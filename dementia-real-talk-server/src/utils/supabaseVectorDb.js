import { createClient } from '@supabase/supabase-js';
import { pipeline } from '@xenova/transformers';

class SupabaseVectorDatabase {
  constructor() {
    this.supabase = null;
    this.initialized = false;
    this.embeddingPipeline = null;
    this.tableName = 'conversations';
  }

  async initialize() {
    if (this.initialized) return;
    try {
      // Connect to Supabase using environment variables
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase URL or service key in environment variables');
      }
      this.supabase = createClient(supabaseUrl, supabaseKey);

      // Initialize the embedding pipeline using xenova transformers
      this.embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

      // (Assumes the "conversations" table is already created with pgvector.)
      console.log('Supabase vector database initialized successfully');
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing Supabase vector database:', error);
      throw error;
    }
  }

  async getEmbedding(text) {
    if (!this.embeddingPipeline) {
      throw new Error('Embedding pipeline not initialized');
    }
    const output = await this.embeddingPipeline(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }

  async addConversation(text, userId, metadata = {}) {
    await this.initialize();
    try {
      const vector = await this.getEmbedding(text);
      // Insert the conversation into Supabase.
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert([
          {
            vector, // pgvector column; ensure dimension is 384
            text,
            userId,
            created_at: new Date().toISOString(),
            metadata // stored as JSON
          }
        ]);
      if (error) throw error;
      console.log('Conversation added successfully');
    } catch (error) {
      console.error('Error adding conversation:', error);
      throw error;
    }
  }

  async searchSimilarConversations(text, limit = 5) {
    await this.initialize();
    try {
      const queryVector = await this.getEmbedding(text);
      // pgvector expects a string representation like "[0.1,0.2,...,0.3]"
      const vectorString = `[${queryVector.join(',')}]`;
      // Call the stored procedure "search_conversations" via Supabase RPC.
      const { data, error } = await this.supabase.rpc('search_conversations', { query_vector: vectorString, limit });
      if (error) throw error;
      return data.map(row => ({
        text: row.text,
        userId: row.userId,
        timestamp: row.created_at,
        metadata: row.metadata,
        similarity: row.score
      }));
    } catch (error) {
      console.error('Error searching conversations:', error);
      throw error;
    }
  }

  async getUserConversations(userId, limit = 10) {
    await this.initialize();
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('userId', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      // Reverse the order to chronological
      const sorted = data.reverse();
      return sorted.map(row => ({
        text: row.text,
        timestamp: row.created_at,
        metadata: row.metadata
      }));
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw error;
    }
  }

  async getConversationHistory(userId, limit = 10) {
    await this.initialize();
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('userId', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      const conversationMap = new Map();
      data.forEach(row => {
        const meta = row.metadata || {};
        const responseId = meta.responseId;
        if (responseId && !conversationMap.has(responseId)) {
          conversationMap.set(responseId, {
            userInput: meta.userInput || '',
            assistantResponse: row.text,
            timestamp: row.created_at
          });
        }
      });
      return Array.from(conversationMap.values())
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } catch (error) {
      console.error('Error getting conversation history:', error);
      throw error;
    }
  }
}

// Export a singleton instance
const supabaseVectorDb = new SupabaseVectorDatabase();
export default supabaseVectorDb; 