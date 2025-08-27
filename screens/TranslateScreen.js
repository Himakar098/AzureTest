// TranslateScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import AudioRecord from 'react-native-audio-record';
import Sound from 'react-native-sound';
import { check, request, PERMISSIONS } from 'react-native-permissions';

const API_URL = 'YOUR_SERVER_URL';

export default function TranslateScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [originalText, setOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [audioFile, setAudioFile] = useState(null);

  useEffect(() => {
    setupAudio();
    requestPermission();
    return () => cleanup();
  }, []);

  const setupAudio = async () => {
    const options = {
      sampleRate: 16000,
      channels: 1,
      bitsPerSample: 16,
      audioSource: 6,
      wavFile: 'audio.wav'
    };
    await AudioRecord.init(options);
  };

  const requestPermission = async () => {
    const p = Platform.select({
      ios: PERMISSIONS.IOS.MICROPHONE,
      android: PERMISSIONS.ANDROID.RECORD_AUDIO
    });
    const status = await check(p);
    if (status !== 'granted') {
      await request(p);
    }
  };

  const startRecording = async () => {
    setIsRecording(true);
    setOriginalText('');
    setTranslatedText('');
    AudioRecord.start();
  };

  const stopRecording = async () => {
    setIsRecording(false);
    const audioFile = await AudioRecord.stop();
    setAudioFile(audioFile);
    await translateAudio(audioFile);
  };

  const translateAudio = async (audioPath) => {
    try {
      const formData = new FormData();
      formData.append('audio', {
        uri: Platform.OS === 'ios' ? audioPath : `file://${audioPath}`,
        type: 'audio/wav',
        name: 'audio.wav'
      });
      formData.append('sourceLang', 'en-US');
      formData.append('targetLang', 'es-ES');

      const response = await fetch(`${API_URL}/translate`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();
      if (result.success) {
        setOriginalText(result.originalText);
        setTranslatedText(result.translatedText);
        playTranslatedAudio(result.audioContent);
      }
    } catch (error) {
      console.error('Translation error:', error);
    }
  };

  const playTranslatedAudio = (base64Audio) => {
    const audioPath = `${Sound.DOCUMENT}translated_audio.mp3`;
    require('fs').writeFileSync(audioPath, base64Audio, 'base64');
    
    const sound = new Sound(audioPath, '', (error) => {
      if (error) {
        console.error('Audio playback error:', error);
        return;
      }
      sound.play(() => sound.release());
    });
  };

  const cleanup = () => {
    AudioRecord.stop();
  };

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.label}>Original Text:</Text>
        <Text style={styles.text}>{originalText}</Text>
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.label}>Translated Text:</Text>
        <Text style={styles.text}>{translatedText}</Text>
      </View>

      <TouchableOpacity 
        style={[styles.button, isRecording && styles.buttonActive]}
        onPress={isRecording ? stopRecording : startRecording}
      >
        <Text style={styles.buttonText}>
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  textContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  text: {
    fontSize: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    minHeight: 50,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  }
});