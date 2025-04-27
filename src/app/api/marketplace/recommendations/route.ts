import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Get personalized product recommendations
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
    const recommendationType = searchParams.get('type') || 'personalized';
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    // Different types of recommendations:
    // 1. personalized: Based on user's wardrobe and style
    // 2. trending: Popular products among all users
    // 3. new: Recently added products
    // 4. gap: Products that fill gaps in the user's wardrobe
    
    let recommendations: any[] = [];
    
    switch (recommendationType) {
      case 'personalized':
        recommendations = await getPersonalizedRecommendations(supabase, session.user.id, limit);
        break;
      case 'trending':
        recommendations = await getTrendingRecommendations(supabase, limit);
        break;
      case 'new':
        recommendations = await getNewRecommendations(supabase, limit);
        break;
      case 'gap':
        recommendations = await getGapRecommendations(supabase, session.user.id, limit);
        break;
      default:
        return NextResponse.json({ 
          error: 'Invalid recommendation type. Valid types are: personalized, trending, new, gap' 
        }, { status: 400 });
    }
    
    return NextResponse.json({
      recommendations,
      metadata: {
        type: recommendationType,
        limit
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

// Get personalized recommendations based on user's wardrobe and style
async function getPersonalizedRecommendations(supabase: any, userId: string, limit: number): Promise<any[]> {
  // Step 1: Get user's most common categories from wardrobe
  const { data: categoryData, error: categoryError } = await supabase
    .from('wardrobe')
    .select('category')
    .eq('user_id', userId);
    
  if (categoryError) {
    console.error('Error fetching user categories:', categoryError);
    return [];
  }
  
  // Count categories and find the top ones
  const categoryCounts: Record<string, number> = {};
  categoryData.forEach((item: any) => {
    if (item.category) {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    }
  });
  
  // Get top 3 categories
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category]) => category);
    
  if (topCategories.length === 0) {
    // Fallback to trending if no categories found
    return getTrendingRecommendations(supabase, limit);
  }
  
  // Step 2: Get products in these categories that user doesn't already have in wishlist
  const { data: wishlistData, error: wishlistError } = await supabase
    .from('wish_list')
    .select('product_id')
    .eq('user_id', userId);
    
  if (wishlistError) {
    console.error('Error fetching wishlist:', wishlistError);
    return [];
  }
  
  const wishlistProductIds = wishlistData.map((item: any) => item.product_id);
  
  // Query for products in top categories that aren't in wishlist
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .in('category', topCategories)
    .not('product_id', 'in', wishlistProductIds.length > 0 ? `(${wishlistProductIds.join(',')})` : '()')
    .order('created_at', { ascending: false })
    .limit(limit);
    
  if (productsError) {
    console.error('Error fetching personalized products:', productsError);
    return [];
  }
  
  // Add recommendation reason to each product
  return products.map((product: any) => ({
    ...product,
    recommendation_reason: `Based on your interest in ${product.category} items`
  }));
}

// Get trending recommendations based on click data
async function getTrendingRecommendations(supabase: any, limit: number): Promise<any[]> {
  // Get products with the most clicks in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // First try to get products based on click data
  const { data: clickData, error: clickError } = await supabase
    .from('click_tracking')
    .select('product_id, count(*)')
    .gte('click_time', thirtyDaysAgo.toISOString())
    .group('product_id')
    .order('count', { ascending: false })
    .limit(limit);
    
  if (clickError || !clickData || clickData.length === 0) {
    // Fallback to most recently added products if no click data
    return getNewRecommendations(supabase, limit);
  }
  
  const productIds = clickData.map((item: any) => item.product_id);
  
  // Get the full product details
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .in('product_id', productIds);
    
  if (productsError) {
    console.error('Error fetching trending products:', productsError);
    return [];
  }
  
  // Sort products in the same order as the click counts
  const sortedProducts = productIds.map(id => 
    products.find((product: any) => product.product_id === id)
  ).filter(Boolean);
  
  // Add recommendation reason
  return sortedProducts.map((product: any) => ({
    ...product,
    recommendation_reason: 'Popular with other users'
  }));
}

// Get newest products
async function getNewRecommendations(supabase: any, limit: number): Promise<any[]> {
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
    
  if (productsError) {
    console.error('Error fetching new products:', productsError);
    return [];
  }
  
  // Add recommendation reason
  return products.map((product: any) => ({
    ...product,
    recommendation_reason: 'Recently added to our marketplace'
  }));
}

// Get gap recommendations (products that fill gaps in user's wardrobe)
async function getGapRecommendations(supabase: any, userId: string, limit: number): Promise<any[]> {
  // This is a simplified implementation
  // A more sophisticated version would analyze the user's wardrobe for missing essentials
  
  // First, get all categories in the user's wardrobe
  const { data: userCategories, error: userCategoryError } = await supabase
    .from('wardrobe')
    .select('category')
    .eq('user_id', userId)
    .not('category', 'is', null);
    
  if (userCategoryError) {
    console.error('Error fetching user categories:', userCategoryError);
    return [];
  }
  
  const userCategorySet = new Set(userCategories.map((item: any) => item.category));
  
  // Get all available categories from products table
  const { data: allCategories, error: allCategoryError } = await supabase
    .from('products')
    .select('category')
    .not('category', 'is', null)
    .group('category');
    
  if (allCategoryError) {
    console.error('Error fetching all categories:', allCategoryError);
    return [];
  }
  
  // Find categories that user doesn't have in their wardrobe
  const missingCategories = allCategories
    .map((item: any) => item.category)
    .filter((category: string) => !userCategorySet.has(category));
    
  if (missingCategories.length === 0) {
    // Fallback to trending if no missing categories
    return getTrendingRecommendations(supabase, limit);
  }
  
  // Get products from categories the user doesn't have
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .in('category', missingCategories)
    .order('created_at', { ascending: false })
    .limit(limit);
    
  if (productsError) {
    console.error('Error fetching gap products:', productsError);
    return [];
  }
  
  // Add recommendation reason
  return products.map((product: any) => ({
    ...product,
    recommendation_reason: `Fill a gap in your wardrobe: ${product.category}`
  }));
} 