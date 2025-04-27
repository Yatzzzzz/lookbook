'use client';

import React, { useState } from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
import * as Label from '@radix-ui/react-label';
import { Check, Trash2, Plus } from 'lucide-react';

interface OccasionTaggerProps {
  selectedOccasions: string[];
  onChange: (occasions: string[]) => void;
  selectedSeasons: string[];
  onSeasonChange: (seasons: string[]) => void;
  allowCustom?: boolean;
}

// Predefined categories
const OCCASIONS = [
  'casual',
  'work',
  'formal',
  'semi-formal',
  'date',
  'party',
  'vacation',
  'workout',
  'outdoor',
  'interview',
  'wedding',
  'concert',
  'dinner'
];

const SEASONS = [
  'spring',
  'summer',
  'fall',
  'winter',
  'all-season'
];

const WEATHER_CONDITIONS = [
  'sunny',
  'rainy',
  'cold',
  'hot',
  'windy',
  'snowy',
  'humid',
  'dry'
];

export function OccasionTagger({
  selectedOccasions = [],
  onChange,
  selectedSeasons = [],
  onSeasonChange,
  allowCustom = true
}: OccasionTaggerProps) {
  const [customOccasion, setCustomOccasion] = useState('');
  const [selectedWeather, setSelectedWeather] = useState<string[]>([]);
  
  // Handle occasion selection
  const handleOccasionToggle = (occasion: string) => {
    if (selectedOccasions.includes(occasion)) {
      onChange(selectedOccasions.filter(o => o !== occasion));
    } else {
      onChange([...selectedOccasions, occasion]);
    }
  };
  
  // Handle season selection
  const handleSeasonToggle = (season: string) => {
    if (selectedSeasons.includes(season)) {
      onSeasonChange(selectedSeasons.filter(s => s !== season));
    } else {
      onSeasonChange([...selectedSeasons, season]);
    }
  };
  
  // Handle weather condition selection
  const handleWeatherToggle = (weather: string) => {
    if (selectedWeather.includes(weather)) {
      setSelectedWeather(selectedWeather.filter(w => w !== weather));
    } else {
      setSelectedWeather([...selectedWeather, weather]);
    }
  };
  
  // Add custom occasion
  const handleAddCustomOccasion = () => {
    if (customOccasion.trim() && !selectedOccasions.includes(customOccasion.trim())) {
      onChange([...selectedOccasions, customOccasion.trim()]);
      setCustomOccasion('');
    }
  };
  
  // Remove occasion
  const handleRemoveOccasion = (occasion: string) => {
    onChange(selectedOccasions.filter(o => o !== occasion));
  };
  
  // Handle key press in custom occasion input
  const handleCustomOccasionKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomOccasion();
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Selected occasions display */}
      {selectedOccasions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Selected Occasions:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedOccasions.map(occasion => (
              <div
                key={occasion}
                className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md text-sm"
              >
                {occasion}
                <button
                  type="button"
                  onClick={() => handleRemoveOccasion(occasion)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Occasion selection */}
      <div>
        <h4 className="text-sm font-medium mb-2">Occasions</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {OCCASIONS.map(occasion => (
            <div key={occasion} className="flex items-center space-x-2">
              <Checkbox.Root
                id={`occasion-${occasion}`}
                checked={selectedOccasions.includes(occasion)}
                onCheckedChange={() => handleOccasionToggle(occasion)}
                className="h-4 w-4 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center"
              >
                <Checkbox.Indicator>
                  <Check size={12} className="text-blue-600 dark:text-blue-400" />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <Label.Root
                htmlFor={`occasion-${occasion}`}
                className="text-sm cursor-pointer"
              >
                {occasion.charAt(0).toUpperCase() + occasion.slice(1)}
              </Label.Root>
            </div>
          ))}
        </div>
        
        {/* Custom occasion input */}
        {allowCustom && (
          <div className="mt-3 flex items-center">
            <input
              type="text"
              value={customOccasion}
              onChange={(e) => setCustomOccasion(e.target.value)}
              onKeyPress={handleCustomOccasionKeyPress}
              placeholder="Add custom occasion"
              className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-gray-800 text-sm"
            />
            <button
              type="button"
              onClick={handleAddCustomOccasion}
              disabled={!customOccasion.trim()}
              className="px-3 py-1 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>
      
      {/* Season selection */}
      <div>
        <h4 className="text-sm font-medium mb-2">Seasons</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SEASONS.map(season => (
            <div key={season} className="flex items-center space-x-2">
              <Checkbox.Root
                id={`season-${season}`}
                checked={selectedSeasons.includes(season)}
                onCheckedChange={() => handleSeasonToggle(season)}
                className="h-4 w-4 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center"
              >
                <Checkbox.Indicator>
                  <Check size={12} className="text-blue-600 dark:text-blue-400" />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <Label.Root
                htmlFor={`season-${season}`}
                className="text-sm cursor-pointer"
              >
                {season.charAt(0).toUpperCase() + season.slice(1)}
              </Label.Root>
            </div>
          ))}
        </div>
      </div>
      
      {/* Weather conditions */}
      <div>
        <h4 className="text-sm font-medium mb-2">Weather Conditions</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {WEATHER_CONDITIONS.map(weather => (
            <div key={weather} className="flex items-center space-x-2">
              <Checkbox.Root
                id={`weather-${weather}`}
                checked={selectedWeather.includes(weather)}
                onCheckedChange={() => handleWeatherToggle(weather)}
                className="h-4 w-4 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center"
              >
                <Checkbox.Indicator>
                  <Check size={12} className="text-blue-600 dark:text-blue-400" />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <Label.Root
                htmlFor={`weather-${weather}`}
                className="text-sm cursor-pointer"
              >
                {weather.charAt(0).toUpperCase() + weather.slice(1)}
              </Label.Root>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 