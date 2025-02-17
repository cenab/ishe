// Load environment variables first
import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { expressjwt as jwt } from 'express-jwt';
import vectorDb from './src/utils/supabaseVectorDb.js';
import conversationsRouter from './src/routes/conversations.js';
import { verifySupabaseToken } from './src/middleware/auth.js';

const app = express();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Server Supabase URL:', supabaseUrl);
console.log('Server Supabase Service Key:', supabaseServiceKey);

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase configuration is missing. Please check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Middleware
app.use(cors({
  origin: ['http://localhost:19006', 'http://localhost:19000', 'http://localhost:19001', 'http://localhost:19002'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Initialize vector database
vectorDb.initialize().catch(console.error);

// Routes
app.use('/api/conversations', conversationsRouter);

// Protected route example
app.get('/api/protected', verifySupabaseToken, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Session endpoint
app.get("/session", verifySupabaseToken, async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    console.log('Creating OpenAI session for user:', req.user.id);

    // Get user's previous conversations
    const userId = req.user.id;
    const previousConversations = await vectorDb.getUserConversations(userId, 10);
    
    // Format conversations into a context string
    const conversationContext = previousConversations
      .map(conv => `User: ${conv.metadata?.userInput || ''}\nAssistant: ${conv.text}`)
      .join('\n\n');

    const systemPrompt = `You are a helpful AI assistant specializing in discussing dementia and related topics. 
Here are the previous conversations with this user for context:

${conversationContext}

Please use this context to provide more personalized and contextually relevant responses while maintaining conversation continuity.`;

    console.log('Making request to OpenAI realtime sessions API...');
    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        modalities: ["audio", "text"],
        instructions: systemPrompt,
        voice: "alloy",
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1"
        },
        turn_detection: null,
        tools: [],
        tool_choice: "none",
        temperature: 0.7,
        max_response_output_tokens: 200
      }),
    });

    if (!r.ok) {
      const errorData = await r.json();
      console.error('OpenAI API error response:', errorData);
      return res.status(r.status).json({ 
        error: 'OpenAI API error',
        details: errorData
      });
    }

    const data = await r.json();
    console.log('Successfully created OpenAI session');
    
    if (!data.client_secret?.value) {
      console.error('OpenAI response missing client_secret:', data);
      return res.status(500).json({
        error: 'Invalid OpenAI response',
        message: 'Response missing client_secret value'
      });
    }

    res.json({
      client_secret: {
        value: data.client_secret.value,
        expires_at: data.client_secret.expires_at
      }
    });
  } catch (error) {
    console.error('Session endpoint error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message
  });
});

// Validate OpenAI API key
async function validateOpenAIKey() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Invalid OpenAI API key: ${error.error?.message || 'Unknown error'}`);
    }

    console.log('OpenAI API key validated successfully');
  } catch (error) {
    console.error('OpenAI API key validation failed:', error);
    throw error;
  }
}

// Start server after validating dependencies
async function startServer() {
  try {
    await validateOpenAIKey();
    await vectorDb.initialize();

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 