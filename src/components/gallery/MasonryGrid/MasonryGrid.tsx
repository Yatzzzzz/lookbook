'use client';

import React from 'react';
import { Look } from '@/lib/gallery-api';
import { Heart, MessageCircle, Eye, Share2, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MasonryGridProps {
  looks: Look[];
  onRate?: (lookId: string, rating: string) => void;
  onSave?: (lookId: string) => void;
  onShare?: (lookId: string) => void;
}

const MasonryGrid: React.FC<MasonryGridProps> = ({
  looks,
  onRate,
  onSave,
  onShare,
}) => {
  // Create columns for masonry layout
  const createColumns = (items: Look[], columnCount: number = 2) => {
    const columns: Look[][] = Array.from({ length: columnCount }, () => []);
    
    items.forEach((item, index) => {
      const columnIndex = index % columnCount;
      columns[columnIndex].push(item);
    });
    
    return columns;
  };

  const columns = createColumns(looks, 2);

  const handleRate = (lookId: string) => {
    if (onRate) onRate(lookId, 'like');
  };

  const handleSave = (lookId: string) => {
    if (onSave) onSave(lookId);
  };

  const handleShare = (lookId: string) => {
    if (onShare) onShare(lookId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
      {columns.map((column, columnIndex) => (
        <div key={columnIndex} className="flex flex-col gap-4">
          {column.map((look) => (
            <div 
              key={look.look_id} 
              className="rounded-lg overflow-hidden border border-border shadow-sm"
            >
              <div className="relative">
                <img
                  src={look.image_url}
                  alt={look.caption}
                  className="w-full object-cover aspect-[3/4]"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => handleSave(look.look_id)}
                    className={cn(
                      "p-2 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors",
                      look.is_saved && "text-yellow-400"
                    )}
                  >
                    <Bookmark size={16} />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <img 
                      src={look.avatar_url || "https://i.pravatar.cc/150"} 
                      alt={look.username} 
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-white text-sm font-medium">{look.username}</span>
                  </div>
                  <p className="text-white text-sm line-clamp-2">{look.caption}</p>
                </div>
              </div>
              <div className="p-3 bg-background">
                <div className="flex justify-between items-center">
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleRate(look.look_id)}
                      className={cn(
                        "flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors",
                        look.user_rating === 'like' && "text-red-500"
                      )}
                    >
                      <Heart size={16} />
                      <span className="text-xs">{look.likes_count}</span>
                    </button>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MessageCircle size={16} />
                      <span className="text-xs">{look.comments_count}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Eye size={16} />
                      <span className="text-xs">{look.views_count}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleShare(look.look_id)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Share2 size={16} />
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {look.tags?.map((tag) => (
                    <span 
                      key={tag} 
                      className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default MasonryGrid; 