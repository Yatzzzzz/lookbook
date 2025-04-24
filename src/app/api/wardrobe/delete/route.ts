import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import adminSupabase from '../../../../lib/admin-supabase';

export async function DELETE(request: NextRequest) {
  try {
    // Get the item ID from the URL query parameters
    const url = new URL(request.url);
    const itemId = url.searchParams.get('id');

    if (!itemId) {
      return NextResponse.json({ error: 'Missing item ID' }, { status: 400 });
    }

    // Verify the user is authenticated
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // First, check if the item belongs to the user
    const { data: itemData, error: itemError } = await supabase
      .from('wardrobe')
      .select('item_id, user_id, image_path')
      .eq('item_id', itemId)
      .single();

    if (itemError && itemError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking item ownership:', itemError);
      return NextResponse.json({ error: 'Error checking item ownership' }, { status: 500 });
    }

    // If item not found or doesn't belong to the user
    if (!itemData) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (itemData.user_id !== userId) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Delete the item using admin privileges (bypasses RLS)
    const { error: deleteError } = await adminSupabase
      .from('wardrobe')
      .delete()
      .eq('item_id', itemId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting wardrobe item:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // If item has an image, delete it too
    if (itemData.image_path) {
      try {
        const imagePath = itemData.image_path.split('/').slice(-2).join('/');
        await adminSupabase.storage.from('wardrobe').remove([imagePath]);
      } catch (imageError) {
        console.error('Error deleting image (item was deleted):', imageError);
        // Don't return error here, as the item was deleted successfully
      }
    }

    return NextResponse.json({ success: true, message: 'Item deleted successfully' });
  } catch (err: any) {
    console.error('Server error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
} 