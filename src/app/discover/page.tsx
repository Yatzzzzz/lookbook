'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useWardrobe, 
  WardrobeItem 
} from '@/app/context/WardrobeContext';
import { 
  Loader2, 
  User, 
  Search, 
  Heart, 
  Shirt, 
  Users,
  TrendingUp,
  Filter
} from 'lucide-react';
import Link from 'next/link';

export default function DiscoverPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    getPopularUsers,
    getPopularItems,
    searchUsers,
    followWardrobe,
    unfollowWardrobe,
    isFollowingWardrobe
  } = useWardrobe();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'items'>('users');
  const [popularUsers, setPopularUsers] = useState<any[]>([]);
  const [popularItems, setPopularItems] = useState<WardrobeItem[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
  const [isToggleFollowing, setIsToggleFollowing] = useState<Record<string, boolean>>({});
  
  // Fetch popular users and items on initial load
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const users = await getPopularUsers(10);
        setPopularUsers(users);
        
        const items = await getPopularItems(10);
        setPopularItems(items);
        
        // Check following status for each user
        if (user) {
          const followingStatuses: Record<string, boolean> = {};
          for (const popularUser of users) {
            followingStatuses[popularUser.user_id] = await isFollowingWardrobe(popularUser.user_id);
          }
          setFollowingStatus(followingStatuses);
        }
      } catch (error) {
        console.error('Error fetching discover data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
  }, [user]);
  
  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
      
      // Check following status for search results
      if (user) {
        const followingStatuses = { ...followingStatus };
        for (const result of results) {
          if (!followingStatuses[result.user_id]) {
            followingStatuses[result.user_id] = await isFollowingWardrobe(result.user_id);
          }
        }
        setFollowingStatus(followingStatuses);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle follow/unfollow
  const handleFollowToggle = async (userId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    setIsToggleFollowing(prev => ({ ...prev, [userId]: true }));
    
    try {
      const isFollowing = followingStatus[userId];
      
      if (isFollowing) {
        await unfollowWardrobe(userId);
      } else {
        await followWardrobe(userId);
      }
      
      // Update following status
      setFollowingStatus(prev => ({
        ...prev,
        [userId]: !isFollowing
      }));
    } catch (error) {
      console.error('Error toggling follow status:', error);
    } finally {
      setIsToggleFollowing(prev => ({ ...prev, [userId]: false }));
    }
  };
  
  // Render user card
  const renderUserCard = (userData: any) => {
    const isFollowing = followingStatus[userData.user_id] || false;
    const isToggling = isToggleFollowing[userData.user_id] || false;
    
    return (
      <div key={userData.user_id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Link href={`/profile/${userData.user_id}`} className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mr-3">
                {userData.avatar_url ? (
                  <img 
                    src={userData.avatar_url} 
                    alt={userData.username} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-medium">{userData.username || 'User'}</h3>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  <span>{userData.followers_count || 0} followers</span>
                </div>
              </div>
            </Link>
            
            <button
              onClick={() => handleFollowToggle(userData.user_id)}
              disabled={isToggling}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
                isFollowing
                  ? 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              {isToggling ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Heart className={`h-3.5 w-3.5 mr-1 ${isFollowing ? 'fill-red-500 text-red-500' : ''}`} />
              )}
              <span>{isFollowing ? 'Following' : 'Follow'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Render item card
  const renderItemCard = (item: WardrobeItem) => {
    return (
      <div key={item.item_id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative">
          {item.image_path ? (
            <img 
              src={item.image_path} 
              alt={item.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Shirt className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-medium text-sm truncate">{item.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
            {item.brand || 'No brand'} · {item.category}
          </p>
          <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
            <Link href={`/profile/${item.user_id}`} className="flex items-center">
              <User className="h-3 w-3 mr-1" />
              <span>View Profile</span>
            </Link>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Discover</h1>
      
      {/* Search Bar */}
      <div className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span>Search</span>
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`py-2 px-4 font-medium text-sm flex items-center ${
            activeTab === 'users'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <Users className="h-4 w-4 mr-1.5" />
          <span>Popular Users</span>
        </button>
        <button
          onClick={() => setActiveTab('items')}
          className={`py-2 px-4 font-medium text-sm flex items-center ${
            activeTab === 'items'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <Shirt className="h-4 w-4 mr-1.5" />
          <span>Popular Items</span>
        </button>
      </div>
      
      {/* Search Results */}
      {searchQuery.trim() && searchResults.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <Search className="h-4 w-4 mr-1.5" />
            <span>Search Results</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.map(renderUserCard)}
          </div>
        </div>
      )}
      
      {/* No Search Results */}
      {searchQuery.trim() && !isSearching && searchResults.length === 0 && (
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
          <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <h2 className="text-lg font-medium mb-1">No Results Found</h2>
          <p className="text-gray-500 dark:text-gray-400">
            No users found matching "{searchQuery}"
          </p>
        </div>
      )}
      
      {/* Content based on active tab */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : activeTab === 'users' ? (
        <>
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <TrendingUp className="h-4 w-4 mr-1.5" />
            <span>Popular Users</span>
          </h2>
          
          {popularUsers.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
              <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <h2 className="text-lg font-medium mb-1">No Popular Users Yet</h2>
              <p className="text-gray-500 dark:text-gray-400">
                Check back later for popular users
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {popularUsers.map(renderUserCard)}
            </div>
          )}
        </>
      ) : (
        <>
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <TrendingUp className="h-4 w-4 mr-1.5" />
            <span>Popular Items</span>
          </h2>
          
          {popularItems.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
              <Shirt className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <h2 className="text-lg font-medium mb-1">No Popular Items Yet</h2>
              <p className="text-gray-500 dark:text-gray-400">
                Check back later for popular items
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {popularItems.map(renderItemCard)}
            </div>
          )}
        </>
      )}
    </div>
  );
} 