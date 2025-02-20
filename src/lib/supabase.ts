import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables are missing. Please connect to Supabase first.');
    return false;
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch (e) {
    console.error('Invalid Supabase URL format');
    return false;
  }

  // Validate anon key format (should be a JWT-like string)
  if (!/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/.test(supabaseAnonKey)) {
    console.error('Invalid Supabase anon key format');
    return false;
  }

  return true;
};

let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

// Singleton pattern to ensure we only create one client instance
export const getSupabase = () => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient<Database>(
        import.meta.env.VITE_SUPABASE_URL!,
        import.meta.env.VITE_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: true, // Enable session persistence
            autoRefreshToken: true, // Enable automatic token refresh
            detectSessionInUrl: true, // Enable session detection in URL
          },
          db: {
            schema: 'public',
          },
        }
      );
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      return null;
    }
  }

  return supabaseInstance;
};

// Export the supabase client for backward compatibility
export const supabase = getSupabase();