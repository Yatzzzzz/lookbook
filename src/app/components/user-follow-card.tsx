'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/app/context/SupabaseProvider';
import { useAuth } from '@/contexts/AuthContext';
import { User, Heart, Users } from 'lucide-react';
import Image from 'next/image';

interface UserFollowCardProps {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  initialIsFollowing?: boolean;
  followersCount?: number;
  sharedInterests?: number;
  compact?: boolean;
}

export default function UserFollowCard({
  id,
  username,
  displayName,
  avatarUrl,
  bio,
  initialIsFollowing = false,
  followersCount = 0,
  sharedInterests = 0,
  compact = false
}: UserFollowCardProps) {
  const router = useRouter();
  const { supabase } = useSupabase();
  const { user } = useAuth();
  
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followers, setFollowers] = useState(followersCount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (id === user.id) {
      setError('You cannot follow yourself');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (isFollowing) {
        // Unfollow
        const response = await fetch(`/api/users/follow?userId=${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to unfollow user');
        }
        
        setIsFollowing(false);
        setFollowers(prev => Math.max(0, prev - 1));
      } else {
        // Follow
        const response = await fetch('/api/users/follow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: id }),
        });
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to follow user');
        }
        
        setIsFollowing(true);
        setFollowers(prev => prev + 1);
      }
    } catch (err: any) {
      console.error('Error toggling follow status:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewProfile = () => {
    router.push(`/profile/${id}`);
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={handleViewProfile}
        >
          <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
            {avatarUrl ? (
              <Image 
                src={avatarUrl} 
                alt={username} 
                width={40}
                height={40}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="h-5 w-5 text-gray-500" />
              </div>
            )}
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              {displayName || username}
            </h4>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              @{username}
            </span>
          </div>
        </div>
        
        <button
          onClick={handleFollowToggle}
          disabled={isLoading || id === user?.id}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            isFollowing
              ? 'bg-primary/10 text-primary hover:bg-primary/20'
              : 'bg-primary text-white hover:bg-primary/90'
          } disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1`}
        >
          {isFollowing ? (
            <>
              <Heart className="h-3 w-3 fill-primary" />
              <span>Following</span>
            </>
          ) : (
            <>
              <Heart className="h-3 w-3" />
              <span>Follow</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      <div 
        className="p-6 cursor-pointer"
        onClick={handleViewProfile}
      >
        <div className="flex flex-col items-center mb-4">
          <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mb-3">
            {avatarUrl ? (
              <Image 
                src={avatarUrl} 
                alt={username} 
                width={64}
                height={64}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="h-8 w-8 text-gray-500" />
              </div>
            )}
          </div>
          
          <h3 className="font-medium text-center">{displayName || username}</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">@{username}</span>
          
          {sharedInterests > 0 && (
            <div className="flex items-center gap-1 mt-2 text-xs text-primary">
              <Heart className="h-3 w-3 fill-primary" />
              <span>{sharedInterests} shared interest{sharedInterests !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        
        {bio && (
          <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-4 line-clamp-2">
            {bio}
          </p>
        )}
        
        <div className="flex justify-center items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span>{followers} follower{followers !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
      
      <div className="px-6 pb-6">
        <button
          onClick={handleFollowToggle}
          disabled={isLoading || id === user?.id}
          className={`w-full py-2 rounded-md font-medium transition-colors ${
            isFollowing
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              : 'bg-primary text-white hover:bg-primary/90'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? 'Processing...' : isFollowing ? 'Following' : 'Follow'}
        </button>
        
        {error && (
          <div className="mt-2 text-xs text-red-500 text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
} 