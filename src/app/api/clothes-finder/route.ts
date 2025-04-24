import { NextResponse } from 'next/server';

// Use the same API key as other Gemini endpoints
const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyC6JxeeL_pWFjZ4EAXEq6XXtFpSOi2vqr4';

export async function POST(req: Request) {
  try {
    const { imageBase64, mode = 'tag' } = await req.json();
    
    if (!imageBase64) {
      return NextResponse.json({ 
        error: 'No image data received',
        userFriendlyError: true 
      }, { status: 400 });
    }

    // Process the image with the appropriate prompt based on mode
    const tags = await analyzeImageWithGemini(imageBase64, mode);
    
    return NextResponse.json({ tags });
  } catch (error: any) {
    console.error('Error processing the request:', error);
    
    // Return user-friendly error message
    return NextResponse.json({
      error: error.message || 'An error occurred while processing the request',
      userFriendlyError: true
    }, { status: 500 });
  }
}

async function analyzeImageWithGemini(imageBase64: string, mode: string) {
  // Extract the base64 part without the data:image prefix if present
  const base64Data = imageBase64.includes(',') 
    ? imageBase64.split(',')[1] 
    : imageBase64;
  
  // Get MIME type from data URL or default to jpeg
  const mimeType = imageBase64.includes(',')
    ? imageBase64.substring(imageBase64.indexOf(":") + 1, imageBase64.indexOf(";"))
    : 'image/jpeg';

  // Select prompt based on mode
  const prompt = getPromptForMode(mode);
  
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
      maxOutputTokens: 500,
    },
  };

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
    return processTagResults(textResult, mode);
  } catch (error: any) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

function getPromptForMode(mode: string): string {
  switch (mode) {
    case 'tag':
      return `Analyze this fashion image and identify all clothing items and accessories.
              List each item on a new line.
              Be specific about colors, patterns, and styles.
              Include only what you can clearly see in the image.
              Format as a simple list without numbering.`;
    
    case 'detail':
      return `Analyze this fashion outfit in detail.
              Identify each clothing item and accessory.
              For each item, describe:
              - Exact color and pattern
              - Material (if obvious)
              - Style details (cut, fit, design elements)
              - Brand (if visible)
              Format as a detailed list with one item per line.`;
    
    case 'style':
      return `Analyze this fashion image and provide:
              1. Overall style category (e.g., casual, formal, bohemian)
              2. Season appropriateness
              3. Occasion suitability
              4. Key fashion elements that define the look
              5. Style tips or improvements
              Format as a list of key points.`;
    
    default:
      return `Analyze this fashion image and identify all clothing items and accessories.
              List each item on a new line.
              Be specific about colors, patterns, and styles.`;
  }
}

function processTagResults(text: string, mode: string): string[] {
  // Split by new lines and filter out empty lines
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // For tag mode, try to extract clean tags
  if (mode === 'tag') {
    // Remove any numbering, bullets or dashes at the beginning of lines
    return lines.map(line => line.replace(/^[\d\.\-\*]+\s*/, '').trim());
  }
  
  // For other modes, keep the formatted text
  return lines;
} 