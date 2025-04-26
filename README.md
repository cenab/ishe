# iShe

A real-time conversation application with iShe, your AI companion.

## Project Structure

```
ishe/
├── ishe-client/               # React Native client application
├── ishe-server/               # Express.js server & API
│   ├── src/                   # Server source code
│   └── supabase/              # Supabase configuration and migrations
├── .github/                   # GitHub Actions workflows 
└── package.json               # Project configuration
```


## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase CLI
- OpenAI API key
- React Native development environment
- Android Studio with:
  - Android SDK Platform 33
  - Android SDK Build-Tools
  - Android Emulator
  - Android SDK Platform-Tools

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ishe.git
cd ishe
```

2. Install dependencies:
```bash
npm run install-all
```

3. Set up Supabase:
```bash
cd ishe-server
npm run supabase:start
```

4. Configure environment variables:
- Copy `.env.example` to `.env` in the server directory
- Fill in the required environment variables

5. Android Setup (if needed):
```bash
# List available Android emulators
npm run emulator:list

# Create a new emulator if none exists
npm run emulator:create

# Start the emulator
npm run emulator
```

6. Start the development servers:

```bash
# Run both client and server
npm run dev

# Run server only
npm run server

# Run client only
npm run client

# Start Supabase
cd ishe-server && npm run supabase:start

# Android Development
npm run android        # Starts both emulator and Expo dev build
npm run android:dev    # Starts Expo dev build only
npm run android:run    # Builds and runs on device/emulator

# iOS Development
npm run ios:dev       # Starts Expo dev build
npm run ios:run       # Builds and runs on simulator
```

## Available Scripts

### Development
- `npm run dev` - Start both server and client in development mode
- `npm run dev:server` - Start server in development mode
- `npm run start:client` - Start Expo development server

### Android
- `npm run android` - Start emulator and Android development build
- `npm run android:dev` - Start Android development build
- `npm run android:run` - Build and run on Android device/emulator
- `npm run emulator` - Start Android emulator
- `npm run emulator:list` - List available Android emulators
- `npm run emulator:create` - Create a new Android emulator

### iOS
- `npm run ios:dev` - Start iOS development build
- `npm run ios:run` - Build and run on iOS simulator

### Installation
- `npm run install:all` - Install dependencies for all packages
- `npm run install:server` - Install server dependencies
- `npm run install:client` - Install client dependencies

### Supabase
- `npm run supabase:start` - Start Supabase local development
- `npm run supabase:stop` - Stop Supabase local development
- `npm run supabase:reset` - Reset Supabase database

## Features

- Real-time conversations with AI about dementia-related topics
- Secure authentication via Supabase
- Vector similarity search for relevant conversation context
- Voice and text input/output
- Conversation history tracking

## Development

### Server

The backend server is built with:
- Express.js
- Supabase (PostgreSQL + pgvector)
- OpenAI API
- Vector embeddings for semantic search

### Client

The mobile app is built with:
- React Native
- Supabase JS client
- OpenAI API integration
- Real-time audio streaming

## Database Migrations

To apply database migrations:
```bash
npm run supabase:reset
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.