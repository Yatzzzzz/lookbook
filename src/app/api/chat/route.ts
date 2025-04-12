import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerateContentRequest,
  Part,
} from '@google/generative-ai';
import { NextRequest } from 'next/server';

// Update to use Gemini 2.0 models
const MODEL_NAME = 'gemini-2.0-flash-exp'; // Using the correct Gemini 2.0 model for multimodal
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error('Missing GEMINI_API_KEY environment variable.');
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

// Safety Settings
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// Generation Configuration
const generationConfig = {
  temperature: 0.4,
  topK: 32,
  topP: 1,
  maxOutputTokens: 4096,
};

// Fashion-specific system prompt to guide the AI's responses
const FASHION_SYSTEM_PROMPT = `
You are a fashion expert assistant helping users with style advice, outfit recommendations, and fashion trends.
Focus on providing detailed fashion-related insights when analyzing images or responding to text queries.
When identifying clothing in images, note details like:
- Garment types and styles
- Colors, patterns, and textures
- Fabric types if apparent
- Potential outfit combinations
- Styling suggestions
- Current fashion context and trends

When processing audio input, listen carefully for fashion terms and preferences mentioned.
If you receive an audio input, respond as if the person is speaking directly to you.

Keep responses helpful, positive, and encouraging, while being specific about fashion details.
For image analysis, start by describing what you see, then provide fashion context and recommendations.
`;

export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return new Response(
      JSON.stringify({ error: 'API key not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { prompt, imageParts, audioPart } = await req.json();

    if (!prompt && (!imageParts || imageParts.length === 0) && !audioPart) {
      return new Response(
        JSON.stringify({ error: 'Request body must contain a prompt, imageParts, or audioPart.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prepare Input for Gemini
    const requestParts: Part[] = [];

    // Add system prompt first to guide the conversation context
    requestParts.push({ text: FASHION_SYSTEM_PROMPT });

    if (prompt) {
      requestParts.push({ text: prompt });
    }

    if (imageParts && Array.isArray(imageParts)) {
      imageParts.forEach((imgBase64: string, index: number) => {
        // Validate base64 format
        if (!imgBase64.startsWith('data:image/')) {
          console.warn(`Invalid image format for part ${index}. Skipping.`);
          return; // Skip this part
        }
        const mimeType = imgBase64.substring(imgBase64.indexOf(':') + 1, imgBase64.indexOf(';'));
        const base64Data = imgBase64.substring(imgBase64.indexOf(',') + 1);

        requestParts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        });
      });
    }

    // Handle audio input if present
    if (audioPart) {
      if (!audioPart.startsWith('data:audio/')) {
        console.warn('Invalid audio format. Skipping.');
      } else {
        const mimeType = audioPart.substring(audioPart.indexOf(':') + 1, audioPart.indexOf(';'));
        const base64Data = audioPart.substring(audioPart.indexOf(',') + 1);

        console.log(`Processing audio input with mimeType: ${mimeType}`);
        
        requestParts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        });
      }
    }

    if (requestParts.length <= 1) { // Only system prompt is present
      return new Response(
        JSON.stringify({ error: 'No valid content (prompt, image, or audio) provided.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const requestPayload: GenerateContentRequest = {
      contents: [{ role: 'user', parts: requestParts }],
      generationConfig,
      safetySettings,
    };

    // Setup streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const genStream = await model.generateContentStream(requestPayload);

          // Iterate over the stream and send chunks to the client
          for await (const chunk of genStream.stream) {
            if (chunk.candidates && chunk.candidates.length > 0) {
              const text = chunk.text();
              // Format as SSE message: data: {...}\n\n
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            } else if (chunk.promptFeedback) {
              // Handle potential content filtering or other feedback
              console.warn('Prompt Feedback:', chunk.promptFeedback);
              // Optionally send feedback info to the client
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ feedback: chunk.promptFeedback })}\n\n`));
              // Decide if you want to stop streaming based on feedback
              if (chunk.promptFeedback.blockReason) {
                console.error(`Streaming blocked due to: ${chunk.promptFeedback.blockReason}`);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: `Content blocked: ${chunk.promptFeedback.blockReason}` })}\n\n`));
                break; // Stop streaming if blocked
              }
            }
          }

          // Signal end of stream
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event: 'end' })}\n\n`));
          controller.close();
        } catch (error: any) {
          console.error('Streaming error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error.message || 'An error occurred during streaming.' })}\n\n`));
          controller.close();
        }
      }
    });

    // Return the stream response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('API Route Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 