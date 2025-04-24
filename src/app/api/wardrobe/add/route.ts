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
        // If there's an error with the description column
        if (error.message.includes('description') && error.message.includes('column')) {
          console.error('Description column error, trying without it:', error);
          
          // Remove the description field and try again
          const { ...itemWithoutDescription } = newItem;
          delete itemWithoutDescription.description;
          
          const retryResult = await adminSupabase
            .from('wardrobe')
            .insert([itemWithoutDescription])
            .select();
            
          if (retryResult.error) {
            console.error('Still failed after removing description:', retryResult.error);
            return NextResponse.json({ error: retryResult.error.message }, { status: 500 });
          }
          
          return NextResponse.json(retryResult.data[0]);
        }
        
        console.error('Error inserting wardrobe item:', error);
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