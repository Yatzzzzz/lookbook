import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { searchParams } = new URL(request.url);
    
    const filter = searchParams.get('filter') || 'recent';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = 9;
    const skip = (page - 1) * pageSize;
    
    // Base query to get public or community-visible outfits
    let query = supabase
      .from('outfits')
      .select(`
        id,
        name,
        image_url,
        visibility,
        created_at,
        user_id,
        profiles!inner(id, username, avatar_url),
        likes(id, user_id)
      `, { count: 'exact' })
      .in('visibility', ['public', 'community'])
      .range(skip, skip + pageSize - 1);
    
    // Apply different sorting based on filter
    switch (filter) {
      case 'trending':
        // Filter to last 7 days and order by most likes
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        query = query
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('likes', { foreignTable: 'likes', ascending: false });
        break;
        
      case 'featured':
        // Get outfits that are marked as featured
        query = query
          .eq('featured', true)
          .order('created_at', { ascending: false });
        break;
        
      case 'recent':
      default:
        // Sort by most recent
        query = query.order('created_at', { ascending: false });
        break;
    }
    
    // Execute the query
    const { data: outfits, count, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Format the response
    const formattedOutfits = outfits.map(outfit => ({
      id: outfit.id,
      name: outfit.name,
      imageUrl: outfit.image_url,
      userId: outfit.user_id,
      userName: outfit.profiles.username,
      userImage: outfit.profiles.avatar_url,
      visibility: outfit.visibility,
      likes: outfit.likes ? outfit.likes.length : 0,
      createdAt: outfit.created_at
    }));
    
    return NextResponse.json({
      outfits: formattedOutfits,
      hasMore: count ? skip + outfits.length < count : false
    });
    
  } catch (error) {
    console.error('Error fetching community outfits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch community outfits' },
      { status: 500 }
    );
  }
} 