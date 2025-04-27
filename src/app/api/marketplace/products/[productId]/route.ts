import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/admin-supabase';

interface ProductParams {
  params: {
    productId: string;
  };
}

// Get a product by ID
export async function GET(request: NextRequest, { params }: ProductParams) {
  try {
    // Verify the user is authenticated
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { productId } = params;
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }
    
    // Get product by ID
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('product_id', productId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        // Record not found
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      
      console.error('Error fetching product:', error);
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

// Update a product (admin only)
export async function PATCH(request: NextRequest, { params }: ProductParams) {
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
    
    const { productId } = params;
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }
    
    // Parse the request body for update data
    const updateData = await request.json();
    
    if (!updateData || Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No update data provided' }, { status: 400 });
    }
    
    // Add updated_at timestamp
    const dataToUpdate = {
      ...updateData,
      updated_at: new Date().toISOString()
    };
    
    // Don't allow changing the product_id
    delete dataToUpdate.product_id;
    delete dataToUpdate.created_at;
    
    // Update the product
    const { data, error } = await supabaseAdmin
      .from('products')
      .update(dataToUpdate)
      .eq('product_id', productId)
      .select();
      
    if (error) {
      console.error('Error updating product:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    return NextResponse.json(data[0]);
    
  } catch (err: any) {
    console.error('Server error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}

// Delete a product (admin only)
export async function DELETE(request: NextRequest, { params }: ProductParams) {
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
    
    const { productId } = params;
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }
    
    // Delete the product
    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('product_id', productId);
      
    if (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
    
  } catch (err: any) {
    console.error('Server error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
} 