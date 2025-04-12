import React from 'react';
import ChatInterface from '@/components/ChatInterface';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gemini Chat | Fashion Social Network',
  description: 'Multimodal chat with Google Gemini AI for fashion advice and recommendations',
};

export default function GeminiChatPage() {
  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow py-4 px-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Gemini Fashion Assistant</h1>
      </header>
      <ChatInterface />
    </main>
  );
} 