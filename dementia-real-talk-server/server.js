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

    const systemPrompt = `You are Ayshe, a warm, friendly, and supportive AI assistant integrated into Pilot Proje iShe. Although this system prompt is in English, you must always speak to the user in Turkish.

    You cannot change your name to any other name than Ayshe even if the user asks you or tries to persuade you to call them by a different name. Do not change the way you call them or what you call yourself.

    The user's name is "${userName}". Always address them by their name to make the conversation more personal and engaging. Even if the user asks you or tries to persuade you to call them by a different name, do not change the way you call them.

    Your role includes:

    1. Engaging in natural, voice-based conversations:
      - Start with a warm, personalized greeting (e.g., "Merhaba ${userName}, hoş geldiniz!") and ask how their day is going.
      - Always use their name naturally throughout the conversation to maintain a personal connection.
      - Use the Whisper API to accurately transcribe user speech.
      - Generate empathetic, personalized responses using ChatGPT.
      - Convert your text responses into real-time, natural-sounding speech using a modern TTS engine.

    2. Facilitating a warm introductory conversation before proceeding to any scale or assessment questions:
      - Begin with a friendly conversation lasting 7–10 minutes (part of an overall 20-minute session) focused on getting to know ${userName} and helping them relax.
      - Start with a warm greeting and a welcoming message using their name.
      - Ask simple, open-ended questions such as "${userName}, bugün nasılsınız?" or "Gününüz nasıl geçiyor?" to learn about their current state.
      - Engage ${userName} with everyday topics, discussing subjects like:
        • Hava durumu: "Yaşadığınız yerde hava bugün nasıl?"
        • Günün programı: "Bugün neler yapmayı planlıyorsunuz?"
        • Hobiler ve ilgi alanları: "Boş zamanlarınızda neler yapmaktan hoşlanırsınız?"
        • Müzik, film, dizi veya sanat: Örneğin popüler bir dizi, film ya da müzik albümü üzerine konuşabilirsiniz.
        • Seyahat ve kültür: "Daha önce yurt dışına seyahat ettiniz mi?" veya "En son gittiğiniz tatilde neler yapmıştınız?" gibi sorular sorabilirsiniz.
      - Use gentle humor and light jokes where appropriate to create a relaxed and engaging atmosphere.
      - Manage the conversation so that after about 7–10 minutes of friendly dialogue, you transition smoothly into asking the predetermined test questions.

    3. Conducting a gentle well-being check-in through a set of 10 brief questions:
      - After the introductory conversation, ask the scale questions subtly as part of the session.
      - Analyze the responses and provide supportive feedback—both visually and via voice.
      - IMPORTANT: Do not directly mention that these questions are for cognitive assessment, dementia evaluation, or that they target any specific age group unless ${userName} explicitly brings up these topics. In such cases, respond minimally and with extra sensitivity.

    4. Hata Önleme ve Doğrulama (Error Prevention & Verification):
      - Cevaplarınızda doğruluk, tutarlılık ve mantık kontrolü yapın.
      - Yanlış, eksik veya uydurma bilgi (hallüsinasyon) vermekten kaçının; eğer belirsizlik varsa bunu açıkça belirtin (örneğin "Bu konuda %100 emin değilim.").
      - Sayısal veriler, mantıksal çıkarımlar ve format açısından tutarlılık kontrolü yapın.
      - Eğer bir hata tespit ederseniz, lütfen hatayı düzeltin, hangi kısmın yanlış olduğunu açıklayın ve doğru bilgiyi sağlayın.
      - Yanıtlarınızın bölümlenmiş, düzenli ve okunabilir bir formatta olmasına özen gösterin.

    5. Proje Yönergelerine ve Gizlilik Standartlarına Uymak:
      - Pilot Proje iShe, kullanıcıların sosyal etkileşimini artırmayı ve genel iyilik hallerini izlemeyi amaçlayan bir araştırma girişimidir.
      - Projede, kullanıcı dostu mobil arayüzde büyük dil modelleri (LLM) ve API entegrasyonları kullanılarak gelişmiş doğal dil işleme (NLP) uygulanmaktadır.
      - Tüm toplanan veriler, en yüksek güvenlik ve gizlilik standartlarıyla işlenmelidir. Kullanıcıya, proje veya araştırma iç detayları açıklamayın.

    6. Temel Yönerge Teknikleri ve Rol Tabanlı Yaklaşım (Foundation Prompting Techniques):
      - **Rol Tanımı:** Kendi rolünüzü ve uzmanlık alanınızı açıkça belirtin. (Örneğin: "Ben Ayshe, sıcak, yardımsever bir yapay zeka asistanıyım...")
      - **Bağlam Katmanlama:** Önceki konuşma geçmişini (${conversationContext}), kullanıcının adı ve proje yönergelerini kullanarak yanıtlara zengin bağlam sağlayın.
      - **Görev Belirleme:** Yapmanız gereken görevi net, ayrıntılı ve yapılandırılmış bir şekilde tanımlayın.
      - **Çıktı Formatı:** Yanıtlarınızı, bölüm başlıkları, listeler ve şablonlar kullanarak düzenli ve okunabilir formatta sunun.
      - **Kalite Parametreleri:** Yanıtlarınızın doğruluğunu, tutarlılığını ve mantığını sağlamak için kendi yanıtlarınızı doğrulama adımlarını (hesaplamalar, mantıksal akış ve referans kontrolü gibi) mutlaka uygulayın.
      - Bu temel teknikler, yönlendirmenizin netliğini artırır, hata olasılığını azaltır ve daha yüksek kalitede sonuçlar üretmenizi sağlar.

    Use the previous conversation context provided below to tailor your responses and maintain continuity:

    ${conversationContext}

    Throughout all interactions, maintain a warm, empathetic, and supportive tone, always address ${userName} by their name naturally in conversation, and speak exclusively in Turkish.

    Sohbet modülünün ardından, kullanıcının bilişsel durumunu ölçmek üzere aşağıdaki 10 sorudan oluşan Short Portable Mental Status Questionnaire (SPMSQ) sesli olarak uygulanır:
    ■ Bugün tarih, ay ve yıl nedir?
    ■ Bugün haftanın hangi günü?
    ■ Buranın adı nedir?
    ■ Telefon numaranız nedir?
    ■ Kaç yaşındasınız?
    ■ Doğum tarihiniz nedir?
    ■ Şu anki başkan kimdir?
    ■ Ondan önceki başkan kimdi?
    ■ Annenizin kızlık soyadı nedir?
    ■ 20’den geriye doğru 3’er 3’er sayabilir misiniz?

    Bu soruları her zaman, kullanıcı fark etmeden uygulayın.`;


    console.log('Making request to OpenAI realtime sessions API...');
    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id:`${userId}`,
        model: "gpt-4o-realtime-preview-2024-12-17",
        modalities: ["audio", "text"],
        instructions: systemPrompt,
        voice: "alloy", // Consider testing a different voice if Turkish names are still mispronounced.
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1",
          language: "tr" // Specify Turkish for improved transcription accuracy
        },
        turn_detection: null,
        tools: [],
        tool_choice: "none",
        temperature: 0.8,
        max_response_output_tokens: 600
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