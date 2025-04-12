import { NextRequest, NextResponse } from 'next/server';

// GET /api/trends/rising - Get rising fashion trends
export async function GET(request: NextRequest) {
  try {
    // In a production environment, this would fetch data from a real source
    // For now, we'll return mock data
    
    const mockTrends = [
      {
        id: '1',
        title: 'Oversized Blazers',
        description: 'Relaxed fit blazers paired with casual items',
        imageUrl: 'https://via.placeholder.com/300',
        popularity: 95,
        category: 'outerwear',
      },
      {
        id: '2',
        title: 'Statement Collars',
        description: 'Bold, embellished collars that stand out',
        imageUrl: 'https://via.placeholder.com/300',
        popularity: 87,
        category: 'tops',
      },
      {
        id: '3',
        title: 'Pastel Suits',
        description: 'Soft-colored suits for a fresh office look',
        imageUrl: 'https://via.placeholder.com/300',
        popularity: 82,
        category: 'formal',
      },
      {
        id: '4',
        title: 'Platform Boots',
        description: 'Chunky platform boots with everything',
        imageUrl: 'https://via.placeholder.com/300',
        popularity: 79,
        category: 'footwear',
      },
      {
        id: '5',
        title: 'Wide Leg Pants',
        description: 'Comfortable, flowy pants for all occasions',
        imageUrl: 'https://via.placeholder.com/300',
        popularity: 76,
        category: 'bottoms',
      },
      {
        id: '6',
        title: 'Cottagecore Dresses',
        description: 'Romantic, vintage-inspired flowing dresses',
        imageUrl: 'https://via.placeholder.com/300',
        popularity: 74,
        category: 'dresses',
      },
    ];
    
    // Filter by category if provided
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    
    let filteredTrends = [...mockTrends];
    if (category) {
      filteredTrends = mockTrends.filter(
        trend => trend.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Sort by popularity (already done in mock data, but in a real app this might be dynamic)
    filteredTrends.sort((a, b) => b.popularity - a.popularity);
    
    return NextResponse.json({ trends: filteredTrends });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
  }
} 