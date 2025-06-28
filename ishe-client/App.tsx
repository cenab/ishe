import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TextInput,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Image,
  Linking,
  Alert,
} from 'react-native';
import {
  Ionicons
} from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { useIsheSession } from './src/hooks/useIsheSession';

const MainApp = () => {
  const { signOut } = useAuth();
  const { 
    isStarted,
    remoteStream,
    currentTranscript,
    isModelSpeaking,
    isUserSpeaking,
    messages,
    promptType,
    isLoading,
    pressProgress,
    isLongPressing,
    init,
    stop,
    switchPromptType,
    handlePressIn,
    handlePressOut,
  } = useIsheSession();

  // Add ref for auto-scrolling
  const scrollViewRef = useRef<ScrollView>(null);

  // Add a useEffect for cleaning up timers on unmount
  useEffect(() => {
    return () => {
      // Assuming pressTimer and progressInterval are managed within useIsheSession
      // If they are still in MainApp, they need to be cleaned up here.
      // For now, assuming they are moved to the hook.
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image 
              source={require('./assets/ishe.png')}
              style={styles.logo}
              resizeMode="cover"
            />
            <Text style={styles.headerTitle}>iShe</Text>
          </View>
          <TouchableOpacity 
            style={styles.signOutButton} 
            onPress={signOut}
          >
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        {isStarted && (
          <View style={styles.promptTypeContainer}>
            <TouchableOpacity
              style={[
                styles.promptTypeButton,
                promptType === 'conversation' && styles.promptTypeButtonActive,
                { backgroundColor: '#007AFF' }
              ]}
              onPress={() => switchPromptType('conversation')}
              disabled={isLoading}
            >
              {isLoading && promptType === 'conversation' ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.promptTypeButtonText}>Sohbet Modu</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.promptTypeButton,
                promptType === 'questions' && styles.promptTypeButtonActive,
                { backgroundColor: '#FF9500' }
              ]}
              onPress={() => switchPromptType('questions')}
              disabled={isLoading}
            >
              {isLoading && promptType === 'questions' ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.promptTypeButtonText}>Soru Modu</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <ScrollView 
          ref={scrollViewRef}
          style={styles.conversationContainer}
          contentContainerStyle={styles.conversationContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message) => (
            <View key={message.id} style={styles.messageContainer}>
              <View style={[
                message.role === 'assistant' ? styles.modelMessage : styles.userMessage,
              ]}>
                <Text style={[
                  styles.messageText,
                  message.role === 'user' && styles.userMessageText
                ]}>{message.text}</Text>
                <Text style={styles.timestampText}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ))}
          
          {currentTranscript && (
            <View style={styles.messageContainer}>
              <View style={[styles.modelMessage, styles.currentMessage]}>
                <Text style={styles.messageText}>{currentTranscript}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.controlsContainer}>
          <View style={styles.statusIndicators}>
            {isModelSpeaking && (
              <View style={styles.statusItem}>
                <ActivityIndicator color="#007AFF" />
                <Text style={styles.statusText}>AI Speaking</Text>
              </View>
            )}
            {isUserSpeaking && (
              <View style={styles.statusItem}>
                <View style={styles.recordingIndicator} />
                <Text style={styles.statusText}>Recording</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.startButton,
              isStarted && styles.stopButton,
              isLongPressing && styles.pressingButton
            ]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <View style={styles.buttonContent}>
              <Text style={[
                styles.startButtonText,
                isStarted && styles.stopButtonText
              ]}>
                {isStarted ? 'Durmak için basılı tutun' : 'Başlamak için basılı tutun'}
              </Text>
              {isLongPressing && (
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${pressProgress}%` }]} />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const AppContent = () => {
  const { user, loading, handleDeepLink } = useAuth();

  // Set up deep link handling
  useEffect(() => {
    // Handle links that open the app
    const handleDeepLinkEvent = (event: {url: string}) => {
      const url = event.url;
      console.log('Deep link received:', url);
      handleDeepLink(url);
    };

    // Handle the initial URL that may have opened the app
    const getInitialURL = async () => {
      console.log('[DeepLink] Checking for initial URL...');
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log('Initial URL:', initialUrl);
        handleDeepLink(initialUrl);
      }
    };

    // Add event listener for deep links while app is running
    const subscription = Linking.addEventListener('url', handleDeepLinkEvent);
    
    // Check for initial URL that opened the app
    getInitialURL();

    // Clean up
    return () => {
      subscription.remove();
    };
  }, [handleDeepLink]);

  if (loading) {
    console.log('[App] Auth loading...');
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  console.log('[App] Rendering MainApp or LoginScreen. User:', !!user);
  return user ? <MainApp /> : <LoginScreen />;
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 65,
    height: 65,
    borderRadius: 33,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  signOutButton: {
    padding: 8,
  },
  conversationContainer: {
    flex: 1,
  },
  conversationContent: {
    padding: 16,
  },
  messageContainer: {
    marginVertical: 8,
    flexDirection: 'row',
  },
  modelMessage: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  userMessage: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
    marginLeft: 'auto',
  },
  currentMessage: {
    backgroundColor: '#F2F2F7',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#000000',
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  timestampText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'right',
  },
  controlsContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  statusIndicators: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: '#F2F2F7',
    padding: 6,
    borderRadius: 12,
  },
  recordingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  pressingButton: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stopButtonText: {
    color: 'white',
  },
  buttonContent: {
    width: '100%',
    alignItems: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 5,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'white',
  },
  promptTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  promptTypeButton: {
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    flex: 1,
    maxWidth: 150,
    alignItems: 'center',
  },
  promptTypeButtonActive: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  promptTypeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});