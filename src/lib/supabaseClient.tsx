'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

// Create a consistent client instance with cookies properly configured
export const createClient = () => {
  return createClientComponentClient<Database>({
    options: {
      persistSession: true, // Enable session persistence
      autoRefreshToken: true, // Enable auto token refresh
      detectSessionInUrl: true, // Allow detecting OAuth in URL
    },
  });
};

// Create and export a singleton instance
let _supabaseClient;
export const getSupabaseClient = () => {
  if (!_supabaseClient) {
    _supabaseClient = createClient();
  }
  return _supabaseClient;
}; 