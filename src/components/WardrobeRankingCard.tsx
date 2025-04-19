'use client';

import { useWardrobe } from '@/app/context/WardrobeContext';
import { Loader2, Award, TrendingUp } from 'lucide-react';

export default function WardrobeRankingCard() {
  const { wardrobeRanking, isLoading, refreshRanking } = useWardrobe();

  const handleRefresh = () => {
    refreshRanking();
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
        <span>Loading ranking data...</span>
      </div>
    );
  }

  if (!wardrobeRanking) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Award className="h-5 w-5 mr-2 text-yellow-500" />
            Wardrobe Ranking
          </h2>
          <button
            onClick={handleRefresh}
            className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Refresh
          </button>
        </div>
        <div className="py-4 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-2">Your wardrobe hasn't been ranked yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Add more items to your wardrobe to see your ranking!
          </p>
        </div>
      </div>
    );
  }

  // Format the ranking information
  const { ranking_position, ranking_score, item_count } = wardrobeRanking;
  
  // Determine the badge color based on ranking
  const getBadgeColor = (position: number | null) => {
    if (!position) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    if (position <= 3) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    if (position <= 10) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (position <= 25) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Award className="h-5 w-5 mr-2 text-yellow-500" />
          Wardrobe Ranking
        </h2>
        <button
          onClick={handleRefresh}
          className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Refresh
        </button>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-gray-600 dark:text-gray-300 text-sm">Your position</span>
          <div className="flex items-center mt-1">
            {ranking_position ? (
              <div className={`rounded-full px-3 py-1 font-bold flex items-center ${getBadgeColor(ranking_position)}`}>
                <TrendingUp className="h-4 w-4 mr-1" />
                #{ranking_position}
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400">Not ranked yet</div>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className="text-gray-600 dark:text-gray-300 text-sm">Score</span>
          <div className="text-2xl font-bold mt-1">{ranking_score}</div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            How Ranking Works
          </h3>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 pl-5 list-disc">
            <li>Each item in your wardrobe adds to your score</li>
            <li>Bonus points for variety in your wardrobe categories</li>
            <li>Rankings update automatically when you modify your wardrobe</li>
          </ul>
        </div>
        
        <div className="pt-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
          Last updated: {new Date(wardrobeRanking.updated_at).toLocaleString()}
        </div>
      </div>
    </div>
  );
} 