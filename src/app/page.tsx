import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

// Force dynamic rendering to prevent static prerendering issues with Supabase
export const dynamic = 'force-dynamic';

export default async function Home() {
  try {
    // Check if user is authenticated
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    // If authenticated, redirect to lookbook, otherwise to gallery
    if (session) {
      redirect('/lookbook');
    } else {
      redirect('/gallery');
    }
  } catch (error) {
    console.error("Error in root page:", error);
    // Default fallback to gallery in case of errors
    redirect('/gallery');
  }
} 