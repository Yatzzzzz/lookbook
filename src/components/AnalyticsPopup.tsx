"use client";

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AnalyticsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

interface ViewData {
  date: string;
  views: number;
}

interface InteractionData {
  name: string;
  value: number;
}

export function AnalyticsPopup({ isOpen, onClose, userId }: AnalyticsPopupProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'engagement' | 'followers'>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [viewsData, setViewsData] = useState<ViewData[]>([]);
  const [interactionData, setInteractionData] = useState<InteractionData[]>([]);
  const [demographicData, setDemographicData] = useState<{ age: InteractionData[], location: InteractionData[] }>({
    age: [],
    location: []
  });
  const [stats, setStats] = useState({
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    totalFollowers: 0,
    newFollowersThisWeek: 0,
    followersGrowthRate: 0
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#9370DB', '#FF6347'];

  useEffect(() => {
    if (isOpen) {
      fetchAnalyticsData();
    }
  }, [isOpen, userId]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch data from Supabase or an API
      // Mock data for demonstration
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Views data for the past 7 days
      const mockViewsData: ViewData[] = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        mockViewsData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          views: Math.floor(Math.random() * 500) + 100
        });
      }
      setViewsData(mockViewsData);
      
      // Interactions data
      setInteractionData([
        { name: 'Likes', value: 1243 },
        { name: 'Comments', value: 357 },
        { name: 'Shares', value: 189 },
        { name: 'Saves', value: 432 }
      ]);
      
      // Demographic data
      setDemographicData({
        age: [
          { name: '18-24', value: 35 },
          { name: '25-34', value: 42 },
          { name: '35-44', value: 15 },
          { name: '45-54', value: 5 },
          { name: '55+', value: 3 }
        ],
        location: [
          { name: 'United States', value: 45 },
          { name: 'United Kingdom', value: 15 },
          { name: 'Canada', value: 10 },
          { name: 'Australia', value: 8 },
          { name: 'Germany', value: 7 },
          { name: 'Other', value: 15 }
        ]
      });
      
      // Overall stats
      setStats({
        totalViews: 12468,
        totalLikes: 1243,
        totalComments: 357,
        totalShares: 189,
        totalFollowers: 5642,
        newFollowersThisWeek: 132,
        followersGrowthRate: 2.4
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold">Your Analytics Dashboard</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b dark:border-gray-700">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'overview'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'engagement'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
            onClick={() => setActiveTab('engagement')}
          >
            Engagement
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'followers'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
            onClick={() => setActiveTab('followers')}
          >
            Followers
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 128px)' }}>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Views</p>
                      <h3 className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</h3>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Likes</p>
                      <h3 className="text-2xl font-bold">{stats.totalLikes.toLocaleString()}</h3>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Comments</p>
                      <h3 className="text-2xl font-bold">{stats.totalComments.toLocaleString()}</h3>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Followers</p>
                      <h3 className="text-2xl font-bold">{stats.totalFollowers.toLocaleString()}</h3>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Profile Views (Last 7 Days)</h3>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={viewsData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="views" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Interactions</h3>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg h-64 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={interactionData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              fill="#8884d8"
                              paddingAngle={5}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {interactionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Audience Age Demographics</h3>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg h-64 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={demographicData.age}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              fill="#8884d8"
                              paddingAngle={5}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {demographicData.age.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Engagement Tab */}
              {activeTab === 'engagement' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Engagement Rate</p>
                      <h3 className="text-2xl font-bold">4.8%</h3>
                      <p className="text-xs text-green-500 flex items-center mt-1">
                        <span>↑</span> 0.6% from last week
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Time Spent</p>
                      <h3 className="text-2xl font-bold">2m 43s</h3>
                      <p className="text-xs text-green-500 flex items-center mt-1">
                        <span>↑</span> 12s from last week
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Content Reach</p>
                      <h3 className="text-2xl font-bold">18.4k</h3>
                      <p className="text-xs text-green-500 flex items-center mt-1">
                        <span>↑</span> 1.2k from last week
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-4">Top Performing Content</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 p-3 bg-white dark:bg-gray-800 rounded-md">
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-md flex-shrink-0"></div>
                        <div className="flex-grow">
                          <h4 className="font-medium">Summer Fashion Collection Post</h4>
                          <div className="flex space-x-4 text-sm mt-1">
                            <span className="text-gray-500">
                              <span className="font-medium text-black dark:text-white">2.4k</span> views
                            </span>
                            <span className="text-gray-500">
                              <span className="font-medium text-black dark:text-white">312</span> likes
                            </span>
                            <span className="text-gray-500">
                              <span className="font-medium text-black dark:text-white">48</span> comments
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 p-3 bg-white dark:bg-gray-800 rounded-md">
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-md flex-shrink-0"></div>
                        <div className="flex-grow">
                          <h4 className="font-medium">Streetwear Essentials Tutorial</h4>
                          <div className="flex space-x-4 text-sm mt-1">
                            <span className="text-gray-500">
                              <span className="font-medium text-black dark:text-white">1.8k</span> views
                            </span>
                            <span className="text-gray-500">
                              <span className="font-medium text-black dark:text-white">249</span> likes
                            </span>
                            <span className="text-gray-500">
                              <span className="font-medium text-black dark:text-white">31</span> comments
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 p-3 bg-white dark:bg-gray-800 rounded-md">
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-md flex-shrink-0"></div>
                        <div className="flex-grow">
                          <h4 className="font-medium">Minimalist Wardrobe Guide</h4>
                          <div className="flex space-x-4 text-sm mt-1">
                            <span className="text-gray-500">
                              <span className="font-medium text-black dark:text-white">1.5k</span> views
                            </span>
                            <span className="text-gray-500">
                              <span className="font-medium text-black dark:text-white">187</span> likes
                            </span>
                            <span className="text-gray-500">
                              <span className="font-medium text-black dark:text-white">27</span> comments
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Engagement by Time of Day</h3>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { time: '12am-4am', engagement: 124 },
                            { time: '4am-8am', engagement: 247 },
                            { time: '8am-12pm', engagement: 513 },
                            { time: '12pm-4pm', engagement: 689 },
                            { time: '4pm-8pm', engagement: 842 },
                            { time: '8pm-12am', engagement: 621 }
                          ]}
                          margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="engagement" fill="#8884d8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Followers Tab */}
              {activeTab === 'followers' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Followers</p>
                      <h3 className="text-2xl font-bold">{stats.totalFollowers.toLocaleString()}</h3>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">New This Week</p>
                      <h3 className="text-2xl font-bold">+{stats.newFollowersThisWeek}</h3>
                      <p className="text-xs text-green-500 flex items-center mt-1">
                        <span>↑</span> {stats.followersGrowthRate}% growth rate
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Follower Engagement</p>
                      <h3 className="text-2xl font-bold">6.2%</h3>
                      <p className="text-xs text-green-500 flex items-center mt-1">
                        <span>↑</span> 0.8% from last week
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Follower Geography</h3>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={demographicData.location}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {demographicData.location.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Follower Growth</h3>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { month: 'Jan', followers: 3840 },
                              { month: 'Feb', followers: 4102 },
                              { month: 'Mar', followers: 4390 },
                              { month: 'Apr', followers: 4721 },
                              { month: 'May', followers: 5125 },
                              { month: 'Jun', followers: 5642 }
                            ]}
                            margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="followers" fill="#4ade80" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-4">Recent Followers</h3>
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 mr-3"></div>
                          <div>
                            <h4 className="font-medium">User Name {i}</h4>
                            <p className="text-xs text-gray-500">Followed you 2d ago</p>
                          </div>
                          <button className="ml-auto text-sm text-blue-500 hover:underline">View Profile</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 