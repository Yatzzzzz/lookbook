import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/admin-supabase';

interface ItemParams {
  params: {
    itemId: string;
  };
}

// Get product matches for a wardrobe item
export async function GET(request: NextRequest, { params }: ItemParams) {
  try {
    // Verify the user is authenticated
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { itemId } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }
    
    // First, get wardrobe item to check ownership and get category
    const { data: wardrobeItem, error: wardrobeError } = await supabase
      .from('wardrobe')
      .select('*')
      .eq('item_id', itemId)
      .single();
      
    if (wardrobeError) {
      if (wardrobeError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }
      console.error('Error fetching wardrobe item:', wardrobeError);
      return NextResponse.json({ error: wardrobeError.message }, { status: 500 });
    }
    
    // Check if user is authorized to view this item
    // (either it's their item or it's public)
    if (wardrobeItem.user_id !== session.user.id && wardrobeItem.visibility !== 'public') {
      return NextResponse.json({ error: 'You do not have permission to view this item' }, { status: 403 });
    }
    
    // Get products that are specifically matched to this item
    const { data: specificMatches, error: specificError } = await supabase
      .from('products')
      .select('*')
      .eq('similar_to_item_id', itemId)
      .limit(limit);
      
    if (specificError) {
      console.error('Error fetching specific product matches:', specificError);
      return NextResponse.json({ error: specificError.message }, { status: 500 });
    }
    
    // If we have enough specific matches, return those
    if (specificMatches.length >= limit) {
      return NextResponse.json({ 
        products: specificMatches,
        metadata: {
          match_type: 'specific',
          item_id: itemId,
          category: wardrobeItem.category
        }
      });
    }
    
    // Otherwise, get additional products from the same category
    const remainingCount = limit - specificMatches.length;
    
    const { data: categoryMatches, error: categoryError } = await supabase
      .from('products')
      .select('*')
      .eq('category', wardrobeItem.category)
      .is('similar_to_item_id', null)
      .limit(remainingCount);
      
    if (categoryError) {
      console.error('Error fetching category product matches:', categoryError);
      return NextResponse.json({ error: categoryError.message }, { status: 500 });
    }
    
    // Combine the specific and category matches
    const combinedMatches = [...specificMatches, ...categoryMatches];
    
    return NextResponse.json({ 
      products: combinedMatches,
      metadata: {
        match_type: 'mixed',
        specific_count: specificMatches.length,
        category_count: categoryMatches.length,
        item_id: itemId,
        category: wardrobeItem.category
      }
    });
    
  } catch (err: any) {
    console.error('Server error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}

// Associate a product with a wardrobe item (admin only)
export async function POST(request: NextRequest, { params }: ItemParams) {
  try {
    // Verify the user is authenticated and has admin privileges
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has admin role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
      
    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const { itemId } = params;
    
    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }
    
    // Check if wardrobe item exists
    const { data: wardrobeItem, error: wardrobeError } = await supabase
      .from('wardrobe')
      .select('item_id, category')
      .eq('item_id', itemId)
      .single();
      
    if (wardrobeError) {
      if (wardrobeError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Wardrobe item not found' }, { status: 404 });
      }
      console.error('Error checking wardrobe item:', wardrobeError);
      return NextResponse.json({ error: wardrobeError.message }, { status: 500 });
    }
    
    // Parse request body to get product IDs to associate
    const requestData = await request.json();
    const { productIds } = requestData;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid request. Expected an array of product IDs in the "productIds" field' 
      }, { status: 400 });
    }
    
    // Update products to associate them with this wardrobe item
    const updatePromises = productIds.map(productId => 
      supabaseAdmin
        .from('products')
        .update({ 
          similar_to_item_id: itemId,
          updated_at: new Date().toISOString()
        })
        .eq('product_id', productId)
    );
    
    await Promise.all(updatePromises);
    
    // Get the updated products
    const { data: updatedProducts, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('similar_to_item_id', itemId);
      
    if (productsError) {
      console.error('Error fetching updated products:', productsError);
      return NextResponse.json({ error: productsError.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `${productIds.length} products associated with wardrobe item`,
      products: updatedProducts
    });
    
  } catch (err: any) {
    console.error('Server error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}

// Remove product associations from a wardrobe item (admin only)
export async function DELETE(request: NextRequest, { params }: ItemParams) {
  try {
    // Verify the user is authenticated and has admin privileges
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has admin role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
      
    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const { itemId } = params;
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    
    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }
    
    // If productId is provided, remove association for just that product
    // Otherwise, remove all associations for the item
    let updateQuery = supabaseAdmin
      .from('products')
      .update({ 
        similar_to_item_id: null,
        updated_at: new Date().toISOString()
      });
      
    if (productId) {
      updateQuery = updateQuery
        .eq('product_id', productId)
        .eq('similar_to_item_id', itemId);
    } else {
      updateQuery = updateQuery
        .eq('similar_to_item_id', itemId);
    }
    
    const { error } = await updateQuery;
    
    if (error) {
      console.error('Error removing product associations:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: productId 
        ? 'Product association removed' 
        : 'All product associations removed for this item'
    });
    
  } catch (err: any) {
    console.error('Server error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
} 