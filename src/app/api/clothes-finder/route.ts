import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { cookies } from 'next/headers';

// Use the same API key as other Gemini endpoints
const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyC6JxeeL_pWFjZ4EAXEq6XXtFpSOi2vqr4';

export async function POST(req: Request) {
  try {
    const { imageBase64, mode = 'tag', referenceItemId } = await req.json();
    
    if (!imageBase64) {
      return NextResponse.json({ 
        error: 'No image data received',
        userFriendlyError: true 
      }, { status: 400 });
    }

    // Process the image with the appropriate prompt based on mode
    const result = await analyzeImageWithGemini(imageBase64, mode, referenceItemId);
    
    // Store the analysis for improving AI over time
    try {
      const cookieStore = cookies();
      const supabase = getSupabaseClient(cookieStore);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        await supabase
          .from('ai_analysis_logs')
          .insert({
            user_id: session.user.id,
            mode,
            analysis_result: JSON.stringify(result),
            has_reference_item: !!referenceItemId,
            created_at: new Date().toISOString()
          });
      }
    } catch (error) {
      // Don't fail if logging fails
      console.error('Error logging AI analysis:', error);
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error processing the request:', error);
    
    // Return user-friendly error message
    return NextResponse.json({
      error: error.message || 'An error occurred while processing the request',
      userFriendlyError: true
    }, { status: 500 });
  }
}

async function analyzeImageWithGemini(imageBase64: string, mode: string, referenceItemId?: string) {
  // Extract the base64 part without the data:image prefix if present
  const base64Data = imageBase64.includes(',') 
    ? imageBase64.split(',')[1] 
    : imageBase64;
  
  // Get MIME type from data URL or default to jpeg
  const mimeType = imageBase64.includes(',')
    ? imageBase64.substring(imageBase64.indexOf(":") + 1, imageBase64.indexOf(";"))
    : 'image/jpeg';

  // Select prompt based on mode
  const prompt = getPromptForMode(mode, referenceItemId);
  
  const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2, // Lower temperature for more consistent results
      maxOutputTokens: 800, // Increased for more detailed analysis
    },
  };

  // If we have a reference item, add it to the prompt for similarity comparison
  if (referenceItemId && mode === 'similarity') {
    try {
      const referenceItem = await getReferenceItem(referenceItemId);
      if (referenceItem && referenceItem.image_path) {
        // Add the reference image to the payload
        const referenceImageResponse = await fetch(referenceItem.image_path);
        if (referenceImageResponse.ok) {
          const referenceImageBlob = await referenceImageResponse.blob();
          const referenceImageBase64 = await blobToBase64(referenceImageBlob);
          
          // Update the payload with both images
          payload.contents[0].parts = [
            {
              text: "Reference image (first) and target image (second) for similarity comparison:"
            },
            {
              inline_data: {
                mime_type: referenceImageBlob.type,
                data: referenceImageBase64.split(',')[1],
              },
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data,
              },
            },
            {
              text: prompt,
            },
          ];
        }
      }
    } catch (error) {
      console.error('Error fetching reference item:', error);
      // Continue with just the target image if reference fetch fails
    }
  }

  try {
    const response = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error from Gemini API:', errorData);
      
      // Check for specific error types
      if (errorData.error?.message?.includes('quota')) {
        throw new Error('Azure OpenAI quota exceeded. Please try again later.');
      } else if (errorData.error?.message?.includes('model')) {
        throw new Error('AI model configuration issue. Please try again later.');
      }
      
      throw new Error(`Error analyzing image: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResult) {
      throw new Error('No analysis results received from the AI model.');
    }
    
    // Process the text result based on mode
    return processResults(textResult, mode, referenceItemId);
  } catch (error: any) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

// Helper to convert Blob to base64
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Fetch a reference wardrobe item for similarity comparison
async function getReferenceItem(itemId: string) {
  try {
    const cookieStore = cookies();
    const supabase = getSupabaseClient(cookieStore);
    
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select('*')
      .eq('item_id', itemId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting reference item:', error);
    return null;
  }
}

function getPromptForMode(mode: string, referenceItemId?: string): string {
  switch (mode) {
    case 'tag':
      return `Analyze this fashion image and identify all clothing items and accessories.
              List each item on a new line.
              Be specific about colors, patterns, and styles.
              Include only what you can clearly see in the image.
              Format as a simple list without numbering.`;
    
    case 'detail':
      return `Analyze this fashion outfit in detail.
              Provide your response in JSON format with the following structure:
              {
                "tags": ["tag1", "tag2", "tag3"], // List of key clothing items and descriptors
                "category": "most_appropriate_category", // One of: top, bottom, dress, outerwear, shoes, accessories, bags, other
                "brand": "detected_brand_if_visible", // Leave empty if not visible
                "brand_confidence": 0.0, // Confidence score from 0.0 to 1.0
                "color": "primary_color",
                "pattern": "pattern_if_any", // e.g., solid, striped, floral, etc.
                "material": "material_if_detectable", // e.g., cotton, denim, leather, etc.
                "style": "style_classification", // e.g., casual, formal, sporty, etc.
                "season": ["spring", "summer", "fall", "winter"], // All applicable seasons
                "occasion": ["casual", "work", "formal", "sport", "party"], // All applicable occasions
                "confidence_score": 0.0 // Overall confidence from 0.0 to 1.0
              }
              Only include fields where you have reasonable confidence. For any field you're unsure about, use null or empty array.`;
    
    case 'style':
      return `Analyze this fashion image and provide:
              1. Overall style category (e.g., casual, formal, bohemian)
              2. Season appropriateness
              3. Occasion suitability
              4. Key fashion elements that define the look
              5. Style tips or improvements
              Format as a list of key points.`;
              
    case 'brand':
      return `Analyze this fashion image and identify any visible brand logos, labels, or distinctive brand styles.
              If you detect a brand, provide:
              1. Brand name
              2. Confidence level (0-10 scale)
              3. Where in the image the brand identifier is located
              4. Any distinctive brand features you recognize
              If no brand is detectable, respond with "No brand detected."
              Format your response as a JSON object.`;
              
    case 'similarity':
      if (referenceItemId) {
        return `Compare these two fashion items carefully.
                The first image is the reference item, the second is the target item being compared.
                Evaluate how similar they are in terms of:
                1. Category (e.g., both are t-shirts, dresses, etc.)
                2. Color and pattern
                3. Style and design
                4. Material (if discernible)
                5. Fit and silhouette
                
                Provide a similarity score from 0 to 100, where:
                - 0-20: Completely different items
                - 21-40: Same category but very different style
                - 41-60: Similar category and some style similarities
                - 61-80: Very similar in most aspects
                - 81-100: Nearly identical items
                
                Format your response as a JSON object with:
                {
                  "similarity_score": 0-100,
                  "category_match": true/false,
                  "color_match": true/false,
                  "style_match": true/false,
                  "key_differences": ["difference1", "difference2"],
                  "key_similarities": ["similarity1", "similarity2"]
                }`;
      } else {
        return `Analyze this fashion item in detail.
                Describe its most distinctive visual features that would be useful for similarity matching:
                1. Precise category
                2. Exact color(s) and pattern
                3. Distinctive design elements
                4. Material appearance
                5. Shape and silhouette
                
                Format your response as a JSON object with:
                {
                  "distinctive_features": ["feature1", "feature2", "feature3"],
                  "category": "precise_category",
                  "color": "precise_color",
                  "pattern": "pattern_description",
                  "material": "material_appearance",
                  "design_elements": ["element1", "element2"]
                }`;
      }
    
    default:
      return `Analyze this fashion image and identify all clothing items and accessories.
              List each item on a new line.
              Be specific about colors, patterns, and styles.`;
  }
}

function processResults(text: string, mode: string, referenceItemId?: string): any {
  // For JSON responses, try to parse
  if (mode === 'detail' || mode === 'brand' || mode === 'similarity') {
    try {
      // Find JSON content in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonContent = jsonMatch[0];
        const parsedResult = JSON.parse(jsonContent);
        
        // Add source text for debugging/transparency
        parsedResult._source_text = JSON.stringify(text);
        
        return parsedResult;
      }
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      console.log('Raw text:', text);
    }
  }
  
  // Fall back to simpler processing for other modes or if JSON parsing fails
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // For tag mode, try to extract clean tags
  if (mode === 'tag') {
    // Remove any numbering, bullets or dashes at the beginning of lines
    return { tags: lines.map(line => line.replace(/^[\d\.\-\*]+\s*/, '').trim()) };
  }
  
  // For style mode, return formatted text
  if (mode === 'style') {
    return { 
      style_analysis: lines,
      _source_text: text
    };
  }
  
  // Default fallback
  return { 
    tags: lines,
    _source_text: text
  };
} 