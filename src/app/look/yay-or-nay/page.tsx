"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { UserAvatar } from '@/components/UserAvatar';

interface Look {
  id: string;
  image_url: string;
  description: string;
  user_name: string;
  user_avatar: string;
  created_at: string;
}

export default function YayOrNayPage() {
  const [looks, setLooks] = useState<Look[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const swipeRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchLooks();
  }, []);

  const fetchLooks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/looks/discover');
      
      if (!response.ok) {
        throw new Error('Failed to fetch looks');
      }
      
      const data = await response.json();
      setLooks(data.looks);
    } catch (err) {
      console.error('Error fetching looks:', err);
      setError('Failed to load looks. Please try again.');
      
      // Set fallback data
      setLooks([
        {
          id: '1',
          image_url: 'https://placehold.co/400x600/png',
          description: 'Summer casual look',
          user_name: 'StyleUser',
          user_avatar: 'https://placehold.co/50/png',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          image_url: 'https://placehold.co/400x600/png',
          description: 'Winter fashion collection',
          user_name: 'FashionPro',
          user_avatar: 'https://placehold.co/50/png',
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (lookId: string, isYay: boolean) => {
    if (isVoting) return;
    
    setIsVoting(true);
    setDirection(isYay ? 'right' : 'left');
    
    try {
      // In a real implementation, send the vote to the API
      await fetch('/api/looks/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lookId, vote: isYay ? 'yay' : 'nay' }),
      });
      
      // Wait for animation to finish
      setTimeout(() => {
        // Move to next look
        if (currentIndex < looks.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          // Fetch more looks or show end screen
          fetchLooks();
          setCurrentIndex(0);
        }
        
        setDirection(null);
        setIsVoting(false);
      }, 300);
    } catch (err) {
      console.error('Error voting:', err);
      setError('Failed to submit your vote. Please try again.');
      setDirection(null);
      setIsVoting(false);
    }
  };

  // Touch/mouse event handlers for swipe
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (isVoting) return;
    
    const clientX = 'touches' in e 
      ? e.touches[0].clientX 
      : (e as React.MouseEvent).clientX;
    
    startXRef.current = clientX;
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (isVoting || startXRef.current === null || !swipeRef.current) return;
    
    const clientX = 'touches' in e 
      ? e.touches[0].clientX 
      : (e as React.MouseEvent).clientX;
    
    const deltaX = clientX - startXRef.current;
    
    if (Math.abs(deltaX) > 5) {
      swipeRef.current.style.transform = `translateX(${deltaX}px) rotate(${deltaX * 0.1}deg)`;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (isVoting || startXRef.current === null || !swipeRef.current) return;
    
    const clientX = 'changedTouches' in e 
      ? e.changedTouches[0].clientX 
      : (e as React.MouseEvent).clientX;
    
    const deltaX = clientX - startXRef.current;
    
    // Reset transform
    swipeRef.current.style.transform = '';
    
    // If swipe distance is significant
    if (Math.abs(deltaX) > 100) {
      // Swipe right = Yay, Swipe left = Nay
      handleVote(looks[currentIndex].id, deltaX > 0);
    }
    
    startXRef.current = null;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error && looks.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 p-4 rounded-md text-red-700 mb-4">
          {error}
        </div>
        <button 
          onClick={() => router.push('/gallery')}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Back to Gallery
        </button>
      </div>
    );
  }

  if (looks.length === 0) {
    return (
      <div className="container mx-auto p-4 text-center">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">No more looks to rate!</h2>
          <p className="text-gray-600">Check back later for new content.</p>
        </div>
        <button 
          onClick={() => router.push('/gallery')}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Explore Gallery
        </button>
      </div>
    );
  }

  const currentLook = looks[currentIndex];

  return (
    <div className="container mx-auto p-4 max-w-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Yay or Nay</h1>
      
      <div className="relative h-[70vh] mx-auto mb-6">
        {error && (
          <div className="absolute top-0 left-0 right-0 z-20 bg-red-100 p-3 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <div 
          ref={swipeRef}
          className={`absolute inset-0 bg-white rounded-xl shadow-lg overflow-hidden transition-transform duration-300
            ${direction === 'left' ? 'translate-x-[-200%] rotate-[-30deg]' : ''}
            ${direction === 'right' ? 'translate-x-[200%] rotate-[30deg]' : ''}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseMove={handleTouchMove}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
        >
          <div className="absolute inset-0">
            <Image
              src={currentLook.image_url}
              alt={currentLook.description}
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
          </div>
          
          {/* Yay/Nay overlays */}
          <div className={`absolute top-6 right-6 bg-green-500 text-white py-2 px-4 rounded-full text-xl font-bold transform rotate-12 transition-opacity duration-300 ${direction === 'right' ? 'opacity-100' : 'opacity-0'}`}>
            YAY!
          </div>
          
          <div className={`absolute top-6 left-6 bg-red-500 text-white py-2 px-4 rounded-full text-xl font-bold transform -rotate-12 transition-opacity duration-300 ${direction === 'left' ? 'opacity-100' : 'opacity-0'}`}>
            NAY!
          </div>
          
          {/* Info footer */}
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
            <div className="flex items-center space-x-3 mb-2">
              <UserAvatar
                src={currentLook.user_avatar}
                alt={currentLook.user_name}
                size="sm"
              />
              <span className="font-medium">{currentLook.user_name}</span>
            </div>
            <p className="text-sm">{currentLook.description}</p>
          </div>
        </div>
        
        {/* Preview of next look */}
        {currentIndex < looks.length - 1 && (
          <div className="absolute inset-0 -z-10 rounded-xl overflow-hidden">
            <Image
              src={looks[currentIndex + 1].image_url}
              alt="Next look"
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
        )}
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-center space-x-6">
        <button
          onClick={() => handleVote(currentLook.id, false)}
          disabled={isVoting}
          className="w-16 h-16 flex items-center justify-center bg-white rounded-full shadow-lg text-red-500 text-3xl disabled:opacity-50"
        >
          ✗
        </button>
        <button
          onClick={() => router.push(`/look/${currentLook.id}`)}
          className="w-12 h-12 flex items-center justify-center bg-gray-200 rounded-full shadow-md text-gray-700"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            className="w-6 h-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <button
          onClick={() => handleVote(currentLook.id, true)}
          disabled={isVoting}
          className="w-16 h-16 flex items-center justify-center bg-white rounded-full shadow-lg text-green-500 text-3xl disabled:opacity-50"
        >
          ♥
        </button>
      </div>
    </div>
  );
} 