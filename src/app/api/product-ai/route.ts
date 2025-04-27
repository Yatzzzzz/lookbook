import { NextResponse } from 'next/server';
import { AzureOpenAI } from "openai";
import type { ChatCompletionMessageParam } from "openai/resources";

// Azure OpenAI configuration from environment variables
const endpoint = process.env.AZURE_OPENAI_ENDPOINT || "https://ai-itzikzabarsky2812ai950890111340.openai.azure.com/";
const modelName = process.env.AZURE_OPENAI_MODEL || "gpt-4o";
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "lookbookAIGPT4o";
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-04-01-preview";

// Initialize the Azure OpenAI client with fallback handling
let client: AzureOpenAI | null = null;
try {
  if (apiKey) {
    const options = { endpoint, apiKey, deployment, apiVersion };
    client = new AzureOpenAI(options);
  }
} catch (error) {
  console.error("Failed to initialize Azure OpenAI client:", error);
}

export async function POST(req: Request) {
  try {
    // Check if client is initialized
    if (!client) {
      return NextResponse.json({
        error: 'Azure OpenAI client not initialized. Check API key configuration.',
        userFriendlyError: 'AI service is not available at the moment. Please try again later.'
      }, { status: 503 });
    }

    // Parse the request body
    const { query, product, userContext } = await req.json();
    
    if (!query) {
      return NextResponse.json({ 
        error: 'No query provided',
        userFriendlyError: true 
      }, { status: 400 });
    }

    // Create a system message that sets up the AI's role
    const systemMessage: ChatCompletionMessageParam = {
      role: "system", 
      content: `You are a fashion expert AI assistant specialized in matching products, providing alternatives, and giving fashion advice.
      - You should help users find similar products based on their description or preferences
      - You can suggest alternatives based on style, color, brand, material, and price range
      - Your responses should be concise, helpful, and relevant to fashion shopping
      - Focus on providing actionable product recommendations
      - When comparing products, highlight key differences in materials, sustainability, quality, and price
      - If you're asked about specific product details you don't know, be honest and don't make up information
      `
    };

    // Create user message with the provided query
    let userMessage: ChatCompletionMessageParam = {
      role: "user",
      content: query
    };

    // If product info is provided, include it in the user message for context
    if (product) {
      userMessage.content = `Regarding this product: ${JSON.stringify(product)}\n\n${query}`;
    }

    // If user context is provided, include it for better personalization
    const messages: ChatCompletionMessageParam[] = [systemMessage];
    if (userContext) {
      messages.push({
        role: "system",
        content: `User information: ${JSON.stringify(userContext)}`
      });
    }
    
    messages.push(userMessage);

    // Call the Azure OpenAI API
    const response = await client.chat.completions.create({
      messages,
      max_tokens: 1000,
      temperature: 0.7,
      top_p: 0.95,
      model: modelName
    });

    // Return the response
    if (response?.choices?.[0]?.message?.content) {
      return NextResponse.json({
        response: response.choices[0].message.content,
        usage: response.usage
      });
    } else {
      throw new Error('No response from Azure OpenAI');
    }
    
  } catch (error: any) {
    console.error('Error calling Azure OpenAI:', error);
    
    // Provide a user-friendly error message
    const errorMessage = error.message || 'An error occurred while processing your request';
    const userFriendlyError = errorMessage.includes('quota') 
      ? 'AI service quota exceeded. Please try again later.'
      : errorMessage.includes('authentication') || errorMessage.includes('access denied') || errorMessage.includes('Missing credentials')
        ? 'Authentication error with AI service. Please check configuration.'
        : 'Error processing your request. Please try again.';
    
    return NextResponse.json({
      error: errorMessage,
      userFriendlyError
    }, { status: 500 });
  }
} 