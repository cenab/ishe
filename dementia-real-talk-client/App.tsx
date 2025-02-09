import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Platform, TextInput } from 'react-native';
import {
  RTCPeerConnection,
  mediaDevices,
  MediaStream,
  MediaStreamTrack,
  RTCView,
} from 'react-native-webrtc';

// Define the API URL based on platform
const API_URL = Platform.select({
  android: 'http://10.0.2.2:3000',
  ios: 'http://localhost:3000',
  default: 'http://localhost:3000',
});

export default function App() {
  // State to track whether the session is started and to hold the remote stream
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [modelResponse, setModelResponse] = useState<string>('');
  const [isModelSpeaking, setIsModelSpeaking] = useState<boolean>(false);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [isUserSpeaking, setIsUserSpeaking] = useState<boolean>(false);
  const [userTranscript, setUserTranscript] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [currentResponseId, setCurrentResponseId] = useState<string | null>(null);
  
  // Refs to store the peer connection and local stream so they can be stopped later
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const dataChannelRef = useRef<any>(null);

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
      console.log('Sent response request to model:', responseCreate);
      setUserTranscript(''); // Clear user transcript for next interaction
    } else {
      console.log('Data channel not ready or no user input');
    }
  };

  // Function to send text input as a message
  const sendTextInput = () => {
    if (dataChannelRef.current?.readyState === 'open' && textInput.trim()) {
      const responseCreate = {
        type: "response.create",
        response: {
          modalities: ["audio", "text"],
          input: [{
            type: "message",
            role: "user",
            content: [{
              type: "input_text",
              text: textInput.trim()
            }]
          }]
        },
      };
      dataChannelRef.current.send(JSON.stringify(responseCreate));
      console.log('Sent text input to model:', responseCreate);
      setTextInput(''); // Clear text input
    }
  };

  // Function to handle incoming messages
  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.data);
      console.log('DataChannel message:', message);

      // If this message is from a different response than our current one, ignore it
      if (message.response_id && currentResponseId && message.response_id !== currentResponseId) {
        console.log('Ignoring message from old response:', message.response_id);
        return;
      }

      switch (message.type) {
        case 'response.created':
          console.log('Response created:', message.response.id);
          setCurrentResponseId(message.response.id);
          break;
        case 'response.done':
          if (message.response.id === currentResponseId) {
            if (message.response.status === 'failed') {
              console.error('Response failed:', message.response.status_details);
            } else {
              console.log('Response completed:', message.response.id);
            }
            setCurrentResponseId(null);
          }
          break;
        case 'transcript':
          // This is the user's speech transcript
          setUserTranscript(message.text);
          setIsUserSpeaking(true);
          break;
        case 'response.audio_transcript.delta':
          if (!currentResponseId || message.response_id === currentResponseId) {
            setCurrentTranscript(prev => prev + (message.delta || ''));
            // Clear previous transcript when getting new deltas
            setTranscript('');
          }
          break;
        case 'response.audio_transcript.done':
          if (!currentResponseId || message.response_id === currentResponseId) {
            // Store the final transcript
            setTranscript(message.transcript);
            setCurrentTranscript('');
            setIsUserSpeaking(false);
          }
          break;
        case 'speech.started':
          if (!currentResponseId || message.response_id === currentResponseId) {
            console.log('Model started speaking');
            setIsModelSpeaking(true);
            // Clear previous transcript when model starts speaking
            setCurrentTranscript('');
            setTranscript('');
          }
          break;
        case 'speech.ended':
          if (!currentResponseId || message.response_id === currentResponseId) {
            console.log('Model finished speaking');
            setIsModelSpeaking(false);
          }
          break;
        case 'session.error':
          console.error('Session error:', message.error);
          break;
        case 'error':
          console.error('Error from server:', message.error);
          break;
        case 'text':
          setModelResponse(message.text);
          break;
        case 'session.created':
        case 'session.updated':
          console.log(`Session ${message.type}:`, message.session.id);
          break;
        case 'response.audio.done':
        case 'response.content_part.done':
        case 'response.output_item.done':
        case 'output_audio_buffer.stopped':
          // These events indicate different stages of response completion
          console.log(`Received ${message.type} event`);
          break;
        default:
          console.log('Unhandled message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  };

  // Function to initialize the connection (called when "Enable" button is pressed)
  async function init() {
    try {
      // Get an ephemeral key from your server
      const tokenResponse = await fetch(`${API_URL}/session`);
      const data = await tokenResponse.json();
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
        console.log('Data channel opened');
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
          console.log('Sent session update:', sessionUpdate);
        }
      });

      dc.addEventListener('message', handleMessage);

      // Handle remote stream: store it in state when received
      pc.addEventListener('track', (event: any) => {
        if (event.streams && event.streams[0]) {
          console.log('Remote stream received:', event.streams[0]);
          
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
            console.log('Added single audio track to new stream:', track.label);
          }
          
          setRemoteStream(newStream);
        }
      });

      // Get local audio from the device's microphone
      try {
        console.log('Requesting microphone access...');
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
        console.log('Microphone access granted');
        
        localStreamRef.current = localStream;
        
        // Add only one audio track to the peer connection
        const audioTracks = localStream.getAudioTracks();
        if (audioTracks.length > 0) {
          audioTracks[0].enabled = true;
          pc.addTrack(audioTracks[0], localStream);
          console.log('Added audio track to peer connection:', audioTracks[0].label);
          
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
        console.log('Sent initial audio buffer config:', audioBuffer);
      } catch (error) {
        console.error('Error accessing microphone:', error);
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
          console.log('New ICE candidate:', event.candidate);
        }
      });

      // Update state to indicate that the session is started
      setIsStarted(true);
    } catch (error) {
      console.error('Error during initialization:', error);
      stop(); // Clean up if initialization fails
    }
  }

  // Function to stop the session
  async function stop() {
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
    setTranscript('');
    setModelResponse('');
    setIsModelSpeaking(false);
    setIsUserSpeaking(false);
    setUserTranscript('');
    setCurrentResponseId(null);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dementia Real Talk React App</Text>
      {isStarted ? (
        <Button title="Stop" onPress={stop} color="#D9534F" />
      ) : (
        <Button title="Enable" onPress={init} color="#5CB85C" />
      )}
      <Text style={styles.status}>
        {isStarted ? (
          isUserSpeaking ? 'Listening to you...' : 
          isModelSpeaking ? 'Assistant is speaking...' : 
          'Ready for your input'
        ) : 'Session Stopped'}
      </Text>
      {remoteStream ? (
        <View style={styles.streamContainer}>
          <Text>Voice connection established</Text>
          {remoteStream.getAudioTracks().length > 0 && (
            <RTCView
              streamURL={remoteStream.toURL()}
              style={styles.rtcView}
            />
          )}
          
          {/* Add text input for emulator testing */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={textInput}
              onChangeText={setTextInput}
              placeholder="Type your message here..."
              multiline
              returnKeyType="send"
              onSubmitEditing={sendTextInput}
              editable={!isModelSpeaking}
            />
            <Button
              title="Send"
              onPress={sendTextInput}
              disabled={isModelSpeaking || !textInput.trim()}
              color="#5CB85C"
            />
          </View>

          {userTranscript && (
            <View style={styles.transcriptContainer}>
              <Text style={styles.label}>Your Message:</Text>
              <Text style={styles.text}>{userTranscript}</Text>
            </View>
          )}
          {/* Show either current transcript or previous response, not both */}
          {currentTranscript ? (
            <View style={styles.transcriptContainer}>
              <Text style={styles.label}>Assistant Speaking:</Text>
              <Text style={styles.text}>{currentTranscript}</Text>
            </View>
          ) : transcript ? (
            <View style={styles.transcriptContainer}>
              <Text style={styles.label}>Assistant's Response:</Text>
              <Text style={styles.text}>{transcript}</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <Text>Establishing connection...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  status: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  streamContainer: {
    width: '100%',
    alignItems: 'center',
  },
  rtcView: {
    width: 1,
    height: 1,
    opacity: 0,
  },
  transcriptContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#FFF',
    borderRadius: 8,
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  text: {
    fontSize: 14,
    color: '#333',
  },
  inputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
    backgroundColor: '#FFF',
    maxHeight: 100,
  },
});
