// app/api/vision/analyze/route.ts
import { NextResponse } from 'next/server';
import { ImageAnnotatorClient } from '@google-cloud/vision';

// Initialize the client (uses GOOGLE_APPLICATION_CREDENTIALS environment variable)
let visionClient: ImageAnnotatorClient | null = null;
try {
    // Ensure credentials path is correctly set in .env.local
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
         console.error("FATAL ERROR: GOOGLE_APPLICATION_CREDENTIALS environment variable not set!");
         // Optionally throw an error to prevent startup if needed
    }
    visionClient = new ImageAnnotatorClient();
    console.log("Google Vision Client Initialized Successfully.");
} catch (error) {
     console.error("Error initializing Google Vision Client:", error);
     // Handle initialization error appropriately
}


interface AnalyzeRequestBody {
    imageBase64: string;
}

// Define a simplified structure for clothing items
interface DetectedClothingItem {
    name: string | null | undefined;
    confidence: number | null | undefined;
    boundingBox: Array<{ x: number | null | undefined; y: number | null | undefined }> | null | undefined;
}

// Define types for the Vision API responses
interface ObjectDetection {
    name?: string | null;
    score?: number | null;
    boundingPoly?: {
        normalizedVertices?: Array<{
            x?: number | null;
            y?: number | null;
        }>;
    };
}

interface ColorInfo {
    color?: {
        red?: number | null;
        green?: number | null;
        blue?: number | null;
    };
    score?: number | null;
    pixelFraction?: number | null;
}

// Define basic response interfaces for Vision API
interface ObjectLocalizationResponse {
    localizedObjectAnnotations?: ObjectDetection[];
}

interface ImagePropertiesResponse {
    imagePropertiesAnnotation?: {
        dominantColors?: {
            colors?: ColorInfo[];
        };
    };
}

interface SafeSearchResponse {
    safeSearchAnnotation?: {
        adult?: string;
        violence?: string;
        racy?: string;
    };
}

export async function POST(request: Request) {
    if (!visionClient) {
         return NextResponse.json({ error: 'Vision client not initialized.' }, { status: 500 });
    }


    if (request.method !== 'POST') {
        return NextResponse.json({ error: `Method ${request.method} Not Allowed` }, { status: 405, headers: { Allow: 'POST' } });
    }

    let requestBody: AnalyzeRequestBody;
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

        // Since we've already checked visionClient is not null above
        const client = visionClient as ImageAnnotatorClient;

        // --- Call Google Cloud Vision API ---
        console.log("Sending image to Google Vision API for analysis...");

        // Perform multiple detections (add more as needed: labels, safeSearch, etc.)
        const [objectLocalizationResult, propertiesResult, safeSearchResult] = await Promise.all([
            client.objectLocalization ? client.objectLocalization({ image: { content: imageBuffer } }) : Promise.resolve([{} as ObjectLocalizationResponse]),
            client.imageProperties ? client.imageProperties({ image: { content: imageBuffer } }) : Promise.resolve([{} as ImagePropertiesResponse]),
            client.safeSearchDetection ? client.safeSearchDetection({ image: { content: imageBuffer } }) : Promise.resolve([{} as SafeSearchResponse])
        ]);

        console.log("Received response from Google Vision API.");

        // --- Process Results ---
        const objects = (objectLocalizationResult[0]?.localizedObjectAnnotations || []) as ObjectDetection[];
        const dominantColors = (propertiesResult[0]?.imagePropertiesAnnotation?.dominantColors?.colors || []) as ColorInfo[];
        const safeSearch = safeSearchResult[0]?.safeSearchAnnotation || null;

        // Ensure type safety and handle potential undefined cases
        console.log('Vision API Analysis:', {
            objectCount: objects.length,
            colorCount: dominantColors.length,
            safeSearchStatus: safeSearch ? 'Available' : 'Not Available'
        });

        // Filter for clothing-related objects (example keywords)
        const clothingKeywords = [
            'clothing', 'footwear', 'shoe', 'dress', 'shirt', 'pants', 'jeans', 'jacket', 'coat',
            'hat', 'glasses', 'sunglasses', 'bag', 'handbag', 'backpack', 'suit', 'tie',
            'skirt', 'shorts', 't-shirt', 'top', 'sweater', 'hoodie', 'sneakers', 'boots',
            'sandal', 'watch', 'belt', 'scarf'
        ];

        const detectedClothing: DetectedClothingItem[] = objects
            .filter((obj: ObjectDetection) =>
                obj.name && clothingKeywords.some((keyword: string) =>
                    obj.name!.toLowerCase().includes(keyword)
                )
            )
            .map((obj: ObjectDetection) => ({
                name: obj.name,
                confidence: obj.score,
                // Extract normalized vertices if available
                boundingBox: obj.boundingPoly?.normalizedVertices?.map((v) => ({ x: v.x, y: v.y }))
            }));

        // Format dominant colors
        const colors = dominantColors.map((c: ColorInfo) => ({
            hex: '#' + [c.color?.red, c.color?.green, c.color?.blue].map(x => {
                const hex = Math.round(x ?? 0).toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            }).join(''),
            score: c.score,
            pixelFraction: c.pixelFraction
        }));

        // Simple check for unsafe content
        const isSafe = !(
            safeSearch?.adult === 'LIKELY' || safeSearch?.adult === 'VERY_LIKELY' ||
            safeSearch?.violence === 'LIKELY' || safeSearch?.violence === 'VERY_LIKELY' ||
            safeSearch?.racy === 'LIKELY' || safeSearch?.racy === 'VERY_LIKELY'
        );

        // Return combined results
        return NextResponse.json({
            isSafe: isSafe,
            detectedClothing: detectedClothing,
            dominantColors: colors.slice(0, 5), // Return top 5 colors
            // Add other analysis results here if needed
        });

    } catch (error: unknown) {
        console.error("Error calling Google Vision API:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during image analysis.';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}