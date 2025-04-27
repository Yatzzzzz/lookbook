'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { 
  UserCheck, Settings, Camera, Edit2, Calendar, MapPin, Link, Mail, 
  Instagram, Twitter, Heart, MessageSquare, Users, Grid, BookOpen, ShoppingBag,
  Shirt, Award, FileText
} from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

// Mock profile data - would be fetched from API in real implementation
const mockProfile = {
  id: "user123",
  name: "Emma Johnson",
  username: "emma_style",
  avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  coverImage: "https://images.unsplash.com/photo-1523381294911-8d3cead13475?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  bio: "Fashion enthusiast | Sustainability advocate | Sharing my personal style journey 💫",
  location: "New York, NY",
  website: "emmastyle.com",
  email: "emma@example.com",
  social: {
    instagram: "emma_style",
    twitter: "emmastyle",
  },
  stats: {
    followers: 2456,
    following: 843,
    likes: 12500,
    wardrobeItems: 86,
    outfits: 38,
    looks: 126
  },
  badges: [
    { id: "1", name: "Sustainability Champion", icon: "🌱" },
    { id: "2", name: "Style Influencer", icon: "💎" },
    { id: "3", name: "Top Creator", icon: "🏆" }
  ],
  sustainabilityScore: 87,
  joinDate: "2021-09-01T00:00:00Z"
};

// Mock content data
const mockLooks = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1603189343302-e603f7add05a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    likes: 289,
    comments: 42
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1616697096954-4c2517734976?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    likes: 156,
    comments: 24
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1583392522442-53da8452b3cc?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    likes: 324,
    comments: 18
  },
  {
    id: "4",
    image: "https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    likes: 198,
    comments: 27
  }
];

const mockOutfits = [
  {
    id: "1",
    name: "Summer Casual",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
  },
  {
    id: "2",
    name: "Office Ready",
    image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
  }
];

const mockArticles = [
  {
    id: "1",
    title: "How to Create a Sustainable Wardrobe",
    image: "https://images.unsplash.com/photo-1596560548464-f010549e84d7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    date: "2023-04-15T00:00:00Z"
  },
  {
    id: "2",
    title: "5 Ways to Style a White Tee",
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842259?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    date: "2023-03-28T00:00:00Z"
  }
];

export default function ProfilePage() {
  const params = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState(mockProfile);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('looks');
  
  const isOwnProfile = user?.id === params.userId;
  const userId = params.userId;
  
  useEffect(() => {
    // In a real application, fetch the profile data from API
    // For now, we're using mock data
    console.log(`Fetching profile for user: ${userId}`);
  }, [userId]);
  
  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    // In a real app, you would call an API to follow/unfollow
    setProfile(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        followers: isFollowing ? prev.stats.followers - 1 : prev.stats.followers + 1
      }
    }));
  };
  
  return (
    <div className="pb-24">
      {/* Cover Photo */}
      <div className="relative h-48 rounded-lg overflow-hidden">
        <Image
          src={profile.coverImage}
          alt="Cover photo"
          fill
          className="object-cover"
        />
        {isOwnProfile && (
          <Button 
            size="icon" 
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
          >
            <Camera className="h-4 w-4 text-white" />
          </Button>
        )}
      </div>
      
      {/* Profile Info */}
      <div className="relative mt-[-4rem] px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-end">
          <Avatar className="h-24 w-24 border-4 border-white dark:border-gray-900">
            <AvatarImage src={profile.avatar} alt={profile.name} />
            <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div className="mt-2 sm:mt-0 sm:ml-4 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{profile.name}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">@{profile.username}</p>
              </div>
              
              <div className="mt-3 sm:mt-0">
                {isOwnProfile ? (
                  <Button variant="outline" className="h-9">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <Button 
                    variant={isFollowing ? "outline" : "default"}
                    className="h-9"
                    onClick={handleFollow}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Following
                      </>
                    ) : (
                      <>
                        <Users className="h-4 w-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Bio & Info */}
        <div className="mt-4">
          <p className="text-sm">{profile.bio}</p>
          
          <div className="mt-3 flex flex-wrap gap-y-2 text-sm text-gray-600 dark:text-gray-400">
            {profile.location && (
              <div className="flex items-center mr-4">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{profile.location}</span>
              </div>
            )}
            
            {profile.website && (
              <div className="flex items-center mr-4">
                <Link className="h-4 w-4 mr-1" />
                <a href={`https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                  {profile.website}
                </a>
              </div>
            )}
            
            <div className="flex items-center mr-4">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Joined {new Date(profile.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          
          {/* Social links */}
          <div className="mt-3 flex space-x-2">
            {profile.social.instagram && (
              <a href={`https://instagram.com/${profile.social.instagram}`} target="_blank" rel="noopener noreferrer" 
                className="text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400">
                <Instagram className="h-5 w-5" />
              </a>
            )}
            
            {profile.social.twitter && (
              <a href={`https://twitter.com/${profile.social.twitter}`} target="_blank" rel="noopener noreferrer" 
                className="text-gray-600 dark:text-gray-400 hover:text-blue-400">
                <Twitter className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
        
        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 sm:grid-cols-6 gap-4 text-center">
          <div>
            <div className="font-semibold">{profile.stats.followers.toLocaleString()}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Followers</div>
          </div>
          <div>
            <div className="font-semibold">{profile.stats.following.toLocaleString()}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Following</div>
          </div>
          <div>
            <div className="font-semibold">{profile.stats.likes.toLocaleString()}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Likes</div>
          </div>
          <div>
            <div className="font-semibold">{profile.stats.wardrobeItems}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Items</div>
          </div>
          <div>
            <div className="font-semibold">{profile.stats.outfits}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Outfits</div>
          </div>
          <div>
            <div className="font-semibold">{profile.stats.looks}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Looks</div>
          </div>
        </div>
        
        {/* Badges */}
        {profile.badges && profile.badges.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <Award className="h-4 w-4 mr-1" />
              Badges
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.badges.map(badge => (
                <Badge key={badge.id} variant="outline" className="flex items-center gap-1 px-2 py-1">
                  <span>{badge.icon}</span>
                  <span>{badge.name}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Sustainability Score */}
        {profile.sustainabilityScore && (
          <div className="mt-4">
            <div className="flex items-center mb-1">
              <span className="text-sm font-medium mr-2">Sustainability Score</span>
              <Badge className="bg-green-500">{profile.sustainabilityScore}/100</Badge>
            </div>
            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full" 
                style={{ width: `${profile.sustainabilityScore}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="looks" className="mt-8">
        <TabsList className="w-full overflow-x-auto flex whitespace-nowrap">
          <TabsTrigger 
            value="looks" 
            onClick={() => setActiveTab('looks')}
            className="flex-1 sm:flex-none"
          >
            <Grid className="h-4 w-4 mr-1" />
            Looks
          </TabsTrigger>
          <TabsTrigger 
            value="outfits" 
            onClick={() => setActiveTab('outfits')}
            className="flex-1 sm:flex-none"
          >
            <Shirt className="h-4 w-4 mr-1" />
            Outfits
          </TabsTrigger>
          <TabsTrigger 
            value="wardrobe" 
            onClick={() => setActiveTab('wardrobe')}
            className="flex-1 sm:flex-none"
          >
            <ShoppingBag className="h-4 w-4 mr-1" />
            Wardrobe
          </TabsTrigger>
          <TabsTrigger 
            value="articles" 
            onClick={() => setActiveTab('articles')}
            className="flex-1 sm:flex-none"
          >
            <FileText className="h-4 w-4 mr-1" />
            Articles
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="looks" className="mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {mockLooks.map(look => (
              <div key={look.id} className="relative rounded-md overflow-hidden group">
                <div className="aspect-square">
                  <Image 
                    src={look.image} 
                    alt={`Look ${look.id}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <div className="flex space-x-3 text-white text-sm">
                    <div className="flex items-center">
                      <Heart className="h-3 w-3 mr-1" />
                      <span>{look.likes}</span>
                    </div>
                    <div className="flex items-center">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      <span>{look.comments}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="outfits" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mockOutfits.map(outfit => (
              <Card key={outfit.id} className="overflow-hidden">
                <div className="relative h-48">
                  <Image
                    src={outfit.image}
                    alt={outfit.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium">{outfit.name}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="wardrobe" className="mt-4">
          <div className="text-center py-8">
            <Shirt className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Wardrobe is private</h3>
            {isOwnProfile ? (
              <Button>Manage Your Wardrobe</Button>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">This user's wardrobe items are private</p>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="articles" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mockArticles.map(article => (
              <Card key={article.id} className="overflow-hidden">
                <div className="relative h-40">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium">{article.title}</h3>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(article.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric' 
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 