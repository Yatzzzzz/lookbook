import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/users/follow
 * Follows a user
 * 
 * Request body:
 * {
 *   userId: string // The ID of the user to follow
 * }
 * 
 * Response: 
 * {
 *   success: boolean,
 *   message?: string,
 *   followersCount?: number // The updated follower count
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;
    
    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 });
    }
    
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check if the user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    const currentUserId = session.user.id;
    
    // Don't allow following yourself
    if (currentUserId === userId) {
      return NextResponse.json({ success: false, message: 'You cannot follow yourself' }, { status: 400 });
    }
    
    // Check if the user to follow exists
    const { data: userToFollow, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (userError || !userToFollow) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }
    
    // Check if already following
    const { data: existingFollow, error: followCheckError } = await supabase
      .from('wardrobe_follows')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('followed_id', userId)
      .single();
    
    if (followCheckError && followCheckError.code !== 'PGRST116') { // PGRST116 is "No rows returned" error
      return NextResponse.json({ success: false, message: 'Failed to check follow status' }, { status: 500 });
    }
    
    // If follow already exists, return success
    if (existingFollow) {
      return NextResponse.json({ success: true, message: 'Already following this user' });
    }
    
    // Insert the follow relationship
    const { error: insertError } = await supabase
      .from('wardrobe_follows')
      .insert({ follower_id: currentUserId, followed_id: userId });
    
    if (insertError) {
      return NextResponse.json({ success: false, message: 'Failed to follow user' }, { status: 500 });
    }
    
    // Get updated follower count for the user
    const { count: followersCount, error: countError } = await supabase
      .from('wardrobe_follows')
      .select('*', { count: 'exact', head: true })
      .eq('followed_id', userId);
    
    if (countError) {
      return NextResponse.json({ success: true, message: 'User followed, but failed to get updated count' });
    }
    
    // Add to activity feed
    try {
      await supabase
        .from('activity_feed')
        .insert({
          user_id: currentUserId,
          action_type: 'follow',
          content_type: 'user',
          content_id: userId,
          is_public: true,
          metadata: {
            followed_id: userId,
            followed_username: (await supabase.from('users').select('username').eq('id', userId).single()).data?.username
          }
        });
    } catch (feedError) {
      console.error('Error adding to activity feed:', feedError);
      // Continue even if activity feed update fails
    }
    
    // Create notification for the followed user
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          notification_type: 'follow',
          content_type: 'user',
          content_id: currentUserId,
          actor_id: currentUserId,
          is_read: false
        });
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Continue even if notification creation fails
    }
    
    return NextResponse.json({ success: true, message: 'User followed', followersCount });
    
  } catch (error: any) {
    console.error('Error following user:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/users/follow
 * Unfollows a user
 * 
 * URL parameters:
 * userId: string // The ID of the user to unfollow
 * 
 * Response: 
 * {
 *   success: boolean,
 *   message?: string,
 *   followersCount?: number // The updated follower count
 * }
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 });
    }
    
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check if the user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    const currentUserId = session.user.id;
    
    // Delete the follow relationship
    const { error: deleteError } = await supabase
      .from('wardrobe_follows')
      .delete()
      .match({ follower_id: currentUserId, followed_id: userId });
    
    if (deleteError) {
      return NextResponse.json({ success: false, message: 'Failed to unfollow user' }, { status: 500 });
    }
    
    // Get updated follower count for the user
    const { count: followersCount, error: countError } = await supabase
      .from('wardrobe_follows')
      .select('*', { count: 'exact', head: true })
      .eq('followed_id', userId);
    
    if (countError) {
      return NextResponse.json({ success: true, message: 'User unfollowed, but failed to get updated count' });
    }
    
    return NextResponse.json({ success: true, message: 'User unfollowed', followersCount });
    
  } catch (error: any) {
    console.error('Error unfollowing user:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
} 