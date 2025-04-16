'use client';

import { useState, useEffect } from 'react';
import * as Slider from '@radix-ui/react-slider';
import * as Tabs from '@radix-ui/react-tabs';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Masonry from 'react-masonry-css';
import { Heart, Star, TrendingUp, BarChart4, Award, Users } from 'lucide-react';

// Create a query client
const queryClient = new QueryClient();

// Types
interface Look {
  look_id: string;
  user_id: string;
  image_url: string;
  caption: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
  username: string;
  avatar_url?: string;
  rating?: number;
  rating_count?: number;
  average_rating?: number;
  tags?: string[];
}

interface ApiResponse {
  looks?: Look[];
  stats?: {
    total_ratings: number;
    average_rating: number;
    highest_rated_look?: Look;
    trending_looks?: Look[];
  };
  pagination: {
    has_more: boolean;
    total: number;
    page: number;
    limit: number;
  };
}

// Demo API functions
const fetchRatingData = async (tab: string, page: number = 1): Promise<ApiResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Generate random mock data
  const generateMockLooks = (count: number, highRating: boolean = false): Look[] => {
    return Array.from({ length: count }, (_, i) => {
      const rating = highRating 
        ? 4 + Math.random() // Between 4-5 for high rated
        : 1 + Math.random() * 4; // Between 1-5 for normal
        
      const ratingCount = 5 + Math.floor(Math.random() * 95); // Between 5-100 
        
      return {
        look_id: `look-${Math.random().toString(36).substring(2, 9)}`,
        user_id: `user-${Math.random().toString(36).substring(2, 9)}`,
        image_url: `https://picsum.photos/500/${600 + Math.floor(Math.random() * 400)}?random=${Math.floor(Math.random() * 1000)}`,
        caption: `Fashion look ${i + 1}`,
        created_at: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
        likes_count: Math.floor(Math.random() * 1000),
        comments_count: Math.floor(Math.random() * 100),
        views_count: Math.floor(Math.random() * 5000),
        username: `user${i + 1}`,
        avatar_url: `https://i.pravatar.cc/150?u=${i + 1}`,
        rating: Math.round(rating * 10) / 10, // One decimal place
        rating_count: ratingCount,
        average_rating: Math.round(rating * 10) / 10,
        tags: ['fashion', 'style', 'outfit', 'look', 'trend']
          .sort(() => 0.5 - Math.random())
          .slice(0, 3)
      };
    });
  };
  
  // Generate trending looks - higher view count, recent timestamps
  const generateTrendingLooks = (count: number): Look[] => {
    const looks = generateMockLooks(count);
    return looks.map(look => ({
      ...look,
      views_count: 2000 + Math.floor(Math.random() * 8000), // Higher views 2k-10k
      created_at: new Date(Date.now() - Math.floor(Math.random() * 604800000)).toISOString(), // Last week
    }));
  };
  
  // Generate high-rated looks
  const highRatedLooks = generateMockLooks(tab === 'top-rated' ? 12 : 1, true);
  const trendingLooks = generateTrendingLooks(tab === 'trending' ? 12 : 5);
  const regularLooks = generateMockLooks(tab === 'all' ? 12 : 0);
  
  let looks: Look[] = [];
  switch(tab) {
    case 'top-rated':
      looks = highRatedLooks;
      break;
    case 'trending':
      looks = trendingLooks;
      break;
    case 'all':
    default:
      looks = [...regularLooks, ...highRatedLooks.slice(0, 2), ...trendingLooks.slice(0, 2)];
      // Shuffle array for "all" tab
      looks.sort(() => 0.5 - Math.random());
  }
  
  // Calculate overall stats
  const total_ratings = looks.reduce((total, look) => total + (look.rating_count || 0), 0);
  const total_rated_value = looks.reduce((total, look) => 
    total + ((look.rating || 0) * (look.rating_count || 0)), 0);
  const average_rating = Math.round((total_rated_value / total_ratings) * 10) / 10;
  
  return {
    looks,
    stats: {
      total_ratings,
      average_rating,
      highest_rated_look: highRatedLooks[0],
      trending_looks: trendingLooks.slice(0, 3)
    },
    pagination: {
      has_more: page < 3,
      total: 36,
      page,
      limit: 12
    }
  };
};

// Rating Slider Component
function RatingSlider({ initialValue = 0, onValueChange, lookId }: { 
  initialValue?: number; 
  onValueChange?: (value: number) => void; 
  lookId: string 
}) {
  const [value, setValue] = useState(initialValue);
  const [isDragging, setIsDragging] = useState(false);

  // Load saved rating from localStorage on mount
  useEffect(() => {
    const savedRating = localStorage.getItem(`rating-${lookId}`);
    if (savedRating) {
      setValue(parseFloat(savedRating));
    }
  }, [lookId]);

  const handleValueChange = (newValue: number[]) => {
    setValue(newValue[0]);
    setIsDragging(true);
  };

  const handleValueCommit = (newValue: number[]) => {
    const finalValue = newValue[0];
    setValue(finalValue);
    setIsDragging(false);
    
    // Save to localStorage
    localStorage.setItem(`rating-${lookId}`, finalValue.toString());
    
    // Call the parent's onValueChange if provided
    if (onValueChange) {
      onValueChange(finalValue);
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Your Rating
        </span>
        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
          {value > 0 ? `${value}/5` : "Not rated"}
        </span>
      </div>

      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        value={[value]}
        onValueChange={handleValueChange}
        onValueCommit={handleValueCommit}
        max={5}
        step={0.5}
        aria-label="Rating"
      >
        <Slider.Track className="bg-gray-200 dark:bg-gray-700 relative grow rounded-full h-2">
          <Slider.Range className="absolute bg-blue-500 dark:bg-blue-400 rounded-full h-full" />
        </Slider.Track>
        <Slider.Thumb
          className={`block w-5 h-5 bg-white dark:bg-gray-800 shadow-lg rounded-full border ${
            isDragging ? 'border-blue-500 dark:border-blue-400' : 'border-gray-300 dark:border-gray-600'
          } focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400`}
          aria-label="Rating"
        />
      </Slider.Root>

      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Poor</span>
        <span>Average</span>
        <span>Good</span>
        <span>Very Good</span>
        <span>Excellent</span>
      </div>
    </div>
  );
}

// Star Rating Display Component
function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return (
    <div className="flex">
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
      ))}
      
      {/* Half star */}
      {hasHalfStar && (
        <div className="relative w-4 h-4">
          <Star className="absolute w-4 h-4 text-gray-300" />
          <div className="absolute overflow-hidden w-2 h-4">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          </div>
        </div>
      )}
      
      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
      ))}
    </div>
  );
}

// Stats Card Component
function StatsCard({ 
  icon, title, value, description, color = "blue" 
}: { 
  icon: React.ReactNode; 
  title: string; 
  value: string | number; 
  description?: string;
  color?: "blue" | "green" | "purple" | "amber" | "red";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
    green: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300",
    purple: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
    red: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
  };
  
  return (
    <div className="flex flex-col p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center mb-3">
        <div className={`p-2 rounded-full mr-2 ${colorClasses[color]}`}>
          {icon}
        </div>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
    </div>
  );
}

// Main component content
function RatingShowcaseContent() {
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  
  // Query for fetching rating data
  const { data, isLoading, isError } = useQuery({
    queryKey: ['ratings', activeTab, page],
    queryFn: () => fetchRatingData(activeTab, page),
  });
  
  // Handle rating change
  const handleRatingChange = (lookId: string, rating: number) => {
    setUserRatings(prev => ({
      ...prev,
      [lookId]: rating
    }));
    
    // In a real app, you would send this to the server
    console.log(`Rated look ${lookId} with ${rating} stars`);
  };
  
  // Handle load more
  const handleLoadMore = () => {
    if (data?.pagination.has_more) {
      setPage(prev => prev + 1);
    }
  };
  
  // Responsive breakpoints for masonry layout
  const masonryBreakpoints = {
    default: 3,
    1100: 3,
    700: 2,
    500: 1
  };
  
  return (
    <div className="max-w-6xl mx-auto px-4 pb-16">
      <h1 className="text-2xl font-bold my-4">Rating Showcase</h1>
      
      {/* Stats Cards */}
      {data?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard 
            icon={<Star className="h-5 w-5" />} 
            title="Average Rating" 
            value={data.stats.average_rating.toFixed(1)}
            description="Across all styles"
            color="amber"
          />
          <StatsCard 
            icon={<Users className="h-5 w-5" />} 
            title="Total Ratings" 
            value={data.stats.total_ratings.toLocaleString()}
            description="Community engagement"
            color="blue"
          />
          <StatsCard 
            icon={<Award className="h-5 w-5" />} 
            title="Highest Rated" 
            value={data.stats.highest_rated_look?.rating?.toFixed(1) || "0.0"}
            description={`By ${data.stats.highest_rated_look?.username || "unknown"}`}
            color="green"
          />
          <StatsCard 
            icon={<TrendingUp className="h-5 w-5" />} 
            title="Trending Looks" 
            value={data.stats.trending_looks?.length || 0}
            description="In the last 7 days"
            color="purple"
          />
        </div>
      )}
      
      {/* Tab navigation */}
      <Tabs.Root 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <Tabs.List className="flex w-full border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
          <Tabs.Trigger 
            value="all"
            className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 whitespace-nowrap"
          >
            All Looks
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="top-rated"
            className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 whitespace-nowrap"
          >
            Top Rated
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="trending"
            className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 whitespace-nowrap"
          >
            Trending
          </Tabs.Trigger>
        </Tabs.List>
        
        {/* Trending Looks Featured Section - Only on 'all' tab */}
        {activeTab === 'all' && data?.stats?.trending_looks && (
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
              <h2 className="text-lg font-semibold">Trending Looks</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.stats.trending_looks.map((look) => (
                <div key={look.look_id} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <img
                      src={look.image_url}
                      alt={look.caption}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Trending
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <img
                          src={look.avatar_url || "https://i.pravatar.cc/150"}
                          alt={look.username}
                          className="w-6 h-6 rounded-full mr-2 object-cover"
                        />
                        <span className="text-sm font-medium">{look.username}</span>
                      </div>
                      <div className="flex items-center">
                        <StarRating rating={look.rating || 0} />
                        <span className="ml-1 text-xs text-gray-500">({look.rating_count})</span>
                      </div>
                    </div>
                    <RatingSlider 
                      initialValue={userRatings[look.look_id] || 0} 
                      lookId={look.look_id} 
                      onValueChange={(value) => handleRatingChange(look.look_id, value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Top Rated Look - Only on 'all' tab */}
        {activeTab === 'all' && data?.stats?.highest_rated_look && (
          <div className="col-span-1 lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md p-3">
            <h3 className="font-bold text-lg mb-2 px-3">Highest Rated Look</h3>
            <div className="aspect-w-16 aspect-h-9 relative overflow-hidden rounded-md">
              <img 
                src={data.stats.highest_rated_look.image_url} 
                alt={data.stats.highest_rated_look.caption} 
                className="object-cover w-full h-64 bg-gray-200 dark:bg-gray-700"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img 
                      src={data.stats.highest_rated_look.avatar_url || 'https://i.pravatar.cc/150?img=8'} 
                      alt={data.stats.highest_rated_look.username}
                      className="w-8 h-8 rounded-full mr-2 border-2 border-white"
                    />
                    <span className="text-white font-medium">{data.stats.highest_rated_look.username}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <StarRating rating={data.stats.highest_rated_look.average_rating || 0} />
                    <span className="text-white ml-1 text-sm">
                      ({data.stats.highest_rated_look.rating_count || 0})
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 px-3">
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">{data.stats.highest_rated_look.caption}</p>
              <div className="mt-4">
                <div className="text-sm font-medium mb-1">Rate this look:</div>
                <RatingSlider 
                  initialValue={userRatings[data?.stats?.highest_rated_look?.look_id] || 0} 
                  lookId={data?.stats?.highest_rated_look?.look_id} 
                  onValueChange={(value) => data?.stats?.highest_rated_look?.look_id && handleRatingChange(data.stats.highest_rated_look.look_id, value)}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Main content - looks grid */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {activeTab === 'all' ? 'All Looks' : 
             activeTab === 'top-rated' ? 'Top Rated Looks' : 'Trending Looks'}
          </h2>
          
          {/* Loading state */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-2 text-gray-500">Loading looks...</p>
            </div>
          )}
          
          {/* Error state */}
          {isError && (
            <div className="text-center py-12 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-red-600 dark:text-red-400">Failed to load looks. Please try again.</p>
            </div>
          )}
          
          {/* Looks grid */}
          {!isLoading && !isError && data?.looks && (
            <Masonry
              breakpointCols={masonryBreakpoints}
              className="flex w-auto -ml-4"
              columnClassName="pl-4 bg-clip-padding"
            >
              {data.looks.map((look) => (
                <div key={look.look_id} className="mb-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="relative">
                      <img
                        src={look.image_url}
                        alt={look.caption}
                        className="w-full object-cover"
                        style={{ minHeight: '200px' }}
                      />
                      <div className="absolute top-2 right-2 flex items-center bg-black/70 text-white text-xs px-2 py-1 rounded">
                        <StarRating rating={look.rating || 0} />
                        <span className="ml-1">({look.rating_count})</span>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center mb-2">
                        <img
                          src={look.avatar_url || "https://i.pravatar.cc/150"}
                          alt={look.username}
                          className="w-6 h-6 rounded-full mr-2 object-cover"
                        />
                        <span className="text-sm font-medium">{look.username}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{look.caption}</p>
                      
                      <RatingSlider 
                        initialValue={userRatings[look.look_id] || 0} 
                        lookId={look.look_id} 
                        onValueChange={(value) => handleRatingChange(look.look_id, value)}
                      />
                      
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-gray-500">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <Heart size={14} />
                            <span className="text-xs">{look.likes_count}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star size={14} />
                            <span className="text-xs">{look.rating_count || 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <BarChart4 size={14} />
                          <span className="text-xs">{look.views_count}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Masonry>
          )}
          
          {/* Load more button */}
          {data?.pagination.has_more && (
            <div className="text-center mt-8">
              <button
                onClick={handleLoadMore}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </Tabs.Root>
    </div>
  );
}

// Export with QueryClientProvider
export default function RatingShowcasePage() {
  return (
    <QueryClientProvider client={queryClient}>
      <RatingShowcaseContent />
    </QueryClientProvider>
  );
} 