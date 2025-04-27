'use client';

import { useState } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PieChart, TrendingUp, Calendar, DollarSign, Search, Lightbulb } from 'lucide-react';
import { WardrobeGapAnalysis } from './wardrobe-gap-analysis';
import { StyleDistribution } from './style-distribution';
import { CostPerWearAnalysis } from './cost-per-wear-analysis';

export function WardrobeAnalytics() {
  const {
    wardrobeItems,
    wardrobeRanking,
    isLoading,
    getCategoryCount,
    getTotalItems,
    getMostWornItems,
    getLeastWornItems,
    getRecentlyWornItems
  } = useWardrobe();

  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  // Calculate statistics
  const totalItems = getTotalItems();
  const totalWears = wardrobeItems.reduce((total, item) => total + (item.wear_count || 0), 0);
  const averageWears = totalItems > 0 ? (totalWears / totalItems).toFixed(1) : '0';
  
  // Calculate total investment
  const totalInvestment = wardrobeItems.reduce((total, item) => {
    return total + (item.purchase_price || 0);
  }, 0);

  // Calculate cost per wear
  const costPerWear = totalWears > 0 ? (totalInvestment / totalWears).toFixed(2) : '0';

  // Get most worn items
  const mostWornItems = getMostWornItems(5);
  
  // Get least worn items
  const leastWornItems = getLeastWornItems(5);
  
  // Get recently worn items
  const recentlyWornItems = getRecentlyWornItems(5);

  // Calculate category distribution
  const categories = [
    { name: 'Tops', key: 'top' },
    { name: 'Bottoms', key: 'bottom' },
    { name: 'Dresses', key: 'dress' },
    { name: 'Shoes', key: 'shoes' },
    { name: 'Accessories', key: 'accessories' },
    { name: 'Outerwear', key: 'outerwear' },
    { name: 'Bags', key: 'bags' },
    { name: 'Other', key: 'other' },
  ];

  // Calculate season distribution
  const seasonCounts = {
    spring: 0,
    summer: 0,
    fall: 0,
    winter: 0,
  };

  wardrobeItems.forEach(item => {
    if (item.season && item.season.length > 0) {
      item.season.forEach(season => {
        if (season in seasonCounts) {
          seasonCounts[season]++;
        }
      });
    }
  });

  // Calculate occasion distribution
  const occasionCounts = {
    casual: 0,
    formal: 0,
    work: 0,
    party: 0,
    sport: 0,
    travel: 0,
  };

  wardrobeItems.forEach(item => {
    if (item.occasion && item.occasion.length > 0) {
      item.occasion.forEach(occasion => {
        if (occasion in occasionCounts) {
          occasionCounts[occasion]++;
        }
      });
    }
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Items in your wardrobe
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Wears</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWears}</div>
            <p className="text-xs text-muted-foreground">
              Times you've worn items
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Wears</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageWears}</div>
            <p className="text-xs text-muted-foreground">
              Average wears per item
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Per Wear</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${costPerWear}</div>
            <p className="text-xs text-muted-foreground">
              Average cost per wear
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h3 className="text-lg font-semibold mb-4">Category Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {categories.map(({ name, key }) => {
                const count = getCategoryCount(key);
                const percentage = totalItems > 0 ? Math.round((count / totalItems) * 100) : 0;
                
                return (
                  <div
                    key={key}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{name}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{count}</span>
                    </div>
                    <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-4">Season Distribution</h3>
              <div className="space-y-3">
                {Object.entries(seasonCounts).map(([season, count]) => {
                  const percentage = totalItems > 0 ? Math.round((count / totalItems) * 100) : 0;
                  
                  return (
                    <div key={season}>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium capitalize">{season}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{count}</span>
                      </div>
                      <div className="mt-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-4">Occasion Distribution</h3>
              <div className="space-y-3">
                {Object.entries(occasionCounts).map(([occasion, count]) => {
                  const percentage = totalItems > 0 ? Math.round((count / totalItems) * 100) : 0;
                  
                  return (
                    <div key={occasion}>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium capitalize">{occasion}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{count}</span>
                      </div>
                      <div className="mt-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="usage" className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h3 className="text-lg font-semibold mb-4">Wear Statistics</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <h4 className="text-md font-medium mb-2">Most Worn</h4>
                <div className="space-y-2">
                  {mostWornItems.length > 0 ? (
                    mostWornItems.map(item => (
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
                            {item.category} · {item.brand || 'No brand'}
                          </p>
                        </div>
                        <div className="text-sm font-semibold">{item.wear_count || 0} wears</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-sm text-gray-500">
                      No wear data available
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium mb-2">Least Worn</h4>
                <div className="space-y-2">
                  {leastWornItems.length > 0 ? (
                    leastWornItems.map(item => (
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
                            {item.category} · {item.brand || 'No brand'}
                          </p>
                        </div>
                        <div className="text-sm font-semibold">{item.wear_count || 0} wears</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-sm text-gray-500">
                      No wear data available
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium mb-2">Recently Worn</h4>
                <div className="space-y-2">
                  {recentlyWornItems.length > 0 ? (
                    recentlyWornItems.map(item => (
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
                            {item.category} · {item.brand || 'No brand'}
                          </p>
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.last_worn ? new Date(item.last_worn).toLocaleDateString() : 'Never worn'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-sm text-gray-500">
                      No wear data available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="financial" className="space-y-6">
          <CostPerWearAnalysis />
        </TabsContent>
        
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StyleDistribution />
            <WardrobeGapAnalysis />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 