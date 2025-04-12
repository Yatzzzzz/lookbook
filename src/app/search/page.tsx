'use client';

import { useState } from 'react';
import BottomNav from '@/components/BottomNav';

// Force dynamic rendering to prevent static prerendering issues with Supabase
export const dynamic = 'force-dynamic';

export default function Search() {
  const [activeTab, setActiveTab] = useState('most-searched');

  const tabs = [
    { id: 'most-searched', name: 'Most Searched' },
    { id: 'surprise-me', name: 'Surprise Me' },
    { id: 'mood-boards', name: 'Mood Boards' },
    { id: 'ai-search', name: 'AI Search' },
  ];

  return (
    <div className="pb-16">
      <h1 className="text-2xl font-bold p-4">Search</h1>
      
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