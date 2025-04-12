import { createBrowserClient } from '@supabase/ssr';
import { Database } from '../../types/supabase';

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wwjuohjstrcyvshfuadr.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseKey
  );
}; 