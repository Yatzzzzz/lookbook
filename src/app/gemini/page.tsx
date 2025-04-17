'use client';

import React, { useCallback } from 'react';
import ChatInterface from '@/components/ChatInterface';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gemini Chat | Fashion Social Network',
  description: 'Multimodal chat with Google Gemini AI for fashion advice and recommendations',
};

export default function GeminiChatPage() {
  const router = useRouter();

  // Handle any necessary navigation from within the page
  const handleNavigation = useCallback((path: string) => {
    // Prevent default navigation behavior
    router.push(path, { scroll: false });
  }, [router]);

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <ChatInterface />
    </main>
  );
} 