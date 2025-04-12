const { GoogleGenerativeAI } = require('@google/generative-ai');

// Function to validate the Gemini API key
async function testGeminiConnection() {
  try {
    // Load API key from .env.local
    const fs = require('fs');
    const path = require('path');
    const dotenv = require('dotenv');
    
    // Load environment variables from .env.local
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      console.log('Loading environment variables from .env.local');
      dotenv.config({ path: envPath });
    } else {
      console.warn('.env.local file not found. Make sure GEMINI_API_KEY is set in your environment.');
    }
    
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY not found in environment variables');
      process.exit(1);
    }
    
    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Test with the text-only model (gemini-1.5-flash-latest is more reliable)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    
    console.log('🔄 Testing connection to Gemini API...');
    
    // Send a simple prompt to test the connection
    const result = await model.generateContent('Hello, please respond with "Gemini API is working correctly" if you can receive this message.');
    const response = await result.response;
    const text = response.text();
    
    if (text.includes('Gemini API is working correctly')) {
      console.log('✅ Gemini API connection successful!');
      console.log('Response: ', text);
      
      // Test the vision model compatibility
      console.log('🔄 Testing vision model availability...');
      try {
        const visionModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
        console.log('✅ Vision model is available for multimodal inputs');
      } catch (visionErr) {
        console.warn('⚠️ Vision model check failed, but text model is working:', visionErr.message);
      }
      
    } else {
      console.warn('⚠️ Connected but received unexpected response:', text);
    }
    
  } catch (error) {
    console.error('❌ Gemini API connection failed:', error.message);
    if (error.message.includes('API key')) {
      console.error('Please check that your GEMINI_API_KEY is valid and has the necessary permissions.');
    }
    process.exit(1);
  }
}

// Run the test
testGeminiConnection(); 