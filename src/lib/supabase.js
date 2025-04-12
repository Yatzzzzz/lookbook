import { createClient } from '@supabase/supabase-js';

// Use default values if not defined (helps during build time)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wwjuohjstrcyvshfuadr.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Add a function to detect if we're in a static build environment
export const isStaticBuild = () => {
  return process.env.NODE_ENV === 'production' && typeof window === 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === '';
};

// Create a dummy client for static builds
const createDummyClient = () => {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => ({ data: null, error: null }),
          limit: () => ({ data: [], error: null }),
        }),
        limit: () => ({ data: [], error: null }),
      }),
      insert: () => ({ data: null, error: null }),
    }),
    storage: {
      from: () => ({
        list: () => ({ data: [], error: null }),
        upload: () => ({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        remove: () => ({ data: null, error: null }),
      }),
      listBuckets: () => ({ data: [], error: null }),
    },
    auth: {
      getUser: () => ({ data: { user: null }, error: null }),
      signUp: () => ({ data: null, error: null }),
      signIn: () => ({ data: null, error: null }),
      signOut: () => ({ error: null }),
    },
  };
};

// Create the client, using a dummy one for static builds
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const supabase = isStaticBuild() 
  ? createDummyClient() 
  : createSupabaseClient(supabaseUrl, supabaseAnonKey);