'use client';

import AuthCheck from '@/components/AuthCheck';

export default function LookbookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthCheck>{children}</AuthCheck>;
} 