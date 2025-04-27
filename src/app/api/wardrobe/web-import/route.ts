import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { cookies } from 'next/headers';

// Example retailer domains we support
const SUPPORTED_RETAILERS = [
  'asos.com',
  'hm.com',
  'zara.com',
  'nordstrom.com',
  'amazon.com'
];

interface ProductMetadata {
  name: string;
  brand?: string;
  category?: string;
  description?: string;
  color?: string;
  price?: string;
  image_url?: string;
  material?: string;
  url: string;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = getSupabaseClient(cookieStore);
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }
    
    // Check if the URL is from a supported retailer
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const hostname = urlObj.hostname.replace('www.', '');
    
    const isSupported = SUPPORTED_RETAILERS.some(domain => hostname.includes(domain));
    
    if (!isSupported) {
      return NextResponse.json(
        { error: 'Unsupported retailer. Please try a URL from a supported retailer.' },
        { status: 400 }
      );
    }
    
    // In a real implementation, we'd use a package like puppeteer or cheerio
    // to scrape the page content and extract metadata
    // For the MVP we'll use a mock implementation based on domain patterns
    const metadata = await extractMetadataFromUrl(urlObj);
    
    // Save the extracted metadata for analytics and improving the extraction
    const { error: logError } = await supabase
      .from('web_import_logs')
      .insert({
        url,
        extracted_metadata: metadata,
        user_id: session.user.id,
        retailer: hostname
      });
    
    if (logError) {
      console.error('Error logging web import:', logError);
      // Continue even if logging fails
    }
    
    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Web import error:', error);
    return NextResponse.json(
      { error: 'Failed to extract product information' },
      { status: 500 }
    );
  }
}

// Mock implementation for metadata extraction
async function extractMetadataFromUrl(url: URL): Promise<ProductMetadata> {
  // Simulate network delay for a more realistic experience
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const hostname = url.hostname.replace('www.', '');
  
  // Generate mock data based on the URL
  if (hostname.includes('asos.com')) {
    return {
      name: 'ASOS DESIGN oversized t-shirt with city print',
      brand: 'ASOS DESIGN',
      category: 'top',
      description: 'T-shirt by ASOS DESIGN. Part of our responsible edit. Crew neck. Short sleeves. City print. Oversized fit.',
      color: 'white',
      price: '$22.00',
      image_url: 'https://via.placeholder.com/400x500?text=ASOS+Tshirt',
      material: 'cotton',
      url: url.toString()
    };
  } else if (hostname.includes('hm.com')) {
    return {
      name: 'Slim Fit Chinos',
      brand: 'H&M',
      category: 'bottom',
      description: 'Slim-fit chinos in stretch cotton twill with a zip fly and button, side pockets, and back pockets with button.',
      color: 'beige',
      price: '$29.99',
      image_url: 'https://via.placeholder.com/400x500?text=HM+Chinos',
      material: 'cotton, elastane',
      url: url.toString()
    };
  } else if (hostname.includes('zara.com')) {
    return {
      name: 'Quilted Coat with Hood',
      brand: 'Zara',
      category: 'outerwear',
      description: 'Quilted coat with high collar and hood. Long sleeves with elastic cuffs. Welt pockets at hip. Adjustable elastic hem.',
      color: 'black',
      price: '$89.90',
      image_url: 'https://via.placeholder.com/400x500?text=Zara+Coat',
      material: 'polyester',
      url: url.toString()
    };
  } else if (hostname.includes('nordstrom.com')) {
    return {
      name: 'Leather Chelsea Boot',
      brand: 'Nordstrom',
      category: 'shoes',
      description: 'Sleek and versatile, this refined Chelsea boot is crafted from smooth leather and features elastic side goring for a comfortable fit.',
      color: 'brown',
      price: '$149.95',
      image_url: 'https://via.placeholder.com/400x500?text=Nordstrom+Boots',
      material: 'leather',
      url: url.toString()
    };
  } else if (hostname.includes('amazon.com')) {
    return {
      name: 'Classic Denim Jacket',
      brand: 'Amazon Essentials',
      category: 'outerwear',
      description: 'This classic denim jacket features a button-front, chest pockets with button-flap closures, side pockets, and adjustable button tabs at the back hem.',
      color: 'blue',
      price: '$39.99',
      image_url: 'https://via.placeholder.com/400x500?text=Amazon+Denim+Jacket',
      material: 'cotton, polyester',
      url: url.toString()
    };
  } else {
    // Default fallback
    return {
      name: 'Clothing Item',
      description: 'No detailed information available',
      url: url.toString()
    };
  }
} 