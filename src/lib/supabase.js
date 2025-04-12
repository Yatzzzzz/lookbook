import { createClient } from '@supabase/supabase-js';

// Use default values if not defined (helps during build time)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wwjuohjstrcyvshfuadr.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);