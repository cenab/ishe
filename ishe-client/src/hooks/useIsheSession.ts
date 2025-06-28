import { useRef, useState, useEffect, useCallback } from 'react';
import {
  RTCPeerConnection,
  mediaDevices,
  MediaStream,
  MediaStreamTrack,
} from 'react-native-webrtc';
import { Audio } from 'expo-av';
import { useAuth } from '../contexts/AuthContext';
import { generateSystemPromptToConverse, generateSystemPromptToAskQuestions } from '../utils/systemPrompt';
import { Alert, Platform } from 'react-native';

// Define the API URL based on platform
const API_URL = Platform.select({
  android: 'https://ishe.batubora.com',
  ios: 'https://ishe.batubora.com',
  default: 'https://ishe.batubora.com',
});

// Add a new type for messages
type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
};

export const useIsheSession = () => {
  const { user, session } = useAuth();

  // State to track whether the session is started and to hold the remote stream
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [isModelSpeaking, setIsModelSpeaking] = useState<boolean>(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState<boolean>(false);
  const [userTranscript, setUserTranscript] = useState<string>('');
  const [currentResponseId, setCurrentResponseId] = useState<string | null>(null);
  
  const [conversationHistories, setConversationHistories] = useState<Record<"conversation" | "questions", Message[]>>({
    conversation: [],
    questions: [],
  });
  const [promptType, setPromptType] = useState<'conversation' | 'questions'>('conversation');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Derived state for current messages
  const messages = conversationHistories[promptType];

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

  // Function to update messages for the current promptType
  const addMessage = useCallback((newMessage: Message) => {
    setConversationHistories(prev => ({
      ...prev,
      [promptType]: [...prev[promptType], newMessage],
    }));
  }, [promptType]);

  // Function to send a response request to the model
  const sendResponseRequest = useCallback(() => {
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
      setUserTranscript(''); // Clear user transcript for next interaction
    }
  }, [userTranscript]);

  // Function to store conversation in vector database
  const storeConversation = useCallback(async (text: string, metadata: any = {}) => {
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
  }, [session]);

  // Function to start recording
  const startRecording = useCallback(async () => {
    console.log('[Audio] Attempting to start recording...');
    if (isRecording || recording) {
      console.log('Recording is already in progress. Skipping start.');
      return;
    }

    try {
      console.log('[Audio] Requesting permissions...');
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        console.error('[Audio] Permission to record was denied');
        return;
      }
      console.log('[Audio] Permissions granted.');

      console.log('[Audio] Setting audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      console.log('[Audio] Audio mode set.');

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
  }, [isRecording, recording]);

  // Function to stop recording and upload
  const stopRecording = useCallback(async () => {
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
      
      if (recordingUri) {
        const duration = Date.now() - (recordingStartTime.current || 0);
        console.log(`Recording duration: ${duration}ms`);
        
        try {
          const formData = new FormData();
          formData.append('audio', {
            uri: recordingUri,
            name: 'recording.wav',
            type: 'audio/wav',
          } as any);
          formData.append('duration', duration.toString());
          formData.append('timestamp', new Date().toISOString());

          console.log('Uploading recording...');
          const response = await fetch(`${API_URL}/api/audio/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
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
        }
      } else {
         console.warn('No recording URI found after stopping.');
      }
      
    } catch (error) {
      console.error('[Audio] Failed to stop or unload recording:', error);
    } finally {
      console.log('Resetting recording state.');
      setRecording(null);
      setIsRecording(false);
      recordingStartTime.current = null;
    }
  }, [recording, session]);

  // Function to handle incoming messages
  const handleMessage = useCallback((event: any) => {
    try {
      const message = JSON.parse(event.data);
      console.log('[DataChannel] Received message type:', message.type, 'Full message:', message);

      if (message.response_id && currentResponseId && message.response_id !== currentResponseId) {
        console.log(`[DataChannel] Ignoring message for previous response ID: ${message.response_id}`);
        return;
      }

      switch (message.type) {
        case 'conversation.item.input_audio_transcription.completed':
          setTempUserInput(prev => [...prev, message.transcript.trim()]);
          break;

        case 'response.created':
          if (tempUserInput.length > 0) {
            const completeUserInput = tempUserInput.join(' ');
            const newUserMessage: Message = {
              id: Date.now().toString(),
              role: 'user',
              text: completeUserInput,
              timestamp: new Date()
            };
            addMessage(newUserMessage);
            storeConversation(completeUserInput, {
              type: 'user_input',
              timestamp: new Date().toISOString()
            });
            setTempUserInput([]);
          }
          setCurrentResponseId(message.response.id);
          break;

        case 'response.done':
          console.log(`[DataChannel] Response done. ID: ${message.response?.id}, Status: ${message.response?.status}`);
          if (message.response.id === currentResponseId) {
            if (message.response.status === 'failed') {
              console.error('Response failed:', message.response.status_details);
            } else {
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
            addMessage(assistantMessage);
            storeConversation(message.transcript, {
              type: 'assistant_response',
              responseId: message.response.id,
              timestamp: new Date().toISOString()
            });
            setCurrentTranscript('');
            setIsUserSpeaking(false);
          }
          break;

        case 'speech.started':
           console.log('[DataChannel] Assistant speech started');
          if (!currentResponseId || message.response_id === currentResponseId) {
            setIsModelSpeaking(true);
            setCurrentTranscript('');
          }
          break;

        case 'speech.ended':
          console.log('[DataChannel] Assistant speech ended');
          if (!currentResponseId || message.response_id === currentResponseId) {
            setIsModelSpeaking(false);
          }
          break;

        case 'session.error':
          console.error('[DataChannel] Session error received:', message.error);
          Alert.alert('Session Error', message.error);
          break;

        case 'error':
          console.error('[DataChannel] Generic error received:', message.error);
          Alert.alert('Error', message.error);
          break;

        case 'text':
          console.log('[DataChannel] Received text message (not used currently)');
          break;

        case 'session.created':
        case 'session.updated':
          console.log(`[DataChannel] Session ${message.type}:`, message.session?.id);
          break;

        case 'response.audio.done':
        case 'response.content_part.done':
        case 'response.output_item.done':
        case 'output_audio_buffer.stopped':
          console.log(`[DataChannel] Received ${message.type} event`);
          break;

        default:
          console.warn('[DataChannel] Unhandled message type:', message.type);
      }
    } catch (error) {
      console.error('[DataChannel] Error parsing message:', error, 'Raw data:', event.data);
    }
  }, [currentResponseId, tempUserInput, currentTranscript, addMessage, storeConversation]);

  const handleSessionUpdate = useCallback((systemPrompt: string) => {
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
          language: "tr",
          prompt: `Bu transkriptör, kullanıcının konuşmalarını (özellikle tıbbi terimler, eski Türkçe ifadeler ve yöresel kelimeler dahil) doğru, eksiksiz ve bağlama uygun şekilde metne dönüştürmek amacıyla tasarlanmıştır. Dinleme esnasında her kelime, cümle ve ifadenin bağlamı doğru algılanmalı; tıbbi, eski Türkçe ve yöresel ifadelerin yazım ve anlamına özen gösterilmelidir. Türkçe'nin aksan, vurgu ve telaffuz özellikleri dikkate alınarak, özellikle tıbbi ve eski ifadelerin doğru telaffuzuna önem verilmelidir. Tıbbi terimler (örneğin "hipertansiyon", "diyabet", "anestezi", "patoloji" vb.) doğru yazılmalı, anlam bütünlüğü korunmalıdır; eski/yöresel ifadeler en doğru karşılıklarıyla aktarılmalıdır. Noktalama ve yazım kurallarına özen gösterilmeli, anlaşılmayan ifadeler için en yakın doğru tahmin yapılmalı ve gerekirse "[anlaşılmadı]" etiketi eklenmelidir. Konuşma, söylemek istendiği şekilde, bağlamı bozmadan eksiksiz metne çevrilmelidir.`
        },
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16', 
        modalities: ['audio', 'text'],
        instructions: systemPrompt
      }
    };
    dataChannelRef.current.send(JSON.stringify(sessionUpdate));
  }, []);

  const stop = useCallback(async () => {
    console.log('[Stop] Stopping session...');
    if (isRecording) {
      await stopRecording();
    }
    
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
      console.log('[Stop] Remote stream stopped.');
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      console.log('[Stop] Local stream stopped.');
    }
    
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
      console.log('[Stop] DataChannel closed.');
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
      console.log('[Stop] PeerConnection closed.');
    }

    console.log('[Stop] Resetting application state.');
    setIsStarted(false);
    setCurrentTranscript('');
    setUserTranscript('');
    setCurrentResponseId(null);
    setTempUserInput([]);

    // Clear any active timers on stop
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

  }, [isRecording, remoteStream, stopRecording, pressTimer, progressInterval]);

  const init = useCallback(async () => {
    if (isStarted) return; // Prevent re-initialization if already started
    setIsLoading(true);

    console.log('[Init] Starting initialization...');
    try {
      if (!session?.access_token) {
        console.error('[Init] No access token found.');
        throw new Error('No access token available. Please log in again.');
      }
      console.log('[Init] Access token found.');

      await startRecording();

      let tokenResponse;
      try {
        tokenResponse = await fetch(`${API_URL}/session`, {
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
      } catch (error) {
        console.error('[API] Error fetching session token:', error);
        throw new Error('Failed to connect to the server. Please check your internet connection and try again.');
      }
      
      const data = await tokenResponse.json();
      if (!data.client_secret?.value) {
        console.error('Invalid response data:', data);
        throw new Error('Session response missing client secret value');
      }

      console.log('[API] Successfully obtained session token.');
      const EPHEMERAL_KEY = data.client_secret.value;

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });
      pcRef.current = pc;
      console.log('[WebRTC] PeerConnection created.');

      const dc = pc.createDataChannel('oai-events');
      dataChannelRef.current = dc;
      console.log('[WebRTC] DataChannel created.');

      dc.addEventListener('open', async () => {
        console.log('[DataChannel] Channel opened.');
        // Generate the initial prompt based on the default conversation type
        const userName = user?.user_metadata?.name || 'Değerli Kullanıcı';
        const initialPrompt = generateSystemPromptToConverse(userName, ''); // Initial context is empty
        handleSessionUpdate(initialPrompt);
      });

      dc.addEventListener('message', handleMessage);
      dc.addEventListener('error', (event: any) => {
         console.error('[DataChannel] Error:', event.error);
      });
       dc.addEventListener('close', () => {
         console.log('[DataChannel] Channel closed.');
      });

      pc.addEventListener('track', (event: any) => {
        console.log('[WebRTC] Received remote track:', event.track.kind);
        if (event.streams && event.streams[0]) {
          if (remoteStream) {
            console.log('[WebRTC] Stopping existing remote stream');
            const tracks = remoteStream.getTracks();
            tracks.forEach(track => {
              track.stop();
              remoteStream.removeTrack(track);
            });
            setRemoteStream(null);
          }
          
          const newStream = new MediaStream();
          const audioTracks = event.streams[0].getAudioTracks(); 
          
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
         if (pcRef.current?.connectionState === 'failed' || pcRef.current?.connectionState === 'disconnected' || pcRef.current?.connectionState === 'closed') {
            stop();
         }
      });
       pc.addEventListener('iceconnectionstatechange', () => {
         console.log(`[WebRTC] ICE Connection state changed: ${pcRef.current?.iceConnectionState}`);
       });
       pc.addEventListener('icegatheringstatechange', () => {
         console.log(`[WebRTC] ICE Gathering state changed: ${pcRef.current?.iceGatheringState}`);
       });

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
        
        const audioTracks = localStream.getAudioTracks();
        if (audioTracks.length > 0) {
          audioTracks[0].enabled = true;
          pc.addTrack(audioTracks[0], localStream);
          console.log('[Media] Added audio track to peer connection:', {
            label: audioTracks[0].label,
            enabled: audioTracks[0].enabled
          });
          
          audioTracks.slice(1).forEach(track => {
            track.enabled = false;
            track.stop();
            console.log('[Media] Disabled additional audio track:', track.label);
          });
        }

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
        throw new Error('Could not access the microphone. Please check your device permissions.');
      }

      let offer;
      try {
        offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: false
        });
        console.log('[WebRTC] Created offer:', {
          type: offer.type,
          sdpLineCount: offer.sdp?.split('\n').length
        });
        await pc.setLocalDescription(offer);
        console.log('[WebRTC] Set local description.');
      } catch (error) {
        console.error('[WebRTC] Error creating offer:', error);
        throw new Error('Failed to create WebRTC offer. Please try again.');
      }

      let sdpResponse;
      try {
        const model = 'gpt-4o-realtime-preview-2025-06-03';
        sdpResponse = await fetch(`${API_URL}/realtime?model=${model}`, {
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
      } catch (error) {
        console.error('[API] Error sending SDP offer:', error);
        throw new Error('Failed to send session data to the server. Please try again.');
      }

      try {
        const answer = {
          type: 'answer' as RTCSdpType,
          sdp: await sdpResponse.text(),
        };
        await pc.setRemoteDescription(answer);
        console.log('[WebRTC] Set remote description.');
      } catch (error) {
        console.error('[WebRTC] Error setting remote description:', error);
        throw new Error('Failed to establish a connection with the server. Please try again.');
      }

      pc.addEventListener('icecandidate', (event: any) => {
        if (event.candidate) {
          // console.log('[WebRTC] New ICE candidate found:', event.candidate);
        } else {
          console.log('[WebRTC] All ICE candidates have been gathered.');
        }
      });

      setIsStarted(true);
      console.log('[Init] Initialization successful and session started.');

    } catch (error) {
      console.error('[Init] Error during initialization:', error);
      Alert.alert('Initialization Error', 'Failed to start the session. Please try again.');
      stop();
    } finally {
      setIsLoading(false);
    }
  }, [isStarted, session, startRecording, remoteStream, stop]);

  // Consolidated useEffect for prompt and context management
  useEffect(() => {
    const currentModeMessages = conversationHistories[promptType];
    const context = currentModeMessages.map(m => `${m.role}: ${m.text}`).join('\n');
    
    const userName = user?.user_metadata?.name || 'Değerli Kullanıcı';
    const newPrompt = promptType === 'conversation'
      ? generateSystemPromptToConverse(userName, context)
      : generateSystemPromptToAskQuestions(userName, context);
    
    // Only update systemPrompt state if it's different to avoid unnecessary re-renders
    // if (newPrompt !== systemPrompt) { // systemPrompt is not a state in this hook anymore
    //   setSystemPrompt(newPrompt);
    // }
    // systemPrompt is now a derived value, not a state.

    console.log(`[useEffect] Dependencies changed. promptType: ${promptType}, isStarted: ${isStarted}, dataChannelReady: ${dataChannelRef.current?.readyState === 'open'}, newPrompt (first 50 chars): ${newPrompt.substring(0, 50)}...`);

    // handleSessionUpdate is now called directly from switchPromptType and init
    // if (isStarted && dataChannelRef.current?.readyState === 'open') {
    //   console.log('[useEffect] Conditions met. Calling handleSessionUpdate with newPrompt.');
    //   handleSessionUpdate(newPrompt);
    // }
  }, [conversationHistories, user, promptType, isStarted, handleSessionUpdate]);

  const switchPromptType = useCallback(async (type: 'conversation' | 'questions') => {
    console.log(`[useIsheSession] Attempting to change promptType to: ${type}`);
    setIsLoading(true);
    setPromptType(type);
    console.log(`[useIsheSession] promptType set to: ${type}, isLoading set to true.`);

    const userName = user?.user_metadata?.name || 'Değerli Kullanıcı';
    const currentModeMessages = conversationHistories[type];
    const context = currentModeMessages.map(m => `${m.role}: ${m.text}`).join('\n');

    const newPrompt = type === 'conversation'
      ? generateSystemPromptToConverse(userName, context)
      : generateSystemPromptToAskQuestions(userName, context);
    
    // Directly call handleSessionUpdate with the new prompt
    if (isStarted && dataChannelRef.current?.readyState === 'open') {
      console.log('[useIsheSession] Calling handleSessionUpdate from switchPromptType.');
      await handleSessionUpdate(newPrompt);
    }

    setIsLoading(false);
    console.log(`[useIsheSession] isLoading set to false.`);
  }, [user, isStarted, conversationHistories, handleSessionUpdate]);

  const handlePressIn = useCallback(() => {
    setIsLongPressing(true);
    setPressProgress(0);
    
    const interval = setInterval(() => {
      setPressProgress(prev => {
        const newProgress = prev + (100 / (LONG_PRESS_DURATION / 100));
        return newProgress > 100 ? 100 : newProgress;
      });
    }, 100);
    setProgressInterval(interval);
    
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
  }, [isStarted, init, stop]);

  const handlePressOut = useCallback(() => {
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
  }, [pressTimer, progressInterval]);

  // Add a useEffect for cleaning up timers on unmount
  useEffect(() => {
    return () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
      }
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [pressTimer, progressInterval]);

  return {
    isStarted,
    remoteStream,
    currentTranscript,
    isModelSpeaking,
    isUserSpeaking,
    userTranscript,
    messages,
    promptType,
    isLoading,
    pressProgress,
    isLongPressing,
    init,
    stop,
    sendResponseRequest,
    switchPromptType,
    addMessage,
    handlePressIn,
    handlePressOut,
  };
};