import React from 'react';

export const metadata = {
  title: 'Gemini Chat | Fashion Social Network',
  description: 'Multimodal chat with Google Gemini AI for fashion advice and recommendations',
};

export default function GeminiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 