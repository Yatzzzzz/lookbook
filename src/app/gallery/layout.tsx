'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Create context for gallery filtering
interface GalleryContextType {
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
}

const GalleryContext = createContext<GalleryContextType>({
  activeSubTab: 'everyone',
  setActiveSubTab: () => {},
});

// Create a hook to use the gallery context
export const useGalleryContext = () => useContext(GalleryContext);

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const [activeMainTab, setActiveMainTab] = useState('gallery');
  const [activeSubTab, setActiveSubTab] = useState('everyone');

  // Set the active tab based on the current path
  useEffect(() => {
    if (pathname === '/gallery') {
      setActiveMainTab('gallery');
    } else if (pathname === '/gallery/yayornay') {
      setActiveMainTab('yayornay');
    } else if (pathname === '/gallery/battle') {
      setActiveMainTab('battle');
    } else if (pathname === '/gallery/opinions') {
      setActiveMainTab('opinions');
    }
  }, [pathname]);

  return (
    <GalleryContext.Provider value={{ activeSubTab, setActiveSubTab }}>
      <div className="flex flex-col min-h-screen" suppressHydrationWarning>
        {/* Main tabs (Red square area) */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <Tabs 
            value={activeMainTab} 
            className="w-full"
            onValueChange={(value) => {
              setActiveMainTab(value);
            }}
          >
            <TabsList className="w-full flex bg-gray-100 dark:bg-gray-800">
              <TabsTrigger 
                value="gallery" 
                className="flex-1 text-[#222222] dark:text-white data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                asChild
              >
                <Link href="/gallery">Gallery</Link>
              </TabsTrigger>
              <TabsTrigger 
                value="yayornay" 
                className="flex-1 text-[#222222] dark:text-white data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                asChild
              >
                <Link href="/gallery/yayornay">Yay or Nay</Link>
              </TabsTrigger>
              <TabsTrigger 
                value="battle" 
                className="flex-1 text-[#222222] dark:text-white data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                asChild
              >
                <Link href="/gallery/battle">Battle</Link>
              </TabsTrigger>
              <TabsTrigger 
                value="opinions" 
                className="flex-1 text-[#222222] dark:text-white data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                asChild
              >
                <Link href="/gallery/opinions">Opinions</Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Secondary tabs - only shown for Gallery tab (Green square area) */}
        {activeMainTab === 'gallery' && (
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <Tabs 
              value={activeSubTab} 
              className="w-full"
              onValueChange={setActiveSubTab}
            >
              <TabsList className="w-full flex bg-gray-100 dark:bg-gray-800">
                <TabsTrigger 
                  value="everyone" 
                  className="flex-1 text-[#222222] dark:text-white data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                >
                  Everyone
                </TabsTrigger>
                <TabsTrigger 
                  value="following" 
                  className="flex-1 text-[#222222] dark:text-white data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                >
                  Following
                </TabsTrigger>
                <TabsTrigger 
                  value="friends" 
                  className="flex-1 text-[#222222] dark:text-white data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                >
                  Friends
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Main content */}
        <div className="flex-grow">
          {children}
        </div>
      </div>
    </GalleryContext.Provider>
  );
} 