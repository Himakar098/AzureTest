// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import TranslateScreen from 'screens/TranslateScreen'
import SettingsScreen from './screens/SettingsScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Translate" component={TranslateScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// screens/HomeScreen.js
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Translate')}>
        <Icon name="translate" size={30} color="#fff" />
        <Text style={styles.buttonText}>Start Translation</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => navigation.navigate('Settings')}>
        <Icon name="settings" size={24} color="#333" />
      </TouchableOpacity>
    </View>
  );
}

// screens/TranslateScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Voice from '@react-native-voice/voice';
import TrackPlayer from 'react-native-track-player';
import { check, request, PERMISSIONS } from 'react-native-permissions';

function TranslateScreen() {
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setupVoice();
    requestPermissions();
    return cleanup;
  }, []);

  const setupVoice = async () => {
    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechResults = handleSpeechResults;
    Voice.onSpeechError = handleSpeechError;
    await TrackPlayer.setupPlayer();
  };

  const requestPermissions = async () => {
    const permission = Platform.select({
      ios: PERMISSIONS.IOS.MICROPHONE,
      android: PERMISSIONS.ANDROID.RECORD_AUDIO,
    });
    
    const status = await check(permission);
    if (status !== 'granted') {
      await request(permission);
    }
  };

  const handleSpeechResults = async (e) => {
    const text = e.value[0];
    setSpokenText(text);
    await translateText(text);
  };

  const handleSpeechError = (e) => {
    setError(e.error?.message || 'Error occurred');
    setIsListening(false);
  };

  const translateText = async (text) => {
    try {
      const response = await fetch('YOUR_API_ENDPOINT', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          sourceLang: 'en',
          targetLang: 'es'
        }),
      });
      
      const data = await response.json();
      setTranslatedText(data.translatedText);
      playTranslatedAudio(data.audioUrl);
    } catch (err) {
      setError('Translation failed');
    }
  };

  const playTranslatedAudio = async (audioUrl) => {
    try {
      await TrackPlayer.add({
        url: audioUrl,
        title: 'Translation',
      });
      await TrackPlayer.play();
    } catch (err) {
      setError('Audio playback failed');
    }
  };

  const toggleListening = async () => {
    try {
      if (isListening) {
        await Voice.stop();
      } else {
        await Voice.start('en-US');
      }
    } catch (err) {
      setError('Voice recognition failed');
    }
  };

  const cleanup = () => {
    Voice.destroy().then(Voice.removeAllListeners);
    TrackPlayer.destroy();
  };

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.label}>Original Text:</Text>
        <Text style={styles.text}>{spokenText}</Text>
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.label}>Translated Text:</Text>
        <Text style={styles.text}>{translatedText}</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, isListening && styles.buttonActive]}
        onPress={toggleListening}>
        <Text style={styles.buttonText}>
          {isListening ? 'Stop' : 'Start Speaking'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// screens/SettingsScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';

function SettingsScreen() {
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');

  return (
    <View style={styles.container}>
      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Source Language:</Text>
        <Picker
          selectedValue={sourceLang}
          onValueChange={setSourceLang}
          style={styles.picker}>
          <Picker.Item label="English" value="en" />
          <Picker.Item label="Spanish" value="es" />
          <Picker.Item label="French" value="fr" />
        </Picker>
      </View>

      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Target Language:</Text>
        <Picker
          selectedValue={targetLang}
          onValueChange={setTargetLang}
          style={styles.picker}>
          <Picker.Item label="Spanish" value="es" />
          <Picker.Item label="English" value="en" />
          <Picker.Item label="French" value="fr" />
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonActive: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  settingsButton: {
    position: 'absolute',
    top: 20,
    right: 20,
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
  error: {
    color: '#FF3B30',
    marginBottom: 10,
  },
  pickerContainer: {
    marginBottom: 20,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  }
});

export default TranslateScreen;
