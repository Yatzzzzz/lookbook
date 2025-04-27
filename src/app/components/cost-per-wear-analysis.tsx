'use client';

import { useState } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, DollarSign, TrendingDown, TrendingUp } from 'lucide-react';

export function CostPerWearAnalysis() {
  const { wardrobeItems, isLoading } = useWardrobe();
  const [sortBy, setSortBy] = useState<'highest' | 'lowest'>('highest');
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading cost analysis...</p>
      </div>
    );
  }
  
  // Filter items that have both purchase price and at least one wear
  const itemsWithCost = wardrobeItems.filter(
    item => item.purchase_price && item.purchase_price > 0 && item.wear_count && item.wear_count > 0
  );
  
  // Calculate cost per wear for each item
  const itemsWithCPW = itemsWithCost.map(item => ({
    ...item,
    costPerWear: item.purchase_price! / item.wear_count!
  }));
  
  // Sort by cost per wear
  const sortedItems = [...itemsWithCPW].sort((a, b) => 
    sortBy === 'highest' 
      ? b.costPerWear - a.costPerWear 
      : a.costPerWear - b.costPerWear
  ).slice(0, 10); // Get top 10
  
  // Calculate average cost per wear by category
  const categoryAvgCPW = {} as Record<string, { total: number, count: number, avg: number }>;
  
  itemsWithCPW.forEach(item => {
    if (!categoryAvgCPW[item.category]) {
      categoryAvgCPW[item.category] = { total: 0, count: 0, avg: 0 };
    }
    categoryAvgCPW[item.category].total += item.costPerWear;
    categoryAvgCPW[item.category].count += 1;
  });
  
  // Calculate the average for each category
  Object.keys(categoryAvgCPW).forEach(category => {
    const { total, count } = categoryAvgCPW[category];
    categoryAvgCPW[category].avg = count > 0 ? total / count : 0;
  });
  
  // Sort categories by avg CPW
  const sortedCategories = Object.entries(categoryAvgCPW)
    .map(([category, data]) => ({ category, avg: data.avg, count: data.count }))
    .sort((a, b) => a.avg - b.avg);
  
  // Calculate overall stats
  const totalInvestment = wardrobeItems.reduce(
    (sum, item) => sum + (item.purchase_price || 0), 0
  );
  const totalWears = wardrobeItems.reduce(
    (sum, item) => sum + (item.wear_count || 0), 0
  );
  const overallCPW = totalWears > 0 ? totalInvestment / totalWears : 0;
  
  // Calculate potential savings with more wears
  const potentialSavings = itemsWithCPW.map(item => {
    const currentCPW = item.costPerWear;
    const potentialCPW = item.purchase_price! / (item.wear_count! * 2); // If wore twice as much
    return {
      name: item.name,
      currentCPW,
      potentialCPW,
      savings: currentCPW - potentialCPW
    };
  }).sort((a, b) => b.savings - a.savings).slice(0, 5);
  
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">Cost Per Wear Analysis</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-sm font-medium mb-1">Total Investment</h3>
            <p className="text-2xl font-bold">${totalInvestment.toFixed(2)}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-sm font-medium mb-1">Overall Cost Per Wear</h3>
            <p className="text-2xl font-bold">${overallCPW.toFixed(2)}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-sm font-medium mb-1">Items with CPW Data</h3>
            <p className="text-2xl font-bold">{itemsWithCPW.length} of {wardrobeItems.length}</p>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-md font-medium">Items by Cost Per Wear</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setSortBy('highest')}
                className={`px-2 py-1 rounded text-xs flex items-center ${
                  sortBy === 'highest' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                }`}
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Highest
              </button>
              <button
                onClick={() => setSortBy('lowest')}
                className={`px-2 py-1 rounded text-xs flex items-center ${
                  sortBy === 'lowest' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                }`}
              >
                <TrendingDown className="h-3 w-3 mr-1" />
                Lowest
              </button>
            </div>
          </div>
          
          {sortedItems.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              {sortedItems.map(item => (
                <div key={item.item_id} className="flex items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  {item.image_path && (
                    <img
                      src={item.image_path}
                      alt={item.name}
                      className="w-8 h-8 object-cover rounded mr-2"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {item.category} · ${item.purchase_price} / {item.wear_count} wears
                    </p>
                  </div>
                  <div className="text-sm font-semibold">
                    ${item.costPerWear.toFixed(2)}/wear
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-500">
              No cost data available. Add purchase prices and track wears to see analysis.
            </div>
          )}
        </div>
        
        <div>
          <h3 className="text-md font-medium mb-3">Average CPW by Category</h3>
          {sortedCategories.length > 0 ? (
            <div className="space-y-3">
              {sortedCategories.map(({ category, avg, count }) => (
                <div key={category}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium capitalize">{category}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ${avg.toFixed(2)} · {count} items
                    </span>
                  </div>
                  <div className="mt-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${100 - Math.min(avg / 50 * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-500">
              No category data available
            </div>
          )}
        </div>
        
        <div>
          <h3 className="text-md font-medium mb-3">Potential Savings</h3>
          {potentialSavings.length > 0 ? (
            <div className="space-y-2">
              {potentialSavings.map(({ name, currentCPW, potentialCPW, savings }) => (
                <div key={name} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm font-medium">{name}</p>
                  <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>Current: ${currentCPW.toFixed(2)}/wear</span>
                    <span>Potential: ${potentialCPW.toFixed(2)}/wear</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Wear twice as much to save ${savings.toFixed(2)} per wear
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-500">
              No savings data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 