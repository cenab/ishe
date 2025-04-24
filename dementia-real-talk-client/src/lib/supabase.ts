import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from 'react-native-dotenv';

// For Android emulator, use 10.0.2.2 instead of localhost
console.log('Initializing Supabase with URL:', SUPABASE_URL);

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

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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