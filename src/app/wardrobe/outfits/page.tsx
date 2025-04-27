'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Edit, Trash2, Share2, Plus, Calendar, Tag, Zap } from 'lucide-react';
import { useWardrobe } from '@/app/context/WardrobeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

interface Outfit {
  id: string;
  name: string;
  items: string[];
  tags: string[];
  season: string;
  occasion: string;
  image: string;
  dateCreated: Date;
  likes: number;
  isLiked: boolean;
  isPublic: boolean;
}

export default function OutfitsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { wardrobeItems } = useWardrobe();
  const [activeTab, setActiveTab] = useState('all');
  const [outfits, setOutfits] = useState<Outfit[]>([
    {
      id: '1',
      name: 'Summer Casual',
      items: ['item1', 'item2', 'item3'],
      tags: ['casual', 'summer'],
      season: 'summer',
      occasion: 'casual',
      image: 'https://images.unsplash.com/photo-1600574691453-499962cc0611?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      dateCreated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      likes: 42,
      isLiked: true,
      isPublic: true
    },
    {
      id: '2',
      name: 'Office Meeting',
      items: ['item4', 'item5', 'item6'],
      tags: ['formal', 'work'],
      season: 'all',
      occasion: 'work',
      image: 'https://images.unsplash.com/photo-1591977733763-08945a1a8694?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      dateCreated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      likes: 28,
      isLiked: false,
      isPublic: true
    },
    {
      id: '3',
      name: 'Weekend Brunch',
      items: ['item7', 'item8', 'item9'],
      tags: ['casual', 'spring', 'brunch'],
      season: 'spring',
      occasion: 'casual',
      image: 'https://images.unsplash.com/photo-1582142606094-21f3e7454fcd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      dateCreated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
      likes: 35,
      isLiked: false,
      isPublic: false
    },
    {
      id: '4',
      name: 'Dinner Date',
      items: ['item10', 'item11', 'item12'],
      tags: ['evening', 'date', 'semi-formal'],
      season: 'all',
      occasion: 'evening',
      image: 'https://images.unsplash.com/photo-1576566588028-4147f3842259?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      dateCreated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21),
      likes: 64,
      isLiked: true,
      isPublic: true
    }
  ]);
  
  const filteredOutfits = outfits.filter(outfit => {
    if (activeTab === 'all') return true;
    if (activeTab === 'summer') return outfit.season === 'summer';
    if (activeTab === 'winter') return outfit.season === 'winter';
    if (activeTab === 'casual') return outfit.occasion === 'casual';
    if (activeTab === 'formal') return outfit.occasion === 'formal' || outfit.occasion === 'work';
    return true;
  });
  
  const toggleLike = (outfitId: string) => {
    setOutfits(outfits.map(outfit => 
      outfit.id === outfitId 
        ? { 
            ...outfit, 
            isLiked: !outfit.isLiked, 
            likes: outfit.isLiked ? outfit.likes - 1 : outfit.likes + 1 
          } 
        : outfit
    ));
  };
  
  const deleteOutfit = (outfitId: string) => {
    if (window.confirm('Are you sure you want to delete this outfit?')) {
      setOutfits(outfits.filter(outfit => outfit.id !== outfitId));
    }
  };
  
  const createNewOutfit = () => {
    // Redirect to outfit creator or open modal
    router.push('/wardrobe/outfits/create');
  };
  
  const aiGeneratedOutfitSuggestions = 2;
  
  return (
    <div className="pb-16">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">My Outfits</h1>
        <Button onClick={createNewOutfit} className="bg-gradient-to-r from-blue-500 to-purple-600">
          <Plus className="h-4 w-4 mr-1" /> Create Outfit
        </Button>
      </div>
      
      {aiGeneratedOutfitSuggestions > 0 && (
        <Card className="mb-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-100 dark:border-indigo-900/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium flex items-center">
                  <Zap className="h-4 w-4 text-yellow-500 mr-1" />
                  AI Outfit Suggestions
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We've created {aiGeneratedOutfitSuggestions} new outfit suggestions based on your style and items
                </p>
              </div>
              <Button size="sm" variant="secondary" className="h-8">
                View Suggestions
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Tabs defaultValue="all" className="mb-4">
        <TabsList className="w-full overflow-x-auto flex whitespace-nowrap">
          <TabsTrigger value="all" onClick={() => setActiveTab('all')}>All Outfits</TabsTrigger>
          <TabsTrigger value="summer" onClick={() => setActiveTab('summer')}>Summer</TabsTrigger>
          <TabsTrigger value="winter" onClick={() => setActiveTab('winter')}>Winter</TabsTrigger>
          <TabsTrigger value="casual" onClick={() => setActiveTab('casual')}>Casual</TabsTrigger>
          <TabsTrigger value="formal" onClick={() => setActiveTab('formal')}>Formal</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredOutfits.map(outfit => (
          <Card key={outfit.id} className="overflow-hidden">
            <div className="relative h-52 sm:h-64">
              <Image
                src={outfit.image}
                alt={outfit.name}
                fill
                className="object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-1">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 bg-white dark:bg-gray-900 opacity-80 hover:opacity-100"
                  onClick={() => toggleLike(outfit.id)}
                >
                  <Heart className={`h-4 w-4 ${outfit.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 bg-white dark:bg-gray-900 opacity-80 hover:opacity-100"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
              {!outfit.isPublic && (
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="bg-black/50 hover:bg-black/50 text-white">
                    Private
                  </Badge>
                </div>
              )}
            </div>
            <CardContent className="p-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{outfit.name}</h3>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>
                      {outfit.dateCreated.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric' 
                      })}
                    </span>
                    <span className="mx-1">•</span>
                    <Heart className="h-3 w-3 mr-1" />
                    <span>{outfit.likes}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => deleteOutfit(outfit.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {outfit.tags.map(tag => (
                  <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full flex items-center">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredOutfits.length === 0 && (
        <div className="text-center py-16">
          <div className="h-16 w-16 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto flex items-center justify-center mb-4">
            <Heart className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">No outfits found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {activeTab === 'all'
              ? "You haven't created any outfits yet"
              : `You don't have any ${activeTab} outfits`}
          </p>
          <Button onClick={createNewOutfit}>
            <Plus className="h-4 w-4 mr-1" /> Create Your First Outfit
          </Button>
        </div>
      )}
    </div>
  );
} 