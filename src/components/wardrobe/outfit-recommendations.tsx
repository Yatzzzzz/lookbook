'use client';

import React, { useState, useEffect } from 'react';
import { WardrobeItem } from '@/app/context/WardrobeContext';
import { getOutfitRecommendations, getWeatherBasedRecommendations } from '@/utils/outfit-recommendation-engine';
import { Loader2, ThumbsUp, ThumbsDown, Save, Cloud, Thermometer, Calendar } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import * as ScrollArea from '@radix-ui/react-scroll-area';

interface OutfitRecommendationsProps {
  wardrobeItems: WardrobeItem[];
  onSaveOutfit?: (outfitItems: WardrobeItem[], name: string, metadata: any) => void;
  isLoading?: boolean;
}

interface RecommendedOutfit {
  name: string;
  description: string;
  items: WardrobeItem[];
  occasion?: string;
  season?: string;
  weatherSuitability?: string[];
  reasoning: string;
  score: number;
}

export function OutfitRecommendations({ 
  wardrobeItems, 
  onSaveOutfit,
  isLoading: externalLoading
}: OutfitRecommendationsProps) {
  const [outfits, setOutfits] = useState<RecommendedOutfit[]>([]);
  const [weatherOutfits, setWeatherOutfits] = useState<RecommendedOutfit[]>([]);
  const [occasionOutfits, setOccasionOutfits] = useState<RecommendedOutfit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('weather');
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'like' | 'dislike'>>({});
  const [selectedOccasion, setSelectedOccasion] = useState<string>('casual');
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  
  const occasions = [
    'casual', 'work', 'formal', 'date', 'party', 'vacation', 'workout'
  ];
  
  const seasons = [
    'spring', 'summer', 'fall', 'winter'
  ];
  
  // Load recommendations when wardrobe items change
  useEffect(() => {
    if (wardrobeItems.length < 3) {
      // Not enough items for meaningful recommendations
      return;
    }
    
    loadRecommendations();
  }, [wardrobeItems]);
  
  // Reload occasion-based recommendations when selections change
  useEffect(() => {
    if (wardrobeItems.length < 3 || !selectedOccasion) {
      return;
    }
    
    loadOccasionRecommendations();
  }, [selectedOccasion, selectedSeason]);
  
  // Load all types of recommendations
  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      // Load weather-based recommendations
      const weatherRecs = await getWeatherBasedRecommendations(wardrobeItems);
      setWeatherOutfits(weatherRecs);
      
      // Load occasion-based recommendations
      await loadOccasionRecommendations();
      
      // Set generic recommendations as a fallback
      const generalRecs = await getOutfitRecommendations({ items: wardrobeItems });
      setOutfits(generalRecs);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load occasion-specific recommendations
  const loadOccasionRecommendations = async () => {
    setIsLoading(true);
    try {
      const occasionRecs = await getOutfitRecommendations({
        items: wardrobeItems,
        occasion: selectedOccasion,
        season: selectedSeason || undefined
      });
      setOccasionOutfits(occasionRecs);
    } catch (error) {
      console.error('Error loading occasion recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle saving an outfit
  const handleSaveOutfit = (outfit: RecommendedOutfit) => {
    if (onSaveOutfit) {
      onSaveOutfit(
        outfit.items,
        outfit.name,
        {
          occasion: outfit.occasion,
          season: outfit.season,
          weatherSuitability: outfit.weatherSuitability,
          description: outfit.description
        }
      );
    }
  };
  
  // Record user feedback on recommendations
  const handleFeedback = (outfitName: string, type: 'like' | 'dislike') => {
    setFeedbackGiven(prev => ({
      ...prev,
      [outfitName]: type
    }));
    
    // In a real app, this would send feedback to the server to improve recommendations
    console.log(`User ${type}d outfit: ${outfitName}`);
  };
  
  // Get the current active recommendations based on tab
  const activeRecommendations = () => {
    switch (activeTab) {
      case 'weather':
        return weatherOutfits;
      case 'occasion':
        return occasionOutfits;
      default:
        return outfits;
    }
  };
  
  // Check if loading
  const loading = isLoading || externalLoading;
  const noRecommendations = activeRecommendations().length === 0;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <h3 className="text-lg font-semibold mb-4">Outfit Recommendations</h3>
      
      {wardrobeItems.length < 3 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>Add at least 3 items to your wardrobe to get outfit recommendations.</p>
        </div>
      ) : (
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
            <Tabs.Trigger
              value="weather"
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'weather'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Cloud size={16} className="mr-2" />
                Weather-based
              </div>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="occasion"
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'occasion'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Calendar size={16} className="mr-2" />
                Occasion-based
              </div>
            </Tabs.Trigger>
          </Tabs.List>
          
          {/* Weather-based recommendations tab */}
          <Tabs.Content value="weather" className="focus:outline-none">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : noRecommendations ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No weather-based recommendations available.</p>
                <button
                  onClick={loadRecommendations}
                  className="mt-2 text-blue-500 hover:text-blue-600"
                >
                  Refresh
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                  <Thermometer size={20} className="text-blue-500 mr-2" />
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Recommendations based on today's weather in your location.
                  </p>
                </div>
                
                <ScrollArea.Root className="max-h-[500px] overflow-auto pr-3">
                  <ScrollArea.Viewport className="space-y-4">
                    {weatherOutfits.map((outfit, index) => (
                      <OutfitRecommendationCard
                        key={`weather-${index}`}
                        outfit={outfit}
                        onSave={() => handleSaveOutfit(outfit)}
                        onLike={() => handleFeedback(outfit.name, 'like')}
                        onDislike={() => handleFeedback(outfit.name, 'dislike')}
                        feedbackType={feedbackGiven[outfit.name]}
                      />
                    ))}
                  </ScrollArea.Viewport>
                  <ScrollArea.Scrollbar
                    orientation="vertical"
                    className="w-2 bg-gray-100 dark:bg-gray-700 rounded-full"
                  >
                    <ScrollArea.Thumb className="bg-gray-300 dark:bg-gray-600 rounded-full" />
                  </ScrollArea.Scrollbar>
                </ScrollArea.Root>
              </div>
            )}
          </Tabs.Content>
          
          {/* Occasion-based recommendations tab */}
          <Tabs.Content value="occasion" className="focus:outline-none">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Select Occasion
                    </label>
                    <select
                      value={selectedOccasion}
                      onChange={(e) => setSelectedOccasion(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                    >
                      {occasions.map(occasion => (
                        <option key={occasion} value={occasion}>
                          {occasion.charAt(0).toUpperCase() + occasion.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Select Season (Optional)
                    </label>
                    <select
                      value={selectedSeason}
                      onChange={(e) => setSelectedSeason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                    >
                      <option value="">Any Season</option>
                      {seasons.map(season => (
                        <option key={season} value={season}>
                          {season.charAt(0).toUpperCase() + season.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {noRecommendations ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>No occasion-based recommendations available.</p>
                    <button
                      onClick={loadOccasionRecommendations}
                      className="mt-2 text-blue-500 hover:text-blue-600"
                    >
                      Refresh
                    </button>
                  </div>
                ) : (
                  <ScrollArea.Root className="max-h-[500px] overflow-auto pr-3">
                    <ScrollArea.Viewport className="space-y-4">
                      {occasionOutfits.map((outfit, index) => (
                        <OutfitRecommendationCard
                          key={`occasion-${index}`}
                          outfit={outfit}
                          onSave={() => handleSaveOutfit(outfit)}
                          onLike={() => handleFeedback(outfit.name, 'like')}
                          onDislike={() => handleFeedback(outfit.name, 'dislike')}
                          feedbackType={feedbackGiven[outfit.name]}
                        />
                      ))}
                    </ScrollArea.Viewport>
                    <ScrollArea.Scrollbar
                      orientation="vertical"
                      className="w-2 bg-gray-100 dark:bg-gray-700 rounded-full"
                    >
                      <ScrollArea.Thumb className="bg-gray-300 dark:bg-gray-600 rounded-full" />
                    </ScrollArea.Scrollbar>
                  </ScrollArea.Root>
                )}
              </div>
            )}
          </Tabs.Content>
        </Tabs.Root>
      )}
    </div>
  );
}

// Outfit recommendation card component
interface OutfitRecommendationCardProps {
  outfit: RecommendedOutfit;
  onSave: () => void;
  onLike: () => void;
  onDislike: () => void;
  feedbackType?: 'like' | 'dislike';
}

function OutfitRecommendationCard({
  outfit,
  onSave,
  onLike,
  onDislike,
  feedbackType
}: OutfitRecommendationCardProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="p-4">
        <h4 className="font-medium text-lg mb-2">{outfit.name}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{outfit.description}</p>
        
        {/* Item grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {outfit.items.map((item) => (
            <div key={item.item_id} className="border rounded-md overflow-hidden">
              {item.image_path ? (
                <div className="aspect-w-1 aspect-h-1 w-full">
                  <img
                    src={item.image_path}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-w-1 aspect-h-1 w-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-400 dark:text-gray-500 text-xs">No image</span>
                </div>
              )}
              <div className="p-2">
                <p className="text-xs font-medium truncate">{item.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.category}</p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Details */}
        <div className="flex flex-wrap gap-2 mb-4">
          {outfit.occasion && (
            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded text-xs">
              {outfit.occasion}
            </span>
          )}
          {outfit.season && (
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-xs">
              {outfit.season}
            </span>
          )}
          {outfit.weatherSuitability?.map((weather) => (
            <span key={weather} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs">
              {weather}
            </span>
          ))}
        </div>
        
        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={onLike}
              className={`p-2 rounded-full ${
                feedbackType === 'like'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <ThumbsUp size={16} />
            </button>
            <button
              onClick={onDislike}
              className={`p-2 rounded-full ${
                feedbackType === 'dislike'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <ThumbsDown size={16} />
            </button>
          </div>
          
          <button
            onClick={onSave}
            className="flex items-center px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm"
          >
            <Save size={16} className="mr-1" />
            Save Outfit
          </button>
        </div>
      </div>
    </div>
  );
} 