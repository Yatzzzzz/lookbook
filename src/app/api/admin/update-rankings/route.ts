import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import adminSupabase from '@/lib/admin-supabase';

// POST /api/admin/update-rankings - Trigger wardrobe rankings update
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privileges
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Call the stored function to update rankings
    const { error } = await adminSupabase.rpc('update_wardrobe_rankings');

    if (error) {
      console.error('Error updating rankings:', error);
      return NextResponse.json({ error: 'Failed to update rankings' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Wardrobe rankings updated successfully' 
    });
  } catch (err: any) {
    console.error('Error in update-rankings API:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}

// GET /api/admin/update-rankings - Get current ranking stats
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privileges
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Get statistics about rankings
    const { data: rankingStats, error: statsError } = await adminSupabase
      .from('wardrobes')
      .select('id, ranking_position')
      .order('ranking_position', { ascending: true });

    if (statsError) {
      console.error('Error fetching ranking stats:', statsError);
      return NextResponse.json({ error: 'Failed to fetch ranking statistics' }, { status: 500 });
    }

    // Get count of users with wardrobes
    const { count, error: countError } = await adminSupabase
      .from('wardrobes')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting wardrobes:', countError);
      return NextResponse.json({ error: 'Failed to count wardrobes' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalWardrobes: count,
        rankedWardrobes: rankingStats.filter(w => w.ranking_position !== null).length,
        topRanked: rankingStats.slice(0, 10).map(w => w.id)
      }
    });
  } catch (err: any) {
    console.error('Error in fetch ranking stats API:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
} 