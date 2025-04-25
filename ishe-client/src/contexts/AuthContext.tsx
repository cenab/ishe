import React, { createContext, useState, useContext, useEffect } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Alert, Linking, Platform } from 'react-native';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  handleDeepLink: (url: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Setting up auth state...');
    // Check active sessions and subscribe to auth changes
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
      } else {
        console.log('Got session:', session ? 'yes' : 'no');
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Function to handle deep links for authentication
  const handleDeepLink = async (url: string) => {
    console.log('Processing authentication deep link:', url);
    
    try {
      // Check if this is a Supabase authentication link
      if (url.includes('access_token=') || url.includes('refresh_token=') || url.includes('type=recovery')) {
        // Extract the parameters from the URL
        const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1] || '');
        
        // If we have an access token or refresh token, set the session
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        if (accessToken) {
          console.log('Setting session from deep link access token');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          if (error) {
            console.error('Error setting session from deep link:', error);
            Alert.alert('Authentication Error', 'Failed to authenticate with the provided link');
          } else {
            console.log('Successfully set session from deep link');
            setSession(data.session);
            setUser(data.session?.user || null);
          }
        }
        
        // Handle password reset links
        if (params.get('type') === 'recovery') {
          // Extract token for password reset flow
          const token = params.get('token');
          if (token) {
            // Navigate to password reset screen or show dialog
            console.log('Password reset token received:', token);
            Alert.alert(
              'Reset Password',
              'You can now reset your password',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    // Here you would typically navigate to a password reset screen
                    // navigation.navigate('ResetPassword', { token });
                  }
                }
              ]
            );
          }
        }
      }
    } catch (error) {
      console.error('Error processing deep link:', error);
      Alert.alert('Error', 'Failed to process the authentication link');
    }
  };

  const handleAuthError = (error: AuthError, action: string) => {
    console.error(`Error during ${action}:`, error);
    const message = error.message || `An error occurred during ${action}`;
    Alert.alert('Authentication Error', message);
    throw error;
  };

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in for:', email);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        handleAuthError(error, 'sign in');
      } else {
        console.log('Sign in successful');
      }
    } catch (error) {
      console.error('Unexpected error during sign in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    console.log('Attempting sign up for:', email);
    try {
      // Define a custom redirect URL using our URL scheme
      const redirectUrl = Platform.select({
        android: 'dementiarealtalkreactapp://login-callback',
        ios: 'dementiarealtalkreactapp://login-callback',
        default: 'http://3.127.58.246/login-callback'
      });
      
      console.log('Using redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        handleAuthError(error, 'sign up');
      } else {
        console.log('Sign up successful');
        // Since autoconfirm is enabled, we can show a success message
        Alert.alert(
          'Sign Up Successful',
          'Please check your email for a confirmation link.'
        );
      }
    } catch (error) {
      console.error('Unexpected error during sign up:', error);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('Attempting sign out');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        handleAuthError(error, 'sign out');
      } else {
        console.log('Sign out successful');
      }
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      handleDeepLink,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};