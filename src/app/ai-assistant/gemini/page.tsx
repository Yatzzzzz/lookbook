'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GeminiRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the main Gemini page with a short delay to ensure all resources are loaded
    const redirectTimeout = setTimeout(() => {
      router.replace('/gemini');
    }, 100);
    
    return () => clearTimeout(redirectTimeout);
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg text-gray-700">Redirecting to Gemini chat...</p>
    </div>
  );
} 