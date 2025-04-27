'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWardrobe } from '@/app/context/WardrobeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, User, Heart } from 'lucide-react';

export default function FollowingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { getFollowedWardrobes, unfollowWardrobe } = useWardrobe();
  
  const [followedUsers, setFollowedUsers] = useState<{ user_id: string; username?: string; avatar_url?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFollowedWardrobes = async () => {
      if (!user) {
        router.push('/login');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const followed = await getFollowedWardrobes();
        setFollowedUsers(followed);
      } catch (err: any) {
        console.error('Error fetching followed wardrobes:', err);
        setError('Failed to load followed wardrobes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFollowedWardrobes();
  }, [user, router, getFollowedWardrobes]);

  const handleUnfollow = async (userId: string) => {
    if (!user) return;

    try {
      await unfollowWardrobe(userId);
      setFollowedUsers(prev => prev.filter(u => u.user_id !== userId));
    } catch (err) {
      console.error('Error unfollowing user:', err);
    }
  };

  const handleViewProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading followed wardrobes...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Wardrobes You Follow</h1>
          <button
            onClick={() => router.push('/wardrobe')}
            className="text-blue-600 text-sm hover:underline mt-1 flex items-center"
          >
            ← Back to Your Wardrobe
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {followedUsers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">You aren't following any wardrobes yet.</p>
          <button
            onClick={() => router.push('/search')}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            Find users to follow
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {followedUsers.map((followedUser) => (
            <div 
              key={followedUser.user_id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
            >
              <div 
                className="p-6 flex flex-col items-center cursor-pointer"
                onClick={() => handleViewProfile(followedUser.user_id)}
              >
                <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-4">
                  {followedUser.avatar_url ? (
                    <img 
                      src={followedUser.avatar_url} 
                      alt={followedUser.username || 'User'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="h-10 w-10 text-gray-400" />
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-center">{followedUser.username || 'User'}</h3>
              </div>
              
              <div className="px-6 pb-6">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnfollow(followedUser.user_id);
                  }}
                  className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center gap-2 hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                  <span>Unfollow</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 