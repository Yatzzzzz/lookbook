'use client';

import React, { useEffect } from 'react';

export default function GemeniTestPage() {
  useEffect(() => {
    // This effect will run after the component mounts
    // It ensures the script is only loaded in client-side environment
    const script = document.createElement('script');
    script.src = 'https://elevenlabs.io/convai-widget/index.js';
    script.async = true;
    script.type = 'text/javascript';
    document.body.appendChild(script);

    return () => {
      // Cleanup function to remove the script when component unmounts
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">ElevenLabs Convai Widget Test</h1>
      
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Widget Demo</h2>
        <p className="mb-4">The ElevenLabs Convai widget should appear below:</p>
        
        <div className="my-8">
          {/* ElevenLabs Convai Widget */}
          <elevenlabs-convai agent-id="W3cWPCyorozoR7kmuqE8"></elevenlabs-convai>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800">
          <h3 className="font-medium mb-2">Notes:</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>This widget is loaded dynamically using a script injected via useEffect</li>
            <li>Agent ID: <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">W3cWPCyorozoR7kmuqE8</code></li>
            <li>If the widget doesn't appear, check browser console for errors</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 