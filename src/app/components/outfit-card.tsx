'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Heart } from 'lucide-react';

interface OutfitCardProps {
  id: string;
  name: string;
  imageUrl: string;
  createdBy: {
    id: string;
    name: string;
    image: string;
  };
  likes: number;
  isPublic: boolean;
  createdAt: Date;
  currentUserId: string;
}

export default function OutfitCard({
  id,
  name,
  imageUrl,
  createdBy,
  likes,
  isPublic,
  createdAt,
  currentUserId
}: OutfitCardProps) {
  const [likesCount, setLikesCount] = useState(likes);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  
  const handleLike = async () => {
    if (isLiking) return;
    
    try {
      setIsLiking(true);
      const response = await fetch('/api/outfits/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ outfitId: id }),
      });
      
      if (response.ok) {
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);
      }
    } catch (error) {
      console.error('Error liking outfit:', error);
    } finally {
      setIsLiking(false);
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg">
      <Link href={`/outfits/${id}`}>
        <div className="relative aspect-square">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      </Link>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <Link href={`/outfits/${id}`}>
            <h3 className="font-medium text-lg hover:underline text-gray-900 dark:text-gray-100">
              {name}
            </h3>
          </Link>
          
          <button
            onClick={handleLike}
            disabled={isLiking || !currentUserId}
            className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            aria-label={isLiked ? "Unlike outfit" : "Like outfit"}
          >
            <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            <span>{likesCount}</span>
          </button>
        </div>
        
        <div className="flex items-center mt-3">
          <Link href={`/profile/${createdBy.id}`} className="flex items-center group">
            <div className="relative h-8 w-8 rounded-full overflow-hidden mr-2">
              <Image
                src={createdBy.image || '/placeholder-user.jpg'}
                alt={createdBy.name}
                fill
                className="object-cover"
              />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:underline">
              {createdBy.name}
            </span>
          </Link>
          
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
            {formatDistanceToNow(createdAt, { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
} 