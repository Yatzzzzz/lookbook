'use client';

import { useState, useEffect } from 'react';
import BottomNav from '@/components/BottomNav';

type Trend = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  popularity: number;
};

type Influencer = {
  id: string;
  username: string;
  avatarUrl: string;
  followers: number;
  bio: string;
};

export default function TrendsPage() {
  const [activeTab, setActiveTab] = useState('top-looks');
  const [risingTrends, setRisingTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tabs = [
    { id: 'top-looks', name: 'Top Looks' },
    { id: 'top-influencers', name: 'Top Influencers' },
    { id: 'top-wardrobes', name: 'Top Wardrobes' },
    { id: 'rising-trends', name: 'Rising Trends' },
  ];

  // Mock data for demonstration
  const mockInfluencers: Influencer[] = [
    {
      id: '1',
      username: 'fashionista',
      avatarUrl: 'https://i.pravatar.cc/150?img=1',
      followers: 15000,
      bio: 'Fashion blogger and stylist with a love for sustainable fashion',
    },
    {
      id: '2',
      username: 'stylemaster',
      avatarUrl: 'https://i.pravatar.cc/150?img=2',
      followers: 12500,
      bio: 'Helping you find your unique style every day',
    },
    {
      id: '3',
      username: 'trendwatcher',
      avatarUrl: 'https://i.pravatar.cc/150?img=3',
      followers: 9800,
      bio: 'Always one step ahead of the latest fashion trends',
    },
    {
      id: '4',
      username: 'chic_style',
      avatarUrl: 'https://i.pravatar.cc/150?img=4',
      followers: 8700,
      bio: 'Everyday chic style for the modern woman',
    },
  ];

  const mockTrends: Trend[] = [
    {
      id: '1',
      title: 'Oversized Blazers',
      description: 'Relaxed fit blazers paired with casual items',
      imageUrl: 'https://via.placeholder.com/300',
      popularity: 95,
    },
    {
      id: '2',
      title: 'Statement Collars',
      description: 'Bold, embellished collars that stand out',
      imageUrl: 'https://via.placeholder.com/300',
      popularity: 87,
    },
    {
      id: '3',
      title: 'Pastel Suits',
      description: 'Soft-colored suits for a fresh office look',
      imageUrl: 'https://via.placeholder.com/300',
      popularity: 82,
    },
    {
      id: '4',
      title: 'Platform Boots',
      description: 'Chunky platform boots with everything',
      imageUrl: 'https://via.placeholder.com/300',
      popularity: 79,
    },
  ];

  useEffect(() => {
    // Fetch rising trends on tab change or component mount
    if (activeTab === 'rising-trends') {
      fetchRisingTrends();
    }
  }, [activeTab]);

  // Simulate API call to fetch rising trends
  const fetchRisingTrends = async () => {
    setLoading(true);
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/trends/rising');
      // const data = await response.json();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use mock data for now
      setRisingTrends(mockTrends);
    } catch (err) {
      console.error('Error fetching rising trends:', err);
      setError('Failed to load rising trends');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-16">
      <h1 className="text-2xl font-bold p-4">Fashion Trends</h1>
      
      {/* Tabs */}
      <div className="flex overflow-x-auto border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`px-4 py-2 ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {/* Top Looks Tab */}
        {activeTab === 'top-looks' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Top Trending Looks</h2>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="h-40 bg-gray-200"></div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium">Look #{item}</div>
                      <div className="text-xs text-blue-600 font-semibold">
                        {Math.floor(Math.random() * 1000)} likes
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <div className="h-5 w-5 bg-gray-300 rounded-full mr-1"></div>
                      <span>@username{item}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Influencers Tab */}
        {activeTab === 'top-influencers' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Top Fashion Influencers</h2>
            <div className="space-y-4">
              {mockInfluencers.map((influencer) => (
                <div key={influencer.id} className="bg-white rounded-lg shadow-md p-3 flex items-center">
                  <div className="flex-shrink-0 mr-3">
                    <div className="h-14 w-14 rounded-full overflow-hidden">
                      <img
                        src={influencer.avatarUrl}
                        alt={influencer.username}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="font-medium">@{influencer.username}</div>
                    <div className="text-xs text-gray-500 line-clamp-2 mb-1">
                      {influencer.bio}
                    </div>
                    <div className="text-xs text-blue-600 font-semibold">
                      {influencer.followers.toLocaleString()} followers
                    </div>
                  </div>
                  <button className="flex-shrink-0 bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Wardrobes Tab */}
        {activeTab === 'top-wardrobes' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Top Virtual Wardrobes</h2>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="h-8 bg-gray-100 border-b p-2 flex items-center justify-between">
                    <div className="text-sm font-medium">Wardrobe #{item}</div>
                    <div className="text-xs text-gray-500">@username{item}</div>
                  </div>
                  <div className="p-3">
                    <div className="grid grid-cols-4 gap-1 mb-3">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((img) => (
                        <div key={img} className="h-12 bg-gray-200 rounded-sm"></div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs">
                      <div className="text-gray-500">{20 + item * 10} items</div>
                      <div className="text-blue-600">View All</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rising Trends Tab */}
        {activeTab === 'rising-trends' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Rising Fashion Trends</h2>
            {loading ? (
              <div className="text-center py-8">Loading trends...</div>
            ) : error ? (
              <div className="bg-red-100 text-red-700 p-3 rounded-lg">
                {error}
              </div>
            ) : (
              <div className="space-y-4">
                {risingTrends.map((trend) => (
                  <div key={trend.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="h-40 bg-gray-200">
                      <img
                        src={trend.imageUrl}
                        alt={trend.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <div className="font-medium">{trend.title}</div>
                      <div className="text-xs text-gray-500 mb-2">
                        {trend.description}
                      </div>
                      <div className="relative w-full h-2 bg-gray-200 rounded overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-blue-600"
                          style={{ width: `${trend.popularity}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-right mt-1">
                        Popularity: {trend.popularity}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
} 