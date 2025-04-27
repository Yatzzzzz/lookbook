'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/app/context/SupabaseProvider';
import { useAuth } from '@/contexts/AuthContext';
import OutfitSocialCard from './outfit-social-card';
import { Loader2, TrendingUp, RefreshCw, Filter } from 'lucide-react';

interface TrendingOutfit {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
  user_id: string;
  username: string;
  user_avatar: string | null;
  visibility: string;
  created_at: string;
  likes_count: number;
  trending_score: number;
}

interface CommunityTrendingProps {
  limit?: number;
  showRefresh?: boolean;
  showFilters?: boolean;
  onlyPublic?: boolean;
  className?: string;
}

export default function CommunityTrending({
  limit = 8,
  showRefresh = true,
  showFilters = true,
  onlyPublic = false,
  className = ''
}: CommunityTrendingProps) {
  const router = useRouter();
  const { supabase } = useSupabase();
  const { user } = useAuth();
  
  const [outfits, setOutfits] = useState<TrendingOutfit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTimeframe, setFilterTimeframe] = useState<'all' | 'week' | 'day'>('all');
  
  const fetchTrendingOutfits = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase.rpc('get_trending_outfits', {
        limit_count: limit,
        offset_count: 0
      });
      
      if (fetchError) throw fetchError;
      
      let filteredOutfits = data;
      
      // Apply time filtering if needed
      if (filterTimeframe !== 'all') {
        const now = new Date();
        const cutoff = new Date();
        
        if (filterTimeframe === 'week') {
          cutoff.setDate(now.getDate() - 7);
        } else if (filterTimeframe === 'day') {
          cutoff.setDate(now.getDate() - 1);
        }
        
        filteredOutfits = data.filter(outfit => new Date(outfit.created_at) >= cutoff);
      }
      
      // Apply visibility filtering if needed
      if (onlyPublic) {
        filteredOutfits = filteredOutfits.filter(outfit => outfit.visibility === 'public');
      }
      
      setOutfits(filteredOutfits);
    } catch (err: any) {
      console.error('Error fetching trending outfits:', err);
      setError('Failed to load trending outfits');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTrendingOutfits();
  }, [filterTimeframe, limit, onlyPublic, supabase]);
  
  const handleRefresh = () => {
    fetchTrendingOutfits();
  };
  
  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-gray-500 dark:text-gray-400">Loading trending outfits...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-red-500 mb-2">{error}</p>
        <button 
          onClick={handleRefresh}
          className="text-primary hover:underline flex items-center gap-1 mx-auto"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Try again</span>
        </button>
      </div>
    );
  }
  
  if (outfits.length === 0) {
    return (
      <div className={`text-center py-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 ${className}`}>
        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Trending Outfits</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          There are no trending outfits to display at the moment
        </p>
        
        {showFilters && filterTimeframe !== 'all' && (
          <button
            onClick={() => setFilterTimeframe('all')}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            Show All Time
          </button>
        )}
      </div>
    );
  }
  
  return (
    <div className={className}>
      {(showRefresh || showFilters) && (
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-medium">Trending Outfits</h2>
          </div>
          
          <div className="flex items-center gap-3">
            {showFilters && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={filterTimeframe}
                  onChange={(e) => setFilterTimeframe(e.target.value as any)}
                  className="p-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                >
                  <option value="all">All Time</option>
                  <option value="week">This Week</option>
                  <option value="day">Today</option>
                </select>
              </div>
            )}
            
            {showRefresh && (
              <button
                onClick={handleRefresh}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {outfits.map((outfit) => (
          <OutfitSocialCard
            key={outfit.id}
            id={outfit.id}
            name={outfit.name}
            imageUrl={outfit.image_url}
            createdBy={{
              id: outfit.user_id,
              name: outfit.username,
              image: outfit.user_avatar
            }}
            likes={outfit.likes_count}
            isPublic={outfit.visibility === 'public' || outfit.visibility === 'community'}
            createdAt={new Date(outfit.created_at)}
            currentUserId={user?.id || ''}
            addToCollection={true}
          />
        ))}
      </div>
    </div>
  );
} 