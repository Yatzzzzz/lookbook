import React from 'react';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Redirecting to Gemini Chat | Fashion Social Network',
  description: 'Redirecting to Gemini AI assistant interface',
};

export default function GeminiRedirectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This is a server-side redirect for users with JavaScript disabled
  // The client-side redirect will take precedence if JavaScript is enabled
  redirect('/gemini');
  
  // This will never be rendered due to the redirect
  return <>{children}</>;
} 