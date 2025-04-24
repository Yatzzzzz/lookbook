'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

// Create a consistent client instance with cookies properly configured
export const createClient = () => {
  return createClientComponentClient<Database>();
};

// Create and export a singleton instance
let _supabaseClient: SupabaseClient<Database> | undefined;

export const getSupabaseClient = () => {
  if (!_supabaseClient) {
    _supabaseClient = createClient();
  }
  return _supabaseClient;
}; 