import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/look/viral-prediction - Calculate viral potential of a look
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.look_id) {
      return NextResponse.json(
        { error: 'Look ID is required' },
        { status: 400 }
      );
    }
    
    // Get the look details
    const { data: lookData, error: lookError } = await supabase
      .from('looks')
      .select(`
        look_id,
        user_id,
        upload_type,
        ai_metadata,
        created_at
      `)
      .eq('look_id', body.look_id)
      .single();
    
    if (lookError) {
      return NextResponse.json({ error: lookError.message }, { status: 500 });
    }
    
    if (!lookData) {
      return NextResponse.json({ error: 'Look not found' }, { status: 404 });
    }
    
    // In a real application, this would use ML/AI to predict virality
    // For now, we'll create a simple algorithm
    
    // Mock factors that might influence viral potential:
    // 1. User engagement history
    // 2. Trend alignment with current popular trends
    // 3. Visual quality and composition
    // 4. Timing of post
    // 5. User followers count
    
    // Simulate getting user's follower count
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('followers_count')
      .eq('id', lookData.user_id)
      .single();
    
    if (userError && userError.code !== 'PGRST116') { // Not found is ok for this demo
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }
    
    const followersCount = userData?.followers_count || 0;
    
    // Generate random factors for demonstration
    const trendAlignment = Math.random() * 100; // 0-100
    const visualQuality = Math.random() * 100; // 0-100
    const timingScore = Math.random() * 100; // 0-100
    const userEngagement = Math.random() * 100; // 0-100
    
    // Calculate weighted viral score
    // In a real app, these weights would be determined by ML training
    const weights = {
      followers: 0.2,
      trendAlignment: 0.3,
      visualQuality: 0.25,
      timing: 0.15,
      engagement: 0.1
    };
    
    // Normalize followers (0-100 scale)
    const normalizedFollowers = Math.min(followersCount / 1000 * 100, 100);
    
    const viralScore = (
      weights.followers * normalizedFollowers +
      weights.trendAlignment * trendAlignment +
      weights.visualQuality * visualQuality +
      weights.timing * timingScore +
      weights.engagement * userEngagement
    );
    
    // Calculate probability (0-100%)
    const viralProbability = Math.min(Math.round(viralScore), 100);
    
    // Determine factors that contributed most to the score
    const factors = [
      { name: 'Follower Count', score: normalizedFollowers },
      { name: 'Trend Alignment', score: trendAlignment },
      { name: 'Visual Quality', score: visualQuality },
      { name: 'Posting Timing', score: timingScore },
      { name: 'User Engagement', score: userEngagement }
    ].sort((a, b) => b.score - a.score);
    
    const topFactors = factors.slice(0, 3).map(f => f.name);
    
    // Generate recommendations based on lowest scoring factors
    const lowestFactors = factors.slice(-2);
    const recommendations = lowestFactors.map(factor => {
      switch(factor.name) {
        case 'Follower Count':
          return 'Try engaging more with other users to grow your following';
        case 'Trend Alignment':
          return 'Consider incorporating current popular fashion trends in your looks';
        case 'Visual Quality':
          return 'Ensure good lighting and composition in your fashion photos';
        case 'Posting Timing':
          return 'Post during peak user activity times for better visibility';
        case 'User Engagement':
          return 'Respond to comments and interact with your audience more';
        default:
          return '';
      }
    }).filter(Boolean);
    
    return NextResponse.json({
      look_id: body.look_id,
      viral_probability: viralProbability,
      top_contributing_factors: topFactors,
      recommendations: recommendations
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
    }
  }
} 