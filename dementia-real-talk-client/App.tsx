import React, { useRef, useState } from 'react';
import { View, Text, Button, StyleSheet, Platform } from 'react-native';
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
  
  // Refs to store the peer connection and local stream so they can be stopped later
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const dataChannelRef = useRef<any>(null);

  // Function to send a response request to the model
  const sendResponseRequest = () => {
    if (dataChannelRef.current?.readyState === 'open') {
      const responseCreate = {
        type: "response.create",
        response: {
          modalities: ["audio", "text"],
          input: [{
            type: "message",
            role: "user",
            content: [{
              type: "input_text",
              text: transcript || "Hello, how can I help you today?"
            }]
          }]
        },
      };
      dataChannelRef.current.send(JSON.stringify(responseCreate));
      console.log('Sent response request to model:', responseCreate);
    } else {
      console.log('Data channel not ready');
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

      // Handle remote stream: store it in state when received
      pc.addEventListener('track', (event: any) => {
        if (event.streams && event.streams[0]) {
          console.log('Remote stream received:', event.streams[0]);
          setRemoteStream(event.streams[0]);
          
          // Enable audio tracks
          event.streams[0].getAudioTracks().forEach((track: MediaStreamTrack) => {
            track.enabled = true;
            console.log('Audio track enabled:', track.id);
          });
        }
      });

      // Get local audio from the device's microphone
      try {
        console.log('Requesting microphone access...');
        const localStream = await mediaDevices.getUserMedia({ 
          audio: true,
          video: false 
        });
        console.log('Microphone access granted');
        
        // Check audio tracks
        const audioTracks = localStream.getAudioTracks();
        console.log('Number of audio tracks:', audioTracks.length);
        audioTracks.forEach(track => {
          console.log('Audio track:', {
            id: track.id,
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
            label: track.label
          });
        });

        localStreamRef.current = localStream;
        
        // Add the first audio track to the peer connection
        const [audioTrack] = localStream.getTracks();
        if (!audioTrack) {
          throw new Error('No audio track available');
        }
        pc.addTrack(audioTrack, localStream);
        console.log('Added audio track to peer connection');
      } catch (error) {
        console.error('Error accessing microphone:', error);
      }

      // Set up a data channel for sending and receiving events
      const dc = pc.createDataChannel('oai-events');
      dataChannelRef.current = dc;

      dc.addEventListener('open', () => {
        console.log('Data channel opened');
        // Send initial response request when channel opens
        sendResponseRequest();
      });

      dc.addEventListener('message', (event: any) => {
        try {
          const message = JSON.parse(event.data);
          console.log('DataChannel message:', message);

          switch (message.type) {
            case 'transcript':
              setTranscript(message.text);
              break;
            case 'speech.started':
              console.log('Model started speaking');
              break;
            case 'speech.ended':
              console.log('Model finished speaking');
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
            case 'response.created':
              console.log('Response created:', message.response.id);
              break;
            case 'response.done':
              if (message.response.status === 'failed') {
                console.error('Response failed:', message.response.status_details);
              } else {
                console.log('Response completed:', message.response.id);
              }
              break;
            case 'session.created':
            case 'session.updated':
              console.log(`Session ${message.type}:`, message.session.id);
              break;
            default:
              console.log('Unhandled message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

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

      // Parse the SDP answer and set it as the remote description
      const answer = {
        type: 'answer' as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);

      // Update state to indicate that the session is started
      setIsStarted(true);
    } catch (error) {
      console.error('Error during initialization:', error);
    }
  }

  // Function to stop the session (called when "Stop" button is pressed)
  async function stop() {
    // Close the peer connection if it exists
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    // Stop all tracks of the local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    // Reset the remote stream and session state
    setRemoteStream(null);
    setIsStarted(false);
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
        {isStarted ? 'Session Started' : 'Session Stopped'}
      </Text>
      {remoteStream ? (
        <View style={styles.streamContainer}>
          <Text>Remote audio stream is available.</Text>
          <RTCView
            streamURL={remoteStream.toURL()}
            style={styles.rtcView}
          />
          {transcript && (
            <View style={styles.transcriptContainer}>
              <Text style={styles.label}>Your message:</Text>
              <Text style={styles.text}>{transcript}</Text>
            </View>
          )}
          {modelResponse && (
            <View style={styles.transcriptContainer}>
              <Text style={styles.label}>Model response:</Text>
              <Text style={styles.text}>{modelResponse}</Text>
            </View>
          )}
          <Button 
            title="Request Response" 
            onPress={sendResponseRequest}
            color="#5CB85C"
          />
        </View>
      ) : (
        <Text>Waiting for remote stream...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
  status: {
    marginVertical: 20,
    fontSize: 16,
  },
  streamContainer: {
    width: '100%',
    alignItems: 'center',
  },
  rtcView: {
    width: 1,  // Minimal size since it's audio-only
    height: 1,
    opacity: 0, // Hide the view since it's audio-only
  },
  transcriptContainer: {
    width: '100%',
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#666',
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
});
