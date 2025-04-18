'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react';

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

  const handleVote = (battleId: string, option: 'main' | 'option1' | 'option2') => {
    setWinners(prev => ({
      ...prev,
      [battleId]: option
    }));
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
    <div className="space-y-12 py-6">
      {items.map((item) => (
        <Card key={item.id} className="overflow-hidden border rounded-lg shadow-md">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-3 text-center">
              Review Your Battle
            </h3>
            <p className="text-gray-600 mb-6 text-center">
              Confirm your outfit options and make a selection if you have a preference
            </p>
            
            <div className="grid grid-cols-3 gap-4">
              {/* Option 1 */}
              {item.option1_url ? (
                <div 
                  className={`relative border rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors ${winners[item.id || ''] === 'option1' ? 'border-blue-500 bg-blue-50' : ''}`}
                  onClick={() => handleVote(item.id || '', 'option1')}
                >
                  <h4 className="text-sm font-medium mb-2 text-center">Option 1</h4>
                  <div className="relative rounded-lg overflow-hidden aspect-square">
                    <img
                      src={item.option1_url}
                      alt="Option 1"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error(`Failed to load image: ${item.option1_url}`);
                        e.currentTarget.src = '/images/placeholder.jpg'; // Use a placeholder
                        e.currentTarget.onerror = null; // Prevent infinite loops
                      }}
                    />
                    {winners[item.id || ''] === 'option1' && (
                      <div className="absolute top-2 right-2 bg-yellow-400 rounded-full p-1">
                        <Trophy className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-center mt-2">Option 1</p>
                </div>
              ) : (
                <div className="relative border rounded-lg p-4 bg-gray-50">
                  <h4 className="text-sm font-medium mb-2 text-center text-gray-500">Option 1</h4>
                  <div className="aspect-square rounded-lg flex items-center justify-center bg-gray-100">
                    <p className="text-gray-400 text-sm text-center p-4">Option 1 not available</p>
                  </div>
                </div>
              )}
              
              {/* Main Image */}
              <div 
                className={`relative border rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors ${winners[item.id || ''] === 'main' ? 'border-blue-500 bg-blue-50' : ''}`}
                onClick={() => handleVote(item.id || '', 'main')}
              >
                <h4 className="text-sm font-medium mb-2 text-center">Main Outfit</h4>
                <div className="relative rounded-lg overflow-hidden aspect-square">
                  <img
                    src={item.image_url}
                    alt="Main outfit"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error(`Failed to load image: ${item.image_url}`);
                      e.currentTarget.src = '/images/placeholder.jpg'; // Use a placeholder
                      e.currentTarget.onerror = null; // Prevent infinite loops
                    }}
                  />
                  {winners[item.id || ''] === 'main' && (
                    <div className="absolute top-2 right-2 bg-yellow-400 rounded-full p-1">
                      <Trophy className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-center mt-2">what is Looking better?</p>
              </div>
              
              {/* Option 2 */}
              {item.option2_url ? (
                <div 
                  className={`relative border rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors ${winners[item.id || ''] === 'option2' ? 'border-blue-500 bg-blue-50' : ''}`}
                  onClick={() => handleVote(item.id || '', 'option2')}
                >
                  <h4 className="text-sm font-medium mb-2 text-center">Option 2</h4>
                  <div className="relative rounded-lg overflow-hidden aspect-square">
                    <img
                      src={item.option2_url}
                      alt="Option 2"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error(`Failed to load image: ${item.option2_url}`);
                        e.currentTarget.src = '/images/placeholder.jpg'; // Use a placeholder
                        e.currentTarget.onerror = null; // Prevent infinite loops
                      }}
                    />
                    {winners[item.id || ''] === 'option2' && (
                      <div className="absolute top-2 right-2 bg-yellow-400 rounded-full p-1">
                        <Trophy className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-center mt-2">Option 2</p>
                </div>
              ) : (
                <div className="relative border rounded-lg p-4 bg-gray-50">
                  <h4 className="text-sm font-medium mb-2 text-center text-gray-500">Option 2</h4>
                  <div className="aspect-square rounded-lg flex items-center justify-center bg-gray-100">
                    <p className="text-gray-400 text-sm text-center p-4">Option 2 not available</p>
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-center text-gray-600 my-4">
              Click on an option if you have a preference, or leave unselected to get neutral opinions
            </p>
            
            <div className="flex justify-center mt-4">
              <Button 
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
              >
                Continue to Audience Selection →
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BattleGrid; 