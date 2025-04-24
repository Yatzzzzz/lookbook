'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ImageOff, Loader2 } from 'lucide-react';

interface LookCardProps {
  look: {
    look_id: string;
    image_url: string;
    title?: string;
    username?: string;
    created_at: string;
  };
  index: number;
}

export default function LookCard({ look, index }: LookCardProps) {
  const [showSlider, setShowSlider] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShowSlider(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowSlider(false);
    }, 300); // Small delay to prevent flickering
  };

  const handleTouch = () => {
    setShowSlider(prev => !prev);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    console.error(`Failed to load image: ${look.image_url}`);
    setImageLoading(false);
    setImageError(true);
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg">
      <div 
        className="relative h-64 overflow-hidden" 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleTouch} // For mobile touch
      >
        <div className="w-full h-full bg-gray-100 relative">
          {/* Loading indicator */}
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
            </div>
          )}

          {/* Error fallback */}
          {imageError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
              <ImageOff className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Image not available</p>
            </div>
          ) : (
            <img
              src={look.image_url}
              alt={look.title || `Fashion look ${index + 1}`}
              className="w-full h-full object-contain"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}
        </div>

        {/* Share and Save buttons */}
        <div className="absolute bottom-3 left-3">
          <button className="p-1 bg-white bg-opacity-70 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
          </button>
        </div>
        <div className="absolute bottom-3 right-3">
          <button className="p-1 bg-white bg-opacity-70 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center mb-2">
          <div className="w-8 h-8 rounded-full bg-gray-300 mr-2 flex items-center justify-center">
            {look.username?.charAt(0).toUpperCase() || "A"}
          </div>
          <span className="font-medium text-sm">{look.username || "Anonymous"}</span>
        </div>
        <h2 className="text-lg font-semibold mb-2 truncate">
          {look.title || `Look ${index + 1}`}
        </h2>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            {new Date(look.created_at).toLocaleDateString()}
          </span>
          <Link
            href={`/look/${look.look_id}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
} 