import { NextResponse } from 'next/server';

interface FashionElement {
  id: string;
  name: string;
  categories: string[];
  colors: string[];
  patterns: string[];
  materials: string[];
  styles: string[];
}

interface ComparisonResult {
  lookIdA: string;
  lookIdB: string;
  similarities: string[];
  differences: string[];
  styleAdvice: string;
}

// Mock database of fashion elements
const mockFashionDatabase: Record<string, FashionElement> = {
  'look1': {
    id: 'look1',
    name: 'Summer Casual',
    categories: ['top', 'shorts'],
    colors: ['white', 'blue'],
    patterns: ['solid'],
    materials: ['cotton', 'denim'],
    styles: ['casual', 'summer']
  },
  'look2': {
    id: 'look2',
    name: 'Business Casual',
    categories: ['blazer', 'pants'],
    colors: ['navy', 'gray'],
    patterns: ['solid'],
    materials: ['cotton', 'polyester'],
    styles: ['professional', 'office']
  },
  'look3': {
    id: 'look3',
    name: 'Street Style',
    categories: ['hoodie', 'jeans'],
    colors: ['black', 'gray'],
    patterns: ['graphic'],
    materials: ['cotton', 'denim'],
    styles: ['street', 'casual']
  },
  'look4': {
    id: 'look4',
    name: 'Evening Glam',
    categories: ['dress'],
    colors: ['black', 'gold'],
    patterns: ['sequin'],
    materials: ['silk', 'satin'],
    styles: ['formal', 'evening']
  },
  'look5': {
    id: 'look5',
    name: 'Athleisure',
    categories: ['leggings', 'sports-bra', 'jacket'],
    colors: ['black', 'neon'],
    patterns: ['solid'],
    materials: ['spandex', 'polyester'],
    styles: ['athletic', 'casual']
  }
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lookIdA, lookIdB } = body;
    
    // Validate required fields
    if (!lookIdA || !lookIdB) {
      return NextResponse.json(
        { error: "Both lookIdA and lookIdB are required" },
        { status: 400 }
      );
    }
    
    // Fetch looks from mock database
    const lookA = mockFashionDatabase[lookIdA];
    const lookB = mockFashionDatabase[lookIdB];
    
    if (!lookA || !lookB) {
      return NextResponse.json(
        { error: "One or both looks not found in database" },
        { status: 404 }
      );
    }
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Compare the looks
    const similarities: string[] = [];
    const differences: string[] = [];
    
    // Compare categories
    const commonCategories = lookA.categories.filter(cat => 
      lookB.categories.includes(cat)
    );
    if (commonCategories.length > 0) {
      similarities.push(`Both looks include ${commonCategories.join(', ')}`);
    }
    
    const uniqueCategoriesA = lookA.categories.filter(cat => 
      !lookB.categories.includes(cat)
    );
    const uniqueCategoriesB = lookB.categories.filter(cat => 
      !lookA.categories.includes(cat)
    );
    if (uniqueCategoriesA.length > 0) {
      differences.push(`${lookA.name} includes ${uniqueCategoriesA.join(', ')} not found in ${lookB.name}`);
    }
    if (uniqueCategoriesB.length > 0) {
      differences.push(`${lookB.name} includes ${uniqueCategoriesB.join(', ')} not found in ${lookA.name}`);
    }
    
    // Compare colors
    const commonColors = lookA.colors.filter(color => 
      lookB.colors.includes(color)
    );
    if (commonColors.length > 0) {
      similarities.push(`Both looks use ${commonColors.join(', ')} color tones`);
    }
    
    const uniqueColorsA = lookA.colors.filter(color => 
      !lookB.colors.includes(color)
    );
    const uniqueColorsB = lookB.colors.filter(color => 
      !lookA.colors.includes(color)
    );
    if (uniqueColorsA.length > 0 || uniqueColorsB.length > 0) {
      differences.push(`Color palettes differ: ${lookA.name} uses ${lookA.colors.join(', ')} while ${lookB.name} uses ${lookB.colors.join(', ')}`);
    }
    
    // Compare styles
    const commonStyles = lookA.styles.filter(style => 
      lookB.styles.includes(style)
    );
    if (commonStyles.length > 0) {
      similarities.push(`Both looks have a ${commonStyles.join(' and ')} aesthetic`);
    }
    
    const uniqueStylesA = lookA.styles.filter(style => 
      !lookB.styles.includes(style)
    );
    const uniqueStylesB = lookB.styles.filter(style => 
      !lookA.styles.includes(style)
    );
    if (uniqueStylesA.length > 0 || uniqueStylesB.length > 0) {
      differences.push(`Style differences: ${lookA.name} is ${lookA.styles.join(', ')} while ${lookB.name} is ${lookB.styles.join(', ')}`);
    }
    
    // Generate style advice
    let styleAdvice = '';
    if (commonCategories.length > 0 || commonColors.length > 0 || commonStyles.length > 0) {
      styleAdvice = `These looks could be combined to create a versatile ${lookA.styles[0]}-${lookB.styles[0]} fusion style.`;
    } else {
      styleAdvice = `These looks represent different style directions - try mixing elements from both for a unique personal style.`;
    }
    
    // Create comparison result
    const comparisonResult: ComparisonResult = {
      lookIdA,
      lookIdB,
      similarities: similarities.length > 0 ? similarities : ['No significant similarities found'],
      differences: differences.length > 0 ? differences : ['No significant differences found'],
      styleAdvice
    };
    
    return NextResponse.json({
      success: true,
      comparison: comparisonResult
    });
    
  } catch (error) {
    console.error("Error processing comparison:", error);
    return NextResponse.json(
      { error: "Failed to process comparison" },
      { status: 500 }
    );
  }
} 