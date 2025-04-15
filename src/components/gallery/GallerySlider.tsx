'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { GalleryCard } from './GalleryCard';
import { Look } from '@/types/look';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { UserAvatar } from '../UserAvatar';

interface GallerySliderProps {
  title?: string;
  looks: Look[];
  loading?: boolean;
  onSave?: (id: number) => void;
  onShare?: (id: number) => void;
}

export function GallerySlider({ title = '', looks, loading = false, onSave, onShare }: GallerySliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  const scroll = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    
    const { scrollLeft, clientWidth } = sliderRef.current;
    const scrollAmount = direction === 'left' ? -clientWidth / 2 : clientWidth / 2;
    
    sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    
    // After scrolling, update the position
    setTimeout(() => {
      if (sliderRef.current) {
        setScrollPosition(sliderRef.current.scrollLeft);
      }
    }, 300);
  };

  // Check if we can scroll in either direction
  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = sliderRef.current
    ? scrollPosition < sliderRef.current.scrollWidth - sliderRef.current.clientWidth
    : false;

  return (
    <div className="relative">
      {looks.length > 0 && (
        <>
          <div className="absolute top-1/2 left-4 z-10 transform -translate-y-1/2">
            <button 
              onClick={() => scroll('left')}
              className={`p-2 rounded-full bg-white shadow-md ${!canScrollLeft ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
          
          <div className="absolute top-1/2 right-4 z-10 transform -translate-y-1/2">
            <button 
              onClick={() => scroll('right')}
              className={`p-2 rounded-full bg-white shadow-md ${!canScrollRight ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
              disabled={!canScrollRight}
              aria-label="Scroll right"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </>
      )}
      
      <div 
        ref={sliderRef}
        className="flex overflow-x-auto scrollbar-hide py-4 px-2 -mx-2 space-x-4 scroll-smooth"
        onScroll={() => setScrollPosition(sliderRef.current?.scrollLeft || 0)}
      >
        {loading ? (
          // Loading placeholders
          Array.from({ length: 5 }).map((_, index) => (
            <div 
              key={`loading-${index}`} 
              className="min-w-[240px] h-[350px] bg-gray-200 rounded-lg animate-pulse"
            />
          ))
        ) : looks.length === 0 ? (
          <div className="w-full text-center py-4 text-gray-500">
            No looks available
          </div>
        ) : (
          looks.map((look) => (
            <div key={look.id} className="min-w-[240px]">
              <Link href={`/look/${look.id}`} className="block">
                <GalleryCard 
                  look={look} 
                  onSave={onSave} 
                  onShare={onShare}
                  compact
                />
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 