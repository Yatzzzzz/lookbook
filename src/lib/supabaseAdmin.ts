import { createClient } from '@supabase/supabase-js';

// This client uses the SERVICE_ROLE_KEY which has admin privileges
// and should ONLY be used in server contexts (API routes, getServerSideProps, etc.)
// NEVER expose this client to the browser
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Helper function to get public URL with the correct format
export function getPublicStorageUrl(bucket: string, path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return '';
  
  // Ensure the URL has the proper format with 'public' in the path
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
} 