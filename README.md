# Dementia Real Talk

A React Native application that enables real-time voice conversations with an AI assistant using OpenAI's Realtime API and WebRTC.

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- React Native development environment set up
  - For iOS: Xcode (Mac only)
  - For Android: Android Studio
- OpenAI API key

## Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/dementia-real-talk.git
cd dementia-real-talk
```

2. Install dependencies:
```bash
# Install client dependencies
cd dementia-real-talk-client
npm install
# or if using yarn
yarn install

# Install server dependencies
cd ../dementia-real-talk-server
npm install
# or if using yarn
yarn install
```

3. Set up environment variables:

Create a `.env` file in the server directory:
```bash
cd dementia-real-talk-server
cp .env.example .env
```

Edit the `.env` file and add your OpenAI API key:
```
OPENAI_API_KEY=your_api_key_here
```

## Running the Application

You'll need to run both the server and client components.

### Start the Server

1. In the server directory:
```bash
cd dementia-real-talk-server
npm start
# or if using yarn
yarn start
```

The server will start on port 3000.

### Start the Client

2. In a new terminal, navigate to the client directory:
```bash
cd dementia-real-talk-client
```

3. For iOS:
```bash
# Install pods (first time only)
cd ios && pod install && cd ..

# Run the app
npm run ios
# or if using yarn
yarn ios
```

4. For Android:
```bash
emulator @Pixel_4a_Edited_API_33
npx expo run:android

```

## Using the Application

1. Launch the app on your device/simulator
2. Press the "Enable" button to start a session
3. Grant microphone permissions when prompted
4. Start speaking - your voice will be transcribed automatically
5. The AI will respond with both voice and text
6. Use the "Request Response" button to manually trigger AI responses
7. Press "Stop" to end the session

## Troubleshooting

- If you're using an iOS simulator and don't hear audio, make sure the simulator's audio input/output is properly configured
- For Android emulators, verify that microphone permissions are granted in the system settings
- Check the console logs for detailed error messages and debugging information

## Development Notes

- The application uses WebRTC for real-time audio communication
- Voice Activity Detection (VAD) is enabled by default
- The model will automatically respond when it detects you've finished speaking
- The UI displays both transcribed user input and model responses

## License

[Add your license information here]