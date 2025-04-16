'use client';

import React, { useEffect, useRef } from 'react';
import { Loader2, Volume2, VolumeX } from 'lucide-react';

interface ResponseDisplayProps {
  isLoading: boolean;
  response: string;
  error: string | null;
  isSpeaking: boolean;
  onSpeak: (text: string) => void;
  onStopSpeaking: () => void;
}

export default function ResponseDisplay({
  isLoading,
  response,
  error,
  isSpeaking,
  onSpeak,
  onStopSpeaking,
}: ResponseDisplayProps) {
  const responseRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to see new content
  useEffect(() => {
    if (responseRef.current && response) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [response]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Consulting the AI fashion assistant...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg shadow-md p-6 border border-red-200 dark:border-red-900/30">
        <h3 className="font-bold text-red-600 dark:text-red-400 mb-2">Error</h3>
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-400 text-center italic">
          Your AI fashion assistant response will appear here.
        </p>
        <p className="text-gray-500 dark:text-gray-500 text-center text-sm mt-2">
          Select one of the query cards above to get started.
        </p>
      </div>
    );
  }

  const paragraphs = response.split('\n').filter(p => p.trim() !== '');

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-xl">AI Fashion Assistant Response</h3>
        <div className="flex space-x-2">
          {isSpeaking ? (
            <button
              onClick={onStopSpeaking}
              className="flex items-center justify-center p-2 bg-orange-100 text-orange-600 rounded-full hover:bg-orange-200"
              title="Stop speaking"
            >
              <VolumeX size={16} />
            </button>
          ) : (
            <button
              onClick={() => onSpeak(response)}
              className="flex items-center justify-center p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200"
              title="Listen to response"
            >
              <Volume2 size={16} />
            </button>
          )}
        </div>
      </div>
      
      <div 
        ref={responseRef}
        className="prose dark:prose-invert prose-sm max-w-none overflow-y-auto max-h-96"
      >
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
} 