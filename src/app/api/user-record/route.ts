import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

async function initSupabase() {
  // This is the correct way to use cookies() in Next.js 15+
  // We need to await cookies() as it's a dynamic API
  const cookieStore = await cookies();
  return createRouteHandlerClient({ 
    cookies: () => cookieStore 
  });
}

// POST /api/user-record - Create a user record if it doesn't exist
export async function POST(_: NextRequest) {
  try {
    const supabase = await initSupabase();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user record already exists
    const { data: existingUser, error: queryError } = await supabase
      .from('users')
      .select('id')
      .eq('id', session.user.id)
      .single();
    
    if (queryError && queryError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      return NextResponse.json({ error: queryError.message }, { status: 500 });
    }
    
    // If user already exists, return early
    if (existingUser) {
      return NextResponse.json({ 
        success: true, 
        message: 'User record already exists',
        userId: session.user.id,
        created: false
      });
    }
    
    // Create user record
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: session.user.id,
        email: session.user.email,
        username: session.user.user_metadata.username || `user_${session.user.id.substring(0, 8)}`,
        created_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error('Error creating user record:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'User record created successfully',
      userId: session.user.id,
      created: true
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error creating user record:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      console.error('Error creating user record:', error);
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
  }
}

export async function GET(_: NextRequest) {
  try {
    const supabase = await initSupabase();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user record
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ user });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error fetching user record:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      console.error('Error fetching user record:', error);
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
  }
} 