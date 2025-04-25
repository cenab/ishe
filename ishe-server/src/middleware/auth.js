import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service key for admin operations
const jwtSecret = process.env.SUPABASE_JWT_SECRET;

console.log('Auth Middleware - Supabase Configuration:');
console.log('URL:', supabaseUrl);
console.log('JWT Secret:', jwtSecret ? 'Configured' : 'Missing');

if (!supabaseUrl || !supabaseServiceKey || !jwtSecret) {
  throw new Error('Supabase configuration is missing. Please check your .env file.');
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

export const verifySupabaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('No authorization header provided');
      return res.status(401).json({ error: 'No authorization header' });
    }

    // Clean and validate the token
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      console.log('Empty token provided');
      return res.status(401).json({ error: 'Empty token' });
    }

    console.log('Attempting to verify token...');

    // Get user directly using the token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError) {
      console.error('Token verification error:', {
        message: userError.message,
        status: userError.status,
        name: userError.name
      });
      return res.status(401).json({ 
        error: 'Invalid token', 
        details: userError.message,
        status: userError.status 
      });
    }

    if (!user) {
      console.log('No user found for the provided token');
      return res.status(401).json({ error: 'User not found' });
    }

    console.log('User authenticated successfully:', user.id);
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', {
      message: error.message,
      stack: error.stack
    });
    res.status(401).json({ 
      error: 'Authentication failed', 
      details: error.message 
    });
  }
}; 