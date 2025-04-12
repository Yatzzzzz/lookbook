'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function TryOnPage() {
  const params = useParams();
  const lookId = params?.lookId;
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading 
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Virtual Try-On</h1>
      <p className="mb-4">Look ID: {lookId}</p>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-100 p-4 rounded-md">
              <h2 className="text-xl font-semibold mb-3">Original Look</h2>
              <div className="aspect-square bg-gray-200 flex items-center justify-center">
                <p className="text-gray-500">Original image would appear here</p>
              </div>
            </div>
            
            <div className="bg-gray-100 p-4 rounded-md">
              <h2 className="text-xl font-semibold mb-3">Try-On Result</h2>
              <div className="aspect-square bg-gray-200 flex items-center justify-center">
                <p className="text-gray-500">Virtual try-on result would appear here</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-center">
            <a 
              href="/feed" 
              className="px-6 py-3 bg-blue-600 text-white rounded-md mr-4"
            >
              Back to Feed
            </a>
            <a 
              href="/look" 
              className="px-6 py-3 bg-gray-600 text-white rounded-md"
            >
              Try Another Look
            </a>
          </div>
        </>
      )}
    </div>
  );
} 