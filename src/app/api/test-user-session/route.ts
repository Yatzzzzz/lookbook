import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Retrieve the user's session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw new Error(sessionError.message);
    }
    
    const session = sessionData.session;
    
    if (!session) {
      return NextResponse.json({ 
        error: 'No active session', 
        authenticated: false 
      }, { status: 401 });
    }
    
    // Check if the user exists in the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (userError && userError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }
    
    // Return session info plus whether the user record exists
    return NextResponse.json({
      authenticated: true,
      session: {
        user: {
          id: session.user.id,
          email: session.user.email,
          user_metadata: session.user.user_metadata,
        }
      },
      user_record_exists: !!userData,
      userData: userData
    });
    
  } catch (error) {
    console.error('Error checking session:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    }, { status: 500 });
  }
} 