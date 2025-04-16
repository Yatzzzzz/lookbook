'use client';

import React, { useState, useCallback } from 'react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import QueryCard from './QueryCard';
import ResponseDisplay from './ResponseDisplay';
import { useRouter } from 'next/navigation';

const queryClient = new QueryClient();

export default function AIAssistantPage() {
  const router = useRouter();
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSubmit = async (formData: Record<string, string>, basePrompt: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Build the prompt by filling in the variables from the form data
      let prompt = basePrompt;
      for (const [key, value] of Object.entries(formData)) {
        prompt = prompt.replace(`{${key}}`, value);
      }

      // Try to use our dedicated test endpoint first
      const apiEndpoint = '/api/testpages/ai-assistant';
      // Fall back to the main fashion assistance endpoint if needed
      const fallbackEndpoint = '/api/fashion-assistance';
      
      let response;
      try {
        response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ question: prompt }),
        });
        
        // If the endpoint doesn't exist, try the fallback
        if (response.status === 404) {
          console.log('Test endpoint not found, using fallback endpoint');
          throw new Error('Endpoint not found');
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_) {
        // Use the fallback endpoint
        response = await fetch(fallbackEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ question: prompt }),
        });
      }

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setResponse(data.result || 'No response from the fashion AI');
    } catch (err) {
      console.error('Error submitting query:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Navigate to the Gemini chat page
  const navigateToGeminiChat = () => {
    router.push('/gemini');
  };

  const speakText = useCallback((text: string) => {
    if (!window.speechSynthesis) {
      console.error("Speech synthesis not supported");
      return;
    }

    // Cancel any ongoing speech
    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Use a female voice if available
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => 
      voice.name.includes('female') || voice.name.includes('Female')
    );
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const queryCards = [
    {
      title: 'Fashion Advice',
      description: 'Get personalized fashion advice for any situation',
      icon: '👗',
      initialPrompt: 'I need fashion advice for {occasion}. I am {age} years old and my style is {style}. What should I wear?',
      fields: [
        {
          name: 'occasion',
          label: 'Occasion',
          placeholder: 'e.g., wedding, job interview, casual day out',
        },
        {
          name: 'age',
          label: 'Age',
          placeholder: 'e.g., 25, 35, 50',
        },
        {
          name: 'style',
          label: 'Your Style Preference',
          placeholder: 'e.g., casual, formal, bohemian, minimalist',
        },
      ],
    },
    {
      title: 'Outfit Recommendations',
      description: 'Get outfit ideas based on your wardrobe items',
      icon: '👔',
      initialPrompt: 'I have {items} in my wardrobe. Help me create {count} outfits for {season} season.',
      fields: [
        {
          name: 'items',
          label: 'Wardrobe Items',
          placeholder: 'e.g., blue jeans, white t-shirt, black blazer, sneakers',
          type: 'textarea',
        },
        {
          name: 'count',
          label: 'Number of Outfits',
          placeholder: 'e.g., 3, 5, 10',
        },
        {
          name: 'season',
          label: 'Season',
          placeholder: 'e.g., summer, winter, fall, spring',
        },
      ],
    },
    {
      title: 'Trending Styles',
      description: 'Discover the latest fashion trends',
      icon: '🔥',
      initialPrompt: 'What are the current fashion trends for {gender} in {category}? I prefer {style} style.',
      fields: [
        {
          name: 'gender',
          label: 'Gender',
          placeholder: 'e.g., men, women, unisex',
        },
        {
          name: 'category',
          label: 'Category',
          placeholder: 'e.g., casual wear, formal attire, accessories',
        },
        {
          name: 'style',
          label: 'Style Preference',
          placeholder: 'e.g., streetwear, business casual, vintage',
        },
      ],
    },
    {
      title: 'Weekly Outfit Planner',
      description: 'Plan your outfits for the entire week',
      icon: '📅',
      initialPrompt: 'I need a weekly outfit plan for {workplace}. My wardrobe includes {items}. The weather forecast is {weather}.',
      fields: [
        {
          name: 'workplace',
          label: 'Workplace/Environment',
          placeholder: 'e.g., corporate office, creative agency, remote work',
        },
        {
          name: 'items',
          label: 'Key Wardrobe Items',
          placeholder: 'e.g., navy suit, white shirts, black dress, casual jeans',
          type: 'textarea',
        },
        {
          name: 'weather',
          label: 'Weather Forecast',
          placeholder: 'e.g., rainy all week, warm with chance of rain, cold mornings',
        },
      ],
    },
    {
      title: 'Chat with AI',
      description: 'Experience our full-featured Gemini AI chat with camera, voice input, and image analysis. Ideal for complex fashion questions and real-time advice.',
      icon: '🤖',
      customAction: navigateToGeminiChat,
      isCustomCard: true,
    },
  ];

  return (
    <QueryClientProvider client={queryClient}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Fashion Assistant</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Get personalized fashion advice, outfit recommendations, and style guidance from our AI assistant.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {queryCards.map((card) => (
            <QueryCard
              key={card.title}
              title={card.title}
              description={card.description}
              icon={card.icon}
              initialPrompt={card.initialPrompt || ''}
              fields={card.fields}
              onSubmit={card.isCustomCard ? undefined : (formData) => handleSubmit(formData, card.initialPrompt || '')}
              isLoading={isLoading}
              customAction={card.customAction}
              isCustomCard={card.isCustomCard}
            />
          ))}
        </div>

        <ResponseDisplay
          isLoading={isLoading}
          response={response}
          error={error}
          isSpeaking={isSpeaking}
          onSpeak={speakText}
          onStopSpeaking={stopSpeaking}
        />
      </div>
    </QueryClientProvider>
  );
} 