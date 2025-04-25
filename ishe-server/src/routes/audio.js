import express from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { verifySupabaseToken } from '../middleware/auth.js';

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase configuration is missing');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Audio upload endpoint
router.post('/upload', verifySupabaseToken, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const userId = req.user.id;
    const timestamp = req.body.timestamp || new Date().toISOString();
    const duration = req.body.duration || '0';

    // Generate a unique filename
    const filename = `${userId}/${timestamp}-${Math.random().toString(36).substring(7)}.wav`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('conversation-recordings')
      .upload(filename, req.file.buffer, {
        contentType: 'audio/wav',
        cacheControl: '3600',
        upsert: false,
        duplex: 'half',
        metadata: {
          userId,
          timestamp,
          duration,
        },
      });

    if (error) {
      console.error('Supabase storage error:', error);
      throw error;
    }

    res.status(200).json({
      message: 'Audio uploaded successfully',
      filename,
      path: data.path,
    });
  } catch (error) {
    console.error('Error uploading audio:', error);
    res.status(500).json({ error: 'Failed to upload audio' });
  }
});

export default router; 