# iShe Server

The server application for iShe, a real-time conversation application with your AI companion.

Backend server for the iShe application.

## Tech Stack

- Node.js
- Express.js
- Supabase (PostgreSQL + pgvector)
- OpenAI API
- WebSocket for real-time communication

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Fill in the required environment variables in `.env`:
```
# Server Configuration
PORT=3000

# OpenAI API Configuration
OPENAI_API_KEY="your-openai-api-key"

# Supabase Configuration
SUPABASE_URL="your-supabase-url"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
SUPABASE_JWT_SECRET="your-supabase-jwt-secret-at-least-32-chars"

# S3 Storage Configuration
S3_ACCESS_KEY="your-s3-access-key"
S3_SECRET_KEY="your-s3-secret-key"
S3_ENDPOINT="your-s3-endpoint"

# Database Configuration
DATABASE_URL="your-database-url"
```

4. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `GET /session` - Get a new session token (requires Supabase authentication)

### Conversations
- `POST /api/conversations` - Add a new conversation
- `GET /api/conversations/search` - Search similar conversations
- `GET /api/conversations/user` - Get user's conversations
- `GET /api/conversations/history` - Get conversation history

## Development

The server uses:
- ES Modules for imports
- Vector embeddings for semantic search
- JWT authentication with Supabase
- Real-time audio streaming with OpenAI

## Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot reload

## Project Structure

```
src/
├── middleware/     # Authentication and other middleware
├── routes/         # API route handlers
├── utils/         # Utility functions and classes
└── config/        # Configuration files
```

## Error Handling

The server implements centralized error handling with detailed logging. All errors are properly formatted before being sent to the client.

## Security

- JWT-based authentication
- Environment variables for sensitive data
- CORS configuration for allowed origins
- Input validation and sanitization 

## Local Development

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Docker and Docker Compose
- Google Cloud account with Speech-to-Text, Text-to-Speech APIs enabled
- Supabase CLI (for local development with Supabase)

### Setting up Local Supabase

The server includes a local Supabase setup for development:

```bash
# Start Supabase locally
npm run supabase:start

# Stop Supabase
npm run supabase:stop

# Reset Supabase database (applies migrations)
npm run supabase:reset
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Server Configuration
PORT=3000

# OpenAI API Configuration
OPENAI_API_KEY="your-openai-api-key"

# Supabase Configuration
SUPABASE_URL="your-supabase-url"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
SUPABASE_JWT_SECRET="your-supabase-jwt-secret-at-least-32-chars"

# S3 Storage Configuration
S3_ACCESS_KEY="your-s3-access-key"
S3_SECRET_KEY="your-s3-secret-key"
S3_ENDPOINT="your-s3-endpoint"

# Database Configuration
DATABASE_URL="your-database-url"
``` 