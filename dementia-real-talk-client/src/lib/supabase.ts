import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// For Android emulator, use 10.0.2.2 instead of localhost
const supabaseUrl = Platform.select({
  android: 'http://10.0.2.2:54321',
  ios: 'http://127.0.0.1:54321',
  default: 'http://127.0.0.1:54321'
});

console.log('Initializing Supabase with URL:', supabaseUrl);

const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Add request interceptor for debugging
const fetchWithLogging = (input: RequestInfo | URL, init?: RequestInit) => {
  const headers = new Headers(init?.headers);
  headers.set('X-Supabase-Api-Version', '2024-01-01');
  
  const modifiedInit = {
    ...init,
    headers
  };

  console.log('Supabase Request:', { 
    url: typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url,
    method: modifiedInit?.method,
    headers: Object.fromEntries(headers.entries())
  });

  return fetch(input, modifiedInit).then(async (response) => {
    const responseData = await response.clone().text();
    console.log('Supabase Response:', { 
      status: response.status, 
      data: responseData,
      headers: Object.fromEntries(response.headers.entries())
    });
    return response;
  });
};

// Test function to verify Kong connectivity
export const testKongConnection = async () => {
  try {
    console.log('Testing Kong connectivity...');
    const response = await fetch(`${supabaseUrl}/healthz`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Info': 'supabase-js-react-native/2.38.4',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    
    const data = await response.text();
    console.log('Kong health check response:', {
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    // Consider both 200 and 404 as successful connections (404 means Kong is working but endpoint doesn't exist)
    return response.status === 200 || response.status === 404;
  } catch (error) {
    console.error('Kong connectivity test failed:', error);
    return false;
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'implicit',
    storage: AsyncStorage,
    storageKey: 'supabase-auth',
    debug: true
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-react-native/2.38.4',
    },
    fetch: fetchWithLogging
  },
}); 