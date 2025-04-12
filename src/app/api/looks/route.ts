import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/looks - Get all looks or filter by parameters
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
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
        image_url,
        description,
        created_at,
        ai_metadata,
        upload_type,
        user:users(username)
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
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.image_url) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }
    
    // Set defaults and prepare data
    const lookData = {
      user_id: session.user.id,
      image_url: body.image_url,
      description: body.description || null,
      upload_type: body.upload_type || 'look',
      ai_metadata: body.ai_metadata || null,
      audience: body.audience || 'everyone',
      excluded_users: body.excluded_users || null,
    };
    
    // Insert into database
    const { data, error } = await supabase
      .from('looks')
      .insert(lookData)
      .select();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, look: data[0] });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
  }
} 