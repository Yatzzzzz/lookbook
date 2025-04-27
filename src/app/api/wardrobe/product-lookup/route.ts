import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { cookies } from 'next/headers';

// Example cache for product lookups
const PRODUCTS_CACHE: Record<string, any> = {};

// Cache TTL in milliseconds (24 hours)
const CACHE_TTL = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = getSupabaseClient(cookieStore);
    
    // Get barcode from query
    const url = new URL(request.url);
    const barcode = url.searchParams.get('barcode');
    
    if (!barcode) {
      return NextResponse.json(
        { error: 'Barcode parameter is required' },
        { status: 400 }
      );
    }
    
    // Check if the product is in our cache
    if (PRODUCTS_CACHE[barcode] && PRODUCTS_CACHE[barcode].timestamp > Date.now() - CACHE_TTL) {
      return NextResponse.json(PRODUCTS_CACHE[barcode].data);
    }
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // First check if we already have this product in our database
    const { data: existingProduct, error: lookupError } = await supabase
      .from('product_lookup')
      .select('*')
      .eq('barcode', barcode)
      .single();
    
    if (existingProduct) {
      // Update cache
      PRODUCTS_CACHE[barcode] = {
        data: existingProduct,
        timestamp: Date.now()
      };
      
      return NextResponse.json(existingProduct);
    }
    
    // If not in our database, use external API to look up the product
    // For this example, we'll implement a mock lookup, but in production
    // you would call a real barcode API like UPC database, Open Food Facts, etc.
    const product = await lookupProductExternally(barcode);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Store the product in our database for future lookups
    const { data: insertedProduct, error: insertError } = await supabase
      .from('product_lookup')
      .insert({
        barcode,
        product_data: product,
        lookup_count: 1,
        user_id: session.user.id,
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error storing product lookup:', insertError);
      // Continue even if caching fails
    }
    
    // Update our local cache
    PRODUCTS_CACHE[barcode] = {
      data: product,
      timestamp: Date.now()
    };
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Product lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to look up product' },
      { status: 500 }
    );
  }
}

// Mock function for product lookup - in production, replace with real API call
async function lookupProductExternally(barcode: string): Promise<any | null> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock data for demo purposes - in production, call a real barcode API
  const mockProducts: Record<string, any> = {
    // Clothing items
    '0123456789012': {
      id: '0123456789012',
      name: 'Cotton T-shirt',
      brand: 'Fashion Brand',
      category: 'top',
      description: 'Basic cotton t-shirt',
      image_url: 'https://via.placeholder.com/150?text=Tshirt',
      color: 'black',
      material: 'cotton'
    },
    '1234567890123': {
      id: '1234567890123',
      name: 'Slim Fit Jeans',
      brand: 'Denim Co',
      category: 'bottom',
      description: 'Comfortable slim fit jeans',
      image_url: 'https://via.placeholder.com/150?text=Jeans',
      color: 'blue',
      material: 'denim'
    },
    '2345678901234': {
      id: '2345678901234',
      name: 'Running Shoes',
      brand: 'Sport Gear',
      category: 'shoes',
      description: 'Lightweight running shoes',
      image_url: 'https://via.placeholder.com/150?text=Shoes',
      color: 'white',
      material: 'synthetic'
    }
  };
  
  // Return the mock product or null if not found
  return mockProducts[barcode] || null;
} 