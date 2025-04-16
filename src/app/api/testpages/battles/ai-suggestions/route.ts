import { NextResponse } from 'next/server';

type FashionElement = 'color' | 'style' | 'pattern' | 'material' | 'silhouette' | 'accessory';

interface AISuggestion {
  comparisonPoint: FashionElement;
  explanation: string;
  recommendation: string;
}

export async function POST(request: Request) {
  try {
    const { lookIds } = await request.json();
    
    if (!lookIds || !Array.isArray(lookIds) || lookIds.length !== 2) {
      return NextResponse.json(
        { error: 'Two valid look IDs are required' },
        { status: 400 }
      );
    }
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate mock AI suggestions
    const suggestions: AISuggestion[] = [
      {
        comparisonPoint: 'color',
        explanation: 'The first look uses a cohesive color palette with complementary tones, while the second look has more contrast but less harmony.',
        recommendation: 'For similar styles, consider using analogous colors that sit next to each other on the color wheel to create visual harmony.'
      },
      {
        comparisonPoint: 'silhouette',
        explanation: 'The first look features a more structured silhouette that highlights the waistline, while the second has a relaxed, flowing silhouette.',
        recommendation: 'Your body type might benefit from the structured elements of the first look combined with the comfort of the second.'
      },
      {
        comparisonPoint: 'accessory',
        explanation: 'The first look uses minimal accessories that do not compete with the outfit, while the second look\'s accessories create focal points.',
        recommendation: 'Try incorporating statement accessories with simpler outfits, and minimal accessories with more complex patterns.'
      }
    ];
    
    return NextResponse.json({
      suggestions,
      lookIds
    });
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI suggestions' },
      { status: 500 }
    );
  }
} 