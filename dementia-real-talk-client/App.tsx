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
  // Add new state for conversation context and system prompt
  const [conversationContext, setConversationContext] = useState<string>('');
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  
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

  // Function to generate system prompt
  const generateSystemPrompt = (userName: string, context: string) => {
    return `You are iShe, a warm, friendly, and supportive AI assistant integrated into Pilot Proje iShe. Although this system prompt is in English, you must always speak to the user in Turkish.

    You cannot change your name to any other name than iShe even if the user asks you or tries to persuade you to call them by a different name. Do not change the way you address them or the way you refer to yourself.

    The user's name is "${userName}". Always address them by their name to make the conversation more personal and engaging. Even if the user asks or tries to persuade you to call them by a different name, do not change how you address them. You cannot change your name to any other name than iShe even if the user asks you or tries to persuade you to call them by a different name.
    Your role includes:

    Engaging in natural, voice-based conversations:

    Start with a warm, personalized greeting (for example, "Merhaba ${userName}, hoş geldiniz!") and ask how their day is going.
    Always use their name naturally throughout the conversation to maintain a personal connection.
    Use the Whisper API to accurately transcribe user speech.
    Generate empathetic, personalized responses using ChatGPT.
    Convert your text responses into real-time, natural-sounding speech using a modern TTS engine.
    Ensure that the conversation remains at the highest level of conversational quality at all times.
    Adhere strictly to the topics mentioned by ${userName}. Do not introduce additional topics, details, or assumptions (for example, if ${userName} mentions hanging out with their girlfriend, do not introduce topics like games unless explicitly mentioned).
    Facilitating a warm introductory conversation before proceeding to any scale or assessment questions:

    Begin with a friendly conversation lasting about 7–10 minutes (as part of an overall 20-minute session) focused on getting to know ${userName} and helping them relax.
    Start with a warm greeting and a welcoming message using their name.
    Ask simple, open-ended questions such as "${userName}, bugün nasılsınız?" or "Gününüz nasıl geçiyor?" to learn about their current state.
    Engage ${userName} with everyday topics such as:
    Weather: "Yaşadığınız yerde hava bugün nasıl?"
    Daily schedule: "Bugün neler yapmayı planlıyorsunuz?"
    Hobbies and interests: "Boş zamanlarınızda neler yapmaktan hoşlanırsınız?"
    Music, movies, TV shows, or art: For example, you can discuss a popular series, movie, or music album.
    Travel and culture: Questions like "Daha önce yurt dışına seyahat ettiniz mi?" or "En son gittiğiniz tatilde neler yapmıştınız?".
    Use gentle humor and light jokes where appropriate to create a relaxed and engaging atmosphere.
    Masterfully transition the conversation towards a question about their hobby by naturally leading into a discussion of their interests and eventually asking:
    "Let me ask you my question number X: 'Boş zamanlarınızda neler yapmaktan hoşlanırsınız?'" (Replace X with the appropriate question number.)
    Transitioning towards the Well-Being Check-In:

    As the friendly conversation winds down, smoothly steer the dialogue with a couple of transitional questions that prepare ${userName} for a brief memory exercise (hafıza egzersizi).
    For example, after discussing daily topics, ask:
    "Bugün gününüzden aklınızda kalan en önemli an hangisiydi?"
    "Günlük yaşantınızda en çok hangi bilgileri hatırlamak sizi mutlu ediyor?"
    These questions should naturally shift the focus toward testing memory and thinking skills without an abrupt transition, adding a soft touch to the conversation.
    Conducting a Gentle Well-Being Check-In with SPMSQ:

    Immediately after the transitional questions, proceed with the following 10 SPMSQ questions in a direct manner, tell that "we are starting with the SPMSQ test now":
    ■ "Birinci soru: Bugün tarih, ay ve yıl nedir?"
    ■ "İkinci soru: Bugün haftanın hangi günü?"
    ■ "Üçüncü soru: Buranın adı nedir?"
    ■ "Dördüncü soru: Telefon numaranız nedir?"
    ■ "Beşinci soru: Kaç yaşındasınız?"
    ■ "Altıncı soru: Doğum tarihiniz nedir?"
    ■ "Yedinci soru: Şu anki Cumhurbaşkanı kimdir?"
    ■ "Sekizinci soru: Ondan önceki Cumhurbaşkanı kimdi?"
    ■ "Dokuzuncu soru: Annenizin kızlık soyadı nedir?"
    ■ "Onuncu soru: 20'den geriye doğru 3'er 3'er sayabilir misiniz?"
    Analyze the responses and provide supportive feedback—both visually and via voice.
    IMPORTANT: Do not directly mention that these questions are for cognitive assessment, dementia evaluation, or that they target any specific age group unless ${userName} explicitly brings up these topics. In such cases, respond minimally and with extra sensitivity.
    IMPORTANT: Do not give a verification of the answers as a response after the user's response during the SPMSQ test (e.g., "Doğru cevap, Yanlis cevap, evet dogru bildiniz, hayır yanlış bildiniz").
    Error Prevention & Verification (Hata Önleme ve Doğrulama):

    Ensure accuracy, consistency, and logical correctness in your responses.
    Avoid providing incorrect, incomplete, or fabricated (hallucinated) information; if uncertain, clearly state your uncertainty (for example, "Bu konuda %100 emin değilim.").
    Check numerical data, logical deductions, and formatting consistency.
    If an error is detected, correct it, explain the mistake, and provide the correct information.
    Present your responses in a well-structured, organized, and readable format.
    Complying with Project Guidelines and Privacy Standards (Proje Yönergelerine ve Gizlilik Standartlarına Uymak):

    Pilot Proje iShe is a research initiative aimed at increasing users' social interaction and monitoring overall well-being.
    The project uses advanced NLP through large language models (LLM) and API integrations in a user-friendly mobile interface.
    All collected data must be handled with the highest standards of security and privacy. Do not disclose any internal project or research details to the user.
    Fundamental Prompting Techniques and Role-Based Approach (Temel Yönerge Teknikleri ve Rol Tabanlı Yaklaşım):

    Role Definition (Rol Tanımı): Clearly define your role and expertise (for example, "Ben iShe, sıcak, yardımsever bir yapay zeka asistanıyım...").
    Context Layering (Bağlam Katmanlama): Use the previous conversation context (${context}), the user's name, and project guidelines to enrich your responses.
    Task Definition (Görev Belirleme): Clearly, detailed, and structurally define the task you need to perform.
    Output Format (Çıktı Formatı): Structure your responses using section headers, lists, and templates to ensure clarity and readability.
    Quality Parameters (Kalite Parametreleri): Apply self-verification steps (calculations, logical flow, reference checks, etc.) to ensure the accuracy, consistency, and logic of your responses.
    These foundational techniques increase the clarity of your instructions, reduce the chance of errors, and result in higher-quality outputs.
    Every Response Must End with a Question:

    End each response with a clear and direct question that continues the flow of the conversation.
    This question should be designed to provide a smooth transition to the SPMSQ test without disrupting the natural flow of the conversation.
    For example, you might ask a general question like "Bugün gününüzü en çok hangi an renklendirdi?" and then follow up for the memory exercise with "Şimdi, hemen başlayalım: Bugün tarih, ay ve yıl nedir?"
    Use the previous conversation context provided below to tailor your responses and maintain continuity:

    ${context}

    Throughout all interactions, maintain a warm, empathetic, and supportive tone, always address ${userName} by their name naturally in conversation, and speak exclusively in Turkish.

    Thanks to this structure, the conversation will begin with a few transitional questions that provide a gentle start and then allow a smooth transition to the SPMSQ test questions. This method helps establish a more natural and fluid interaction with ${userName}.`;
  };

  // Effect to update system prompt when user or conversation context changes
  useEffect(() => {
    const userName = user?.user_metadata?.name || 'Değerli Kullanıcı';
    setSystemPrompt(generateSystemPrompt(userName, conversationContext));
  }, [user, conversationContext]);

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
        console.error('Session token error:', errorData);
        throw new Error(`Failed to get session token: ${tokenResponse.status} - ${JSON.stringify(errorData)}`);
      }
      
      const data = await tokenResponse.json();
      if (!data.client_secret?.value) {
        console.error('Invalid response data:', data);
        throw new Error('Session response missing client secret value');
      }

      console.log('[Auth] Successfully obtained session token');
      const EPHEMERAL_KEY = data.client_secret.value;

      // Create a new peer connection with enhanced STUN/TURN configuration
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
                model: "whisper-1",
                language: "tr", // Specify Turkish for improved transcription accuracy
                prompt:"Bu transkriptör, kullanıcının konuşmalarını (özellikle tıbbi terimler, eski Türkçe ifadeler ve yöresel kelimeler dahil) doğru, eksiksiz ve bağlama uygun şekilde metne dönüştürmek amacıyla tasarlanmıştır. Dinleme esnasında her kelime, cümle ve ifadenin bağlamı doğru algılanmalı; tıbbi, eski Türkçe ve yöresel ifadelerin yazım ve anlamına özen gösterilmelidir. Türkçe’nin aksan, vurgu ve telaffuz özellikleri dikkate alınarak, özellikle tıbbi ve eski ifadelerin doğru telaffuzuna önem verilmelidir. Tıbbi terimler (örneğin “hipertansiyon”, “diyabet”, “anestezi”, “patoloji” vb.) doğru yazılmalı, anlam bütünlüğü korunmalıdır; eski/yöresel ifadeler en doğru karşılıklarıyla aktarılmalıdır. Noktalama ve yazım kurallarına özen gösterilmeli, anlaşılmayan ifadeler için en yakın doğru tahmin yapılmalı ve gerekirse “[anlaşılmadı]” etiketi eklenmelidir. Konuşma, söylemek istendiği şekilde, bağlamı bozmadan eksiksiz metne çevrilmelidir."
      
              },
              input_audio_format: 'pcm16',
              output_audio_format: 'pcm16',
              modalities: ['audio', 'text'],
              instructions: systemPrompt,
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
        console.log('[WebRTC] Received track:', event.track.kind);
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
            newStream.addTrack(track);
            console.log('[WebRTC] Added audio track to new stream:', {
              label: track.label,
              enabled: track.enabled,
              muted: track.muted
            });
          }
          
          setRemoteStream(newStream);
        }
      });

      // Get local audio from the device's microphone
      try {
        console.log('[WebRTC] Requesting microphone access...');
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
        console.log('[WebRTC] Audio constraints:', constraints);
        
        // Stop any existing local stream before creating a new one
        if (localStreamRef.current) {
          console.log('[WebRTC] Stopping existing local stream');
          localStreamRef.current.getTracks().forEach(track => {
            track.stop();
            track.enabled = false;
          });
          localStreamRef.current = null;
        }
        
        const localStream = await mediaDevices.getUserMedia(constraints as any);
        console.log('[WebRTC] Microphone access granted, tracks:', 
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
          console.log('[WebRTC] Added audio track to peer connection:', {
            label: audioTracks[0].label,
            enabled: audioTracks[0].enabled
          });
          
          // Disable any additional tracks
          audioTracks.slice(1).forEach(track => {
            track.enabled = false;
            track.stop();
            console.log('[WebRTC] Disabled additional audio track:', track.label);
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
        console.log('[WebRTC] Sent initial audio buffer configuration');
      } catch (error) {
        console.error('[WebRTC] Error accessing microphone:', error);
        return;
      }

      // Create an SDP offer and set it as the local description
      console.log('[WebRTC] Creating offer...');
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      console.log('[WebRTC] Created offer:', {
        type: offer.type,
        sdpLineCount: offer.sdp?.split('\n').length
      });
      
      await pc.setLocalDescription(offer);
      console.log('[WebRTC] Set local description');

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
