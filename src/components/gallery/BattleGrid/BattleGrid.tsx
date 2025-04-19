'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, ImageOff, Loader2 } from 'lucide-react';
import SupabaseImage from '@/components/ui/supabase-image';

interface BattleItem {
  look_id?: string;
  id?: string;
  image_url: string;
  caption?: string;
  description?: string;
  username?: string;
  avatar_url?: string;
  user?: {
    id: string;
    username: string;
    avatar_url?: string | null;
  };
  option1_url?: string;
  option2_url?: string;
}

interface BattleGridProps {
  items: BattleItem[];
}

const BattleGrid: React.FC<BattleGridProps> = ({ items }) => {
  const [winners, setWinners] = useState<Record<string, 'main' | 'option1' | 'option2'>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleVote = (battleId: string, option: 'main' | 'option1' | 'option2') => {
    setWinners(prev => ({
      ...prev,
      [battleId]: option
    }));
  };

  const handleImageError = (imageKey: string, imageUrl: string) => {
    console.error(`Failed to load image: ${imageUrl}`);
    
    setImageErrors(prev => ({
      ...prev,
      [imageKey]: true
    }));
  };

  // Function to get proper URL for Supabase images with fallbacks
  const getImageUrl = (url: string) => {
    if (!url) return '';
    
    // Ensure URL is properly formatted
    try {
      // Try to create a URL object to validate it
      new URL(url);
      
      // Fix any URL encoding issues that might occur with Supabase URLs
      // Replace problematic characters in the URL if needed
      return url.replace(/\s/g, '%20');
    } catch (e) {
      // If URL is invalid, log it and return empty string
      console.error('Invalid image URL:', url);
      return '';
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-lg font-medium mb-2">No battles available</p>
        <p className="text-muted-foreground mb-4">Looks marked as battle will appear here</p>
        
        <div className="p-4 border border-gray-300 rounded-md text-left mt-4 bg-gray-50">
          <h3 className="font-medium mb-2">Debug Information</h3>
          <p className="text-sm mb-2">If this is unexpected, check the following:</p>
          <ul className="text-sm list-disc pl-5 space-y-1">
            <li>The "battle" storage bucket exists in Supabase</li>
            <li>Images have been uploaded with the correct folder structure</li>
            <li>Each battle needs: main image + option1 + option2</li>
            <li>Filenames should include identifiers like "main", "option1", "option2"</li>
            <li>Check browser console for detailed error messages</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4">
      {items.map((item) => {
        const itemId = item.id || item.look_id || Math.random().toString();
        const mainImageKey = `main-${itemId}`;
        const option1Key = `option1-${itemId}`;
        const option2Key = `option2-${itemId}`;
        
        // Get valid image URLs
        const mainImageUrl = getImageUrl(item.image_url);
        const option1ImageUrl = getImageUrl(item.option1_url || '');
        const option2ImageUrl = getImageUrl(item.option2_url || '');
        
        return (
          <Card key={itemId} className="overflow-hidden border rounded-lg shadow-md">
            <CardContent className="p-4">
              <h3 className="text-lg font-bold mb-2 text-center">
                Review Your Battle
              </h3>
              <p className="text-gray-500 mb-4 text-center text-sm">
                Confirm your outfit options and make a selection if you have a preference
              </p>
              
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {/* Option 1 */}
                <div 
                  className={`relative border rounded-lg p-2 cursor-pointer hover:border-blue-500 transition-colors ${winners[itemId] === 'option1' ? 'border-blue-500 bg-blue-50' : ''}`}
                  onClick={() => option1ImageUrl ? handleVote(itemId, 'option1') : null}
                >
                  <h4 className="text-xs font-medium mb-1 text-center">Option 1</h4>
                  <div className="relative rounded-lg overflow-hidden aspect-square bg-gray-100">
                    {option1ImageUrl ? (
                      <>
                        <div className="w-full h-full aspect-square">
                          <SupabaseImage
                            src={option1ImageUrl}
                            alt="Option 1"
                            className="aspect-square"
                            fill
                            sizes="(max-width: 640px) 50vw, 200px"
                            priority
                            onError={() => handleImageError(option1Key, option1ImageUrl)}
                          />
                        </div>
                        
                        {winners[itemId] === 'option1' && (
                          <div className="absolute top-1 right-1 bg-yellow-400 rounded-full p-1 z-20">
                            <Trophy className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="aspect-square rounded-lg flex items-center justify-center bg-gray-100">
                        <p className="text-gray-400 text-xs text-center p-2">Not available</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Option 2 */}
                <div 
                  className={`relative border rounded-lg p-2 cursor-pointer hover:border-blue-500 transition-colors ${winners[itemId] === 'option2' ? 'border-blue-500 bg-blue-50' : ''}`}
                  onClick={() => option2ImageUrl ? handleVote(itemId, 'option2') : null}
                >
                  <h4 className="text-xs font-medium mb-1 text-center">Option 2</h4>
                  <div className="relative rounded-lg overflow-hidden aspect-square bg-gray-100">
                    {option2ImageUrl ? (
                      <>
                        <div className="w-full h-full aspect-square">
                          <SupabaseImage
                            src={option2ImageUrl}
                            alt="Option 2"
                            className="aspect-square"
                            fill
                            sizes="(max-width: 640px) 50vw, 200px"
                            priority
                            onError={() => handleImageError(option2Key, option2ImageUrl)}
                          />
                        </div>
                        
                        {winners[itemId] === 'option2' && (
                          <div className="absolute top-1 right-1 bg-yellow-400 rounded-full p-1 z-20">
                            <Trophy className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="aspect-square rounded-lg flex items-center justify-center bg-gray-100">
                        <p className="text-gray-400 text-xs text-center p-2">Not available</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Main Image - shows in the second row on mobile, in the middle on larger screens */}
                <div 
                  className={`relative border rounded-lg p-2 cursor-pointer hover:border-blue-500 transition-colors col-span-2 sm:col-span-1 sm:col-start-2 sm:row-start-1 mt-3 sm:mt-0 ${winners[itemId] === 'main' ? 'border-blue-500 bg-blue-50' : ''}`}
                  onClick={() => mainImageUrl ? handleVote(itemId, 'main') : null}
                >
                  <h4 className="text-xs font-medium mb-1 text-center">Main Outfit</h4>
                  <div className="relative rounded-lg overflow-hidden aspect-square bg-gray-100">
                    {mainImageUrl ? (
                      <>
                        <div className="w-full h-full aspect-square">
                          <SupabaseImage
                            src={mainImageUrl}
                            alt="Main outfit"
                            className="aspect-square"
                            fill
                            sizes="(max-width: 640px) 100vw, 300px"
                            priority
                            onError={() => handleImageError(mainImageKey, mainImageUrl)}
                          />
                        </div>
                        
                        {winners[itemId] === 'main' && (
                          <div className="absolute top-1 right-1 bg-yellow-400 rounded-full p-1 z-20">
                            <Trophy className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="aspect-square rounded-lg flex items-center justify-center bg-gray-100">
                        <p className="text-gray-400 text-xs text-center p-2">Main image not available</p>
                      </div>
                    )}
                  </div>
                  <p className="text-center mt-1 text-xs">what is Looking better?</p>
                </div>
              </div>
              
              <p className="text-center text-gray-500 my-3 text-xs">
                Click on an option if you have a preference
              </p>
              
              <div className="flex justify-center mt-3">
                <Button 
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md text-sm"
                  size="sm"
                >
                  Continue →
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default BattleGrid; 