'use client';

import * as Slider from '@radix-ui/react-slider';
import { useState, useEffect } from 'react';

interface RatingSliderProps {
  initialValue?: number;
  onValueChange?: (value: number) => void;
  lookId: string;
}

export function RatingSlider({ initialValue = 3, onValueChange, lookId }: RatingSliderProps) {
  const [value, setValue] = useState(initialValue);
  const [isDragging, setIsDragging] = useState(false);

  // Load saved rating from localStorage on mount
  useEffect(() => {
    const savedRating = localStorage.getItem(`rating-${lookId}`);
    if (savedRating) {
      setValue(parseInt(savedRating, 10));
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
          Rating
        </span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {value}/5
        </span>
      </div>

      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        value={[value]}
        onValueChange={handleValueChange}
        onValueCommit={handleValueCommit}
        max={5}
        step={1}
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