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
} from 'react-native';
import {
  RTCPeerConnection,
  mediaDevices,
  MediaStream,
  MediaStreamTrack,
  RTCView,
  MediaStreamTrack as WebRTCMediaStreamTrack
} from 'react-native-webrtc';
import { Audio } from 'expo-av';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { Ionicons } from '@expo/vector-icons';
import { generateSystemPromptToConverse, generateSystemPromptToAskQuestions } from './src/utils/systemPrompt';

// Define the API URL based on platform
const API_URL = Platform.select({
  android: 'https://3.127.58.246',
  ios: 'https://3.127.58.246',
  default: 'https://3.127.58.246',
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
  // Add new state for conversation context and system prompt
  const [conversationContext, setConversationContext] = useState<string>('');
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [promptType, setPromptType] = useState<'conversation' | 'questions'>('conversation');
  
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

  // Add new function to handle prompt type change
  const handlePromptTypeChange = (type: 'conversation' | 'questions') => {
    const userName = user?.user_metadata?.name || 'Değerli Kullanıcı';
    setPromptType(type);
    const newPrompt = type === 'conversation' 
      ? generateSystemPromptToConverse(userName, conversationContext)
      : generateSystemPromptToAskQuestions(userName, conversationContext);
    setSystemPrompt(newPrompt);
    handleSessionUpdate(newPrompt);
  };

  // Update the useEffect to use the correct prompt type
  useEffect(() => {
    const userName = user?.user_metadata?.name || 'Değerli Kullanıcı';
    const newPrompt = promptType === 'conversation'
      ? generateSystemPromptToConverse(userName, conversationContext)
      : generateSystemPromptToAskQuestions(userName, conversationContext);
    setSystemPrompt(newPrompt);
  }, [user, conversationContext, promptType]);

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
      console.log('[API] Storing conversation snippet...');
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
        console.error(`[API] Failed to store conversation. Status: ${response.status}`);
        throw new Error('Failed to store conversation');
      }
      console.log('[API] Conversation snippet stored successfully.');
    } catch (error) {
      console.error('[API] Error storing conversation:', error);
    }
  };

  // Function to start recording
  const startRecording = async () => {
    console.log('[Audio] Attempting to start recording...');
    // Prevent starting if already recording
    if (isRecording || recording) {
      console.log('Recording is already in progress. Skipping start.');
      return;
    }

    try {
      // Request permissions
      console.log('[Audio] Requesting permissions...');
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        console.error('[Audio] Permission to record was denied');
        return;
      }
      console.log('[Audio] Permissions granted.');

      // Set audio mode
      console.log('[Audio] Setting audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      console.log('[Audio] Audio mode set.');

      // Start recording
      console.log('[Audio] Creating and preparing new recording...');
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
      console.log('[Audio] Recording prepared.');

      await newRecording.startAsync();
      console.log('[Audio] Recording started.');
      setRecording(newRecording);
      setIsRecording(true);
      recordingStartTime.current = Date.now();
    } catch (error) {
      console.error('[Audio] Failed to start recording:', error);
    }
  };

  // Function to stop recording and upload
  const stopRecording = async () => {
    if (!recording) {
      console.log('[Audio] Stop recording called but no recording object exists.');
      return;
    }

    let recordingUri: string | null = null;
    try {
      console.log('[Audio] Attempting to stop and unload recording...');
      await recording.stopAndUnloadAsync();
      recordingUri = recording.getURI();
      console.log('[Audio] Recording stopped and unloaded successfully. URI:', recordingUri);
      
      // --- Upload Logic ---
      if (recordingUri) {
        const duration = Date.now() - (recordingStartTime.current || 0);
        console.log(`Recording duration: ${duration}ms`);
        
        try {
          // Create form data for upload
          const formData = new FormData();
          formData.append('audio', {
            uri: recordingUri,
            name: 'recording.wav',
            type: 'audio/wav', // MIME type
          } as any); // The 'as any' is often needed due to typing differences
          formData.append('duration', duration.toString());
          formData.append('timestamp', new Date().toISOString());

          console.log('Uploading recording...');
          // Upload the recording
          const response = await fetch(`${API_URL}/api/audio/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
              // Content-Type is set automatically by fetch for FormData
            },
            body: formData,
          });

          if (!response.ok) {
             const errorText = await response.text();
             console.error(`Failed to upload recording. Status: ${response.status}, Body: ${errorText}`);
             throw new Error(`Failed to upload recording: ${response.status}`);
          }
           console.log('Recording uploaded successfully.');
           
        } catch (uploadError) {
           console.error('[API] Error during recording upload:', uploadError);
           // Decide if you want to bubble this error up or just log it
        }
      } else {
         console.warn('No recording URI found after stopping.');
      }
      // --- End Upload Logic ---
      
    } catch (error) {
      // Error specifically from stopAndUnloadAsync
      console.error('[Audio] Failed to stop or unload recording:', error);
    } finally {
      console.log('Resetting recording state.');
      setRecording(null);
      setIsRecording(false);
      recordingStartTime.current = null;
    }
  };

  // Function to handle incoming messages
  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.data);
      console.log('[DataChannel] Received message:', message.type, message); // Log type and full message

      if (message.response_id && currentResponseId && message.response_id !== currentResponseId) {
        console.log(`[DataChannel] Ignoring message for previous response ID: ${message.response_id}`);
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
          console.log(`[DataChannel] Response done. ID: ${message.response?.id}, Status: ${message.response?.status}`);
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
          console.log('[DataChannel] Received user transcript');
          setUserTranscript(message.text);
          setIsUserSpeaking(true);
          break;

        case 'response.audio_transcript.delta':
          // Log only occasionally to avoid flooding
          // if (Math.random() < 0.1) console.log('[DataChannel] Received transcript delta');
          if (!currentResponseId || message.response_id === currentResponseId) {
            setCurrentTranscript(prev => prev + (message.delta || ''));
          }
          break;

        case 'response.audio_transcript.done':
           console.log('[DataChannel] Received full assistant transcript');
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
           console.log('[DataChannel] Assistant speech started');
          if (!currentResponseId || message.response_id === currentResponseId) {
            //console.log('Model started speaking');
            setIsModelSpeaking(true);
            // Clear previous transcript when model starts speaking
            setCurrentTranscript('');
          }
          break;

        case 'speech.ended':
          console.log('[DataChannel] Assistant speech ended');
          if (!currentResponseId || message.response_id === currentResponseId) {
            //console.log('Model finished speaking');
            setIsModelSpeaking(false);
          }
          break;

        case 'session.error':
          console.error('[DataChannel] Session error received:', message.error);
          break;

        case 'error':
          console.error('[DataChannel] Generic error received:', message.error);
          break;

        case 'text':
          console.log('[DataChannel] Received text message (not used currently)');
          // This case is not used in the current implementation
          break;

        case 'session.created':
        case 'session.updated':
          console.log(`[DataChannel] Session ${message.type}:`, message.session?.id);
          break;

        case 'response.audio.done':
        case 'response.content_part.done':
        case 'response.output_item.done':
        case 'output_audio_buffer.stopped':
          // These events indicate different stages of response completion
          console.log(`[DataChannel] Received ${message.type} event`);
          break;

        default:
          console.warn('[DataChannel] Unhandled message type:', message.type);
      }
    } catch (error) {
      console.error('[DataChannel] Error parsing message:', error, 'Raw data:', event.data);
    }
  };


  function handleSessionUpdate(systemPrompt: string) {
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== 'open') {
       console.warn('[DataChannel] Cannot update session, channel not open.');
       return;
    }
    console.log('[DataChannel] Sending session.update with new system prompt...');
    const sessionUpdate = {
      type: 'session.update',
      session: {
        input_audio_transcription: {
          model: "whisper-1",
          language: "tr", // Specify Turkish for improved transcription accuracy
          prompt: `Bu transkriptör, kullanıcının konuşmalarını (özellikle tıbbi terimler, eski Türkçe ifadeler ve yöresel kelimeler dahil) doğru, eksiksiz ve bağlama uygun şekilde metne dönüştürmek amacıyla tasarlanmıştır. Dinleme esnasında her kelime, cümle ve ifadenin bağlamı doğru algılanmalı; tıbbi, eski Türkçe ve yöresel ifadelerin yazım ve anlamına özen gösterilmelidir. Türkçe'nin aksan, vurgu ve telaffuz özellikleri dikkate alınarak, özellikle tıbbi ve eski ifadelerin doğru telaffuzuna önem verilmelidir. Tıbbi terimler (örneğin "hipertansiyon", "diyabet", "anestezi", "patoloji" vb.) doğru yazılmalı, anlam bütünlüğü korunmalıdır; eski/yöresel ifadeler en doğru karşılıklarıyla aktarılmalıdır. Noktalama ve yazım kurallarına özen gösterilmeli, anlaşılmayan ifadeler için en yakın doğru tahmin yapılmalı ve gerekirse "[anlaşılmadı]" etiketi eklenmelidir. Konuşma, söylemek istendiği şekilde, bağlamı bozmadan eksiksiz metne çevrilmelidir.`

        },
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16', 
        modalities: ['audio', 'text'],
        instructions: systemPrompt
      }
    };
    dataChannelRef.current .send(JSON.stringify(sessionUpdate));
  }

  // Function to initialize the connection (called when "Enable" button is pressed)
  async function init() {
    console.log('[Init] Starting initialization...');
    try {
      if (!session?.access_token) {
        console.error('[Init] No access token found.');
        throw new Error('No access token available. Please log in again.');
      }
      console.log('[Init] Access token found.');

      // Start recording
      console.log('[Init] Calling startRecording...');
      await startRecording();
      console.log('[Init] startRecording finished.');

      console.log('[API] Requesting session token from server...');
      // Get an ephemeral key from your server
      const tokenResponse = await fetch(`${API_URL}/session`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error('Session token error:', errorData);
        throw new Error(`Failed to get session token: ${tokenResponse.status} - ${JSON.stringify(errorData)}`);
      }
      
      const data = await tokenResponse.json();
      if (!data.client_secret?.value) {
        console.error('Invalid response data:', data);
        throw new Error('Session response missing client secret value');
      }

      console.log('[API] Successfully obtained session token.');
      const EPHEMERAL_KEY = data.client_secret.value;

      console.log('[WebRTC] Creating PeerConnection...');
      // Create a new peer connection with enhanced STUN/TURN configuration
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });
      pcRef.current = pc;
      console.log('[WebRTC] PeerConnection created.');

      console.log('[WebRTC] Creating DataChannel...');
      // Set up data channel first
      const dc = pc.createDataChannel('oai-events');
      dataChannelRef.current = dc;
      console.log('[WebRTC] DataChannel created.');

      dc.addEventListener('open', () => {
        console.log('[DataChannel] Channel opened.');
        // Send initial session update to configure audio
        if (dc.readyState === 'open') {
          // Set conversation mode as default and update session
          handlePromptTypeChange('conversation');
        }
      });

      dc.addEventListener('message', handleMessage);
      dc.addEventListener('error', (event: any) => {
         console.error('[DataChannel] Error:', event.error);
      });
       dc.addEventListener('close', () => {
         console.log('[DataChannel] Channel closed.');
      });


      // Handle remote stream: store it in state when received
      pc.addEventListener('track', (event: any) => {
        console.log('[WebRTC] Received remote track:', event.track.kind);
        if (event.streams && event.streams[0]) {
          //console.log('Remote stream received:', event.streams[0]);
          
          // Stop any existing remote stream
          if (remoteStream) {
            console.log('[WebRTC] Stopping existing remote stream');
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
            newStream.addTrack(track as any);
            console.log('[WebRTC] Added audio track to new stream:', {
              label: track.label,
              enabled: track.enabled,
              muted: track.muted
            });
          }
          
          setRemoteStream(newStream);
        }
      });

      pc.addEventListener('connectionstatechange', () => {
         console.log(`[WebRTC] Connection state changed: ${pcRef.current?.connectionState}`);
      });
       pc.addEventListener('iceconnectionstatechange', () => {
         console.log(`[WebRTC] ICE Connection state changed: ${pcRef.current?.iceConnectionState}`);
       });
       pc.addEventListener('icegatheringstatechange', () => {
         console.log(`[WebRTC] ICE Gathering state changed: ${pcRef.current?.iceGatheringState}`);
       });


      // Get local audio from the device's microphone
      try {
        console.log('[Media] Requesting microphone access...');
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
        console.log('[Media] Audio constraints:', constraints);
        
        // Stop any existing local stream before creating a new one
        if (localStreamRef.current) {
          console.log('[Media] Stopping existing local stream');
          localStreamRef.current.getTracks().forEach(track => {
            track.stop();
            track.enabled = false;
          });
          localStreamRef.current = null;
        }
        
        const localStream = await mediaDevices.getUserMedia(constraints as any);
        console.log('[Media] Microphone access granted, tracks:', 
          localStream.getTracks().map(t => ({
            kind: t.kind,
            label: t.label,
            enabled: t.enabled
          }))
        );
        
        localStreamRef.current = localStream;
        
        // Add only one audio track to the peer connection
        const audioTracks = localStream.getAudioTracks();
        if (audioTracks.length > 0) {
          audioTracks[0].enabled = true;
          pc.addTrack(audioTracks[0], localStream);
          console.log('[Media] Added audio track to peer connection:', {
            label: audioTracks[0].label,
            enabled: audioTracks[0].enabled
          });
          
          // Disable any additional tracks
          audioTracks.slice(1).forEach(track => {
            track.enabled = false;
            track.stop();
            console.log('[Media] Disabled additional audio track:', track.label);
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
        console.log('[Media] Sent initial audio buffer configuration');
      } catch (error) {
        console.error('[Media] Error accessing microphone:', error);
        throw error; // Rethrow to trigger cleanup in outer catch
      }

      // Create an SDP offer and set it as the local description
      console.log('[WebRTC] Creating SDP offer...');
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      console.log('[WebRTC] Created offer:', {
        type: offer.type,
        sdpLineCount: offer.sdp?.split('\n').length
      });
      
      await pc.setLocalDescription(offer);
      console.log('[WebRTC] Set local description.');

      console.log('[API] Sending SDP offer to server...');
      // Send the offer's SDP to our server endpoint
      const model = 'gpt-4o-realtime-preview-2024-12-17';
      const sdpResponse = await fetch(`${API_URL}/realtime?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/sdp',
        },
      });

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        console.error(`[API] SDP offer request failed. Status: ${sdpResponse.status}, Body: ${errorText}`);
        throw new Error(`HTTP error! status: ${sdpResponse.status}`);
      }
      console.log('[API] SDP offer sent successfully.');

      // Parse the SDP answer and set it as the remote description
      console.log('[WebRTC] Setting remote SDP answer...');
      const answer = {
        type: 'answer' as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);
      console.log('[WebRTC] Set remote description.');

      // Add ICE candidate handler
      pc.addEventListener('icecandidate', (event: any) => {
        if (event.candidate) {
          // console.log('[WebRTC] New ICE candidate found:', event.candidate);
        } else {
          console.log('[WebRTC] All ICE candidates have been gathered.');
        }
      });

      // Update state to indicate that the session is started
      setIsStarted(true);
      console.log('[Init] Initialization successful and session started.');

    } catch (error) {
      console.error('[Init] Error during initialization:', error);
      stop(); // Clean up if initialization fails
    }
  }

  // Function to stop the session
  async function stop() {
    console.log('[Stop] Stopping session...');
    // Stop recording
    console.log('[Stop] Calling stopRecording...');
    await stopRecording();
    console.log('[Stop] stopRecording finished.');
    
    // Stop and remove all remote stream tracks
    if (remoteStream) {
      const tracks = remoteStream.getTracks();
      tracks.forEach(track => {
        track.stop();
        remoteStream.removeTrack(track);
      });
      setRemoteStream(null);
      console.log('[Stop] Remote stream stopped and removed.');
    } else {
       console.log('[Stop] No remote stream to stop.');
    }
    
    // Stop and remove all local stream tracks
    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getTracks();
      tracks.forEach(track => {
        track.stop();
        localStreamRef.current?.removeTrack(track);
      });
      localStreamRef.current = null;
      console.log('[Stop] Local stream stopped and removed.');
    } else {
       console.log('[Stop] No local stream to stop.');
    }
    
    // Close data channel
    if (dataChannelRef.current) {
      console.log('[Stop] Closing DataChannel...');
      dataChannelRef.current.close();
      dataChannelRef.current = null;
      console.log('[Stop] DataChannel closed.');
    } else {
       console.log('[Stop] No DataChannel to close.');
    }

    // Close peer connection
    if (pcRef.current) {
      console.log('[Stop] Closing PeerConnection...');
      pcRef.current.close();
      pcRef.current = null;
      console.log('[Stop] PeerConnection closed.');
    } else {
       console.log('[Stop] No PeerConnection to close.');
    }

    // Reset all states
    console.log('[Stop] Resetting application state.');
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
              onPress={() => handlePromptTypeChange('conversation')}
            >
              <Text style={styles.promptTypeButtonText}>Sohbet Modu</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.promptTypeButton,
                promptType === 'questions' && styles.promptTypeButtonActive,
                { backgroundColor: '#FF9500' }
              ]}
              onPress={() => handlePromptTypeChange('questions')}
            >
              <Text style={styles.promptTypeButtonText}>Soru Modu</Text>
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


