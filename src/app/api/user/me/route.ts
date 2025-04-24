import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current user from the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get user information from the users table, including username
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, email, created_at, avatar_url')
      .eq('id', session.user.id)
      .single();
      
    if (userError) {
      // If user record doesn't exist yet, return just the auth information
      console.error('Error fetching user data:', userError);
      return NextResponse.json({
        data: {
          id: session.user.id,
          email: session.user.email,
          // Provide a default username based on email if no user record exists
          username: session.user.email?.split('@')[0] || 'user'
        }
      });
    }
    
    return NextResponse.json({ data: userData });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
  }
} 