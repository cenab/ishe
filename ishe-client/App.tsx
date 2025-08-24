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
  MediaStreamTrack as WebRTCMediaStreamTrack
} from 'react-native-webrtc';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { Ionicons } from '@expo/vector-icons';
import { generateSystemPromptToAskQuestions } from './src/utils/systemPrompt';
import InCallManager from 'react-native-incall-manager';

// Define the API URL based on platform
// For local development:
// - iOS simulator: use 'localhost' or '127.0.0.1'
// - Android emulator: use '10.0.2.2' (special alias for host machine's localhost)
// - Physical devices: use your machine's actual IP address (e.g., '192.168.1.100')
// const API_URL = Platform.select({
//   android: 'http://10.0.2.2:3000', // Android emulator
//   ios: 'http://localhost:3000',     // iOS simulator
//   default: 'http://localhost:3000',
// });

// For production use:
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

const MainApp = () => {
  const { user, session } = useAuth();
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
  // Map responseId -> complete user input for pairing with assistant response
  const [responseUserInputs, setResponseUserInputs] = useState<Record<string, string>>({});
  // Robust pairing maps
  const [userItemToTranscript, setUserItemToTranscript] = useState<Record<string, string>>({});
  const [assistantItemToResponseId, setAssistantItemToResponseId] = useState<Record<string, string>>({});
  const [responseIdToUserInput, setResponseIdToUserInput] = useState<Record<string, string>>({});
  const [userItemToResponseId, setUserItemToResponseId] = useState<Record<string, string>>({});
  
  // Removed expo-av recording. Use WebRTC only.
  
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

  // Update the useEffect to always use questions prompt
  useEffect(() => {
    const userName = user?.user_metadata?.name || 'Değerli Kullanıcı';
    const newPrompt = generateSystemPromptToAskQuestions(userName, conversationContext);
    setSystemPrompt(newPrompt);
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
      const preview = (text || '').slice(0, 160);
      console.log('[API] Storing conversation snippet...', {
        type: metadata?.type,
        responseId: metadata?.responseId,
        userInputPreview: (metadata?.userInput || '').slice(0, 160),
        textPreview: preview + ((text && text.length > 160) ? '...' : '')
      });
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

  // Removed expo-av recording start function

  // Removed expo-av recording stop/upload

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
          setTempUserInput((prev: string[]) => [...prev, message.transcript.trim()]);
          console.log('[Transcript] Chunk completed:', (message.transcript || '').slice(0, 160));
          // Map final transcript to the originating user item
          if (message.item_id) {
            const finalTranscript = (message.transcript || '').trim();
            if (finalTranscript) {
              setUserItemToTranscript(prev => ({ ...prev, [message.item_id]: finalTranscript }));
              // Immediately store user input without pairing
              console.log('[UserInput] Storing final user transcript from item', message.item_id);
              storeConversation(finalTranscript, {
                type: 'user_input',
                itemId: message.item_id,
                timestamp: new Date().toISOString()
              });
              // If we already know which responseId this user item maps to, link and persist now
              const mappedResponseId = userItemToResponseId[message.item_id];
              if (mappedResponseId && !responseIdToUserInput[mappedResponseId]) {
                console.log('[Pair] user transcript completed -> linking response to user input', {
                  responseId: mappedResponseId,
                  userItemId: message.item_id,
                  userInputPreview: finalTranscript.slice(0, 160)
                });
                storeConversation(finalTranscript, {
                  type: 'user_input',
                  responseId: mappedResponseId,
                  timestamp: new Date().toISOString()
                });
                setResponseIdToUserInput(prev => ({ ...prev, [mappedResponseId]: finalTranscript }));
                setResponseUserInputs(prev => ({ ...prev, [mappedResponseId]: finalTranscript }));
              }
            }
          }
          break;

        case 'response.created':
          // When a response is created, it means the user has finished speaking
          // Prefer the concatenated completed chunks; otherwise fall back to live userTranscript
          {
            const respId = message.response.id;
            const candidateFromChunks = tempUserInput.length > 0 ? tempUserInput.join(' ') : '';
            const fallbackFromLive = (userTranscript || '').trim();
            const completeUserInput = (candidateFromChunks || fallbackFromLive).trim();

            if (completeUserInput) {
              console.log('[Turn] response.created -> finalized user input', {
                responseId: respId,
                source: candidateFromChunks ? 'chunks' : 'live',
                length: completeUserInput.length,
                preview: completeUserInput.slice(0, 160)
              });
              setMessages((prev: Message[]) => [...prev, {
                id: Date.now().toString(),
                role: 'user',
                text: completeUserInput,
                timestamp: new Date()
              }]);
              // Do not store here to avoid duplicates; user input is stored on transcript completed
            }
            setTempUserInput([]); // Clear temporary input
            setCurrentResponseId(respId);
          }
          break;

        case 'response.output_item.added': {
          // Map assistant item id to response id for later pairing
          const assistantItemId = message.item?.id;
          const responseId = message.response_id;
          if (assistantItemId && responseId) {
            setAssistantItemToResponseId(prev => ({ ...prev, [assistantItemId]: responseId }));
          }
          break;
        }

        case 'conversation.item.created': {
          // Assistant item references previous user item; pair that transcript with responseId
          const item = message.item;
          if (item?.role === 'assistant' && item?.type === 'message') {
            const assistantItemId = item.id;
            const prevUserItemId = message.previous_item_id;
            if (assistantItemId && prevUserItemId) {
              const responseId = assistantItemToResponseId[assistantItemId];
              const userInput = userItemToTranscript[prevUserItemId];
              if (responseId && userInput && !responseIdToUserInput[responseId]) {
                console.log('[Pair] assistant item created -> linking response to user input', {
                  responseId,
                  assistantItemId,
                  prevUserItemId,
                  userInputPreview: userInput.slice(0, 160)
                });
                // Persist user turn once we know the definitive responseId
                storeConversation(userInput, {
                  type: 'user_input',
                  responseId,
                  timestamp: new Date().toISOString()
                });
                setResponseIdToUserInput(prev => ({ ...prev, [responseId]: userInput }));
                // Keep legacy map in sync for existing code paths
                setResponseUserInputs(prev => ({ ...prev, [responseId]: userInput }));
              } else if (responseId && !userInput) {
                // We know which response this user item maps to, but transcript isn't completed yet.
                setUserItemToResponseId(prev => ({ ...prev, [prevUserItemId]: responseId }));
                console.log('[Pair] assistant item created -> mapped userItem to response, awaiting transcript', {
                  responseId,
                  assistantItemId,
                  prevUserItemId
                });
              }
            }
          }
          break;
        }

        case 'response.done':
          console.log(`[DataChannel] Response done. ID: ${message.response?.id}, Status: ${message.response?.status}`);
          if (message.response.id === currentResponseId) {
            if (message.response.status === 'failed') {
              console.error('Response failed:', message.response.status_details);
            } else {
              // Store assistant's response (finalized) and pair with user input if available
              if (currentTranscript) {
                const userInputForThisResponse = (
                  responseIdToUserInput[message.response.id] ||
                  responseUserInputs[message.response.id] ||
                  (userTranscript || '').trim() ||
                  undefined
                );
                console.log('[Turn] response.done -> storing assistant response', {
                  responseId: message.response.id,
                  assistantTextPreview: currentTranscript.slice(0, 160),
                  userInputPreview: (userInputForThisResponse || '').slice(0, 160)
                });
                storeConversation(currentTranscript, {
                  type: 'assistant_response',
                  responseId: message.response.id,
                  userInput: userInputForThisResponse,
                  timestamp: new Date().toISOString()
                });
                // Clean up map entry
                if (responseUserInputs[message.response.id]) {
                  setResponseUserInputs(prev => {
                    const clone = { ...prev };
                    delete clone[message.response.id];
                    return clone;
                  });
                }
                if (responseIdToUserInput[message.response.id]) {
                  setResponseIdToUserInput(prev => {
                    const clone = { ...prev };
                    delete clone[message.response.id];
                    return clone;
                  });
                }
              }
            }
            setCurrentResponseId(null);
          }
          break;

        case 'transcript':
          console.log('[Transcript] Live:', (message.text || '').slice(0, 160));
          setUserTranscript(message.text);
          setIsUserSpeaking(true);
          break;

        case 'response.audio_transcript.delta':
          // Log only occasionally to avoid flooding
          // if (Math.random() < 0.1) console.log('[DataChannel] Received transcript delta');
          if (!currentResponseId || message.response_id === currentResponseId) {
            setCurrentTranscript((prev: string) => prev + (message.delta || ''));
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
            setMessages((prev: Message[]) => [...prev, assistantMessage]);
            // Store assistant's complete response, paired with the original user input
            const userInputForThisResponse = (
              responseIdToUserInput[message.response_id] ||
              responseUserInputs[message.response_id] ||
              (userTranscript || '').trim() ||
              undefined
            );
            console.log('[Turn] response.audio_transcript.done -> storing assistant response', {
              responseId: message.response_id,
              assistantTextPreview: (message.transcript || '').slice(0, 160),
              userInputPreview: (userInputForThisResponse || '').slice(0, 160)
            });
            storeConversation(message.transcript, {
              type: 'assistant_response',
              responseId: message.response_id,
              userInput: userInputForThisResponse,
              timestamp: new Date().toISOString()
            });
            // Clean up map entry
            if (responseUserInputs[message.response_id]) {
              setResponseUserInputs(prev => {
                const clone = { ...prev };
                delete clone[message.response_id];
                return clone;
              });
            }
            if (responseIdToUserInput[message.response_id]) {
              setResponseIdToUserInput(prev => {
                const clone = { ...prev };
                delete clone[message.response_id];
                return clone;
              });
            }
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
            // Re-assert speakerphone routing when assistant speech starts
            try {
              InCallManager.setForceSpeakerphoneOn(true);
              InCallManager.setSpeakerphoneOn?.(true);
              console.log('[Audio] Speakerphone re-asserted on speech start');
            } catch (e) {
              console.warn('[Audio] Failed to re-assert speaker on speech start:', e);
            }
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
          model: 'whisper-1',
          language: 'tr',
          prompt: 'Türkçe konuşmaları doğru yaz; tıbbi ve yöresel terimlere özen göster; noktalama ve Türkçe karakterleri (ç, ğ, ı, İ, ö, ş, ü) doğru kullan.'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.3,
          silence_duration_ms: 900,
          prefix_padding_ms: 500,
          interrupt_response: true,
          create_response: true
        },
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

      // Removed separate expo-av recording; using WebRTC stream only

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
          // Set questions mode and update session
          const userName = user?.user_metadata?.name || 'Değerli Kullanıcı';
          const newPrompt = generateSystemPromptToAskQuestions(userName, conversationContext);
          setSystemPrompt(newPrompt);
          handleSessionUpdate(newPrompt);
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
            const tracks: any[] = (remoteStream as any).getTracks?.() || [];
            tracks.forEach((track: any) => {
              if (track && typeof track.stop === 'function') track.stop();
              if (remoteStream && typeof (remoteStream as any).removeTrack === 'function') {
                (remoteStream as any).removeTrack(track);
              }
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
          // Re-assert speakerphone routing when remote audio becomes available
          try {
            InCallManager.setForceSpeakerphoneOn(true);
            InCallManager.setSpeakerphoneOn?.(true);
            console.log('[Audio] Speakerphone re-asserted after remote track');
          } catch (e) {
            console.warn('[Audio] Failed to re-assert speaker after track:', e);
          }
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
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: false,
            autoGainControl: false
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
        const audioTracks: any[] = (localStream as any).getAudioTracks?.() || [];
        if (audioTracks.length > 0) {
          (audioTracks[0] as any).enabled = true;
          pc.addTrack(audioTracks[0] as any, localStream as any);
          console.log('[Media] Added audio track to peer connection:', {
            label: (audioTracks[0] as any).label,
            enabled: (audioTracks[0] as any).enabled
          });
          
          // Disable any additional tracks
          (audioTracks as any[]).slice(1).forEach((track: any) => {
            track.enabled = false;
            if (typeof track.stop === 'function') track.stop();
            console.log('[Media] Disabled additional audio track:', track?.label);
          });
        }

        // No need to send custom audio buffer config; use defaults to preserve native quality
      } catch (error) {
        console.error('[Media] Error accessing microphone:', error);
        throw error; // Rethrow to trigger cleanup in outer catch
      }

      // Ensure audio routes to loudspeaker once session starts
      try {
        InCallManager.start({ media: 'audio' });
        // iOS/Android: force speakerphone
        InCallManager.setForceSpeakerphoneOn(true);
        InCallManager.setSpeakerphoneOn?.(true);
        // Keep screen on while in session (optional)
        InCallManager.setKeepScreenOn?.(true);
        console.log('[Audio] Speakerphone forced ON');
      } catch (e) {
        console.warn('[Audio] Failed to set speakerphone:', e);
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
      const model = 'gpt-4o-realtime-preview-2025-06-03';
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
      // Re-assert speakerphone routing after remote description is set
      try {
        InCallManager.setForceSpeakerphoneOn(true);
        InCallManager.setSpeakerphoneOn?.(true);
        console.log('[Audio] Speakerphone re-asserted after remote description');
      } catch (e) {
        console.warn('[Audio] Failed to re-assert speaker after remote description:', e);
      }

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
    // Removed separate expo-av recording stop
    
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

    // Reset audio routing
    try {
      InCallManager.setForceSpeakerphoneOn(false);
      InCallManager.setSpeakerphoneOn?.(false);
      InCallManager.setKeepScreenOn?.(false);
      InCallManager.stop();
      console.log('[Audio] Speakerphone reset OFF');
    } catch (e) {
      console.warn('[Audio] Failed to reset speakerphone:', e);
    }
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