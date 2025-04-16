import { NextResponse } from 'next/server';

interface Look {
  look_id: string;
  image_url: string;
  caption: string;
  username: string;
  tags?: string[];
  avatar_url?: string;
  rating?: number;
  rating_count?: number;
}

interface BattlePair {
  id: number;
  looks: Look[];
}

export async function GET() {
  try {
    // Generate mock battle data
    const mockLooks: Look[] = Array.from({ length: 8 }, (_, i) => ({
      look_id: `look-${i + 1}`,
      image_url: `https://picsum.photos/seed/look${i + 1}/600/800`,
      caption: [
        'Summer casual ensemble with linen shirt',
        'Evening cocktail dress with subtle embellishments',
        'Street style outfit with vintage denim',
        'Business casual attire for modern workspace',
        'Bohemian chic look with layered accessories',
        'Minimalist outfit with monochrome palette',
        'Athleisure ensemble with technical fabrics',
        'Classic formal wear with contemporary cut'
      ][i],
      username: [`FashionFinder`, `StyleSavvy`, `TrendTracker`, `ModeMaster`][i % 4],
      avatar_url: `https://i.pravatar.cc/150?u=${i + 10}`,
      tags: ['summer', 'casual', 'formal', 'business', 'evening', 'street', 'vintage', 'minimal']
        .sort(() => 0.5 - Math.random())
        .slice(0, 3),
      rating: (3 + Math.random() * 2).toFixed(1),
      rating_count: Math.floor(10 + Math.random() * 190)
    }));
    
    // Create battle pairs
    const pairs: BattlePair[] = [];
    for (let i = 0; i < mockLooks.length; i += 2) {
      if (i + 1 < mockLooks.length) {
        pairs.push({
          id: i / 2,
          looks: [mockLooks[i], mockLooks[i + 1]]
        });
      }
    }
    
    return NextResponse.json(pairs);
  } catch (error) {
    console.error('Error generating battle data:', error);
    return NextResponse.json(
      { error: 'Failed to load battle data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { battleId, lookId, rating, action } = await request.json();
    
    // Validate input
    if (!battleId && battleId !== 0) {
      return NextResponse.json(
        { error: 'Battle ID is required' },
        { status: 400 }
      );
    }
    
    if (!lookId) {
      return NextResponse.json(
        { error: 'Look ID is required' },
        { status: 400 }
      );
    }
    
    // Mock successful response
    return NextResponse.json({
      success: true,
      message: `${action === 'rate' ? 'Rating' : 'Vote'} recorded for look ${lookId} in battle ${battleId}`
    });
  } catch (error) {
    console.error('Error processing battle action:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 