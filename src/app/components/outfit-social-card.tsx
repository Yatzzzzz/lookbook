'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/app/context/SupabaseProvider';
import { useWardrobe } from '@/app/context/WardrobeContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Heart, Share, User, Bookmark, BookmarkCheck } from 'lucide-react';
import Image from 'next/image';

interface OutfitSocialCardProps {
  id: string;
  name: string;
  imageUrl: string;
  createdBy: {
    id: string;
    name: string | null;
    image: string | null;
  };
  likes: number;
  isPublic: boolean;
  createdAt: Date;
  currentUserId: string;
  addToCollection?: boolean;
}

export default function OutfitSocialCard({
  id,
  name,
  imageUrl,
  createdBy,
  likes,
  isPublic,
  createdAt,
  currentUserId,
  addToCollection = false
}: OutfitSocialCardProps) {
  const router = useRouter();
  const { supabase } = useSupabase();
  const { user } = useAuth();
  const { addOutfitToCollection } = useWardrobe();
  
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if the user has already liked this outfit
  useState(() => {
    if (!user) return;
    
    const checkLikeStatus = async () => {
      try {
        const { data, error } = await supabase.rpc('has_user_liked_outfit', {
          outfit_id: id,
          user_id: user.id
        });
        
        if (error) {
          console.error('Error checking like status:', error);
          return;
        }
        
        setIsLiked(data || false);
      } catch (err) {
        console.error('Error in like status check:', err);
      }
    };
    
    checkLikeStatus();
  });

  const handleLike = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('outfit_likes')
          .delete()
          .match({ outfit_id: id, user_id: user.id });
          
        if (error) throw error;
        
        setLikeCount(prev => Math.max(0, prev - 1));
        setIsLiked(false);
      } else {
        // Like
        const { error } = await supabase
          .from('outfit_likes')
          .insert({ outfit_id: id, user_id: user.id });
          
        if (error) throw error;
        
        setLikeCount(prev => prev + 1);
        setIsLiked(true);
      }
    } catch (err: any) {
      console.error('Error toggling like:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToCollection = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await addOutfitToCollection(id, 'Saved Outfits');
      setIsSaved(true);
    } catch (err: any) {
      console.error('Error saving outfit:', err);
      setError(err.message || 'Failed to save outfit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    setShareModalOpen(true);
  };

  const handleClickCard = () => {
    router.push(`/outfits/view/${id}`);
  };

  const handleClickUser = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/profile/${createdBy.id}`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1">
      <div 
        className="relative w-full aspect-square cursor-pointer" 
        onClick={handleClickCard}
      >
        {imageUrl ? (
          <Image 
            src={imageUrl} 
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            priority={false}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-gray-500 dark:text-gray-400">No image</span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 
            className="font-medium text-gray-900 dark:text-gray-100 hover:text-primary cursor-pointer"
            onClick={handleClickCard}
          >
            {name}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDistanceToNow(createdAt, { addSuffix: true })}
          </span>
        </div>
        
        <div 
          className="flex items-center gap-2 mb-3 cursor-pointer"
          onClick={handleClickUser}
        >
          {createdBy.image ? (
            <div className="h-6 w-6 rounded-full overflow-hidden">
              <Image 
                src={createdBy.image} 
                alt={createdBy.name || 'User'} 
                width={24}
                height={24}
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <User className="h-3 w-3 text-gray-500" />
            </div>
          )}
          <span className="text-sm text-gray-700 dark:text-gray-300 hover:underline">
            {createdBy.name || 'User'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
              disabled={isLoading}
              className="flex items-center gap-1 group disabled:opacity-50"
              aria-label={isLiked ? "Unlike" : "Like"}
            >
              <Heart 
                className={`h-5 w-5 transition-colors ${
                  isLiked 
                    ? 'text-red-500 fill-red-500' 
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-red-500'
                }`} 
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">{likeCount}</span>
            </button>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className="flex items-center gap-1 group"
              aria-label="Share"
            >
              <Share className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-500" />
            </button>
          </div>
          
          {addToCollection && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleSaveToCollection();
              }}
              disabled={isLoading || isSaved}
              className="flex items-center gap-1 group disabled:opacity-50"
              aria-label={isSaved ? "Saved to collection" : "Save to collection"}
            >
              {isSaved ? (
                <BookmarkCheck className="h-5 w-5 text-green-500 fill-green-500" />
              ) : (
                <Bookmark className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-500" />
              )}
            </button>
          )}
        </div>
        
        {error && (
          <div className="mt-2 text-xs text-red-500">
            {error}
          </div>
        )}
      </div>
      
      {shareModalOpen && (
        <div className="absolute inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          {/* 
            Here we would normally render the ShareOutfitModal component
            but we're just showing that we would call it
          */}
        </div>
      )}
    </div>
  );
} 