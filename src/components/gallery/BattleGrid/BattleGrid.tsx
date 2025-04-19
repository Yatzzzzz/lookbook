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
    setWinners(prev => ({ ...prev, [battleId]: option }));
  };

  const handleImageError = (id: string) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  // Render a single battle item
  const renderItem = (item: BattleItem, index: number) => {
    if (!item || !item.image_url) return null;

    const itemId = item.look_id || item.id || `item-${index}`;
    const isWinner = winners[itemId] === 'main';
    const hasError = imageErrors[itemId];

    return (
      <Card key={itemId} className="relative overflow-hidden group">
        <CardContent className="p-0">
          <div className="relative aspect-[3/4] w-full">
            <SupabaseImage
              src={item.image_url}
              alt={item.caption || 'Look image'}
              fill
              className="object-cover"
              onError={() => handleImageError(itemId)}
            />
            
            {hasError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
                <ImageOff className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Image unavailable</p>
              </div>
            )}

            {isWinner && (
              <div className="absolute top-2 right-2 bg-yellow-500 text-white p-1 rounded-full">
                <Trophy className="h-4 w-4" />
              </div>
            )}
          </div>

          <div className="p-3">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium">{item.username || (item.user?.username) || 'Unknown'}</div>
              <Button 
                size="sm" 
                variant={isWinner ? "default" : "outline"}
                onClick={() => handleVote(itemId, 'main')}
                className="h-8"
              >
                {isWinner ? 'Voted' : 'Vote'}
              </Button>
            </div>
            {item.caption && <p className="text-sm text-gray-500 mt-1 truncate">{item.caption}</p>}
          </div>
        </CardContent>
      </Card>
    );
  };

  // TODO: Replace this with a grid layout based on design requirements
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item, index) => renderItem(item, index))}
    </div>
  );
};

export default BattleGrid; 