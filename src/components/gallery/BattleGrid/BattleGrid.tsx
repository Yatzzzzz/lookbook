'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react';

interface BattleItem {
  look_id: string;
  image_url: string;
  caption: string;
  username: string;
  avatar_url?: string;
}

interface BattleGridProps {
  items: BattleItem[];
}

const BattleGrid: React.FC<BattleGridProps> = ({ items }) => {
  const [winners, setWinners] = useState<Record<number, string>>({});

  // Group items into pairs for battles
  const createBattlePairs = (items: BattleItem[]) => {
    const pairs: BattleItem[][] = [];
    for (let i = 0; i < items.length; i += 2) {
      if (i + 1 < items.length) {
        pairs.push([items[i], items[i + 1]]);
      }
    }
    return pairs;
  };

  const battlePairs = createBattlePairs(items);

  const handleVote = (battleIndex: number, winner: BattleItem) => {
    setWinners(prev => ({
      ...prev,
      [battleIndex]: winner.look_id
    }));
  };

  return (
    <div className="space-y-8 py-6">
      {battlePairs.map((pair, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-4">
            <h3 className="text-lg font-medium text-center mb-4">Battle #{index + 1}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {pair.map((item) => (
                <div key={item.look_id} className="relative">
                  <div className="relative rounded-lg overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.caption}
                      className="w-full aspect-square object-cover"
                    />
                    {winners[index] === item.look_id && (
                      <div className="absolute top-2 right-2 bg-yellow-400 rounded-full p-1">
                        <Trophy className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <span className="text-white text-sm font-medium">{item.username}</span>
                    </div>
                  </div>
                  
                  {!winners[index] && (
                    <Button 
                      className="w-full mt-2"
                      onClick={() => handleVote(index, item)}
                    >
                      Vote
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            {winners[index] && (
              <div className="mt-4 p-3 bg-muted rounded-lg text-center">
                <p className="text-sm">
                  You voted for {pair.find(item => item.look_id === winners[index])?.caption}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      
      {battlePairs.length === 0 && (
        <div className="text-center p-8">
          <p className="text-lg font-medium mb-2">No battles available</p>
          <p className="text-muted-foreground">Check back later for fashion battles</p>
        </div>
      )}
    </div>
  );
};

export default BattleGrid; 