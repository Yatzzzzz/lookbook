'use client'

import React, { useState, useEffect } from 'react';

// ... other imports and component code ...

const FashionAssistant = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [question, setQuestion] = useState('');
  const [liveResponse, setLiveResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    // ... your existing handleAnalyze logic to fetch the response ...
    try {
      setIsLoading(true);
      const response = await fetch('/api/fashion-assistance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: uploadedImage, question }),
      });

      if (response.ok) {
        const data = await response.json();
        setLiveResponse(data.result);
        // --- New code for voice ---
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(data.result);
          window.speechSynthesis.speak(utterance);
        } else {
          console.log("Speech synthesis not supported in this browser.");
        }
        // --- End of new code ---
      } else {
        const errorData = await response.json();
        console.error('Backend error:', errorData);
        setLiveResponse('An error occurred while processing the request');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setLiveResponse('An error occurred while sending the request');
    } finally {
      setIsLoading(false);
    }
  };

  // ... rest of your component code ...

  return (
    <div>
      {/* ... your UI elements ... */}
      <div className="mt-4">
        <strong>Live Response:</strong>
        <p>{liveResponse}</p>
      </div>
      {/* ... rest of your UI elements ... */}
    </div>
  );
};

export default FashionAssistant;