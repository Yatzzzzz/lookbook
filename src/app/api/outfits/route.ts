import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { cookies } from 'next/headers';

/**
 * GET handler for retrieving outfits
 * Can filter by user_id, visibility, etc.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const outfitId = searchParams.get('outfit_id');
    const userId = searchParams.get('user_id');
    const visibility = searchParams.get('visibility');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Get the supabase client
    const cookieStore = cookies();
    const supabase = getSupabaseClient(cookieStore);
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Start building the query
    let query = supabase.from('outfits').select(`
      *,
      outfit_items(*)
    `);
    
    // Apply filters
    if (outfitId) {
      query = query.eq('outfit_id', outfitId);
    }
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (visibility) {
      query = query.eq('visibility', visibility);
    }
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    // Execute the query
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching outfits:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in GET /api/outfits:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST handler for creating a new outfit
 */
export async function POST(request: Request) {
  try {
    // Get the request body
    const body = await request.json();
    const { name, description, visibility, season, occasion, weather_conditions, featured, items } = body;
    
    if (!name) {
      return NextResponse.json({ error: 'Outfit name is required' }, { status: 400 });
    }
    
    // Get the supabase client
    const cookieStore = cookies();
    const supabase = getSupabaseClient(cookieStore);
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Create the outfit
    const { data: outfit, error: outfitError } = await supabase
      .from('outfits')
      .insert({
        user_id: session.user.id,
        name,
        description,
        visibility: visibility || 'private',
        season,
        occasion,
        weather_conditions,
        featured: featured || false
      })
      .select()
      .single();
    
    if (outfitError) {
      console.error('Error creating outfit:', outfitError);
      return NextResponse.json({ error: outfitError.message }, { status: 500 });
    }
    
    // If items are provided, add them to the outfit
    if (items && Array.isArray(items) && items.length > 0) {
      const outfitItems = items.map((item, index) => ({
        outfit_id: outfit.outfit_id,
        item_id: item.itemId,
        layer_order: index,
        position_x: item.positionX,
        position_y: item.positionY,
        z_index: item.zIndex || index,
        scale: item.scale || 1.0,
        rotation: item.rotation || 0,
        position_data: item.positionData
      }));
      
      const { error: itemsError } = await supabase
        .from('outfit_items')
        .insert(outfitItems);
      
      if (itemsError) {
        console.error('Error adding items to outfit:', itemsError);
        // Don't fail the entire operation if items fail to add
        // Just return a warning with the outfit
        return NextResponse.json({ 
          data: outfit, 
          warning: 'Outfit created but some items failed to add' 
        });
      }
    }
    
    return NextResponse.json({ data: outfit });
  } catch (error: any) {
    console.error('Error in POST /api/outfits:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT handler for updating an existing outfit
 */
export async function PUT(request: Request) {
  try {
    // Get the request body
    const body = await request.json();
    const { outfit_id, name, description, visibility, season, occasion, weather_conditions, featured, items } = body;
    
    if (!outfit_id) {
      return NextResponse.json({ error: 'Outfit ID is required' }, { status: 400 });
    }
    
    // Get the supabase client
    const cookieStore = cookies();
    const supabase = getSupabaseClient(cookieStore);
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify ownership of the outfit
    const { data: existingOutfit, error: fetchError } = await supabase
      .from('outfits')
      .select('user_id')
      .eq('outfit_id', outfit_id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching outfit:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    
    if (existingOutfit.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Update the outfit
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (season !== undefined) updateData.season = season;
    if (occasion !== undefined) updateData.occasion = occasion;
    if (weather_conditions !== undefined) updateData.weather_conditions = weather_conditions;
    if (featured !== undefined) updateData.featured = featured;
    
    const { data: updatedOutfit, error: updateError } = await supabase
      .from('outfits')
      .update(updateData)
      .eq('outfit_id', outfit_id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating outfit:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    // If items are provided, first remove all existing items and then add the new ones
    if (items && Array.isArray(items)) {
      // Remove existing items
      const { error: deleteError } = await supabase
        .from('outfit_items')
        .delete()
        .eq('outfit_id', outfit_id);
      
      if (deleteError) {
        console.error('Error removing existing items:', deleteError);
        return NextResponse.json({ 
          data: updatedOutfit, 
          warning: 'Outfit updated but failed to update items' 
        });
      }
      
      // Add new items if there are any
      if (items.length > 0) {
        const outfitItems = items.map((item, index) => ({
          outfit_id: outfit_id,
          item_id: item.itemId,
          layer_order: index,
          position_x: item.positionX,
          position_y: item.positionY,
          z_index: item.zIndex || index,
          scale: item.scale || 1.0,
          rotation: item.rotation || 0,
          position_data: item.positionData
        }));
        
        const { error: itemsError } = await supabase
          .from('outfit_items')
          .insert(outfitItems);
        
        if (itemsError) {
          console.error('Error adding new items to outfit:', itemsError);
          return NextResponse.json({ 
            data: updatedOutfit, 
            warning: 'Outfit updated but some items failed to add' 
          });
        }
      }
    }
    
    return NextResponse.json({ data: updatedOutfit });
  } catch (error: any) {
    console.error('Error in PUT /api/outfits:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE handler for removing an outfit
 */
export async function DELETE(request: NextRequest) {
  try {
    const outfitId = request.nextUrl.searchParams.get('outfit_id');
    
    if (!outfitId) {
      return NextResponse.json({ error: 'Outfit ID is required' }, { status: 400 });
    }
    
    // Get the supabase client
    const cookieStore = cookies();
    const supabase = getSupabaseClient(cookieStore);
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify ownership of the outfit
    const { data: existingOutfit, error: fetchError } = await supabase
      .from('outfits')
      .select('user_id')
      .eq('outfit_id', outfitId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching outfit:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    
    if (existingOutfit.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Delete the outfit (associated outfit_items will be deleted automatically due to the CASCADE constraint)
    const { error: deleteError } = await supabase
      .from('outfits')
      .delete()
      .eq('outfit_id', outfitId);
    
    if (deleteError) {
      console.error('Error deleting outfit:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/outfits:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 