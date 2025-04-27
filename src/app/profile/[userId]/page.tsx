'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useWardrobe, 
  WardrobeItem,
  ActivityFeedItem,
  Comment
} from '@/app/context/WardrobeContext';
import { 
  Loader2, 
  User, 
  Heart, 
  ShoppingBag, 
  Shirt, 
  Clock,
  MessageSquare,
  Send,
  Bell,
  Search,
  X,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import ProfileCompletionIndicator from '@/components/profile/profile-completion-indicator';

export default function ProfilePage() {
  const { userId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { 
    followWardrobe, 
    unfollowWardrobe, 
    isFollowingWardrobe,
    fetchActivityFeed,
    getComments,
    addComment,
    deleteComment
  } = useWardrobe();
  const supabase = getSupabaseClient();

  const [profile, setProfile] = useState<any>(null);
  const [publicItems, setPublicItems] = useState<WardrobeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  
  // New state for activity feed and comments
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [activeTab, setActiveTab] = useState<'wardrobe' | 'activity'>('wardrobe');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [itemComments, setItemComments] = useState<Record<string, Comment[]>>({});
  const [comment, setComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  // Check if viewing own profile
  const isOwnProfile = user?.id === userId;

  // Fetch profile and public wardrobe items
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!userId || !supabase) {
        router.push('/lookbook');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Check if user is authenticated first
        if (!user) {
          setError('Authentication required');
          setIsLoading(false);
          setTimeout(() => router.push('/login'), 1000); // Redirect after a brief delay
          return;
        }

        // Fetch user profile from user_profiles view instead of profiles
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          if (profileError.code === 'PGRST116') {
            setError('User profile not found');
            // Create a new profile on the fly if it's the current user
            if (userId === user.id) {
              try {
                await supabase.from('profiles').insert({
                  id: user.id,
                  username: user.email?.split('@')[0] || 'User',
                  avatar_url: user.user_metadata?.avatar_url || null
                });
                // Refresh the page after creating the profile
                setTimeout(() => window.location.reload(), 1500);
                setError('Creating your profile...');
                return;
              } catch (createError) {
                console.error('Error creating profile:', createError);
                setError('Failed to create user profile');
              }
            }
          } else {
            setError('Could not load user profile: ' + profileError.message);
          }
          setIsLoading(false);
          return;
        }

        if (!profileData) {
          setError('User profile not found');
          setIsLoading(false);
          return;
        }

        setProfile(profileData);

        // Fetch public wardrobe items
        const { data: items, error: itemsError } = await supabase
          .from('wardrobe')
          .select('*')
          .eq('user_id', userId)
          .eq('visibility', 'public')
          .order('created_at', { ascending: false });

        if (itemsError) {
          console.error('Error fetching wardrobe items:', itemsError);
          setError('Could not load wardrobe items');
          setIsLoading(false);
          return;
        }

        setPublicItems(items || []);

        // Check if current user is following this profile
        if (user && user.id !== userId) {
          const isFollowingStatus = await isFollowingWardrobe(userId as string);
          setIsFollowing(isFollowingStatus);
        }

        // Get follower count
        const { count: followersCount, error: followerError } = await supabase
          .from('wardrobe_follows')
          .select('*', { count: 'exact', head: true })
          .eq('followed_id', userId);

        if (!followerError) {
          setFollowerCount(followersCount || 0);
        }

        // Get following count
        const { count: followingsCount, error: followingError } = await supabase
          .from('wardrobe_follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userId);

        if (!followingError) {
          setFollowingCount(followingsCount || 0);
        }

        // If viewing the activity tab, also fetch activity data
        if (activeTab === 'activity' && !activityFeed.length) {
          await fetchUserActivity();
        }
      } catch (err: any) {
        console.error('Error fetching profile data:', err);
        setError('An error occurred while loading the profile: ' + (err.message || 'Unknown error'));
        // Navigate to lookbook page after 3 seconds in case of fatal error
        setTimeout(() => router.push('/lookbook'), 3000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [userId, supabase, user, activeTab, router]);

  // Fetch activity feed for this user
  const fetchUserActivity = async () => {
    if (!userId || !supabase) return;
    
    setIsLoadingActivity(true);
    
    try {
      const { data, error } = await supabase
        .from('activity_feed')
        .select(`
          *,
          profiles:user_id(id, username, display_name, avatar_url)
        `)
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      const formattedData = data.map((item: any) => ({
        ...item,
        profile: item.profiles
      }));
      
      setActivityFeed(formattedData);
    } catch (err) {
      console.error('Error fetching activity feed:', err);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  // Function to toggle comments for an item
  const toggleComments = async (itemId: string, itemType: string) => {
    if (expandedItemId === itemId) {
      setExpandedItemId(null);
      return;
    }
    
    setExpandedItemId(itemId);
    
    if (!itemComments[itemId]) {
      try {
        const comments = await getComments(itemType, itemId);
        setItemComments(prev => ({
          ...prev,
          [itemId]: comments
        }));
      } catch (err) {
        console.error('Error fetching comments:', err);
      }
    }
  };

  // Function to submit a comment
  const handleSubmitComment = async (itemId: string, itemType: string) => {
    if (!comment.trim() || !user) return;
    
    setIsPostingComment(true);
    
    try {
      await addComment(itemType, itemId, comment);
      
      // Add the new comment to the local state
      const newComment: Comment = {
        id: 'temp-' + Date.now(),
        user_id: user.id,
        item_type: itemType,
        item_id: itemId,
        content: comment,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profile: {
          id: user.id,
          username: user?.email?.split('@')[0] || 'User',
          display_name: profile?.display_name || user?.email?.split('@')[0] || 'User',
          avatar_url: undefined
        }
      };
      
      setItemComments(prev => ({
        ...prev,
        [itemId]: [...(prev[itemId] || []), newComment]
      }));
      
      // Clear comment input
      setComment('');
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setIsPostingComment(false);
    }
  };

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!user || !userId) return;

    try {
      if (isFollowing) {
        await unfollowWardrobe(userId as string);
        setIsFollowing(false);
        setFollowerCount(prev => prev - 1);
      } else {
        await followWardrobe(userId as string);
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error toggling follow status:', err);
    }
  };

  // Render an activity feed item
  const renderActivityItem = (activity: ActivityFeedItem) => {
    const getActionText = () => {
      switch (activity.action_type) {
        case 'wardrobe_add':
          return 'added a new item to their wardrobe';
        case 'outfit_create':
          return 'created a new outfit';
        case 'follow':
          return 'followed a new user';
        case 'inspiration_save':
          return 'saved an item to an inspiration board';
        case 'outfit_wear':
          return 'wore an outfit';
        case 'wardrobe_wear':
          return 'wore an item from their wardrobe';
        default:
          return 'did something';
      }
    };
    
    const getIcon = () => {
      switch (activity.action_type) {
        case 'wardrobe_add':
          return <Shirt className="h-5 w-5" />;
        case 'outfit_create':
          return <User className="h-5 w-5" />;
        case 'follow':
          return <Heart className="h-5 w-5" />;
        case 'inspiration_save':
          return <Heart className="h-5 w-5" />;
        case 'outfit_wear':
        case 'wardrobe_wear':
          return <Clock className="h-5 w-5" />;
        default:
          return <Bell className="h-5 w-5" />;
      }
    };
    
    return (
      <div key={activity.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4">
          <div className="flex items-center mb-2">
            <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
              {activity.profile?.avatar_url ? (
                <img src={activity.profile.avatar_url} alt={activity.profile.display_name || activity.profile.username || 'User'} className="h-full w-full object-cover" />
              ) : (
                <User className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <div className="ml-3">
              <p className="font-medium">
                {activity.profile?.display_name || activity.profile?.username || 'User'} {getActionText()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </p>
            </div>
            <div className="ml-auto">{getIcon()}</div>
          </div>
          
          {activity.metadata && activity.metadata.description && (
            <p className="text-sm mb-3">{activity.metadata.description}</p>
          )}
          
          {/* Comment button */}
          <div className="mt-3 flex items-center">
            <button
              onClick={() => toggleComments(activity.id, 'activity')}
              className="text-xs flex items-center text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Comments
            </button>
          </div>
          
          {/* Comments section */}
          {expandedItemId === activity.id && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              {/* Existing comments */}
              <div className="space-y-3 mb-3">
                {itemComments[activity.id]?.length > 0 ? (
                  itemComments[activity.id].map(comment => (
                    <div key={comment.id} className="flex">
                      <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {comment.profile?.avatar_url ? (
                          <img src={comment.profile.avatar_url} alt={comment.profile.display_name || comment.profile.username || 'User'} className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div className="ml-2 bg-gray-50 dark:bg-gray-900 p-2 rounded-lg flex-grow">
                        <p className="text-xs font-medium mb-1">{comment.profile?.display_name || comment.profile?.username || 'User'}</p>
                        <p className="text-sm">{comment.content}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {user?.id === comment.user_id && (
                        <button
                          onClick={() => deleteComment(comment.id)}
                          className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet</p>
                )}
              </div>
              
              {/* Comment form */}
              <div className="flex items-center">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-grow rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                />
                <button
                  onClick={() => handleSubmitComment(activity.id, 'activity')}
                  disabled={!comment.trim() || isPostingComment}
                  className="ml-2 rounded-md bg-primary px-3 py-2 text-white disabled:opacity-50 transition-colors"
                >
                  {isPostingComment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="mb-4 text-red-500">
          <X className="w-12 h-12 mx-auto" />
        </div>
        <h1 className="mb-4 text-2xl font-bold">{error}</h1>
        <p className="mb-6 text-muted-foreground">
          The user profile you are looking for could not be found or an error occurred.
        </p>
        <div className="flex gap-4">
          <Link 
            href="/lookbook" 
            className="px-4 py-2 text-white bg-primary rounded-md hover:bg-primary/90 transition-colors"
          >
            Go to Lookbook
          </Link>
          <button 
            onClick={() => router.back()} 
            className="px-4 py-2 border border-input bg-background rounded-md hover:bg-accent transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start gap-8">
        {/* Profile sidebar */}
        <div className="w-full md:w-1/3 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex flex-col items-center">
            <div className="h-24 w-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden mb-4">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name || profile.username || 'User'} className="h-full w-full object-cover" />
              ) : (
                <User className="h-12 w-12 text-gray-400" />
              )}
            </div>
            
            <h1 className="text-xl font-bold mb-1">{profile?.display_name || profile?.username || 'User'}</h1>
            
            {profile?.username && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">@{profile.username}</p>
            )}
            
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
              <span className="mr-3">{followerCount} followers</span>
              <span>{followingCount} following</span>
            </div>
            
            {/* Profile completion indicator (only for own profile) */}
            {isOwnProfile && (
              <div className="w-full mb-4">
                <ProfileCompletionIndicator userId={userId as string} showDetails={true} />
              </div>
            )}
            
            {!isOwnProfile && (
              <button 
                onClick={handleFollowToggle}
                className={`w-full py-2 px-4 rounded-md mb-4 ${
                  isFollowing 
                    ? 'bg-white text-primary border border-primary hover:bg-primary/10' 
                    : 'bg-primary text-white hover:bg-primary/90'
                } transition-colors`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
            
            {isOwnProfile && (
              <Link 
                href="/wardrobe" 
                className="w-full py-2 px-4 text-center rounded-md mb-4 bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                Manage Wardrobe
              </Link>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <h2 className="font-medium mb-3">Stats</h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                <Shirt className="h-5 w-5 text-primary mb-1" />
                <p className="text-xs text-gray-500 dark:text-gray-400">Public Items</p>
                <p className="font-medium">{publicItems.length}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                <Clock className="h-5 w-5 text-primary mb-1" />
                <p className="text-xs text-gray-500 dark:text-gray-400">Activities</p>
                <p className="font-medium">{activityFeed.length}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="w-full md:w-2/3">
          {/* Tab navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('wardrobe')}
                className={`py-2 px-4 font-medium text-sm border-b-2 -mb-px ${
                  activeTab === 'wardrobe'
                    ? 'text-primary border-primary'
                    : 'text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Wardrobe
              </button>
              <button
                onClick={() => {
                  setActiveTab('activity');
                  if (!activityFeed.length) {
                    fetchUserActivity();
                  }
                }}
                className={`py-2 px-4 font-medium text-sm border-b-2 -mb-px ${
                  activeTab === 'activity'
                    ? 'text-primary border-primary'
                    : 'text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Activity
              </button>
            </div>
          </div>
          
          {/* Wardrobe content */}
          {activeTab === 'wardrobe' && (
            <>
              <h2 className="text-xl font-bold mb-6">{isOwnProfile ? 'Your public items' : 'Public wardrobe items'}</h2>
              
              {publicItems.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
                  <p className="text-muted-foreground">No public items to display</p>
                  {isOwnProfile && (
                    <p className="mt-2 text-sm text-gray-500">
                      Set items to public in your wardrobe to display them here
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {publicItems.map((item) => (
                    <div 
                      key={item.item_id} 
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
                    >
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          
          {/* Activity content */}
          {activeTab === 'activity' && (
            <>
              <h2 className="text-xl font-bold mb-6">Activity Feed</h2>
              
              {isLoadingActivity ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : activityFeed.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
                  <p className="text-muted-foreground">No activity to display</p>
                  {isOwnProfile && (
                    <p className="mt-2 text-sm text-gray-500">
                      Your public actions will appear here
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {activityFeed.map(renderActivityItem)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}