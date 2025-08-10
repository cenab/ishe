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
import audioRouter from './src/routes/audio.js';
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
app.use('/api/audio', audioRouter);

// Protected route example
app.get('/api/protected', verifySupabaseToken, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Add new WebRTC SDP endpoint
app.post("/realtime", verifySupabaseToken, express.raw({ type: 'application/sdp' }), async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    const sdp = req.body.toString();
    const model = req.query.model || 'gpt-4o-realtime-preview-2025-06-03';

    if (!sdp) {
      return res.status(400).json({ error: 'SDP offer is required' });
    }

    console.log('[WebRTC] Forwarding SDP offer to OpenAI...');
    const response = await fetch(`https://api.openai.com/v1/realtime?model=${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/sdp'
      },
      body: sdp
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[WebRTC] OpenAI SDP error:', error);
      return res.status(response.status).send(error);
    }

    const answer = await response.text();
    res.set('Content-Type', 'application/sdp').send(answer);
  } catch (error) {
    console.error('[WebRTC] Error handling SDP:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});

// Session endpoint
app.get("/session", verifySupabaseToken, async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    console.log('Creating OpenAI session for user:', req.user.id);

    // Get user's name from metadata
    const userName = req.user.user_metadata?.name || 'Değerli Kullanıcı';
    console.log('User name:', userName);

    // Get user's previous conversations
    const userId = req.user.id;
    const previousConversations = await vectorDb.getUserConversations(userId);
    
    // Format conversations into a context string, filtering out empty or undefined inputs
    const conversationContext = previousConversations
      .filter(conv => conv.metadata?.userInput || conv.text)
      .map(conv => {
        const userInput = conv.metadata?.userInput;
        const assistantResponse = conv.text;
        return userInput 
          ? `User: ${userInput}\nAssistant: ${assistantResponse}`
          : `Assistant: ${assistantResponse}`;
      })
      .join('\n\n');

    console.log('Conversation context length:', conversationContext.length);
    console.log('Number of previous conversations:', previousConversations.length);
    

    const systemPrompt = `You are iShe, a warm, friendly, and supportive AI assistant integrated into Pilot Proje iShe. Although this system prompt is in English, you must always speak to the user in Turkish.

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
        ■ "Onuncu soru: 20’den geriye doğru 3’er 3’er sayabilir misiniz?"
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
        Context Layering (Bağlam Katmanlama): Use the previous conversation context (${conversationContext}), the user's name, and project guidelines to enrich your responses.
        Task Definition (Görev Belirleme): Clearly, detailed, and structurally define the task you need to perform.
        Output Format (Çıktı Formatı): Structure your responses using section headers, lists, and templates to ensure clarity and readability.
        Quality Parameters (Kalite Parametreleri): Apply self-verification steps (calculations, logical flow, reference checks, etc.) to ensure the accuracy, consistency, and logic of your responses.
        These foundational techniques increase the clarity of your instructions, reduce the chance of errors, and result in higher-quality outputs.
        Every Response Must End with a Question:

        End each response with a clear and direct question that continues the flow of the conversation.
        This question should be designed to provide a smooth transition to the SPMSQ test without disrupting the natural flow of the conversation.
        For example, you might ask a general question like "Bugün gününüzü en çok hangi an renklendirdi?" and then follow up for the memory exercise with "Şimdi, hemen başlayalım: Bugün tarih, ay ve yıl nedir?"
        Use the previous conversation context provided below to tailor your responses and maintain continuity:

        ${conversationContext}

        Throughout all interactions, maintain a warm, empathetic, and supportive tone, always address ${userName} by their name naturally in conversation, and speak exclusively in Turkish.

        Thanks to this structure, the conversation will begin with a few transitional questions that provide a gentle start and then allow a smooth transition to the SPMSQ test questions. This method helps establish a more natural and fluid interaction with ${userName}.`;;
    

    console.log('Making request to OpenAI realtime sessions API...');
    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2025-06-03",
        modalities: ["audio", "text"],
        instructions: systemPrompt,
        voice: "alloy",
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1",
          language: "tr",
          prompt: "Türkçe konuşmaları doğru yaz; tıbbi ve yöresel terimlere özen göster; noktalama ve Türkçe karakterleri (ç, ğ, ı, İ, ö, ş, ü) doğru kullan."
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.3,
          silence_duration_ms: 700,
          prefix_padding_ms: 400,
          interrupt_response: true,
          create_response: true
        },
        // Stronger initial session config to bias Turkish ASR from the very first packet
        tools: [],
        tool_choice: "none",
        temperature: 0.7,
        max_response_output_tokens: "inf"
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