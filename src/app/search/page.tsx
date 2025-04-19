'use client';

import { useState } from 'react';
import BottomNav from '@/components/BottomNav';
import { Search as SearchIcon } from 'lucide-react';

// Force dynamic rendering to prevent static prerendering issues with Supabase
export const dynamic = 'force-dynamic';

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('most-searched');

  const tabs = [
    { id: 'most-searched', name: 'Most Searched' },
    { id: 'surprise-me', name: 'Surprise Me' },
    { id: 'mood-boards', name: 'Mood Boards' },
    { id: 'ai-search', name: 'AI Search' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality here
    console.log('Searching for:', searchQuery);
  };

  return (
    <div className="pb-16">
      <h1 className="text-2xl font-bold p-4">Search</h1>
      
      {/* Main Search Bar */}
      <div className="px-4 mb-4">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <SearchIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
            <input
              type="text"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              placeholder="Search for outfits, styles, trends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button 
              type="submit"
              className="absolute right-2.5 top-2.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <span className="sr-only">Search</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </button>
          </div>
        </form>
      </div>
      
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
        {activeTab === 'most-searched' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Most Searched Looks</h2>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="bg-gray-100 h-48 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Trending Look {item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'surprise-me' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Surprise Me</h2>
            <p className="text-gray-600 mb-4">Discover random or personalized look recommendations</p>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="bg-gray-100 h-48 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Surprise Look {item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'mood-boards' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Mood Boards</h2>
            <p className="text-gray-600 mb-4">User-created visual inspiration boards</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Mood Board {item}</h3>
                  <div className="grid grid-cols-3 gap-1">
                    {[1, 2, 3, 4, 5, 6].map((img) => (
                      <div key={img} className="bg-gray-200 aspect-square"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ai-search' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">AI Search</h2>
            <p className="text-gray-600 mb-4">Text-based search using AI</p>
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Find a red dress for a party..."
                  className="w-full border rounded-full py-2 px-4 pr-10"
                />
                <button className="absolute right-2 top-2 text-blue-600">
                  🔍
                </button>
              </div>
            </div>
            <div className="mt-8 text-center text-gray-500">
              <p>Type your fashion query above to get AI-powered results</p>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
} 