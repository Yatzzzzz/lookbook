import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * This API route ensures that every user in the auth.users table
 * has a corresponding entry in the profiles table.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // First, check if the profiles table exists
    const { data: tableExists, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'profiles')
      .eq('table_schema', 'public');

    if (tableError) {
      return NextResponse.json({ error: tableError.message }, { status: 500 });
    }

    // If profiles table doesn't exist, create it
    if (!tableExists || tableExists.length === 0) {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          username TEXT,
          avatar_url TEXT,
          bio TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Public profiles are viewable by everyone" 
          ON profiles FOR SELECT 
          USING (true);
        
        CREATE POLICY "Users can update own profile" 
          ON profiles FOR UPDATE 
          USING (auth.uid() = id);
        
        CREATE POLICY "Users can insert their own profile" 
          ON profiles FOR INSERT 
          WITH CHECK (auth.uid() = id);
      `;
      
      const { error: createError } = await supabase.rpc('execute_sql', { query: createTableQuery });
      
      if (createError) {
        return NextResponse.json({ 
          error: `Failed to create profiles table: ${createError.message}` 
        }, { status: 500 });
      }
    }

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, email');

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users found to sync' });
    }

    // Get existing profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id');

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    // Create a set of existing profile IDs for quick lookup
    const existingProfileIds = new Set(profiles?.map(profile => profile.id) || []);

    // Find users without profiles
    const usersWithoutProfiles = users.filter(user => !existingProfileIds.has(user.id));

    if (usersWithoutProfiles.length === 0) {
      return NextResponse.json({ message: 'All users already have profiles' });
    }

    // Create profiles for users without them
    const profilesToCreate = usersWithoutProfiles.map(user => ({
      id: user.id,
      username: user.username,
      avatar_url: null,
      bio: null
    }));

    const { error: insertError } = await supabase
      .from('profiles')
      .insert(profilesToCreate);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: `Created ${usersWithoutProfiles.length} profiles for users without them`,
      synced_users: usersWithoutProfiles.length
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST method to sync profiles' });
} 