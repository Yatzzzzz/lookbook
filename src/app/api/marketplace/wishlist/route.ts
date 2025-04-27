import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import supabaseAdmin from '@/lib/admin-supabase';

// Get the user's wishlist
export async function GET(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get wishlist items with product details
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
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching wishlist:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ wishlist: data });
    
  } catch (err: any) {
    console.error('Server error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}

// Add an item to the wishlist
export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request body
    const requestData = await request.json();
    const { 
      productId, 
      notes, 
      targetPrice, 
      notifyPriceDrop = false 
    } = requestData;
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }
    
    // Check if product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('product_id, price')
      .eq('product_id', productId)
      .single();
      
    if (productError) {
      if (productError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      console.error('Error checking product:', productError);
      return NextResponse.json({ error: productError.message }, { status: 500 });
    }
    
    // Check if already in wishlist
    const { data: existingItem, error: existingError } = await supabase
      .from('wish_list')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('product_id', productId)
      .maybeSingle();
      
    if (existingError) {
      console.error('Error checking existing wishlist item:', existingError);
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }
    
    if (existingItem) {
      // Update existing wishlist item
      const { data, error } = await supabase
        .from('wish_list')
        .update({
          notes,
          target_price: targetPrice,
          notify_price_drop: notifyPriceDrop
        })
        .eq('id', existingItem.id)
        .select();
        
      if (error) {
        console.error('Error updating wishlist item:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Wishlist item updated', 
        item: data[0],
        isNewItem: false
      });
    }
    
    // Create new wishlist item
    const wishlistItem = {
      id: uuidv4(),
      user_id: session.user.id,
      product_id: productId,
      notes,
      price_at_addition: product.price,
      target_price: targetPrice,
      notify_price_drop: notifyPriceDrop,
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('wish_list')
      .insert([wishlistItem])
      .select();
      
    if (error) {
      console.error('Error adding to wishlist:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Add activity feed item for wishlist addition
    try {
      await supabase
        .from('activity_feed')
        .insert([{
          user_id: session.user.id,
          activity_type: 'added_to_wishlist',
          content_type: 'product',
          content_id: productId,
          is_private: true,
          metadata: { product_id: productId }
        }]);
    } catch (activityError) {
      // Log but don't fail if activity feed update fails
      console.error('Error adding to activity feed:', activityError);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Item added to wishlist', 
      item: data[0],
      isNewItem: true
    });
    
  } catch (err: any) {
    console.error('Server error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
} 