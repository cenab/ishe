import express from 'express';
import vectorDb from '../utils/supabaseVectorDb.js';
import { verifySupabaseToken } from '../middleware/auth.js';

const router = express.Router();

// Add a new conversation
router.post('/', verifySupabaseToken, async (req, res) => {
  try {
    const { text, metadata } = req.body;
    const userId = req.user.id;

    await vectorDb.addConversation(text, userId, metadata);
    res.status(201).json({ message: 'Conversation added successfully' });
  } catch (error) {
    console.error('Error adding conversation:', error);
    res.status(500).json({ error: 'Failed to add conversation' });
  }
});

// Search similar conversations
router.get('/search', verifySupabaseToken, async (req, res) => {
  try {
    const { query, limit } = req.query;
    const results = await vectorDb.searchSimilarConversations(query, parseInt(limit) || 5);
    res.json(results);
  } catch (error) {
    console.error('Error searching conversations:', error);
    res.status(500).json({ error: 'Failed to search conversations' });
  }
});

// Get user's conversations
router.get('/user', verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await vectorDb.getUserConversations(userId);
    res.json(conversations);
  } catch (error) {
    console.error('Error getting user conversations:', error);
    res.status(500).json({ error: 'Failed to get user conversations' });
  }
});

// Get user's conversation history (grouped by context)
router.get('/history', verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit } = req.query;
    const history = await vectorDb.getConversationHistory(userId, parseInt(limit) || 10);
    res.json(history);
  } catch (error) {
    console.error('Error getting conversation history:', error);
    res.status(500).json({ error: 'Failed to get conversation history' });
  }
});

export default router; 