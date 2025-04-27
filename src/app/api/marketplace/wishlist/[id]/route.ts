import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

interface WishlistItemParams {
  params: {
    id: string;
  };
}

// Get a specific wishlist item
export async function GET(request: NextRequest, { params }: WishlistItemParams) {
  try {
    // Verify the user is authenticated
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'Wishlist item ID is required' }, { status: 400 });
    }
    
    // Get the wishlist item with product details
    const { data, error } = await supabase
      .from('wish_list')
      .select(`
        id,
        created_at,
        notes,
        price_at_addition,
        notify_price_drop,
        target_price,
        product:products(*)
      `)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Wishlist item not found' }, { status: 404 });
      }
      console.error('Error fetching wishlist item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
    
  } catch (err: any) {
    console.error('Server error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}

// Update a wishlist item
export async function PATCH(request: NextRequest, { params }: WishlistItemParams) {
  try {
    // Verify the user is authenticated
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'Wishlist item ID is required' }, { status: 400 });
    }
    
    // Verify the wishlist item belongs to the user
    const { data: existingItem, error: existingError } = await supabase
      .from('wish_list')
      .select('id')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();
      
    if (existingError) {
      if (existingError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Wishlist item not found' }, { status: 404 });
      }
      console.error('Error checking wishlist item:', existingError);
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }
    
    // Parse the request body
    const updateData = await request.json();
    const { notes, targetPrice, notifyPriceDrop } = updateData;
    
    // Update the wishlist item
    const { data, error } = await supabase
      .from('wish_list')
      .update({
        notes,
        target_price: targetPrice,
        notify_price_drop: notifyPriceDrop
      })
      .eq('id', id)
      .select();
      
    if (error) {
      console.error('Error updating wishlist item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Wishlist item updated', 
      item: data[0]
    });
    
  } catch (err: any) {
    console.error('Server error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}

// Delete a wishlist item
export async function DELETE(request: NextRequest, { params }: WishlistItemParams) {
  try {
    // Verify the user is authenticated
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'Wishlist item ID is required' }, { status: 400 });
    }
    
    // Get product ID before deleting (for activity feed)
    const { data: wishlistItem, error: getError } = await supabase
      .from('wish_list')
      .select('product_id')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();
      
    if (getError) {
      if (getError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Wishlist item not found' }, { status: 404 });
      }
      console.error('Error fetching wishlist item:', getError);
      return NextResponse.json({ error: getError.message }, { status: 500 });
    }
    
    // Delete the wishlist item
    const { error } = await supabase
      .from('wish_list')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);
      
    if (error) {
      console.error('Error deleting wishlist item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Add activity feed item for wishlist removal
    try {
      await supabase
        .from('activity_feed')
        .insert([{
          user_id: session.user.id,
          activity_type: 'removed_from_wishlist',
          content_type: 'product',
          content_id: wishlistItem.product_id,
          is_private: true,
          metadata: { product_id: wishlistItem.product_id }
        }]);
    } catch (activityError) {
      // Log but don't fail if activity feed update fails
      console.error('Error adding to activity feed:', activityError);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Item removed from wishlist'
    });
    
  } catch (err: any) {
    console.error('Server error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
} 