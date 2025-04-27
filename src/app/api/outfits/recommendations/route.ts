import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { cookies } from 'next/headers';
import { getOutfitRecommendations, getWeatherBasedRecommendations } from '@/utils/outfit-recommendation-engine';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const occasion = searchParams.get('occasion');
    const season = searchParams.get('season');
    const weatherBased = searchParams.get('weather_based') === 'true';
    const location = searchParams.get('location');
    const stylePreference = searchParams.get('style_preference')?.split(',');
    const colorScheme = searchParams.get('color_scheme')?.split(',');
    const limit = parseInt(searchParams.get('limit') || '5');
    
    // Get the supabase client
    const cookieStore = cookies();
    const supabase = getSupabaseClient(cookieStore);
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch user's wardrobe items
    const { data: wardrobeItems, error: wardrobeError } = await supabase
      .from('wardrobe')
      .select('*')
      .eq('user_id', session.user.id);
    
    if (wardrobeError) {
      console.error('Error fetching wardrobe items:', wardrobeError);
      return NextResponse.json({ error: wardrobeError.message }, { status: 500 });
    }
    
    if (!wardrobeItems || wardrobeItems.length === 0) {
      return NextResponse.json({ 
        error: 'No wardrobe items found. Add some items to your wardrobe first.'
      }, { status: 404 });
    }
    
    // Generate recommendations based on the criteria
    let recommendations;
    
    if (weatherBased) {
      // Generate weather-based recommendations
      recommendations = await getWeatherBasedRecommendations(
        wardrobeItems,
        location || undefined
      );
    } else {
      // Generate occasion or general recommendations
      recommendations = await getOutfitRecommendations({
        items: wardrobeItems,
        occasion: occasion || undefined,
        season: season || undefined,
        stylePreference: stylePreference || undefined,
        colorScheme: colorScheme || undefined
      });
    }
    
    // Limit the number of recommendations
    const limitedRecommendations = recommendations.slice(0, limit);
    
    return NextResponse.json({
      recommendations: limitedRecommendations,
      count: limitedRecommendations.length,
      total_available: recommendations.length
    });
  } catch (error: any) {
    console.error('Error in GET /api/outfits/recommendations:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Get the request body
    const body = await request.json();
    const { 
      occasion, 
      season, 
      weather,
      stylePreference,
      colorScheme
    } = body;
    
    // Get the supabase client
    const cookieStore = cookies();
    const supabase = getSupabaseClient(cookieStore);
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch user's wardrobe items
    const { data: wardrobeItems, error: wardrobeError } = await supabase
      .from('wardrobe')
      .select('*')
      .eq('user_id', session.user.id);
    
    if (wardrobeError) {
      console.error('Error fetching wardrobe items:', wardrobeError);
      return NextResponse.json({ error: wardrobeError.message }, { status: 500 });
    }
    
    if (!wardrobeItems || wardrobeItems.length === 0) {
      return NextResponse.json({ 
        error: 'No wardrobe items found. Add some items to your wardrobe first.'
      }, { status: 404 });
    }
    
    // Generate recommendations based on the criteria
    const recommendations = await getOutfitRecommendations({
      items: wardrobeItems,
      occasion,
      season,
      weather,
      stylePreference,
      colorScheme
    });
    
    // Log the recommendation request for improving the algorithm
    try {
      await supabase
        .from('recommendation_logs')
        .insert({
          user_id: session.user.id,
          request_params: {
            occasion,
            season,
            weather,
            stylePreference,
            colorScheme
          },
          items_count: wardrobeItems.length,
          results_count: recommendations.length,
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      // Don't fail if logging fails
      console.error('Error logging recommendation request:', logError);
    }
    
    return NextResponse.json({
      recommendations,
      count: recommendations.length
    });
  } catch (error: any) {
    console.error('Error in POST /api/outfits/recommendations:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 