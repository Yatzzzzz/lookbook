import { createClient } from '@supabase/supabase-js';

// Use default values if not defined (helps during build time)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wwjuohjstrcyvshfuadr.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key-for-static-build';

// Add a function to detect if we're in a static build environment
export const isStaticBuild = () => {
  // Enhanced detection for static build environment
  return (
    // During build time in production
    (process.env.NODE_ENV === 'production' && typeof window === 'undefined') ||
    // If no anon key is provided (original empty string check)
    (typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'string' && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === '') ||
    // If the anon key is our dummy key
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'dummy-key-for-static-build'
  );
};

// Enhanced dummy client with proper error signatures that match the actual client
const createDummyClient = () => {
  console.log('Creating dummy Supabase client for static build');
  return {
    from: (table) => ({
      select: (columns) => ({
        eq: (column, value) => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
          limit: (limit) => Promise.resolve({ data: [], error: null }),
          single: () => Promise.resolve({ data: null, error: null }),
        }),
        limit: (limit) => Promise.resolve({ data: [], error: null }),
      }),
      insert: (data) => Promise.resolve({ data: null, error: null }),
      update: (data) => ({
        eq: (column, value) => Promise.resolve({ data: null, error: null }),
        match: (criteria) => Promise.resolve({ data: null, error: null }),
      }),
      delete: () => ({
        eq: (column, value) => Promise.resolve({ data: null, error: null }),
        match: (criteria) => Promise.resolve({ data: null, error: null }),
      }),
    }),
    storage: {
      from: (bucket) => ({
        list: (prefix, options) => Promise.resolve({ data: [], error: null }),
        upload: (path, file) => Promise.resolve({ data: null, error: null }),
        getPublicUrl: (path) => ({ data: { publicUrl: '' } }),
        remove: (paths) => Promise.resolve({ data: null, error: null }),
      }),
      listBuckets: () => Promise.resolve({ data: [], error: null }),
    },
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signUp: (options) => Promise.resolve({ data: null, error: null }),
      signIn: (options) => Promise.resolve({ data: null, error: null }),
      signInWithPassword: (options) => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: (callback) => {
        // Return an unsubscribe function that does nothing
        return { data: { subscription: null } };
      },
    },
    rpc: (fn, params) => Promise.resolve({ data: null, error: null }),
  };
};

// Create the client, using a dummy one for static builds
const createSupabaseClient = () => {
  try {
    // Use a dummy client during static builds
    if (isStaticBuild()) {
      return createDummyClient();
    }
    
    // Otherwise create a real client
    return createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    // Fallback to dummy client on error
    return createDummyClient();
  }
};

export const supabase = createSupabaseClient();