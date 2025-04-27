import { NextResponse } from 'next/server';

// Import the Google Cloud Vision API client
import { ImageAnnotatorClient } from '@google-cloud/vision';

let visionClient: ImageAnnotatorClient | null = null;
try {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error("FATAL ERROR: GOOGLE_APPLICATION_CREDENTIALS environment variable not set!");
  }
  visionClient = new ImageAnnotatorClient();
  console.log("Google Vision Client Initialized Successfully for background removal.");
} catch (error) {
  console.error("Error initializing Google Vision Client:", error);
}

interface RemoveBackgroundRequestBody {
  imageBase64: string;
}

export async function POST(request: Request) {
  if (!visionClient) {
    return NextResponse.json({ error: 'Vision client not initialized.' }, { status: 500 });
  }

  if (request.method !== 'POST') {
    return NextResponse.json({ error: `Method ${request.method} Not Allowed` }, { status: 405, headers: { Allow: 'POST' } });
  }

  let requestBody: RemoveBackgroundRequestBody;
  try {
    requestBody = await request.json();
  } catch (error) {
    console.error('JSON parsing error:', error);
    return NextResponse.json({ error: 'Invalid request body. Expected JSON.' }, { status: 400 });
  }

  const { imageBase64 } = requestBody;

  if (!imageBase64) {
    return NextResponse.json({ error: 'imageBase64 data is required.' }, { status: 400 });
  }

  try {
    // Prepare image data from base64
    const matches = imageBase64.match(/^data:image\/[a-zA-Z+]+;base64,(.*)$/);
    if (!matches || matches.length !== 2) {
      return NextResponse.json({ error: 'Invalid imageBase64 format.' }, { status: 400 });
    }
    const imageBuffer = Buffer.from(matches[1], 'base64');

    // Use object detection to segment the clothing item
    console.log("Sending image to Google Vision API for object detection and segmentation...");
    
    const client = visionClient as ImageAnnotatorClient;
    const [objectLocalizationResult] = await client.objectLocalization({ image: { content: imageBuffer } });
    
    const objects = objectLocalizationResult.localizedObjectAnnotations || [];
    
    // Filter for clothing-related objects
    const clothingKeywords = [
      'clothing', 'footwear', 'shoe', 'dress', 'shirt', 'pants', 'jeans', 'jacket', 'coat',
      'hat', 'glasses', 'sunglasses', 'bag', 'handbag', 'backpack', 'suit', 'tie',
      'skirt', 'shorts', 't-shirt', 'top', 'sweater', 'hoodie', 'sneakers', 'boots',
      'sandal', 'watch', 'belt', 'scarf', 'person'
    ];

    const clothingItems = objects.filter((obj: any) =>
      obj.name && clothingKeywords.some(keyword =>
        obj.name.toLowerCase().includes(keyword)
      )
    );

    if (clothingItems.length === 0) {
      return NextResponse.json({ 
        error: 'No clothing items detected in the image.',
        objectsDetected: objects.map((obj: any) => obj.name)
      }, { status: 400 });
    }

    // For simplicity, we'll use the first detected clothing item with the highest confidence
    const mainItem = clothingItems.reduce((prev: any, current: any) => 
      (prev.score > current.score) ? prev : current
    );

    // For real background removal, we would use a more sophisticated segmentation technique
    // or a specialized API. Here we're simply demonstrating the concept.
    
    // Since we can't do actual background removal without a specialized service,
    // we'll return the bounding box information for the client to use
    const boundingPoly = mainItem.boundingPoly?.normalizedVertices || [];
    
    return NextResponse.json({
      success: true,
      detectedObject: mainItem.name,
      confidence: mainItem.score,
      boundingBox: boundingPoly.map((v: any) => ({ x: v.x, y: v.y })),
      message: "In a production environment, this endpoint would return the image with background removed."
    });

  } catch (error: any) {
    console.error("Error processing background removal:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during background removal.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 