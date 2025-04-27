import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/outfits/like
 * Likes an outfit
 * 
 * Request body:
 * {
 *   outfitId: string // The ID of the outfit to like
 * }
 * 
 * Response: 
 * {
 *   success: boolean,
 *   message?: string,
 *   likes?: number // The updated like count
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { outfitId } = body;
    
    if (!outfitId) {
      return NextResponse.json({ success: false, message: 'Outfit ID is required' }, { status: 400 });
    }
    
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check if the user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Check if the outfit exists and is accessible
    const { data: outfit, error: outfitError } = await supabase
      .from('outfits')
      .select('id, user_id, visibility')
      .eq('id', outfitId)
      .single();
    
    if (outfitError || !outfit) {
      return NextResponse.json({ success: false, message: 'Outfit not found' }, { status: 404 });
    }
    
    // Check if the user has permission to view this outfit
    if (outfit.visibility !== 'public' && outfit.visibility !== 'community' && outfit.user_id !== userId) {
      return NextResponse.json({ success: false, message: 'You do not have permission to interact with this outfit' }, { status: 403 });
    }
    
    // Check if the user has already liked this outfit
    const { data: existingLike, error: likeCheckError } = await supabase
      .from('outfit_likes')
      .select('id')
      .eq('outfit_id', outfitId)
      .eq('user_id', userId)
      .single();
    
    if (likeCheckError && likeCheckError.code !== 'PGRST116') { // PGRST116 is "No rows returned" error
      return NextResponse.json({ success: false, message: 'Failed to check like status' }, { status: 500 });
    }
    
    // If like already exists, return success
    if (existingLike) {
      return NextResponse.json({ success: true, message: 'Outfit already liked' });
    }
    
    // Insert the like
    const { error: insertError } = await supabase
      .from('outfit_likes')
      .insert({ outfit_id: outfitId, user_id: userId });
    
    if (insertError) {
      return NextResponse.json({ success: false, message: 'Failed to like outfit' }, { status: 500 });
    }
    
    // Get updated like count
    const { data: likeCount, error: countError } = await supabase
      .rpc('get_outfit_like_count', { outfit_id: outfitId });
    
    if (countError) {
      return NextResponse.json({ success: true, message: 'Outfit liked, but failed to get updated count' });
    }
    
    return NextResponse.json({ success: true, message: 'Outfit liked', likes: likeCount });
    
  } catch (error: any) {
    console.error('Error liking outfit:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/outfits/like
 * Unlikes an outfit
 * 
 * Request body:
 * {
 *   outfitId: string // The ID of the outfit to unlike
 * }
 * 
 * Response: 
 * {
 *   success: boolean,
 *   message?: string,
 *   likes?: number // The updated like count
 * }
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const outfitId = searchParams.get('outfitId');
    
    if (!outfitId) {
      return NextResponse.json({ success: false, message: 'Outfit ID is required' }, { status: 400 });
    }
    
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check if the user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Delete the like
    const { error: deleteError } = await supabase
      .from('outfit_likes')
      .delete()
      .match({ outfit_id: outfitId, user_id: userId });
    
    if (deleteError) {
      return NextResponse.json({ success: false, message: 'Failed to unlike outfit' }, { status: 500 });
    }
    
    // Get updated like count
    const { data: likeCount, error: countError } = await supabase
      .rpc('get_outfit_like_count', { outfit_id: outfitId });
    
    if (countError) {
      return NextResponse.json({ success: true, message: 'Outfit unliked, but failed to get updated count' });
    }
    
    return NextResponse.json({ success: true, message: 'Outfit unliked', likes: likeCount });
    
  } catch (error: any) {
    console.error('Error unliking outfit:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
} 