'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { Heart, Share } from "lucide-react";
import { Look } from "@/types/look";
import Image from 'next/image';
import { UserAvatar } from '../UserAvatar';

interface GalleryCardProps {
  look: Look;
  onSave?: (id: number) => void;
  onShare?: (id: number) => void;
  compact?: boolean;
}

export function GalleryCard({ look, onSave, onShare, compact = false }: GalleryCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSave?.(look.id);
  };
  
  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onShare?.(look.id);
  };

  return (
    <div 
      className={`relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ${
        compact ? 'h-64' : 'h-auto'
      } transition-all duration-200 hover:shadow-md`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`relative ${compact ? 'h-48' : 'h-72'}`}>
        {look.image_url ? (
          <Image
            src={look.image_url}
            alt={look.caption || 'Fashion look'}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
            className="transition-transform duration-500 ease-in-out group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-gray-400">No image</span>
          </div>
        )}
        
        {/* Actions */}
        <div className="absolute top-2 right-2 flex space-x-1 z-10">
          <button
            onClick={handleSave}
            className="p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            aria-label={look.is_liked ? 'Unsave' : 'Save'}
          >
            <Heart size={16} fill={look.is_liked ? 'red' : 'none'} stroke={look.is_liked ? 'red' : 'currentColor'} />
          </button>
          <button
            onClick={handleShare}
            className="p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            aria-label="Share"
          >
            <Share size={16} />
          </button>
        </div>
      </div>
      
      {/* Card content */}
      {!compact && (
        <div className="p-3">
          <div className="flex items-center mb-2">
            <div className="flex-shrink-0">
              <UserAvatar 
                src={look.user.avatar_url} 
                name={look.user.username} 
                size="sm"
              />
            </div>
            <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              {look.user.username}
            </span>
          </div>
          
          {look.caption && (
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
              {look.caption}
            </p>
          )}
          
          <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400 space-x-3">
            <span>{look.likes_count} likes</span>
            <span>•</span>
            <span>{look.views_count} views</span>
          </div>
        </div>
      )}
    </div>
  );
} 