import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { email, password, username } = await request.json();
    
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (authError) throw authError;
    
    // 2. Insert user record
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          username,
          email
        }]);
        
      if (profileError) throw profileError;
      
      return NextResponse.json({ 
        success: true, 
        message: 'User created!',
        userId: authData.user.id
      });
    }
    
    return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 400 });
  } catch (error: unknown) {
    console.error('API error:', error);
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
