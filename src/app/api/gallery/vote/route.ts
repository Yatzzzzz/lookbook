import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/gallery/vote - Record vote for a fashion battle or look rating
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
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
    if (!body.look_id || !body.vote_type) {
      return NextResponse.json(
        { error: 'Look ID and vote type are required' },
        { status: 400 }
      );
    }
    
    // Different handling based on vote_type
    if (body.vote_type === 'battle') {
      if (body.battle_id === undefined) {
        return NextResponse.json(
          { error: 'Battle ID is required for battle votes' },
          { status: 400 }
        );
      }
      
      // Insert battle vote
      const { data, error } = await supabase
        .from('battle_votes')
        .insert({
          user_id: session.user.id,
          look_id: body.look_id,
          battle_id: body.battle_id
        })
        .select();
      
      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          // User already voted, update their vote
          const { data: updateData, error: updateError } = await supabase
            .from('battle_votes')
            .update({ look_id: body.look_id })
            .match({ user_id: session.user.id, battle_id: body.battle_id })
            .select();
          
          if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
          }
          
          return NextResponse.json({ success: true, vote: updateData[0], updated: true });
        }
        
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ success: true, vote: data[0] });
    } 
    else if (body.vote_type === 'rating') {
      if (body.rating === undefined || body.rating < 1 || body.rating > 5) {
        return NextResponse.json(
          { error: 'Valid rating (1-5) is required for rating votes' },
          { status: 400 }
        );
      }
      
      try {
        // Validate look_id exists to avoid WHERE clause issues
        if (!body.look_id) {
          console.error('Missing look_id for rating');
          return NextResponse.json({ 
            error: 'Look ID is required for rating' 
          }, { status: 400 });
        }
        
        // Insert or update rating
        const { data: ratingData, error: ratingError } = await supabase
          .from('look_ratings')
          .upsert({
            user_id: session.user.id,
            look_id: body.look_id,
            rating: body.rating
          })
          .select();
        
        if (ratingError) {
          console.error('Rating error:', ratingError);
          return NextResponse.json({ error: ratingError.message }, { status: 500 });
        }
        
        // Get the updated look statistics
        const { data: lookData, error: lookError } = await supabase
          .from('looks')
          .select('rating, rating_count, avg_rating')
          .eq('look_id', body.look_id)
          .single();
        
        if (lookError) {
          console.error('Error fetching updated look data:', lookError);
          // Still return success for the rating even if we couldn't fetch updated stats
          return NextResponse.json({ 
            success: true, 
            rating: ratingData[0],
            message: 'Rating saved successfully' 
          });
        }
        
        return NextResponse.json({ 
          success: true, 
          rating: ratingData[0],
          stats: {
            rating: lookData.rating || '0',
            rating_count: lookData.rating_count || 0,
            avg_rating: lookData.avg_rating || 0
          },
          message: 'Rating saved successfully' 
        });
      } catch (error) {
        console.error('Unexpected error during rating:', error);
        return NextResponse.json({ 
          error: 'An unexpected error occurred while saving your rating' 
        }, { status: 500 });
      }
    }
    else if (body.vote_type === 'yay_nay') {
      if (body.vote === undefined || !['yay', 'nay'].includes(body.vote)) {
        return NextResponse.json(
          { error: 'Vote must be either "yay" or "nay"' },
          { status: 400 }
        );
      }
      
      // Insert yay/nay vote
      const { data, error } = await supabase
        .from('yay_nay_votes')
        .upsert({
          user_id: session.user.id,
          look_id: body.look_id,
          vote: body.vote
        })
        .select();
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ success: true, vote: data[0] });
    }
    else {
      return NextResponse.json(
        { error: 'Invalid vote type. Must be "battle", "rating", or "yay_nay"' },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
  }
} 