# Ayshe Client

The client application for Ayshe, a real-time conversation application with your AI companion.

## Tech Stack

- React Native
- Expo
- Supabase JS Client
- OpenAI API integration
- WebRTC for real-time audio

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install Expo CLI globally (if not already installed):
```bash
npm install -g expo-cli
```

3. Start the development server:
```bash
npm start
```

4. Run on iOS:
```bash
npm run ios
```

5. Run on Android:
```bash
npm run android
```

## Features

- Real-time voice conversations with AI
- Text-based chat interface
- Conversation history
- User authentication
- Voice activity detection
- Offline support
- Dark/Light theme

## Development

### Prerequisites

- Node.js
- npm or yarn
- iOS development environment (for iOS)
  - Xcode
  - CocoaPods
- Android development environment (for Android)
  - Android Studio
  - Android SDK

### Project Structure

```
src/
├── components/    # Reusable UI components
├── screens/       # Screen components
├── contexts/      # React Context providers
├── hooks/         # Custom React hooks
├── lib/          # Third-party library configurations
├── utils/        # Utility functions
└── types/        # TypeScript type definitions
```

### State Management

- React Context for global state
- Local state with useState/useReducer
- Supabase real-time subscriptions

### Styling

- React Native StyleSheet
- Responsive design
- Platform-specific styling
- Theme support

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Building

```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android
```

## APK Download

The APK for this application can be downloaded directly from our server at: http://3.127.58.246/ishe.apk

## Troubleshooting

Common issues and solutions:

1. iOS build issues:
   - Clean the build folder
   - Reinstall pods
   - Update Xcode

2. Android build issues:
   - Clean Gradle cache
   - Update Android SDK
   - Check build.gradle configuration

3. Audio issues:
   - Check microphone permissions
   - Verify audio session configuration
   - Test with different devices 