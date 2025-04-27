'use client';

import { useState } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search } from 'lucide-react';

export function WardrobeGapAnalysis() {
  const { wardrobeItems, isLoading } = useWardrobe();
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading gap analysis...</p>
      </div>
    );
  }
  
  // Essential wardrobe items by category
  const essentialItems = {
    top: [
      { name: 'White T-shirt', seasons: ['spring', 'summer'] },
      { name: 'Black T-shirt', seasons: ['spring', 'summer'] },
      { name: 'Button-down shirt', seasons: ['spring', 'summer', 'fall'] },
      { name: 'Sweater', seasons: ['fall', 'winter'] },
      { name: 'Turtleneck', seasons: ['fall', 'winter'] },
    ],
    bottom: [
      { name: 'Blue jeans', seasons: ['spring', 'summer', 'fall', 'winter'] },
      { name: 'Black pants', seasons: ['fall', 'winter'] },
      { name: 'Chinos', seasons: ['spring', 'summer', 'fall'] },
      { name: 'Shorts', seasons: ['spring', 'summer'] },
    ],
    dress: [
      { name: 'Casual dress', seasons: ['spring', 'summer'] },
      { name: 'Formal dress', seasons: ['spring', 'summer', 'fall', 'winter'] },
    ],
    outerwear: [
      { name: 'Light jacket', seasons: ['spring', 'fall'] },
      { name: 'Winter coat', seasons: ['winter'] },
      { name: 'Rain jacket', seasons: ['spring', 'fall'] },
    ],
    shoes: [
      { name: 'Sneakers', seasons: ['spring', 'summer', 'fall'] },
      { name: 'Boots', seasons: ['fall', 'winter'] },
      { name: 'Dress shoes', seasons: ['spring', 'summer', 'fall', 'winter'] },
      { name: 'Sandals', seasons: ['summer'] },
    ],
    accessories: [
      { name: 'Scarf', seasons: ['fall', 'winter'] },
      { name: 'Gloves', seasons: ['winter'] },
      { name: 'Belt', seasons: ['spring', 'summer', 'fall', 'winter'] },
      { name: 'Hat/Cap', seasons: ['spring', 'summer'] },
    ],
    bags: [
      { name: 'Everyday bag', seasons: ['spring', 'summer', 'fall', 'winter'] },
      { name: 'Travel bag', seasons: ['spring', 'summer', 'fall', 'winter'] },
    ],
  };

  // Essential occasions to cover
  const essentialOccasions = ['casual', 'work', 'formal', 'sport'];
  
  // Check what categories are missing items
  const categoryGaps = Object.entries(essentialItems).map(([category, items]) => {
    const userItemsInCategory = wardrobeItems.filter(item => item.category === category);
    const hasEnoughItems = userItemsInCategory.length >= Math.ceil(items.length * 0.6); // 60% coverage
    return {
      category,
      items: items.map(item => item.name),
      hasEnoughItems,
      count: userItemsInCategory.length,
      recommended: items.length,
    };
  });
  
  // Check season coverage
  const seasons = ['spring', 'summer', 'fall', 'winter'];
  const seasonGaps = seasons.map(season => {
    const itemsForSeason = wardrobeItems.filter(item => 
      item.season && item.season.includes(season)
    );
    
    // Calculate how many essential items for this season are covered
    let essentialCount = 0;
    let totalEssentials = 0;
    
    Object.entries(essentialItems).forEach(([category, items]) => {
      items.forEach(item => {
        if (item.seasons.includes(season)) {
          totalEssentials++;
          // Check if user has at least one item in this category for this season
          if (wardrobeItems.some(userItem => 
            userItem.category === category && 
            userItem.season && 
            userItem.season.includes(season)
          )) {
            essentialCount++;
          }
        }
      });
    });
    
    const coveragePercentage = totalEssentials > 0 
      ? Math.round((essentialCount / totalEssentials) * 100) 
      : 0;
    
    return {
      season,
      items: itemsForSeason.length,
      coverage: coveragePercentage,
      hasGoodCoverage: coveragePercentage >= 70
    };
  });
  
  // Check occasion coverage
  const occasionGaps = essentialOccasions.map(occasion => {
    const itemsForOccasion = wardrobeItems.filter(item => 
      item.occasion && item.occasion.includes(occasion)
    );
    
    return {
      occasion,
      items: itemsForOccasion.length,
      hasEnoughItems: itemsForOccasion.length >= 5, // Arbitrary threshold of at least 5 items
    };
  });
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Wardrobe Gap Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-md font-medium mb-2">Category Gaps</h3>
            <div className="space-y-2">
              {categoryGaps.map(gap => (
                <div key={gap.category} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium capitalize">{gap.category}</span>
                    <span className={`text-sm ${gap.hasEnoughItems ? 'text-green-500' : 'text-amber-500'}`}>
                      {gap.count}/{gap.recommended}
                    </span>
                  </div>
                  {!gap.hasEnoughItems && (
                    <p className="text-sm text-gray-500 mt-1">
                      Consider adding more {gap.category} items
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-2">
            <h3 className="text-md font-medium mb-2">Seasonal Coverage</h3>
            <div className="grid grid-cols-2 gap-2">
              {seasonGaps.map(gap => (
                <div key={gap.season} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium capitalize">{gap.season}</span>
                    <span className={`text-sm ${gap.hasGoodCoverage ? 'text-green-500' : 'text-amber-500'}`}>
                      {gap.coverage}% coverage
                    </span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${gap.hasGoodCoverage ? 'bg-green-500' : 'bg-amber-500'}`}
                      style={{ width: `${gap.coverage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-2">
            <h3 className="text-md font-medium mb-2">Occasion Coverage</h3>
            <div className="grid grid-cols-2 gap-2">
              {occasionGaps.map(gap => (
                <div key={gap.occasion} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium capitalize">{gap.occasion}</span>
                    <span className={`text-sm ${gap.hasEnoughItems ? 'text-green-500' : 'text-amber-500'}`}>
                      {gap.items} items
                    </span>
                  </div>
                  {!gap.hasEnoughItems && (
                    <p className="text-sm text-gray-500 mt-1">
                      Add more items for {gap.occasion} occasions
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 