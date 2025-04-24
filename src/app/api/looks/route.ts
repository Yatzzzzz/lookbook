import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/looks - Get all looks or filter by parameters
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;
    const orderBy = searchParams.get('order_by') || 'created_at';
    const orderDirection = searchParams.get('order_direction') || 'desc';
    
    // Construct query
    let query = supabase
      .from('looks')
      .select(`
        look_id,
        user_id,
        username,
        image_url,
        description,
        title,
        created_at,
        ai_metadata,
        upload_type,
        feature_in,
        category,
        rating,
        tags,
        file_name,
        storage_path,
        users(username)
      `)
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .range(offset, offset + limit - 1);
    
    // Add filters if provided
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Process data to ensure username is available
    if (data) {
      data.forEach(look => {
        // Extract username from users relation if available
        if (look.users && look.users.username) {
          look.username = look.users.username;
        }
      });
    }
    
    return NextResponse.json({ looks: data });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
  }
}

// POST /api/looks - Create a new look
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.image_url) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }
    
    // Extract the file name from the URL if not provided
    if (!body.file_name && body.image_url) {
      const urlParts = body.image_url.split('/');
      body.file_name = urlParts[urlParts.length - 1];
    }
    
    // Add user ID to the look
    body.user_id = session.user.id;
    
    // Fetch the username from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('username')
      .eq('id', session.user.id)
      .single();
    
    if (userError) {
      console.error('Error fetching username:', userError);
    } else if (userData && userData.username) {
      // Add username to the look data
      body.username = userData.username;
    }
    
    // Add timestamp if not provided
    if (!body.created_at) {
      body.created_at = new Date().toISOString();
    }
    
    // Ensure tags are in the correct format
    if (body.tags && !Array.isArray(body.tags)) {
      if (typeof body.tags === 'string') {
        body.tags = body.tags.split(',').map((tag: string) => tag.trim());
      } else {
        body.tags = [];
      }
    }
    
    console.log('Creating look with data:', body);
    
    // Insert the look
    const { data, error } = await supabase
      .from('looks')
      .insert(body)
      .select();
    
    if (error) {
      console.error('Error inserting look:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ look: data[0] });
  } catch (error: unknown) {
    console.error('Error in POST /api/looks:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
  }
} 