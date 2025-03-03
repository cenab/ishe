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
} from 'react-native';
import {
  RTCPeerConnection,
  mediaDevices,
  MediaStream,
  MediaStreamTrack,
  RTCView,
} from 'react-native-webrtc';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { Ionicons } from '@expo/vector-icons';

// Define the API URL based on platform
const API_URL = Platform.select({
  android: 'http://10.0.2.2:3000',
  ios: 'http://localhost:3000',
  default: 'http://localhost:3000',
});

// Add a new type for messages
type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
};

const MainApp = () => {
  const { user, session, signOut } = useAuth();
  // State to track whether the session is started and to hold the remote stream
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [isModelSpeaking, setIsModelSpeaking] = useState<boolean>(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState<boolean>(false);
  const [userTranscript, setUserTranscript] = useState<string>('');
  const [currentResponseId, setCurrentResponseId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  // Add new state for temporary user input
  const [tempUserInput, setTempUserInput] = useState<string[]>([]);
  
  // Add new state and ref for audio recording
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const recordingStartTime = useRef<number | null>(null);
  
  // Add new state for long-press functionality
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | null>(null);
  const [pressProgress, setPressProgress] = useState<number>(0);
  const [isLongPressing, setIsLongPressing] = useState<boolean>(false);
  const LONG_PRESS_DURATION = 3000; // 3 seconds in milliseconds
  
  // Refs to store the peer connection and local stream so they can be stopped later
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const dataChannelRef = useRef<any>(null);
  // Add ref for auto-scrolling
  const scrollViewRef = useRef<ScrollView>(null);

  // Function to send a response request to the model
  const sendResponseRequest = () => {
    if (dataChannelRef.current?.readyState === 'open' && userTranscript) {
      const responseCreate = {
        type: "response.create",
        response: {
          modalities: ["audio", "text"],
          input: [{
            type: "message",
            role: "user",
            content: [{
              type: "input_text",
              text: userTranscript
            }]
          }]
        },
      };
      dataChannelRef.current.send(JSON.stringify(responseCreate));
      //console.log('Sent response request to model:', responseCreate);
      setUserTranscript(''); // Clear user transcript for next interaction
    } else {
      //console.log('Data channel not ready or no user input');
    }
  };

  // Function to store conversation in vector database
  const storeConversation = async (text: string, metadata: any = {}) => {
    try {
      const response = await fetch(`${API_URL}/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          text,
          metadata
        })
      });

      if (!response.ok) {
        throw new Error('Failed to store conversation');
      }
    } catch (error) {
      //console.error('Error storing conversation:', error);
    }
  };

  // Function to start recording
  const startRecording = async () => {
    try {
      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        console.error('Permission to record was denied');
        return;
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        web: {
          mimeType: 'audio/wav',
          bitsPerSecond: 128000,
        },
      });

      await newRecording.startAsync();
      setRecording(newRecording);
      setIsRecording(true);
      recordingStartTime.current = Date.now();
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  // Function to stop recording and upload
  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const duration = Date.now() - (recordingStartTime.current || 0);
      
      if (uri) {
        // Create form data for upload
        const formData = new FormData();
        formData.append('audio', {
          uri,
          type: 'audio/wav',
          name: 'recording.wav',
        } as any);
        formData.append('duration', duration.toString());
        formData.append('timestamp', new Date().toISOString());

        // Upload the recording
        const response = await fetch(`${API_URL}/api/audio/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload recording');
        }
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    } finally {
      setRecording(null);
      setIsRecording(false);
      recordingStartTime.current = null;
    }
  };

  // Function to handle incoming messages
  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.data);
      console.log('DataChannel message:', message);

      if (message.response_id && currentResponseId && message.response_id !== currentResponseId) {
        return;
      }

      switch (message.type) {
        case 'conversation.item.input_audio_transcription.completed':
          // Add the transcript to temporary input array
          setTempUserInput(prev => [...prev, message.transcript.trim()]);
          break;

        case 'response.created':
          // When a response is created, it means the user has finished speaking
          // Join all temporary inputs and create a single message
          if (tempUserInput.length > 0) {
            const completeUserInput = tempUserInput.join(' ');
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'user',
              text: completeUserInput,
              timestamp: new Date()
            }]);
            // Store user's input immediately
            storeConversation(completeUserInput, {
              type: 'user_input',
              timestamp: new Date().toISOString()
            });
            setTempUserInput([]); // Clear temporary input
          }
          setCurrentResponseId(message.response.id);
          break;

        case 'response.done':
          if (message.response.id === currentResponseId) {
            if (message.response.status === 'failed') {
              console.error('Response failed:', message.response.status_details);
            } else {
              // Store assistant's response
              if (currentTranscript) {
                storeConversation(currentTranscript, {
                  type: 'assistant_response',
                  responseId: message.response.id,
                  timestamp: new Date().toISOString()
                });
              }
            }
            setCurrentResponseId(null);
          }
          break;

        case 'transcript':
          setUserTranscript(message.text);
          setIsUserSpeaking(true);
          break;

        case 'response.audio_transcript.delta':
          if (!currentResponseId || message.response_id === currentResponseId) {
            setCurrentTranscript(prev => prev + (message.delta || ''));
          }
          break;

        case 'response.audio_transcript.done':
          if (!currentResponseId || message.response_id === currentResponseId) {
            const assistantMessage: Message = {
              id: message.response_id || Date.now().toString(),
              role: 'assistant',
              text: message.transcript,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMessage]);
            // Store assistant's complete response
            storeConversation(message.transcript, {
              type: 'assistant_response',
              responseId: message.response_id,
              timestamp: new Date().toISOString()
            });
            setCurrentTranscript('');
            setIsUserSpeaking(false);
          }
          break;

        case 'speech.started':
          if (!currentResponseId || message.response_id === currentResponseId) {
            //console.log('Model started speaking');
            setIsModelSpeaking(true);
            // Clear previous transcript when model starts speaking
            setCurrentTranscript('');
          }
          break;

        case 'speech.ended':
          if (!currentResponseId || message.response_id === currentResponseId) {
            //console.log('Model finished speaking');
            setIsModelSpeaking(false);
          }
          break;

        case 'session.error':
          //console.error('Session error:', message.error);
          break;

        case 'error':
          //console.error('Error from server:', message.error);
          break;

        case 'text':
          // This case is not used in the current implementation
          break;

        case 'session.created':
        case 'session.updated':
          //console.log(`Session ${message.type}:`, message.session.id);
          break;

        case 'response.audio.done':
        case 'response.content_part.done':
        case 'response.output_item.done':
        case 'output_audio_buffer.stopped':
          // These events indicate different stages of response completion
          //console.log(`Received ${message.type} event`);
          break;

        default:
          //console.log('Unhandled message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  };

  // Function to initialize the connection (called when "Enable" button is pressed)
  async function init() {
    try {
      if (!session?.access_token) {
        throw new Error('No access token available. Please log in again.');
      }

      // Start recording
      await startRecording();

      //console.log('Requesting session token...');
      // Get an ephemeral key from your server
      const tokenResponse = await fetch(`${API_URL}/session`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        //console.error('Session token error:', errorData);
        throw new Error(`Failed to get session token: ${tokenResponse.status} - ${JSON.stringify(errorData)}`);
      }
      
      const data = await tokenResponse.json();
      if (!data.client_secret?.value) {
        //console.error('Invalid response data:', data);
        throw new Error('Session response missing client secret value');
      }

      //console.log('Successfully obtained session token');
      const EPHEMERAL_KEY = data.client_secret.value;

      // Create a new peer connection with STUN servers
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });
      pcRef.current = pc;

      // Set up data channel first
      const dc = pc.createDataChannel('oai-events');
      dataChannelRef.current = dc;

      dc.addEventListener('open', () => {
        //console.log('Data channel opened');
        // Send initial session update to configure audio
        if (dc.readyState === 'open') {
          const sessionUpdate = {
            type: 'session.update',
            session: {
              input_audio_transcription: {
                language: 'en',
                model: 'whisper-1'
              },
              input_audio_format: 'pcm16',
              output_audio_format: 'pcm16',
              modalities: ['audio', 'text'],
              turn_detection: {
                type: 'server_vad',
                silence_duration_ms: 600,
                prefix_padding_ms: 300,
                threshold: 0.5,
                create_response: true
              }
            }
          };
          dc.send(JSON.stringify(sessionUpdate));
          //console.log('Sent session update:', sessionUpdate);
        }
      });

      dc.addEventListener('message', handleMessage);

      // Handle remote stream: store it in state when received
      pc.addEventListener('track', (event: any) => {
        if (event.streams && event.streams[0]) {
          //console.log('Remote stream received:', event.streams[0]);
          
          // Stop any existing remote stream
          if (remoteStream) {
            const tracks = remoteStream.getTracks();
            tracks.forEach(track => {
              track.stop();
              remoteStream.removeTrack(track);
            });
            setRemoteStream(null);
          }
          
          // Create a new MediaStream with only one audio track
          const newStream = new MediaStream();
          const audioTracks = event.streams[0].getAudioTracks();
          
          // Only add the first audio track if it exists
          if (audioTracks.length > 0) {
            const track = audioTracks[0];
            track.enabled = true;
            newStream.addTrack(track);
            //console.log('Added single audio track to new stream:', track.label);
          }
          
          setRemoteStream(newStream);
        }
      });

      // Get local audio from the device's microphone
      try {
        //console.log('Requesting microphone access...');
        const constraints = {
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: false
        };
        
        // Stop any existing local stream before creating a new one
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => {
            track.stop();
            track.enabled = false;
          });
          localStreamRef.current = null;
        }
        
        const localStream = await mediaDevices.getUserMedia(constraints as any);
        //console.log('Microphone access granted');
        
        localStreamRef.current = localStream;
        
        // Add only one audio track to the peer connection
        const audioTracks = localStream.getAudioTracks();
        if (audioTracks.length > 0) {
          audioTracks[0].enabled = true;
          pc.addTrack(audioTracks[0], localStream);
          //console.log('Added audio track to peer connection:', audioTracks[0].label);
          
          // Disable any additional tracks
          audioTracks.slice(1).forEach(track => {
            track.enabled = false;
            track.stop();
          });
        }

        // Send initial audio buffer
        const audioBuffer = {
          type: 'input_audio_buffer.append',
          audio_buffer: {
            format: 'pcm16',
            sample_rate: 16000,
            channel_count: 1
          }
        };
        dc.send(JSON.stringify(audioBuffer));
        //console.log('Sent initial audio buffer config:', audioBuffer);
      } catch (error) {
        //console.error('Error accessing microphone:', error);
        return; // Exit if we can't get microphone access
      }

      // Create an SDP offer and set it as the local description
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      await pc.setLocalDescription(offer);

      // Send the offer's SDP to the API endpoint
      const baseUrl = 'https://api.openai.com/v1/realtime';
      const model = 'gpt-4o-realtime-preview-2024-12-17';
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          'Content-Type': 'application/sdp',
        },
      });

      if (!sdpResponse.ok) {
        throw new Error(`HTTP error! status: ${sdpResponse.status}`);
      }

      // Parse the SDP answer and set it as the remote description
      const answer = {
        type: 'answer' as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);

      // Add ICE candidate handler
      pc.addEventListener('icecandidate', (event: any) => {
        if (event.candidate) {
          //console.log('New ICE candidate:', event.candidate);
        }
      });

      // Update state to indicate that the session is started
      setIsStarted(true);
    } catch (error) {
      //console.error('Error during initialization:', error);
      stop(); // Clean up if initialization fails
    }
  }

  // Function to stop the session
  async function stop() {
    // Stop recording
    await stopRecording();
    
    // Stop and remove all remote stream tracks
    if (remoteStream) {
      const tracks = remoteStream.getTracks();
      tracks.forEach(track => {
        track.stop();
        remoteStream.removeTrack(track);
      });
      setRemoteStream(null);
    }
    
    // Stop and remove all local stream tracks
    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getTracks();
      tracks.forEach(track => {
        track.stop();
        localStreamRef.current?.removeTrack(track);
      });
      localStreamRef.current = null;
    }
    
    // Close data channel
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    
    // Close peer connection
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    
    // Reset all states
    setIsStarted(false);
    setCurrentTranscript('');
    setUserTranscript('');
    setCurrentResponseId(null);
    setTempUserInput([]); // Clear temporary input when stopping
    setMessages([]); // Clear messages when stopping
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image 
              source={require('./assets/ayshe.png')}
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
            onPressIn={() => {
              setIsLongPressing(true);
              setPressProgress(0);
              
              // Start a timer that increments progress every 100ms
              const interval = setInterval(() => {
                setPressProgress(prev => {
                  const newProgress = prev + (100 / (LONG_PRESS_DURATION / 100));
                  return newProgress > 100 ? 100 : newProgress;
                });
              }, 100);
              setProgressInterval(interval);
              
              // Set the main timer for the action
              const timer = setTimeout(() => {
                if (isStarted) {
                  stop();
                } else {
                  init();
                }
                clearInterval(interval);
                setPressProgress(0);
                setIsLongPressing(false);
              }, LONG_PRESS_DURATION);
              
              setPressTimer(timer);
            }}
            onPressOut={() => {
              if (pressTimer) {
                clearTimeout(pressTimer);
                setPressTimer(null);
              }
              if (progressInterval) {
                clearInterval(progressInterval);
                setProgressInterval(null);
              }
              setPressProgress(0);
              setIsLongPressing(false);
            }}
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
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

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
});
