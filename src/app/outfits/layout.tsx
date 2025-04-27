'use client';

import AuthCheck from '@/components/AuthCheck';

export default function OutfitsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthCheck>{children}</AuthCheck>;
} 