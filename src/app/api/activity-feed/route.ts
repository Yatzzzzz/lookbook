import { createApiSupabaseClient } from '@/lib/utils';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createApiSupabaseClient();
    
    // Get current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    
    try {
      // Use an explicit join instead of the profiles:user_id shorthand that requires foreign key constraints
      const { data: activityData, error } = await supabase
        .from('activity_feed')
        .select('*')
        .or(`is_public.eq.true,user_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(limit);
        
      if (error) {
        console.error('API Error fetching activity feed:', error);
        // If there's a database error, return an empty array instead of failing
        return NextResponse.json([]);
      }
      
      // If we have activity data, fetch the related profiles separately
      if (activityData && activityData.length > 0) {
        // Get unique user IDs from activity feed items
        const userIds = [...new Set(activityData.map(item => item.user_id))];
        
        // Fetch profiles for these users
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);
        
        if (profilesError) {
          console.error('API Error fetching profiles:', profilesError);
        }
        
        // Create a lookup map for profiles
        const profilesMap = (profilesData || []).reduce((map, profile) => {
          map[profile.id] = profile;
          return map;
        }, {});
        
        // Combine activity data with profile data
        const formattedData = activityData.map(item => ({
          ...item,
          profile: profilesMap[item.user_id] || null
        }));
        
        return NextResponse.json(formattedData);
      }
      
      return NextResponse.json(activityData || []);
    } catch (err) {
      console.error('API Exception fetching activity feed:', err);
      // Return empty array on error
      return NextResponse.json([]);
    }
  } catch (err) {
    console.error('API route error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch activity feed' },
      { status: 500 }
    );
  }
} 