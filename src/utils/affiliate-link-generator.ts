/**
 * Affiliate Link Generator Utility
 * 
 * This utility provides functions for creating, tracking, and managing 
 * affiliate links for content creators in the Lookbook platform.
 */

import { getSupabaseClient } from '@/lib/supabaseClient';

/**
 * Generates an affiliate link with tracking parameters
 */
export async function generateAffiliateLink(
  userId: string,
  productId: string,
  source: string = 'creator'
): Promise<string> {
  const supabase = getSupabaseClient();

  try {
    // Check if user is eligible for affiliate program
    const { data: creatorData, error: creatorError } = await supabase
      .from('creator_profiles')
      .select('id, affiliate_id, commission_rate')
      .eq('user_id', userId)
      .single();

    if (creatorError || !creatorData) {
      console.error('Error fetching creator profile:', creatorError);
      throw new Error('User is not registered as a creator');
    }

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('product_url, brand')
      .eq('product_id', productId)
      .single();

    if (productError || !product) {
      console.error('Error fetching product:', productError);
      throw new Error('Product not found');
    }

    // Create a tracking record for this affiliate link
    const trackingId = generateTrackingId(userId, productId);
    
    const { error: trackingError } = await supabase
      .from('affiliate_tracking')
      .insert({
        tracking_id: trackingId,
        creator_id: creatorData.id,
        product_id: productId,
        created_at: new Date().toISOString(),
        source,
        affiliate_id: creatorData.affiliate_id,
        commission_rate: creatorData.commission_rate
      });

    if (trackingError) {
      console.error('Error creating tracking record:', trackingError);
      throw new Error('Failed to create affiliate tracking record');
    }

    // Construct the affiliate link with tracking parameters
    const url = new URL(product.product_url);
    url.searchParams.append('aff', creatorData.affiliate_id);
    url.searchParams.append('track', trackingId);
    url.searchParams.append('src', 'lookbook');
    
    return url.toString();
  } catch (error) {
    console.error('Error generating affiliate link:', error);
    throw error;
  }
}

/**
 * Tracks a click on an affiliate link
 */
export async function trackAffiliateClick(
  trackingId: string,
  userId?: string
): Promise<void> {
  const supabase = getSupabaseClient();

  try {
    // Get the tracking record
    const { data: tracking, error: trackingError } = await supabase
      .from('affiliate_tracking')
      .select('id, click_count')
      .eq('tracking_id', trackingId)
      .single();

    if (trackingError || !tracking) {
      console.error('Error fetching tracking record:', trackingError);
      throw new Error('Tracking ID not found');
    }

    // Increment click count
    const { error: updateError } = await supabase
      .from('affiliate_tracking')
      .update({
        click_count: (tracking.click_count || 0) + 1,
        last_clicked_at: new Date().toISOString()
      })
      .eq('id', tracking.id);

    if (updateError) {
      console.error('Error updating click count:', updateError);
      throw new Error('Failed to update click count');
    }

    // Log the click with user info if available
    if (userId) {
      const { error: clickLogError } = await supabase
        .from('affiliate_click_logs')
        .insert({
          tracking_id: trackingId,
          user_id: userId,
          clicked_at: new Date().toISOString()
        });

      if (clickLogError) {
        console.error('Error logging click:', clickLogError);
        // Don't throw here, just log the error
      }
    }
  } catch (error) {
    console.error('Error tracking affiliate click:', error);
    throw error;
  }
}

/**
 * Records a conversion (purchase) from an affiliate link
 */
export async function recordAffiliateConversion(
  trackingId: string, 
  orderId: string,
  amount: number
): Promise<void> {
  const supabase = getSupabaseClient();

  try {
    // Get the tracking record
    const { data: tracking, error: trackingError } = await supabase
      .from('affiliate_tracking')
      .select('id, creator_id, product_id, commission_rate')
      .eq('tracking_id', trackingId)
      .single();

    if (trackingError || !tracking) {
      console.error('Error fetching tracking record:', trackingError);
      throw new Error('Tracking ID not found');
    }

    // Calculate commission
    const commission = amount * (tracking.commission_rate / 100);

    // Record the conversion
    const { error: conversionError } = await supabase
      .from('affiliate_conversions')
      .insert({
        tracking_id: trackingId,
        creator_id: tracking.creator_id,
        product_id: tracking.product_id,
        order_id: orderId,
        amount,
        commission,
        converted_at: new Date().toISOString(),
        status: 'pending'
      });

    if (conversionError) {
      console.error('Error recording conversion:', conversionError);
      throw new Error('Failed to record conversion');
    }

    // Update the tracking record
    const { error: updateError } = await supabase
      .from('affiliate_tracking')
      .update({
        conversion_count: supabase.rpc('increment', { row_id: tracking.id, table: 'affiliate_tracking', column: 'conversion_count' }),
        total_revenue: supabase.rpc('add_amount', { row_id: tracking.id, table: 'affiliate_tracking', column: 'total_revenue', amount }),
        total_commission: supabase.rpc('add_amount', { row_id: tracking.id, table: 'affiliate_tracking', column: 'total_commission', amount: commission })
      })
      .eq('id', tracking.id);

    if (updateError) {
      console.error('Error updating tracking record:', updateError);
      throw new Error('Failed to update tracking record');
    }
  } catch (error) {
    console.error('Error recording affiliate conversion:', error);
    throw error;
  }
}

/**
 * Gets affiliate performance statistics for a creator
 */
export async function getAffiliateStats(
  userId: string, 
  period: 'day' | 'week' | 'month' | 'year' = 'month'
): Promise<{
  clicks: number;
  conversions: number;
  revenue: number;
  commission: number;
  conversionRate: number;
  topProducts: any[];
}> {
  const supabase = getSupabaseClient();

  try {
    // Get the creator profile
    const { data: creator, error: creatorError } = await supabase
      .from('creator_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (creatorError || !creator) {
      console.error('Error fetching creator profile:', creatorError);
      throw new Error('User is not registered as a creator');
    }

    // Determine date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Get tracking stats
    const { data: stats, error: statsError } = await supabase
      .rpc('get_creator_affiliate_stats', {
        p_creator_id: creator.id,
        p_start_date: startDate.toISOString(),
        p_end_date: now.toISOString()
      });

    if (statsError) {
      console.error('Error fetching affiliate stats:', statsError);
      throw new Error('Failed to fetch affiliate statistics');
    }

    // Get top performing products
    const { data: topProducts, error: productsError } = await supabase
      .rpc('get_creator_top_products', {
        p_creator_id: creator.id,
        p_start_date: startDate.toISOString(),
        p_end_date: now.toISOString(),
        p_limit: 5
      });

    if (productsError) {
      console.error('Error fetching top products:', productsError);
      // Don't throw here, just continue with empty array
    }

    return {
      clicks: stats?.total_clicks || 0,
      conversions: stats?.total_conversions || 0,
      revenue: stats?.total_revenue || 0,
      commission: stats?.total_commission || 0,
      conversionRate: stats?.total_clicks ? (stats.total_conversions / stats.total_clicks) * 100 : 0,
      topProducts: topProducts || []
    };
  } catch (error) {
    console.error('Error getting affiliate stats:', error);
    throw error;
  }
}

/**
 * Generates a unique tracking ID for affiliate links
 */
function generateTrackingId(userId: string, productId: string): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `LB-${userId.substring(0, 6)}-${productId.substring(0, 6)}-${timestamp}-${randomStr}`;
} 