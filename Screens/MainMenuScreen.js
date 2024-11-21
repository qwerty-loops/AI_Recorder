// MainMenuScreen.js
import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';

const MainMenuScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>NoteSight</Text>
      <Pressable
        style={styles.button}
        onPress={() => navigation.navigate('AudioRecorderScreen')}
      >
        <Text style={styles.buttonText}>Record Audio</Text>
      </Pressable>
      <Pressable
        style={styles.button}
        onPress={() => navigation.navigate('CameraScreen')}
      >
        <Text style={styles.buttonText}>Record Video</Text>
      </Pressable>
      <Pressable
      style={styles.button}
      onPress={() => navigation.navigate('RecordingsListScreen')}
      >
      <Text style={styles.buttonText}>View Recordings</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  },
});

export default MainMenuScreen;
