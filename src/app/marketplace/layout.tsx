'use client';

import AuthCheck from '@/components/AuthCheck';

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthCheck>{children}</AuthCheck>;
} 