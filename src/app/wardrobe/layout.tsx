'use client';

import WardrobeTabNav from '@/components/WardrobeTabNav';

export default function WardrobeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <WardrobeTabNav />
      <div className="flex-1 w-full max-w-screen-lg mx-auto p-4">
        {children}
      </div>
    </div>
  );
} 