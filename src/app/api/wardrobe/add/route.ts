import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import adminSupabase from '../../../../lib/admin-supabase';

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
    const itemData = await request.json();
    const userId = session.user.id;
    
    if (!itemData) {
      return NextResponse.json({ error: 'Missing item data' }, { status: 400 });
    }
    
    // Ensure required fields are present
    if (!itemData.name) {
      return NextResponse.json({ error: 'Item name is required' }, { status: 400 });
    }
    
    if (!itemData.category) {
      return NextResponse.json({ error: 'Item category is required' }, { status: 400 });
    }
    
    // Create the wardrobe item with generated ID
    const newItem = {
      ...itemData,
      user_id: userId,
      item_id: itemData.item_id || uuidv4(),
      created_at: new Date().toISOString()
    };
    
    // Try to insert using admin privileges (bypasses RLS)
    try {
      const { data, error } = await adminSupabase
        .from('wardrobe')
        .insert([newItem])
        .select();
        
      if (error) {
        console.error('Initial error inserting wardrobe item:', error);
        
        // Check for column-related errors
        if (error.message && (
          error.message.includes('column') || 
          error.message.includes('does not exist') ||
          error.message.includes('not present in table')
        )) {
          // Create a sanitized version of the item by only including fields from the schema
          const knownFields = [
            'item_id', 'user_id', 'name', 'category', 'color', 'brand', 'style',
            'image_path', 'created_at', 'description', 'visibility', 'brand_url',
            'wear_count', 'purchase_date', 'purchase_price', 'size', 'last_worn',
            'material', 'season', 'occasion', 'featured', 'metadata'
          ];
          
          // Only include known fields
          const sanitizedItem = Object.keys(newItem)
            .filter(key => knownFields.includes(key))
            .reduce((obj, key) => {
              obj[key] = newItem[key];
              return obj;
            }, {} as any);
          
          console.log('Retrying with sanitized item:', sanitizedItem);
          
          const retryResult = await adminSupabase
            .from('wardrobe')
            .insert([sanitizedItem])
            .select();
            
          if (retryResult.error) {
            console.error('Still failed after sanitizing fields:', retryResult.error);
            return NextResponse.json({ error: retryResult.error.message }, { status: 500 });
          }
          
          return NextResponse.json(retryResult.data[0]);
        }
        
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