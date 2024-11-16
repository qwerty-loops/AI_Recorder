import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  FlatList, 
  Alert, 
  Modal, 
  Platform, 
  PermissionsAndroid 
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';

const AudioRecorderScreen = () => {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [recordingsList, setRecordingsList] = useState([]);
  const [currentPlaybackUri, setCurrentPlaybackUri] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [recordTime, setRecordTime] = useState('00:00:00');
  const [playTime, setPlayTime] = useState('00:00:00');
  const [duration, setDuration] = useState('00:00:00');

  const audioRecorderPlayer = useRef(new AudioRecorderPlayer()).current;

  useEffect(() => {
    const requestPermissions = async () => {
      const microphonePermission = await requestMicrophonePermission();

      if (!microphonePermission) {
        Alert.alert('Permission Required', 'Microphone access is required to record audio.');
      }

      if (Platform.OS === 'android') {
        await requestStoragePermission();
      }
    };

    requestPermissions();

    return () => {
      audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.stopPlayer();
      audioRecorderPlayer.removePlayBackListener();
    };
  }, []);

  const requestMicrophonePermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
        title: 'Microphone Permission',
        message: 'This app needs access to your microphone to record audio.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      });
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 29) {
      return true;
    }
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'Storage Permission',
        message: 'This app needs access to your storage to save audio files.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  const startRecording = async () => {
    try {
      const path = `${RNFS.DownloadDirectoryPath}/Recording_${Date.now()}.mp3`;
      await audioRecorderPlayer.startRecorder(path);
      setRecording(true);
      setPaused(false);

      audioRecorderPlayer.addRecordBackListener((e) => {
        setRecordTime(audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)));
      });
    } catch (error) {
      Alert.alert('Recording Error', error.message);
    }
  };

  const pauseRecording = async () => {
    try {
      await audioRecorderPlayer.pauseRecorder();
      setPaused(true);
    } catch (error) {
      Alert.alert('Pause Error', error.message);
    }
  };

  const resumeRecording = async () => {
    try {
      await audioRecorderPlayer.resumeRecorder();
      setPaused(false);
    } catch (error) {
      Alert.alert('Resume Error', error.message);
    }
  };

  const stopRecording = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setRecording(false);
      setPaused(false);
      setRecordTime('00:00:00');

      setRecordingsList((prevList) => [
        ...prevList,
        { uri: result, name: `Recording_${Date.now()}.mp3` },
      ]);
    } catch (error) {
      Alert.alert('Stop Recording Error', error.message);
    }
  };

  const startPlaying = async (uri) => {
    try {
      setCurrentPlaybackUri(uri);
      setModalVisible(true);
      await audioRecorderPlayer.startPlayer(uri);
      setPlaying(true);

      audioRecorderPlayer.addPlayBackListener((e) => {
        setPlayTime(audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)));
        setDuration(audioRecorderPlayer.mmssss(Math.floor(e.duration)));
        if (e.currentPosition === e.duration) {
          stopPlaying();
        }
      });
    } catch (error) {
      Alert.alert('Playback Error', error.message);
    }
  };

  const stopPlaying = async () => {
    try {
      await audioRecorderPlayer.stopPlayer();
      audioRecorderPlayer.removePlayBackListener();
      setPlaying(false);
      setModalVisible(false);
      setPlayTime('00:00:00');
    } catch (error) {
      Alert.alert('Stop Playback Error', error.message);
    }
  };

  const onForwardPress = async () => {
    await audioRecorderPlayer.seekToPlayer(Math.min(duration, playTime + 10000));
  };

  const onRewindPress = async () => {
    await audioRecorderPlayer.seekToPlayer(Math.max(0, playTime - 10000));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.timerText}>
        {recording ? `Recording: ${recordTime}` : playing ? `${playTime} / ${duration}` : ''}
      </Text>

      {!recording && (
        <FlatList
          data={recordingsList}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => (
            <Pressable style={styles.playButton} onPress={() => startPlaying(item.uri)}>
              <Text style={styles.playButtonText}>{item.name}</Text>
            </Pressable>
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      <View style={styles.controlButtons}>
        {recording && (
          <>
            <Pressable style={styles.controlButton} onPress={paused ? resumeRecording : pauseRecording}>
              <Text style={styles.controlButtonText}>{paused ? 'Resume' : 'Pause'}</Text>
            </Pressable>
            <Pressable style={styles.controlButton} onPress={stopRecording}>
              <Text style={styles.controlButtonText}>Stop</Text>
            </Pressable>
          </>
        )}
      </View>

      {!recording && (
        <Pressable
          style={[styles.recordButton, recording && styles.recording]}
          onPress={startRecording}
        >
          <Text style={styles.recordButtonText}>Start Recording</Text>
        </Pressable>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <View style={styles.fullScreenPlayer}>
          <Text style={styles.playerTitle}>Now Playing</Text>
          <Text style={styles.playerText}>{playTime} / {duration}</Text>
          <View style={styles.playbackControls}>
            <Pressable style={styles.playbackButton} onPress={onRewindPress}>
              <Text style={styles.buttonText}>Rewind 10s</Text>
            </Pressable>
            <Pressable style={styles.playbackButton} onPress={() => (playing ? stopPlaying() : startPlaying(currentPlaybackUri))}>
              <Text style={styles.buttonText}>{playing ? 'Pause' : 'Play'}</Text>
            </Pressable>
            <Pressable style={styles.playbackButton} onPress={onForwardPress}>
              <Text style={styles.buttonText}>Forward 10s</Text>
            </Pressable>
          </View>
          <Pressable style={styles.modalButton} onPress={stopPlaying}>
            <Text style={styles.modalButtonText}>Close Player</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  recordButton: {
    backgroundColor: 'red',
    padding: 20,
    borderRadius: 50,
    marginBottom: 60,
    width: '60%',
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
  },
  recording: {
    backgroundColor: 'darkred',
  },
  recordButtonText: {
    color: 'white',
    fontSize: 18,
  },
  playButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    alignItems: 'center',
    width: '80%',
  },
  playButtonText: {
    color: 'white',
    fontSize: 16,
  },
  controlButtons: {
    flexDirection: 'row',
    marginVertical: 10,
    justifyContent: 'space-around',
    width: '80%',
  },
  controlButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 16,
  },
  fullScreenPlayer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  playerText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
  },
  playbackControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginBottom: 20,
  },
  playbackButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  modalButton: {
    backgroundColor: 'red',
    padding: 15,
    borderRadius: 5,
    width: '50%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 18,
  },
});

export default AudioRecorderScreen;
