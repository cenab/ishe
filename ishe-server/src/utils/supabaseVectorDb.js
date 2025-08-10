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
      
      // Ensure metadata is a valid object
      let cleanMetadata = {};
      
      try {
        // If metadata is a string, try to parse it
        if (typeof metadata === 'string') {
          cleanMetadata = JSON.parse(metadata);
        } else {
          cleanMetadata = { ...metadata };
        }

        // Ensure all values are JSON-safe
        Object.keys(cleanMetadata).forEach(key => {
          if (cleanMetadata[key] === undefined) {
            delete cleanMetadata[key];
          } else if (typeof cleanMetadata[key] === 'object') {
            cleanMetadata[key] = JSON.stringify(cleanMetadata[key]);
          } else {
            cleanMetadata[key] = String(cleanMetadata[key]);
          }
        });

      } catch (e) {
        console.error('Error formatting metadata:', e);
        cleanMetadata = {};
      }

      // Add timestamp to metadata
      cleanMetadata.timestamp = new Date().toISOString();

      console.log('Formatted metadata:', cleanMetadata);

      // Check if this is a response to a previous message and avoid inserting duplicates
      // Only skip when both responseId AND type match an existing row, so we can store
      // two rows (user_input and assistant_response) for the same responseId.
      if (cleanMetadata.responseId && cleanMetadata.type) {
        const { data: existingData, error: existingError } = await this.supabase
          .from(this.tableName)
          .select('*')
          .eq('metadata->>responseId', cleanMetadata.responseId)
          .eq('metadata->>type', cleanMetadata.type)
          .single();

        if (existingError && existingError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          throw existingError;
        }

        if (existingData) {
          console.log('Skipping duplicate insert for', {
            responseId: cleanMetadata.responseId,
            type: cleanMetadata.type
          });
          return; // Skip adding exact duplicate
        }
      }

      // Insert the new conversation
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert([
          {
            vector,
            text,
            userId,
            created_at: new Date().toISOString(),
            metadata: cleanMetadata
          }
        ]);

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      console.log('Conversation added successfully:', { 
        text: text.substring(0, 50) + '...', 
        metadata: cleanMetadata 
      });
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

  async getUserConversations(userId) {
    await this.initialize();
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('userId', userId)
        .order('created_at', { ascending: false });
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