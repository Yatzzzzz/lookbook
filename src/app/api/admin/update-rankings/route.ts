import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Admin API to update wardrobe rankings based on item counts
// Uses direct DB connection with service role key to bypass RLS

// Fixed endpoint that requires admin privileges
export async function POST(req: NextRequest) {
  try {
    // Check if requester is an admin
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin - hardcoded admin emails for security
    // In a production app, this would be fetched from a secure admin table
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    
    if (!adminEmails.includes(session.user.email)) {
      console.log(`Unauthorized admin access attempt: ${session.user.email}`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Admin supabase client with service role for unrestricted access
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    if (!adminSupabase) {
      return NextResponse.json({ error: 'Admin credentials error' }, { status: 500 });
    }
    
    // Get all wardrobes
    const { data: wardrobes, error: fetchError } = await adminSupabase
      .from('wardrobes')
      .select('id, user_id, item_count');
    
    if (fetchError) {
      console.error('Error fetching wardrobes:', fetchError);
      return NextResponse.json({ error: 'Error fetching wardrobes' }, { status: 500 });
    }
    
    // Calculate rankings based on item_count
    const sortedWardrobes = [...wardrobes || []].sort((a, b) => 
      (b.item_count || 0) - (a.item_count || 0)
    );
    
    // Update each wardrobe with its ranking
    const updatePromises = sortedWardrobes.map(async (wardrobe, index) => {
      const rankingPosition = index + 1;
      const rankingScore = 100 - (index / sortedWardrobes.length * 100);
      
      return adminSupabase
        .from('wardrobes')
        .update({
          ranking_position: rankingPosition,
          ranking_score: Math.round(rankingScore * 100) / 100,  // Round to 2 decimal places
          updated_at: new Date().toISOString()
        })
        .eq('id', wardrobe.id);
    });
    
    await Promise.all(updatePromises);
    
    return NextResponse.json({
      success: true,
      message: `Updated rankings for ${sortedWardrobes.length} wardrobes`
    });
    
  } catch (error) {
    console.error('Error updating wardrobe rankings:', error);
    return NextResponse.json({ 
      error: 'Failed to update rankings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to just get current rankings (also requires admin)
export async function GET(req: NextRequest) {
  try {
    // Check if requester is an admin
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    
    if (!adminEmails.includes(session.user.email)) {
      console.log(`Unauthorized admin access attempt: ${session.user.email}`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Admin supabase client
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    // Get all wardrobes with rankings
    const { data: wardrobes, error: fetchError } = await adminSupabase
      .from('wardrobes')
      .select(`
        id, 
        user_id, 
        item_count, 
        ranking_position,
        ranking_score,
        users:user_id (username, email)
      `)
      .order('ranking_position', { ascending: true });
    
    if (fetchError) {
      console.error('Error fetching wardrobe rankings:', fetchError);
      return NextResponse.json({ error: 'Error fetching rankings' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      count: wardrobes?.length || 0,
      rankings: wardrobes
    });
    
  } catch (error) {
    console.error('Error fetching wardrobe rankings:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch rankings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 