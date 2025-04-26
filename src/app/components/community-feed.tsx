'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import OutfitCard from './outfit-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Outfit {
  id: string;
  name: string;
  imageUrl: string;
  userId: string;
  userName: string;
  userImage: string;
  visibility: string;
  likes: number;
  createdAt: string;
}

interface CommunityFeedProps {
  filter: 'trending' | 'recent' | 'featured';
}

export default function CommunityFeed({ filter }: CommunityFeedProps) {
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    
    getUser();
  }, [supabase]);

  useEffect(() => {
    async function fetchOutfits() {
      try {
        setLoading(true);
        const response = await fetch(`/api/outfits/community?filter=${filter}&page=${page}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch community outfits');
        }
        
        const data = await response.json();
        
        if (page === 1) {
          setOutfits(data.outfits);
        } else {
          setOutfits((prev) => [...prev, ...data.outfits]);
        }
        
        setHasMore(data.hasMore);
      } catch (error) {
        console.error('Error fetching community outfits:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchOutfits();
  }, [filter, page]);

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  // Display loading skeletons
  if (loading && outfits.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6).fill(0).map((_, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <Skeleton className="h-64 w-full" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex items-center space-x-2 pt-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Display no results message
  if (!loading && outfits.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-600 dark:text-gray-400">
          No outfits found in the community feed.
        </p>
        <p className="mt-2 text-gray-500 dark:text-gray-500">
          Be the first to share your outfit with the community!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {outfits.map((outfit) => (
          <OutfitCard
            key={outfit.id}
            id={outfit.id}
            name={outfit.name}
            imageUrl={outfit.imageUrl}
            createdBy={{
              id: outfit.userId,
              name: outfit.userName,
              image: outfit.userImage
            }}
            likes={outfit.likes}
            isPublic={outfit.visibility === 'public' || outfit.visibility === 'community'}
            createdAt={new Date(outfit.createdAt)}
            currentUserId={user?.id || ''}
          />
        ))}
      </div>
      
      {hasMore && (
        <div className="flex justify-center mt-8">
          <Button 
            onClick={handleLoadMore}
            variant="outline"
            className="border-gray-300 dark:border-gray-700"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
} 