import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import supabaseAdmin from '@/lib/admin-supabase';

export async function POST(request: NextRequest) {
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
    
    // Parse the request body
    const productData = await request.json();
    
    if (!productData) {
      return NextResponse.json({ error: 'Missing product data' }, { status: 400 });
    }
    
    // Validate required fields
    if (!productData.name || !productData.category || !productData.product_url) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, category, and product_url are required' 
      }, { status: 400 });
    }
    
    // Create the product with generated ID if not provided
    const newProduct = {
      ...productData,
      product_id: productData.product_id || uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Insert the product using admin privileges (bypasses RLS)
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .insert([newProduct])
        .select();
        
      if (error) {
        console.error('Error inserting product:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json(data[0]);
    } catch (err: any) {
      console.error('Unexpected error in database operation:', err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  } catch (err: any) {
    console.error('Server error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const query = searchParams.get('query');
    
    // Build the query
    let supabaseQuery = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Add filters if provided
    if (category) {
      supabaseQuery = supabaseQuery.eq('category', category);
    }
    
    if (query) {
      supabaseQuery = supabaseQuery.or(
        `name.ilike.%${query}%,description.ilike.%${query}%,brand.ilike.%${query}%`
      );
    }
    
    // Execute the query
    const { data, error, count } = await supabaseQuery;
    
    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      products: data,
      metadata: {
        limit,
        offset,
        total: count
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