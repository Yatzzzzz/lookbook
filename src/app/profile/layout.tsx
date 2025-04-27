'use client';

import AuthCheck from '@/components/AuthCheck';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthCheck>{children}</AuthCheck>;
} 