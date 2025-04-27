'use client';

import { useWardrobe } from '../context/WardrobeContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PieChart } from 'lucide-react';

export function StyleDistribution() {
  const { wardrobeItems, isLoading } = useWardrobe();
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading style analysis...</p>
      </div>
    );
  }
  
  // Define common style categories
  const styleCategories = {
    'casual': { count: 0, color: 'bg-blue-500' },
    'formal': { count: 0, color: 'bg-purple-500' },
    'business casual': { count: 0, color: 'bg-indigo-500' },
    'streetwear': { count: 0, color: 'bg-red-500' },
    'bohemian': { count: 0, color: 'bg-orange-500' },
    'minimalist': { count: 0, color: 'bg-gray-500' },
    'vintage': { count: 0, color: 'bg-amber-500' },
    'athletic': { count: 0, color: 'bg-green-500' },
    'other': { count: 0, color: 'bg-gray-400' }
  };
  
  // Count items by style
  wardrobeItems.forEach(item => {
    if (item.style) {
      const style = item.style.toLowerCase();
      if (style in styleCategories) {
        styleCategories[style].count++;
      } else {
        styleCategories['other'].count++;
      }
    } else {
      styleCategories['other'].count++;
    }
  });
  
  // Calculate percentages and prepare data for display
  const totalItems = wardrobeItems.length;
  const styleData = Object.entries(styleCategories)
    .map(([style, data]) => ({
      style,
      count: data.count,
      percentage: totalItems > 0 ? Math.round((data.count / totalItems) * 100) : 0,
      color: data.color
    }))
    .sort((a, b) => b.count - a.count);
  
  // Find dominant styles (styles that make up more than 15% of the wardrobe)
  const dominantStyles = styleData
    .filter(style => style.percentage >= 15)
    .map(style => style.style);
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">Style Distribution</CardTitle>
        <PieChart className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        {styleData.length === 0 ? (
          <div className="text-center py-4 text-sm text-gray-500">
            No style data available
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {styleData.map(style => (
                <div key={style.style}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium capitalize">{style.style}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {style.count} ({style.percentage}%)
                    </span>
                  </div>
                  <div className="mt-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${style.color} rounded-full`}
                      style={{ width: `${style.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-md font-medium mb-2">Your Style Persona</h3>
              {dominantStyles.length > 0 ? (
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm">
                    Your wardrobe has a dominant {dominantStyles.map(s => <span key={s} className="font-medium capitalize">{s}</span>).reduce((prev, curr, i, arr) => {
                      return i === 0 ? curr : i === arr.length - 1 ? <>{prev} and {curr}</> : <>{prev}, {curr}</>;
                    }, null)} style.
                  </p>
                  <p className="text-sm mt-2">
                    {dominantStyles.length === 1 
                      ? "Consider adding different styles to diversify your options."
                      : "You have a good mix of dominant styles that you can combine for various looks."}
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm">
                    Your wardrobe doesn't have a dominant style yet. Consider defining your style preferences
                    by adding more items with consistent styles.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 