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
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Consulting the AI fashion assistant...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg shadow-md p-6 border border-red-200">
        <h3 className="font-bold text-red-600 mb-2">Error</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <p className="text-gray-600 text-center italic">
          Your AI fashion assistant response will appear here.
        </p>
        <p className="text-gray-500 text-center text-sm mt-2">
          Select one of the query cards above to get started.
        </p>
      </div>
    );
  }

  // Format the response with enhanced styling
  const formatResponse = () => {
    // Split by newlines for processing
    const lines = response.split('\n');
    
    // Process each line to identify special formatting
    return lines.map((line, index) => {
      if (!line.trim()) return null;

      // Check for various heading and list formats
      if (line.match(/^\*\*.*\*\*$/)) {
        // Bold heading like **Key Trends**
        return (
          <h4 key={`line-${index}`} className="font-bold text-blue-800 mt-4 mb-2">
            {line.replace(/^\*\*|\*\*$/g, '')}
          </h4>
        );
      } else if (line.match(/^\*\*.*\*\*:/)) {
        // Bold heading with colon like **Key Trends:**
        return (
          <h4 key={`line-${index}`} className="font-bold text-blue-800 mt-4 mb-2">
            {line.replace(/^\*\*|\*\*:/g, '')}:
          </h4>
        );
      } else if (line.startsWith('* ')) {
        // Bullet point
        return (
          <div key={`line-${index}`} className="flex items-start my-1">
            <span className="text-blue-800 mr-2">•</span>
            <p className="text-blue-900 flex-1">{line.substring(2)}</p>
          </div>
        );
      } else if (line.match(/^-\s+/)) {
        // Dash bullet point
        return (
          <div key={`line-${index}`} className="flex items-start my-1">
            <span className="text-blue-800 mr-2">•</span>
            <p className="text-blue-900 flex-1">{line.substring(2)}</p>
          </div>
        );
      } else if (line.match(/^\d+\.\s+/)) {
        // Numbered list item
        const number = line.match(/^\d+/)?.[0];
        return (
          <div key={`line-${index}`} className="flex items-start my-1">
            <span className="text-blue-800 mr-2">{number}.</span>
            <p className="text-blue-900 flex-1">{line.replace(/^\d+\.\s+/, '')}</p>
          </div>
        );
      } else {
        // Regular paragraph
        return (
          <p key={`line-${index}`} className="my-2 text-blue-900">
            {line}
          </p>
        );
      }
    });
  };

  return (
    <div className="relative bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-xl bg-blue-100 px-3 py-1 rounded-lg text-blue-700">
          AI Fashion Assistant Response
        </h3>
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
        className="bg-blue-100 p-4 rounded-lg overflow-y-auto max-h-96"
      >
        {formatResponse()}
      </div>
    </div>
  );
} 