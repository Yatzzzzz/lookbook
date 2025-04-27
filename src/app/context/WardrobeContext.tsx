'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getSupabaseClient } from '@/lib/supabaseClient';

// Import the auth context properly
import { useAuth } from '@/contexts/AuthContext';

export interface WardrobeItem {
  item_id: string;
  user_id: string;
  category: string;
  color?: string;
  image_path?: string;
  brand?: string;
  style?: string;
  created_at: string;
  metadata?: any;
  name: string;
  description?: string;
  visibility?: string;
  brand_url?: string;
  wear_count?: number;
  purchase_date?: string;
  purchase_price?: number;
  size?: string;
  last_worn?: string;
  material?: string[];
  season?: string[];
  occasion?: string[];
  featured?: boolean;
  affiliate_links?: any;
}

export interface Outfit {
  outfit_id: string;
  user_id: string;
  name: string;
  description?: string;
  image_url?: string;
  created_at: string;
  last_worn?: string;
  wear_count?: number;
  visibility?: string;
  season?: string[];
  occasion?: string[];
  weather_conditions?: string[];
  featured?: boolean;
}

export interface OutfitItem {
  id: string;
  outfit_id: string;
  item_id: string;
  layer_order?: number;
  position_data?: any;
  created_at: string;
}

export interface WardrobeRanking {
  id: string;
  user_id: string;
  item_count: number;
  top_count: number;
  bottom_count: number;
  shoes_count: number;
  dress_count: number;
  accessories_count: number;
  outerwear_count: number;
  bags_count: number;
  other_count: number;
  ranking_score: number;
  ranking_position?: number;
}

export interface WardrobeFollow {
  id: string;
  follower_id: string;
  followed_id: string;
  created_at: string;
}

export interface InspirationBoard {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at?: string;
  visibility?: string;
  cover_image?: string;
}

export interface InspirationItem {
  id: string;
  board_id: string;
  item_id?: string;
  user_id: string;
  external_url?: string;
  external_image?: string;
  note?: string;
  created_at: string;
  source_type: 'wardrobe' | 'external' | 'outfit';
  outfit_id?: string;
}

export interface Profile {
  id: string;
  username?: string;
  avatar_url?: string;
}

// Marketplace interfaces
export interface Product {
  product_id: string;
  name: string;
  description?: string;
  brand?: string;
  category: string;
  image_url?: string;
  product_url: string;
  price?: number;
  affiliate_code?: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
  similar_to_item_id?: string;
  tags?: string[];
}

export interface WishListItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  notes?: string;
  price_at_addition?: number;
  notify_price_drop: boolean;
  target_price?: number;
  product?: Product;
}

export interface PriceHistory {
  id: string;
  product_id: string;
  price: number;
  recorded_at: string;
}

export interface ProductRecommendation {
  id: string;
  user_id: string;
  product_id: string;
  recommendation_type: string;
  created_at: string;
  relevance_score?: number;
  is_viewed: boolean;
  is_clicked: boolean;
  product?: Product;
}

// New interfaces for social features
export interface ActivityFeedItem {
  id: string;
  user_id: string;
  action_type: string;
  item_type: string;
  item_id: string;
  metadata?: any;
  created_at: string;
  is_public: boolean;
  profile?: Profile;
}

export interface Comment {
  id: string;
  user_id: string;
  item_type: string;
  item_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  sender_id?: string;
  notification_type: string;
  item_type?: string;
  item_id?: string;
  content?: string;
  is_read: boolean;
  created_at: string;
  sender_profile?: Profile;
}

interface FollowedWardrobeRecord {
  followed_id: string;
  profiles: Profile;
}

interface FollowerRecord {
  follower_id: string;
  profiles: Profile;
}

interface WardrobeContextType {
  wardrobeItems: WardrobeItem[];
  setWardrobeItems: React.Dispatch<React.SetStateAction<WardrobeItem[]>>;
  wardrobeRanking: WardrobeRanking | null;
  isLoading: boolean;
  error: string | null;
  addItem: (item: Omit<WardrobeItem, 'item_id' | 'user_id' | 'created_at'>) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateItem: (itemId: string, updates: Partial<WardrobeItem>) => Promise<void>;
  getCategoryCount: (category: string) => number;
  getTotalItems: () => number;
  uploadImage: (file: File) => Promise<string>;
  refreshSession: () => Promise<any>;
  refreshRanking: () => Promise<void>;
  refreshWardrobeItems: () => Promise<void>;
  
  outfits: Outfit[];
  isLoadingOutfits: boolean;
  outfitError: string | null;
  addOutfit: (outfit: Omit<Outfit, 'outfit_id' | 'user_id' | 'created_at'>) => Promise<string>;
  updateOutfit: (outfitId: string, updates: Partial<Outfit>) => Promise<void>;
  removeOutfit: (outfitId: string) => Promise<void>;
  getOutfit: (outfitId: string) => Outfit | undefined;
  
  addItemToOutfit: (outfitId: string, itemId: string, options?: { layer_order?: number, position_data?: any }) => Promise<void>;
  removeItemFromOutfit: (outfitId: string, itemId: string) => Promise<void>;
  getOutfitItems: (outfitId: string) => Promise<WardrobeItem[]>;
  
  logItemAsWorn: (itemId: string, date?: Date) => Promise<void>;
  logOutfitAsWorn: (outfitId: string, date?: Date) => Promise<void>;
  
  updateItemVisibility: (itemId: string, visibility: string) => Promise<void>;
  updateOutfitVisibility: (outfitId: string, visibility: string) => Promise<void>;
  
  getMostWornItems: (limit?: number) => WardrobeItem[];
  getLeastWornItems: (limit?: number) => WardrobeItem[];
  getRecentlyWornItems: (limit?: number) => WardrobeItem[];
  
  // Wardrobe following functionality
  followWardrobe: (userId: string) => Promise<void>;
  unfollowWardrobe: (userId: string) => Promise<void>;
  isFollowingWardrobe: (userId: string) => Promise<boolean>;
  getFollowedWardrobes: () => Promise<{ user_id: string; username?: string; avatar_url?: string }[]>;
  getWardrobeFollowers: () => Promise<{ user_id: string; username?: string; avatar_url?: string }[]>;
  
  // Inspiration boards functionality
  inspirationBoards: InspirationBoard[];
  isLoadingInspirationBoards: boolean;
  inspirationBoardError: string | null;
  createInspirationBoard: (name: string, description?: string, visibility?: string) => Promise<string>;
  updateInspirationBoard: (boardId: string, updates: Partial<InspirationBoard>) => Promise<void>;
  deleteInspirationBoard: (boardId: string) => Promise<void>;
  getInspirationBoard: (boardId: string) => InspirationBoard | undefined;
  getInspirationBoardItems: (boardId: string) => Promise<InspirationItem[]>;
  addItemToInspirationBoard: (boardId: string, itemType: 'wardrobe' | 'external' | 'outfit', itemId?: string, externalUrl?: string, externalImage?: string, note?: string) => Promise<void>;
  removeItemFromInspirationBoard: (boardId: string, itemId: string) => Promise<void>;
  refreshInspirationBoards: () => Promise<void>;
  
  // New methods for social features
  // Activity Feed
  activityFeed: ActivityFeedItem[];
  isLoadingActivityFeed: boolean;
  activityFeedError: string | null;
  fetchActivityFeed: (limit?: number) => Promise<ActivityFeedItem[]>;
  addActivityFeedItem: (actionType: string, itemType: string, itemId: string, isPublic?: boolean, metadata?: any) => Promise<void>;
  refreshActivityFeed: () => Promise<void>;
  
  // Comments
  addComment: (itemType: string, itemId: string, content: string) => Promise<void>;
  getComments: (itemType: string, itemId: string) => Promise<Comment[]>;
  updateComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  
  // Notifications
  notifications: Notification[];
  unreadNotificationsCount: number;
  isLoadingNotifications: boolean;
  notificationsError: string | null;
  fetchNotifications: () => Promise<Notification[]>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  
  // User search
  searchUsers: (query: string, limit?: number) => Promise<{ user_id: string; username?: string; avatar_url?: string }[]>;
  
  // Popular users/items
  getPopularUsers: (limit?: number) => Promise<{ user_id: string; username?: string; avatar_url?: string; followers_count: number }[]>;
  getPopularItems: (limit?: number) => Promise<WardrobeItem[]>;
  
  // Marketplace functionality
  products: Product[];
  wishListItems: WishListItem[];
  productRecommendations: ProductRecommendation[];
  isLoadingProducts: boolean;
  productsError: string | null;
  isLoadingWishList: boolean;
  wishListError: string | null;
  isLoadingRecommendations: boolean;
  recommendationsError: string | null;
  
  // Product methods
  fetchSimilarProducts: (itemId: string, limit?: number) => Promise<Product[]>;
  searchProducts: (query: string, category?: string, limit?: number) => Promise<Product[]>;
  getProductDetails: (productId: string) => Promise<Product | null>;
  refreshProducts: () => Promise<void>;
  
  // Wishlist methods
  addToWishList: (productId: string, notes?: string, targetPrice?: number, notifyPriceDrop?: boolean) => Promise<void>;
  removeFromWishList: (wishListItemId: string) => Promise<void>;
  updateWishListItem: (wishListItemId: string, updates: Partial<WishListItem>) => Promise<void>;
  refreshWishList: () => Promise<void>;
  
  // Product recommendation methods
  getProductRecommendations: (recommendationType: string, limit?: number) => Promise<ProductRecommendation[]>;
  markRecommendationAsViewed: (recommendationId: string) => Promise<void>;
  markRecommendationAsClicked: (recommendationId: string) => Promise<void>;
  refreshRecommendations: () => Promise<void>;
  
  // Price tracking methods
  getPriceHistory: (productId: string) => Promise<PriceHistory[]>;
  
  // Affiliate tracking methods
  trackProductClick: (productId: string, source: string) => Promise<void>;
  
  // Add the getSustainableAlternatives to the interface definition
  getSustainableAlternatives: (productId?: string) => Promise<any[]>;
}

const WardrobeContext = createContext<WardrobeContextType | undefined>(undefined);

export function WardrobeProvider({ children }: { children: React.ReactNode }) {
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [wardrobeRanking, setWardrobeRanking] = useState<WardrobeRanking | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [isLoadingOutfits, setIsLoadingOutfits] = useState<boolean>(false);
  const [outfitError, setOutfitError] = useState<string | null>(null);
  
  const [inspirationBoards, setInspirationBoards] = useState<InspirationBoard[]>([]);
  const [isLoadingInspirationBoards, setIsLoadingInspirationBoards] = useState<boolean>(false);
  const [inspirationBoardError, setInspirationBoardError] = useState<string | null>(null);
  
  // New state for social features
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [isLoadingActivityFeed, setIsLoadingActivityFeed] = useState<boolean>(false);
  const [activityFeedError, setActivityFeedError] = useState<string | null>(null);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState<boolean>(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  
  // Marketplace state
  const [products, setProducts] = useState<Product[]>([]);
  const [wishListItems, setWishListItems] = useState<WishListItem[]>([]);
  const [productRecommendations, setProductRecommendations] = useState<ProductRecommendation[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [isLoadingWishList, setIsLoadingWishList] = useState<boolean>(false);
  const [wishListError, setWishListError] = useState<string | null>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState<boolean>(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  
  const { user, refreshSession: authRefreshSession } = useAuth();
  const supabase = getSupabaseClient();
  
  // Function to refresh the session using AuthContext's refreshSession
  const refreshSession = async () => {
    try {
      const session = await authRefreshSession();
      if (!session) {
        throw new Error('Failed to refresh session');
      }
      return session;
    } catch (err) {
      console.error('Failed to refresh session:', err);
      throw err;
    }
  };
  
  // Extract the fetch wardrobe items functionality into a reusable function
  const fetchWardrobeItems = async () => {
    if (!user) {
      setWardrobeItems([]);
      setIsLoading(false);
      return;
    }

    if (!supabase) {
      setError("Supabase client is not initialized");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching wardrobe items for user:', user.id);
      
      const { data, error } = await supabase
        .from('wardrobe')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      console.log(`Found ${data?.length || 0} wardrobe items`);
      setWardrobeItems(data || []);
      
      // Also fetch ranking data
      await fetchWardrobeRanking();
    } catch (err: any) {
      console.error('Error fetching wardrobe items:', err);
      setError(err.message || 'Failed to fetch wardrobe items');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch items from Supabase on mount and when user changes
  useEffect(() => {
    fetchWardrobeItems();
  }, [user, supabase]);
  
  // Function to fetch wardrobe ranking
  const fetchWardrobeRanking = async () => {
    if (!user || !supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('wardrobes')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 is the "not found" error
        console.error('Error fetching wardrobe ranking:', error);
      } else if (data) {
        setWardrobeRanking(data);
      } else {
        // No ranking data exists yet
        setWardrobeRanking(null);
      }
    } catch (err) {
      console.error('Error in fetchWardrobeRanking:', err);
    }
  };
  
  // Function to refresh ranking - called after operations that might affect it
  const refreshRanking = async () => {
    await fetchWardrobeRanking();
  };
  
  // Function to refresh wardrobe items - to be called when we need to sync with database
  const refreshWardrobeItems = async () => {
    await fetchWardrobeItems();
  };
  
  // Function to upload image
  const uploadImage = async (file: File): Promise<string> => {
    if (!user || !user.id) {
      throw new Error('You must be logged in to upload images');
    }
    
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }
    
    if (!file) {
      throw new Error('No file provided');
    }
    
    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${uuidv4()}.${fileExt}`;
      const filePath = fileName;
      
      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('wardrobe')
        .upload(filePath, file);
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL
      const { data } = supabase.storage
        .from('wardrobe')
        .getPublicUrl(filePath);
        
      return data.publicUrl;
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(err.message || 'Failed to upload image');
      throw err;
    }
  };
  
  // New function to fetch outfits
  const fetchOutfits = async () => {
    if (!user || !supabase) {
      setOutfits([]);
      return;
    }
    
    setIsLoadingOutfits(true);
    setOutfitError(null);
    
    try {
      console.log('Fetching outfits for user:', user.id);
      
      const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      console.log(`Found ${data?.length || 0} outfits`);
      setOutfits(data || []);
    } catch (err: any) {
      console.error('Error fetching outfits:', err);
      setOutfitError(err.message || 'Failed to fetch outfits');
    } finally {
      setIsLoadingOutfits(false);
    }
  };
  
  // Fetch outfits when user changes
  useEffect(() => {
    fetchOutfits();
  }, [user, supabase]);
  
  // Function to add a new outfit
  const addOutfit = async (outfit: Omit<Outfit, 'outfit_id' | 'user_id' | 'created_at'>): Promise<string> => {
    if (!user) {
      throw new Error('You must be logged in to create outfits');
    }
    
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }
    
    try {
      // Try to refresh session first
      try {
        await refreshSession();
      } catch (sessionError) {
        console.error('Session refresh error:', sessionError);
      }
      
      // Create outfit with required fields
      const outfitId = uuidv4();
      const outfitToInsert = {
        ...outfit,
        outfit_id: outfitId,
        user_id: user.id,
        name: outfit.name || 'Unnamed outfit',
        visibility: outfit.visibility || 'private',
        wear_count: 0
      };
      
      const { data, error } = await supabase
        .from('outfits')
        .insert([outfitToInsert])
        .select();
        
      if (error) {
        throw error;
      }
      
      // Update local state
      const newOutfit = data[0];
      setOutfits(prev => [newOutfit, ...prev]);
      
      return outfitId;
    } catch (err: any) {
      console.error('Error creating outfit:', err);
      throw err;
    }
  };
  
  // Function to update an outfit
  const updateOutfit = async (outfitId: string, updates: Partial<Outfit>) => {
    if (!user) {
      throw new Error('You must be logged in to update outfits');
    }
    
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }
    
    try {
      const { data, error } = await supabase
        .from('outfits')
        .update(updates)
        .eq('outfit_id', outfitId)
        .eq('user_id', user.id)
        .select();
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setOutfits(prev => 
        prev.map(outfit => (outfit.outfit_id === outfitId ? data[0] : outfit))
      );
    } catch (err: any) {
      console.error('Error updating outfit:', err);
      throw err;
    }
  };
  
  // Function to remove an outfit
  const removeOutfit = async (outfitId: string) => {
    if (!user) {
      throw new Error('You must be logged in to delete outfits');
    }
    
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }
    
    try {
      const { error } = await supabase
        .from('outfits')
        .delete()
        .eq('outfit_id', outfitId)
        .eq('user_id', user.id);
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setOutfits(prev => prev.filter(outfit => outfit.outfit_id !== outfitId));
    } catch (err: any) {
      console.error('Error deleting outfit:', err);
      throw err;
    }
  };
  
  // Function to get a specific outfit
  const getOutfit = (outfitId: string) => {
    return outfits.find(outfit => outfit.outfit_id === outfitId);
  };
  
  // Function to add an item to an outfit
  const addItemToOutfit = async (outfitId: string, itemId: string, options?: { layer_order?: number, position_data?: any }) => {
    if (!user) {
      throw new Error('You must be logged in to update outfits');
    }
    
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }
    
    try {
      // Check if the outfit belongs to the user
      const outfit = outfits.find(o => o.outfit_id === outfitId);
      if (!outfit) {
        throw new Error('Outfit not found');
      }
      
      if (outfit.user_id !== user.id) {
        throw new Error('You can only add items to your own outfits');
      }
      
      const outfitItem = {
        id: uuidv4(),
        outfit_id: outfitId,
        item_id: itemId,
        layer_order: options?.layer_order || 0,
        position_data: options?.position_data || null
      };
      
      const { error } = await supabase
        .from('outfit_items')
        .insert([outfitItem]);
        
      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('Error adding item to outfit:', err);
      throw err;
    }
  };
  
  // Function to remove an item from an outfit
  const removeItemFromOutfit = async (outfitId: string, itemId: string) => {
    if (!user) {
      throw new Error('You must be logged in to update outfits');
    }
    
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }
    
    try {
      const { error } = await supabase
        .from('outfit_items')
        .delete()
        .match({ outfit_id: outfitId, item_id: itemId });
        
      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('Error removing item from outfit:', err);
      throw err;
    }
  };
  
  // Function to get all items in an outfit
  const getOutfitItems = async (outfitId: string): Promise<WardrobeItem[]> => {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }
    
    try {
      // First get all outfit_items entries
      const { data: outfitItemsData, error: outfitItemsError } = await supabase
        .from('outfit_items')
        .select('*')
        .eq('outfit_id', outfitId);
        
      if (outfitItemsError) {
        throw outfitItemsError;
      }
      
      if (!outfitItemsData || outfitItemsData.length === 0) {
        return [];
      }
      
      // Extract item IDs
      const itemIds = outfitItemsData.map(item => item.item_id);
      
      // Fetch all wardrobe items with these IDs
      const { data: itemsData, error: itemsError } = await supabase
        .from('wardrobe')
        .select('*')
        .in('item_id', itemIds);
        
      if (itemsError) {
        throw itemsError;
      }
      
      return itemsData || [];
    } catch (err: any) {
      console.error('Error fetching outfit items:', err);
      throw err;
    }
  };
  
  // Function to log a wardrobe item as worn
  const logItemAsWorn = async (itemId: string, date?: Date) => {
    if (!user) {
      throw new Error('You must be logged in to update items');
    }
    
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }
    
    try {
      // Find the item first to get current wear count
      const item = wardrobeItems.find(item => item.item_id === itemId);
      if (!item) {
        throw new Error('Item not found');
      }
      
      const currentWearCount = item.wear_count || 0;
      const lastWorn = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      
      // Update the item
      const { data, error } = await supabase
        .from('wardrobe')
        .update({
          wear_count: currentWearCount + 1,
          last_worn: lastWorn
        })
        .eq('item_id', itemId)
        .eq('user_id', user.id)
        .select();
        
      if (error) {
        throw error;
      }
      
      // Update local state
      if (data && data[0]) {
        setWardrobeItems(prev => 
          prev.map(item => (item.item_id === itemId ? data[0] : item))
        );
      }
    } catch (err: any) {
      console.error('Error logging item as worn:', err);
      throw err;
    }
  };
  
  // Function to log an outfit as worn
  const logOutfitAsWorn = async (outfitId: string, date?: Date) => {
    if (!user) {
      throw new Error('You must be logged in to update outfits');
    }
    
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }
    
    try {
      // Find the outfit first to get current wear count
      const outfit = outfits.find(outfit => outfit.outfit_id === outfitId);
      if (!outfit) {
        throw new Error('Outfit not found');
      }
      
      const currentWearCount = outfit.wear_count || 0;
      const lastWorn = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      
      // Update the outfit
      const { data, error } = await supabase
        .from('outfits')
        .update({
          wear_count: currentWearCount + 1,
          last_worn: lastWorn
        })
        .eq('outfit_id', outfitId)
        .eq('user_id', user.id)
        .select();
        
      if (error) {
        throw error;
      }
      
      // Update local state
      if (data && data[0]) {
        setOutfits(prev => 
          prev.map(outfit => (outfit.outfit_id === outfitId ? data[0] : outfit))
        );
      }
      
      // Also log all items in the outfit as worn
      try {
        const outfitItems = await getOutfitItems(outfitId);
        for (const item of outfitItems) {
          await logItemAsWorn(item.item_id, date);
        }
      } catch (itemErr) {
        console.error('Error logging outfit items as worn:', itemErr);
        // Continue even if some items fail to update
      }
    } catch (err: any) {
      console.error('Error logging outfit as worn:', err);
      throw err;
    }
  };
  
  // Function to update item visibility
  const updateItemVisibility = async (itemId: string, visibility: string) => {
    return updateItem(itemId, { visibility });
  };
  
  // Function to update outfit visibility
  const updateOutfitVisibility = async (outfitId: string, visibility: string) => {
    return updateOutfit(outfitId, { visibility });
  };
  
  // Function to get most worn items
  const getMostWornItems = (limit: number = 5): WardrobeItem[] => {
    return [...wardrobeItems]
      .filter(item => item.wear_count && item.wear_count > 0)
      .sort((a, b) => (b.wear_count || 0) - (a.wear_count || 0))
      .slice(0, limit);
  };
  
  // Function to get least worn items
  const getLeastWornItems = (limit: number = 5): WardrobeItem[] => {
    return [...wardrobeItems]
      .filter(item => item.created_at) // Filter out items without created_at
      .sort((a, b) => (a.wear_count || 0) - (b.wear_count || 0))
      .slice(0, limit);
  };
  
  // Function to get recently worn items
  const getRecentlyWornItems = (limit: number = 5): WardrobeItem[] => {
    return [...wardrobeItems]
      .filter(item => item.last_worn) // Only include items that have been worn
      .sort((a, b) => {
        if (!a.last_worn) return 1;
        if (!b.last_worn) return -1;
        return new Date(b.last_worn).getTime() - new Date(a.last_worn).getTime();
      })
      .slice(0, limit);
  };
  
  // Add new item to Supabase
  const addItem = async (item: Omit<WardrobeItem, 'item_id' | 'user_id' | 'created_at'>) => {
    if (!user || !user.id) {
      throw new Error('You must be logged in to add items');
    }
    
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }
    
    try {
      // First, get a fresh session to ensure authentication
      try {
        await refreshSession();
      } catch (sessionError) {
        console.error('Session refresh error:', sessionError);
        // Continue with potentially expired token - API might still work
      }
      
      // Validate required fields
      if (!item.name) {
        throw new Error('Item name is required');
      }
      
      if (!item.category) {
        throw new Error('Item category is required');
      }
      
      // Create a new item object, ensuring required fields are present
      const itemToInsert = {
        ...item,
        user_id: user.id,
        item_id: uuidv4(),
        created_at: new Date().toISOString(),
        // Ensure name and category are present as they are required fields
        name: item.name,
        category: item.category
      };
      
      // Log what we're trying to insert
      console.log('Attempting to insert item:', itemToInsert);
      
      // Try first with client
      try {
        const { data, error } = await supabase
          .from('wardrobe')
          .insert([itemToInsert])
          .select();
          
        if (error) {
          console.error('Supabase error details:', error);
          
          // For any error, try the API route which has more robust error handling
          console.log('Error detected, trying API route instead');
          return await tryInsertViaAPI(itemToInsert);
        }
        
        if (data && data.length > 0) {
          // Just update local state directly without re-fetching
          setWardrobeItems(prev => [...prev, data[0]]);
          
          // Update ranking after a short delay
          setTimeout(() => {
            refreshRanking();
          }, 500);
          return;
        } else {
          console.log('No data returned, trying API route');
          return await tryInsertViaAPI(itemToInsert);
        }
      } catch (clientError) {
        console.error('Client insertion error:', clientError);
        return await tryInsertViaAPI(itemToInsert);
      }
    } catch (err: any) {
      console.error('Error adding wardrobe item:', err);
      setError(err.message || 'Failed to add wardrobe item');
      throw err;
    }
  };
  
  // Helper function to try inserting via API
  const tryInsertViaAPI = async (item: any) => {
    console.log('Attempting to use server API...');
    
    try {
      // Sanitize the item before sending to API
      // Only include fields that we know should exist in the wardrobe table
      const knownFields = [
        'item_id', 'user_id', 'name', 'category', 'color', 'brand', 'style',
        'image_path', 'created_at', 'description', 'visibility', 'brand_url',
        'wear_count', 'purchase_date', 'purchase_price', 'size', 'last_worn',
        'material', 'season', 'occasion', 'featured', 'metadata'
      ];
      
      // Create a sanitized version
      const sanitizedItem = Object.keys(item)
        .filter(key => knownFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = item[key];
          return obj;
        }, {} as any);
      
      const response = await fetch('/api/wardrobe/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sanitizedItem)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add item via API');
      }
      
      const apiData = await response.json();
      // Update local state directly without re-fetching
      setWardrobeItems(prev => [...prev, apiData]);
      
      // Update ranking after a short delay
      setTimeout(() => {
        refreshRanking();
      }, 500);
    } catch (apiError: any) {
      console.error('API insert failed:', apiError);
      throw new Error(`Failed to add item: ${apiError.message}`);
    }
  };
  
  // Remove item from Supabase
  const removeItem = async (itemId: string) => {
    if (!user || !user.id) {
      throw new Error('You must be logged in to remove items');
    }
    
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }
    
    try {
      // First, try to refresh the session to ensure we have valid auth
      try {
        await refreshSession();
      } catch (sessionError) {
        console.error('Session refresh error:', sessionError);
        // Continue with potentially expired token - API might still work
      }
      
      // Try client-side deletion first
      try {
        const { error } = await supabase
          .from('wardrobe')
          .delete()
          .eq('item_id', itemId)
          .eq('user_id', user.id);
          
        if (error) {
          console.error('Supabase delete error:', error);
          
          if (error.message.includes('row-level security') || 
              error.message.includes('permission denied') ||
              error.message.includes('auth') || 
              error.message.includes('JWT')) {
            // Fall back to API route for permission issues
            return await deleteViaAPI(itemId);
          }
          throw error;
        }
        
        // Also remove the image if it exists
        const itemToRemove = wardrobeItems.find(item => item.item_id === itemId);
        if (itemToRemove?.image_path) {
          const imagePath = itemToRemove.image_path.split('/').slice(-2).join('/');
          await supabase.storage.from('wardrobe').remove([imagePath]);
        }
        
        // Update local state
        setWardrobeItems(prev => prev.filter(item => item.item_id !== itemId));
        
        // Update ranking
        setTimeout(() => {
          refreshRanking();
        }, 500);
      } catch (clientError) {
        console.error('Client deletion error:', clientError);
        return await deleteViaAPI(itemId);
      }
    } catch (err: any) {
      console.error('Error removing wardrobe item:', err);
      setError(err.message || 'Failed to remove wardrobe item');
      throw err;
    }
  };
  
  // Helper function to delete via API route
  const deleteViaAPI = async (itemId: string) => {
    console.log('Using API route for deletion due to permission issues');
    
    try {
      const response = await fetch(`/api/wardrobe/delete?id=${itemId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete item via API');
      }
      
      // Update local state
      setWardrobeItems(prev => prev.filter(item => item.item_id !== itemId));
      
      // Update ranking
      setTimeout(() => {
        refreshRanking();
      }, 500);
    } catch (apiError: any) {
      console.error('API deletion failed:', apiError);
      throw new Error(`Failed to delete item: ${apiError.message}`);
    }
  };
  
  // Update item in Supabase
  const updateItem = async (itemId: string, updates: Partial<WardrobeItem>) => {
    if (!user || !user.id) {
      throw new Error('You must be logged in to update items');
    }
    
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }
    
    // Validate required fields if they are being updated
    if (updates.name !== undefined && !updates.name.trim()) {
      throw new Error('Item name is required');
    }
    
    if (updates.category !== undefined && !updates.category) {
      throw new Error('Item category is required');
    }
    
    try {
      // Sanitize updates to only include known fields
      const knownFields = [
        'name', 'category', 'color', 'brand', 'style',
        'image_path', 'description', 'visibility', 'brand_url',
        'wear_count', 'purchase_date', 'purchase_price', 'size', 'last_worn',
        'material', 'season', 'occasion', 'featured', 'metadata'
      ];
      
      // Create a sanitized version of updates
      const sanitizedUpdates = Object.keys(updates)
        .filter(key => knownFields.includes(key))
        .reduce((obj, key) => {
          // Use type assertion to tell TypeScript that key is a valid property of WardrobeItem
          obj[key as keyof WardrobeItem] = updates[key as keyof typeof updates];
          return obj;
        }, {} as Partial<WardrobeItem>);
      
      const { data, error } = await supabase
        .from('wardrobe')
        .update(sanitizedUpdates)
        .eq('item_id', itemId)
        .eq('user_id', user.id)
        .select();
        
      if (error) {
        console.error('Error updating wardrobe item:', error);
        
        if (error.message.includes('row-level security')) {
          throw new Error('Permission denied. You can only update your own items.');
        }
        
        if (error.message && (
          error.message.includes('column') || 
          error.message.includes('does not exist') ||
          error.message.includes('not present in table')
        )) {
          throw new Error('Failed to update: Some fields are not compatible with the database schema.');
        }
        
        throw error;
      }
      
      // Update local state directly without re-fetching
      setWardrobeItems(prev => 
        prev.map(item => (item.item_id === itemId ? data[0] : item))
      );
      
      // Update ranking after a short delay
      setTimeout(() => {
        refreshRanking();
      }, 500);
    } catch (err: any) {
      console.error('Error updating wardrobe item:', err);
      setError(err.message || 'Failed to update wardrobe item');
      throw err;
    }
  };
  
  const getCategoryCount = (category: string) => {
    return wardrobeItems.filter(item => item.category === category).length;
  };
  
  const getTotalItems = () => {
    return wardrobeItems.length;
  };
  
  // Follow wardrobe functionality
  const followWardrobe = async (userId: string) => {
    if (!user || !supabase) return;
    
    try {
      // Check if already following
      const { data: existingFollow } = await supabase
        .from('wardrobe_follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('followed_id', userId)
        .single();
      
      if (existingFollow) {
        console.log('Already following this wardrobe');
        return;
      }
      
      const { error } = await supabase
        .from('wardrobe_follows')
        .insert({
          follower_id: user.id,
          followed_id: userId
        });
      
      if (error) throw error;
      
      console.log('Successfully followed wardrobe');
      
      // Add additional code to create an activity feed item and notification
      try {
        // Add to activity feed
        await addActivityFeedItem('follow', 'user', userId, true);
        
        // Create notification for the followed user
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            sender_id: user.id,
            notification_type: 'follow',
            content: 'started following your wardrobe'
          });
      } catch (err: any) {
        console.error('Error creating follow notification:', err);
      }
    } catch (err: any) {
      console.error('Error following wardrobe:', err);
      throw new Error(err.message || 'Failed to follow wardrobe');
    }
  };
  
  const unfollowWardrobe = async (userId: string) => {
    if (!user || !supabase) return;
    
    try {
      const { error } = await supabase
        .from('wardrobe_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('followed_id', userId);
      
      if (error) throw error;
      
      console.log('Successfully unfollowed wardrobe');
    } catch (err: any) {
      console.error('Error unfollowing wardrobe:', err);
      throw new Error(err.message || 'Failed to unfollow wardrobe');
    }
  };
  
  const isFollowingWardrobe = async (userId: string): Promise<boolean> => {
    if (!user || !supabase) return false;
    
    try {
      const { data, error } = await supabase
        .from('wardrobe_follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('followed_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
        throw error;
      }
      
      return !!data;
    } catch (err: any) {
      console.error('Error checking follow status:', err);
      return false;
    }
  };
  
  const getFollowedWardrobes = async (): Promise<{ user_id: string; username?: string; avatar_url?: string }[]> => {
    if (!user || !supabase) return [];
    
    try {
      // Join wardrobe_follows with profiles to get profile information
      const { data, error } = await supabase
        .from('wardrobe_follows')
        .select(`
          followed_id,
          profiles:followed_id (
            id,
            username,
            avatar_url
          )
        `)
        .eq('follower_id', user.id);
      
      if (error) throw error;
      
      // Transform the data into the required format using type-safe approach
      return (data || []).map((item: any) => ({
        user_id: item.followed_id,
        username: item.profiles?.username || undefined,
        avatar_url: item.profiles?.avatar_url || undefined
      }));
    } catch (err: any) {
      console.error('Error fetching followed wardrobes:', err);
      return [];
    }
  };
  
  const getWardrobeFollowers = async (): Promise<{ user_id: string; username?: string; avatar_url?: string }[]> => {
    if (!user || !supabase) return [];
    
    try {
      // Join wardrobe_follows with profiles to get profile information
      const { data, error } = await supabase
        .from('wardrobe_follows')
        .select(`
          follower_id,
          profiles:follower_id (
            id,
            username,
            avatar_url
          )
        `)
        .eq('followed_id', user.id);
      
      if (error) throw error;
      
      // Transform the data into the required format using type-safe approach
      return (data || []).map((item: any) => ({
        user_id: item.follower_id,
        username: item.profiles?.username || undefined,
        avatar_url: item.profiles?.avatar_url || undefined
      }));
    } catch (err: any) {
      console.error('Error fetching wardrobe followers:', err);
      return [];
    }
  };
  
  // Fetch inspiration boards
  const fetchInspirationBoards = async () => {
    if (!user) {
      setInspirationBoards([]);
      setIsLoadingInspirationBoards(false);
      return;
    }

    if (!supabase) {
      setInspirationBoardError("Supabase client is not initialized");
      setIsLoadingInspirationBoards(false);
      return;
    }

    setIsLoadingInspirationBoards(true);
    setInspirationBoardError(null);

    try {
      const { data, error } = await supabase
        .from('inspiration_boards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setInspirationBoards(data || []);
    } catch (err: any) {
      console.error('Error fetching inspiration boards:', err.message);
      setInspirationBoardError(err.message);
    } finally {
      setIsLoadingInspirationBoards(false);
    }
  };

  // Create a new inspiration board
  const createInspirationBoard = async (name: string, description?: string, visibility: string = 'private'): Promise<string> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    try {
      const newBoard: InspirationBoard = {
        id: uuidv4(),
        user_id: user.id,
        name,
        description,
        created_at: new Date().toISOString(),
        visibility
      };

      const { data, error } = await supabase
        .from('inspiration_boards')
        .insert([newBoard])
        .select();

      if (error) {
        throw error;
      }

      // Update the local state
      setInspirationBoards(prev => [...prev, data[0]]);
      
      return newBoard.id;
    } catch (err: any) {
      console.error('Error creating inspiration board:', err.message);
      throw err;
    }
  };

  // Update an inspiration board
  const updateInspirationBoard = async (boardId: string, updates: Partial<InspirationBoard>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    try {
      const updatedAt = new Date().toISOString();
      const updateData = {
        ...updates,
        updated_at: updatedAt
      };

      const { error } = await supabase
        .from('inspiration_boards')
        .update(updateData)
        .eq('id', boardId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Update the local state
      setInspirationBoards(prev => 
        prev.map(board => 
          board.id === boardId ? { ...board, ...updates, updated_at: updatedAt } : board
        )
      );
    } catch (err: any) {
      console.error('Error updating inspiration board:', err.message);
      throw err;
    }
  };

  // Delete an inspiration board
  const deleteInspirationBoard = async (boardId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    try {
      // First delete all items in the board
      const { error: itemsError } = await supabase
        .from('inspiration_items')
        .delete()
        .eq('board_id', boardId);

      if (itemsError) {
        throw itemsError;
      }

      // Then delete the board itself
      const { error } = await supabase
        .from('inspiration_boards')
        .delete()
        .eq('id', boardId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Update the local state
      setInspirationBoards(prev => prev.filter(board => board.id !== boardId));
    } catch (err: any) {
      console.error('Error deleting inspiration board:', err.message);
      throw err;
    }
  };

  // Get a specific inspiration board
  const getInspirationBoard = (boardId: string) => {
    return inspirationBoards.find(board => board.id === boardId);
  };

  // Get items in an inspiration board
  const getInspirationBoardItems = async (boardId: string): Promise<InspirationItem[]> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    try {
      const { data, error } = await supabase
        .from('inspiration_items')
        .select('*')
        .eq('board_id', boardId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (err: any) {
      console.error('Error fetching inspiration board items:', err.message);
      throw err;
    }
  };

  // Add an item to an inspiration board
  const addItemToInspirationBoard = async (
    boardId: string, 
    itemType: 'wardrobe' | 'external' | 'outfit', 
    itemId?: string, 
    externalUrl?: string, 
    externalImage?: string, 
    note?: string
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    try {
      const newItem: Partial<InspirationItem> = {
        id: uuidv4(),
        board_id: boardId,
        user_id: user.id,
        created_at: new Date().toISOString(),
        source_type: itemType,
        note
      };

      if (itemType === 'wardrobe' && itemId) {
        newItem.item_id = itemId;
      } else if (itemType === 'outfit' && itemId) {
        newItem.outfit_id = itemId;
      } else if (itemType === 'external') {
        newItem.external_url = externalUrl;
        newItem.external_image = externalImage;
      }

      const { error } = await supabase
        .from('inspiration_items')
        .insert([newItem]);

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('Error adding item to inspiration board:', err.message);
      throw err;
    }
  };

  // Remove an item from an inspiration board
  const removeItemFromInspirationBoard = async (boardId: string, itemId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    try {
      const { error } = await supabase
        .from('inspiration_items')
        .delete()
        .eq('id', itemId)
        .eq('board_id', boardId);

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('Error removing item from inspiration board:', err.message);
      throw err;
    }
  };

  // Refresh inspiration boards
  const refreshInspirationBoards = async () => {
    await fetchInspirationBoards();
  };
  
  // Activity Feed Methods
  const fetchActivityFeed = async (limit: number = 20): Promise<ActivityFeedItem[]> => {
    if (!user || !supabase) return [];
    
    setIsLoadingActivityFeed(true);
    setActivityFeedError(null);
    
    try {
      // First check if the table exists to avoid errors with missing tables
      try {
        const { error: tableCheckError } = await supabase
          .from('activity_feed')
          .select('id')
          .limit(1);
          
        if (tableCheckError && tableCheckError.message?.includes('does not exist')) {
          console.log('Activity feed table does not exist, returning empty array');
          setActivityFeed([]);
          return [];
        }
      } catch (tableErr) {
        console.error('Error checking activity feed table:', tableErr);
        // Continue with the query anyway
      }

      // Fetch activity feed entries that are either public or belong to the current user
      // But avoid using the foreign key reference which is causing the error
      const { data: activityData, error } = await supabase
        .from('activity_feed')
        .select('*')
        .or(`is_public.eq.true,user_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        // Create a safe error object with just the basic properties to avoid circular references
        const errorDetails = {
          message: error.message || 'No error message',
          code: error.code || 'No error code',
          details: error.details || 'No details',
          hint: error.hint || 'No hint provided'
        };
        
        console.error("Supabase error fetching activity feed:", errorDetails);
        
        // Set a more informative error message
        setActivityFeedError(`Failed to load activity feed: ${error.message || 'Unknown error'}`);
        
        // If there's an error with the direct Supabase query, try the API route
        return fetchActivityFeedViaAPI(limit);
      }
      
      // Ensure we have valid data before processing
      if (!activityData) {
        console.log('No activity feed data returned');
        setActivityFeed([]);
        return [];
      }
      
      if (!Array.isArray(activityData)) {
        console.log('Invalid format for activity feed data - not an array');
        setActivityFeed([]);
        return [];
      }

      // If we have activity data, fetch the profile data separately
      if (activityData.length > 0) {
        // Extract unique user IDs to fetch profiles for
        const userIds = [...new Set(activityData.map(item => item.user_id))];
        
        // Fetch profiles for these users
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);
        
        if (profilesError) {
          console.error('Error fetching profiles for activity feed:', profilesError);
          // Continue without profile data, rather than failing completely
        }
        
        // Create a lookup map for profiles
        const profilesMap = (profilesData || []).reduce((map, profile) => {
          map[profile.id] = profile;
          return map;
        }, {} as Record<string, Profile>);
        
        // Join the data manually
        const formattedData = activityData.map(item => ({
          ...item,
          profile: profilesMap[item.user_id] || null
        }));
        
        setActivityFeed(formattedData);
        return formattedData;
      }
      
      setActivityFeed(activityData);
      return activityData;
    } catch (err: any) {
      // Create a safer error object that won't have circular references
      const safeErrorObj = {
        message: err?.message || 'No error message',
        name: err?.name || 'Unknown error type',
        code: err?.code,
        details: typeof err?.details === 'string' ? err.details : 'Error details not available'
      };
      
      console.error('Error fetching activity feed:', safeErrorObj);
      
      // Set a more useful error message in the context
      setActivityFeedError(`Failed to fetch activity feed: ${err?.message || 'Unknown error'}`);
      
      // If there's an exception, try the API route as fallback
      return fetchActivityFeedViaAPI(limit);
    } finally {
      setIsLoadingActivityFeed(false);
    }
  };
  
  // Helper function to fetch activity feed via API
  const fetchActivityFeedViaAPI = async (limit: number = 20): Promise<ActivityFeedItem[]> => {
    console.log('Falling back to API route for activity feed');
    try {
      const response = await fetch(`/api/activity-feed?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        console.error('API returned non-array data for activity feed');
        setActivityFeed([]);
        return [];
      }
      
      setActivityFeed(data);
      return data;
    } catch (apiErr: any) {
      // Create a simpler error object that won't have circular references
      const safeErrorObj = {
        message: apiErr?.message || 'No error message',
        name: apiErr?.name || 'Unknown error type',
        status: typeof apiErr?.status === 'number' ? apiErr.status : 'No status code'
      };
      
      console.error('Error fetching activity feed via API:', safeErrorObj);
      
      // Set a more specific error message based on the type of error
      if (apiErr?.message?.includes('fetch') || apiErr?.message?.includes('network')) {
        setActivityFeedError('Network error while loading activity feed. Please check your connection.');
      } else if (apiErr?.status === 401 || apiErr?.status === 403) {
        setActivityFeedError('Authentication error. Please try logging in again.');
      } else {
        setActivityFeedError(`Failed to load activity feed: ${apiErr?.message || 'Unknown error'}`);
      }
      
      setActivityFeed([]);
      return [];
    } finally {
      setIsLoadingActivityFeed(false);
    }
  };
  
  const addActivityFeedItem = async (
    actionType: string,
    itemType: string,
    itemId: string,
    isPublic: boolean = true,
    metadata: any = {}
  ): Promise<void> => {
    if (!user || !supabase) return;
    
    try {
      // First check if the table exists to avoid errors with missing tables
      try {
        const { error: tableCheckError } = await supabase
          .from('activity_feed')
          .select('id')
          .limit(1);
          
        if (tableCheckError && tableCheckError.message.includes('does not exist')) {
          console.log('Activity feed table does not exist, skipping add operation');
          return;
        }
      } catch (tableErr) {
        console.error('Error checking activity feed table:', tableErr);
        // Continue with the insert anyway
      }
      
      const { error } = await supabase
        .from('activity_feed')
        .insert({
          user_id: user.id,
          action_type: actionType,
          item_type: itemType,
          item_id: itemId,
          metadata,
          is_public: isPublic
        });
      
      if (error) {
        console.error('Error adding to activity feed:', error);
        return; // Don't proceed with refresh if there was an error
      }
      
      // Only refresh the activity feed if insert was successful
      try {
        await refreshActivityFeed();
      } catch (refreshErr) {
        console.error('Error refreshing activity feed after add:', refreshErr);
      }
    } catch (err: any) {
      console.error('Error adding activity feed item:', err);
      // Do not rethrow to prevent crashing the app
    }
  };
  
  const refreshActivityFeed = async (): Promise<void> => {
    try {
      await fetchActivityFeed();
    } catch (err: any) {
      // Create a safer error representation
      const safeError = {
        message: err?.message || 'Unknown error',
        name: err?.name || 'Error',
        code: err?.code
      };
      
      console.error('Error refreshing activity feed:', safeError);
      
      // Set empty data to prevent UI issues
      setActivityFeed([]);
      setActivityFeedError('Failed to refresh activity feed. Please try again later.');
      
      // Do not rethrow the error to prevent crashing the app
    }
  };
  
  // Comments Methods
  const addComment = async (itemType: string, itemId: string, content: string): Promise<void> => {
    if (!user || !supabase) return;
    
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          item_type: itemType,
          item_id: itemId,
          content
        });
      
      if (error) throw error;
      
      // Add to activity feed
      await addActivityFeedItem('comment', itemType, itemId, true, { content });
      
      // Create notification for the item owner (if not the current user)
      if (itemType === 'wardrobe_item') {
        const { data: itemData } = await supabase
          .from('wardrobe')
          .select('user_id, name')
          .eq('item_id', itemId)
          .single();
        
        if (itemData && itemData.user_id !== user.id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: itemData.user_id,
              sender_id: user.id,
              notification_type: 'comment',
              item_type: itemType,
              item_id: itemId,
              content: `commented on your item: ${itemData.name}`
            });
        }
      } else if (itemType === 'outfit') {
        const { data: itemData } = await supabase
          .from('outfits')
          .select('user_id, name')
          .eq('outfit_id', itemId)
          .single();
        
        if (itemData && itemData.user_id !== user.id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: itemData.user_id,
              sender_id: user.id,
              notification_type: 'comment',
              item_type: itemType,
              item_id: itemId,
              content: `commented on your outfit: ${itemData.name}`
            });
        }
      }
    } catch (err: any) {
      console.error('Error adding comment:', err);
    }
  };
  
  const getComments = async (itemType: string, itemId: string): Promise<Comment[]> => {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id(id, username, avatar_url)
        `)
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      return data.map((comment: any) => ({
        ...comment,
        profile: comment.profiles
      }));
    } catch (err: any) {
      console.error('Error fetching comments:', err);
      return [];
    }
  };
  
  const updateComment = async (commentId: string, content: string): Promise<void> => {
    if (!user || !supabase) return;
    
    try {
      const { error } = await supabase
        .from('comments')
        .update({
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    } catch (err: any) {
      console.error('Error updating comment:', err);
    }
  };
  
  const deleteComment = async (commentId: string): Promise<void> => {
    if (!user || !supabase) return;
    
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    } catch (err: any) {
      console.error('Error deleting comment:', err);
    }
  };
  
  // Notifications Methods
  const fetchNotifications = async (): Promise<Notification[]> => {
    if (!user || !supabase) return [];
    
    setIsLoadingNotifications(true);
    setNotificationsError(null);
    
    try {
      // First, fetch the notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (notificationsError) throw notificationsError;
      
      // If there are no notifications, return empty array
      if (!notificationsData || notificationsData.length === 0) {
        setNotifications([]);
        return [];
      }
      
      // Extract sender IDs from notifications that have a sender
      const senderIds = notificationsData
        .filter(notification => notification.sender_id)
        .map(notification => notification.sender_id);
      
      // If there are no senders, return just the notifications without profile data
      if (senderIds.length === 0) {
        setNotifications(notificationsData);
        return notificationsData;
      }
      
      // Fetch profile data for senders in a separate query
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', senderIds);
      
      if (profilesError) throw profilesError;
      
      // Create a map of profiles by ID for easy lookup
      const profilesMap = (profilesData || []).reduce((map, profile) => {
        map[profile.id] = {
          id: profile.id,
          username: profile.username,
          avatar_url: profile.avatar_url
        };
        return map;
      }, {} as Record<string, Profile>);
      
      // Combine notifications with sender profiles
      const notificationsWithProfiles = notificationsData.map(notification => ({
        ...notification,
        sender_profile: notification.sender_id ? profilesMap[notification.sender_id] : undefined
      }));
      
      setNotifications(notificationsWithProfiles);
      return notificationsWithProfiles;
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setNotificationsError(err.message);
      return [];
    } finally {
      setIsLoadingNotifications(false);
    }
  };
  
  const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    if (!user || !supabase) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId
            ? { ...notification, is_read: true } : notification
        )
      );
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
    }
  };
  
  const markAllNotificationsAsRead = async (): Promise<void> => {
    if (!user || !supabase) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
    }
  };
  
  const deleteNotification = async (notificationId: string): Promise<void> => {
    if (!user || !supabase) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
    } catch (err: any) {
      console.error('Error deleting notification:', err);
    }
  };
  
  const refreshNotifications = async (): Promise<void> => {
    await fetchNotifications();
  };
  
  // Calculate unread notifications count
  const unreadNotificationsCount = notifications.filter(n => !n.is_read).length;
  
  // User Search Method
  const searchUsers = async (query: string, limit: number = 10): Promise<{ user_id: string; username?: string; avatar_url?: string }[]> => {
    if (!supabase || !query.trim()) return [];
    
    try {
      // Search for users by username (case-insensitive)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .ilike('username', `%${query}%`)
        .limit(limit);
      
      if (error) throw error;
      
      return data.map((profile: any) => ({
        user_id: profile.id,
        username: profile.username,
        avatar_url: profile.avatar_url
      }));
    } catch (err: any) {
      console.error('Error searching users:', err);
      return [];
    }
  };
  
  // Popular Users/Items Methods
  const getPopularUsers = async (limit: number = 10): Promise<{ user_id: string; username?: string; avatar_url?: string; followers_count: number }[]> => {
    if (!supabase) return [];
    
    try {
      // Get users with the most followers
      const { data, error } = await supabase
        .rpc('get_popular_users', { limit_count: limit });
      
      if (error) throw error;
      
      return data || [];
    } catch (err: any) {
      console.error('Error fetching popular users:', err);
      return [];
    }
  };
  
  const getPopularItems = async (limit: number = 10): Promise<WardrobeItem[]> => {
    if (!supabase) return [];
    
    try {
      // Get public wardrobe items with the most views/comments
      const { data, error } = await supabase
        .from('wardrobe')
        .select('*')
        .eq('visibility', 'public')
        .order('wear_count', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return data || [];
    } catch (err: any) {
      console.error('Error fetching popular items:', err);
      return [];
    }
  };
  
  // Marketplace methods
  const fetchSimilarProducts = async (itemId: string, limit: number = 10): Promise<Product[]> => {
    try {
      setIsLoadingProducts(true);
      const supabase = getSupabaseClient();
      
      const { data: wardrobeItem, error: itemError } = await supabase
        .from('wardrobe')
        .select('*')
        .eq('item_id', itemId)
        .single();

      if (itemError) {
        throw new Error(`Error fetching wardrobe item: ${itemError.message}`);
      }
      
      // Find products similar to the wardrobe item
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('similar_to_item_id', itemId)
        .limit(limit);

      if (error) {
        throw new Error(`Error fetching similar products: ${error.message}`);
      }
      
      // If we don't have enough products specifically matched to this item,
      // add some from the same category
      if (data.length < limit && wardrobeItem) {
        const { data: categoryProducts, error: categoryError } = await supabase
          .from('products')
          .select('*')
          .eq('category', wardrobeItem.category)
          .neq('similar_to_item_id', itemId) // Don't include already matched items
          .limit(limit - data.length);

        if (categoryError) {
          throw new Error(`Error fetching category products: ${categoryError.message}`);
        }
        
        return [...data, ...categoryProducts];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching similar products:', error);
      setProductsError(error instanceof Error ? error.message : 'Unknown error');
      return [];
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const searchProducts = async (query: string, category?: string, limit: number = 20): Promise<Product[]> => {
    try {
      setIsLoadingProducts(true);
      const supabase = getSupabaseClient();
      
      let productQuery = supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,brand.ilike.%${query}%`)
        .limit(limit);
        
      if (category) {
        productQuery = productQuery.eq('category', category);
      }
      
      const { data, error } = await productQuery;

      if (error) {
        throw new Error(`Error searching products: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      console.error('Error searching products:', error);
      setProductsError(error instanceof Error ? error.message : 'Unknown error');
      return [];
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const getProductDetails = async (productId: string): Promise<Product | null> => {
    try {
      setIsLoadingProducts(true);
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('product_id', productId)
        .single();

      if (error) {
        throw new Error(`Error fetching product details: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching product details:', error);
      setProductsError(error instanceof Error ? error.message : 'Unknown error');
      return null;
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const refreshProducts = async (): Promise<void> => {
    try {
      setIsLoadingProducts(true);
      const supabase = getSupabaseClient();
      
      // Get recently viewed or added products
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        throw new Error(`Error fetching products: ${error.message}`);
      }
      
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProductsError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchWishList = async (): Promise<void> => {
    if (!user) return;
    
    try {
      setIsLoadingWishList(true);
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('wish_list')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Error fetching wishlist: ${error.message}`);
      }
      
      setWishListItems(data || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setWishListError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoadingWishList(false);
    }
  };

  const addToWishList = async (
    productId: string, 
    notes?: string, 
    targetPrice?: number, 
    notifyPriceDrop: boolean = false
  ): Promise<void> => {
    if (!user) return;
    
    try {
      const supabase = getSupabaseClient();
      
      // Get current product price
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('price')
        .eq('product_id', productId)
        .single();
        
      if (productError) {
        throw new Error(`Error fetching product price: ${productError.message}`);
      }
      
      const { error } = await supabase
        .from('wish_list')
        .insert({
          user_id: user.id,
          product_id: productId,
          notes,
          price_at_addition: product?.price,
          target_price: targetPrice,
          notify_price_drop: notifyPriceDrop
        });

      if (error) {
        throw new Error(`Error adding to wishlist: ${error.message}`);
      }
      
      // Add activity feed item for adding to wishlist
      await addActivityFeedItem(
        'added_to_wishlist',
        'product',
        productId,
        false, // Private by default
        { product_id: productId }
      );
      
      // Refresh wishlist
      await fetchWishList();
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      setWishListError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const removeFromWishList = async (wishListItemId: string): Promise<void> => {
    if (!user) return;
    
    try {
      const supabase = getSupabaseClient();
      
      const { error } = await supabase
        .from('wish_list')
        .delete()
        .eq('id', wishListItemId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Error removing from wishlist: ${error.message}`);
      }
      
      // Refresh wishlist
      await fetchWishList();
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      setWishListError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const updateWishListItem = async (wishListItemId: string, updates: Partial<WishListItem>): Promise<void> => {
    if (!user) return;
    
    try {
      const supabase = getSupabaseClient();
      
      const { error } = await supabase
        .from('wish_list')
        .update(updates)
        .eq('id', wishListItemId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Error updating wishlist item: ${error.message}`);
      }
      
      // Refresh wishlist
      await fetchWishList();
    } catch (error) {
      console.error('Error updating wishlist item:', error);
      setWishListError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const refreshWishList = async (): Promise<void> => {
    await fetchWishList();
  };

  const fetchProductRecommendations = async (): Promise<void> => {
    if (!user) return;
    
    try {
      setIsLoadingRecommendations(true);
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('product_recommendations')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', user.id)
        .order('relevance_score', { ascending: false });

      if (error) {
        throw new Error(`Error fetching product recommendations: ${error.message}`);
      }
      
      setProductRecommendations(data || []);
    } catch (error) {
      console.error('Error fetching product recommendations:', error);
      setRecommendationsError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const getProductRecommendations = async (
    recommendationType: string, 
    limit: number = 10
  ): Promise<ProductRecommendation[]> => {
    if (!user) return [];
    
    try {
      setIsLoadingRecommendations(true);
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('product_recommendations')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', user.id)
        .eq('recommendation_type', recommendationType)
        .order('relevance_score', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Error fetching ${recommendationType} recommendations: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      console.error(`Error fetching ${recommendationType} recommendations:`, error);
      setRecommendationsError(error instanceof Error ? error.message : 'Unknown error');
      return [];
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const markRecommendationAsViewed = async (recommendationId: string): Promise<void> => {
    if (!user) return;
    
    try {
      const supabase = getSupabaseClient();
      
      const { error } = await supabase
        .from('product_recommendations')
        .update({ is_viewed: true })
        .eq('id', recommendationId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Error marking recommendation as viewed: ${error.message}`);
      }
      
      // Update local state
      setProductRecommendations(prevRecommendations => 
        prevRecommendations.map(rec => 
          rec.id === recommendationId ? { ...rec, is_viewed: true } : rec
        )
      );
    } catch (error) {
      console.error('Error marking recommendation as viewed:', error);
      setRecommendationsError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const markRecommendationAsClicked = async (recommendationId: string): Promise<void> => {
    if (!user) return;
    
    try {
      const supabase = getSupabaseClient();
      
      const { error } = await supabase
        .from('product_recommendations')
        .update({ is_clicked: true })
        .eq('id', recommendationId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Error marking recommendation as clicked: ${error.message}`);
      }
      
      // Update local state
      setProductRecommendations(prevRecommendations => 
        prevRecommendations.map(rec => 
          rec.id === recommendationId ? { ...rec, is_clicked: true } : rec
        )
      );
    } catch (error) {
      console.error('Error marking recommendation as clicked:', error);
      setRecommendationsError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const refreshRecommendations = async (): Promise<void> => {
    await fetchProductRecommendations();
  };

  const getPriceHistory = async (productId: string): Promise<PriceHistory[]> => {
    try {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('price_history')
        .select('*')
        .eq('product_id', productId)
        .order('recorded_at', { ascending: true });

      if (error) {
        throw new Error(`Error fetching price history: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching price history:', error);
      return [];
    }
  };

  const trackProductClick = async (productId: string, source: string): Promise<void> => {
    try {
      const supabase = getSupabaseClient();
      const sessionId = localStorage.getItem('session_id') || uuidv4();
      
      // Store session ID for future tracking
      if (!localStorage.getItem('session_id')) {
        localStorage.setItem('session_id', sessionId);
      }
      
      const { error } = await supabase
        .from('click_tracking')
        .insert({
          user_id: user?.id,
          product_id: productId,
          source,
          session_id: sessionId
        });

      if (error) {
        throw new Error(`Error tracking product click: ${error.message}`);
      }
    } catch (error) {
      console.error('Error tracking product click:', error);
    }
  };
  
  // Initial data fetching
  useEffect(() => {
    if (user) {
      // Create an async function to handle all fetching with proper error handling
      const fetchAllData = async () => {
        try {
          await fetchWardrobeItems();
        } catch (err) {
          console.error('Error fetching wardrobe items:', err);
        }
        
        try {
          await fetchWardrobeRanking();
        } catch (err) {
          console.error('Error fetching wardrobe ranking:', err);
        }
        
        try {
          await fetchOutfits();
        } catch (err) {
          console.error('Error fetching outfits:', err);
        }
        
        try {
          await fetchInspirationBoards();
        } catch (err) {
          console.error('Error fetching inspiration boards:', err);
        }
        
        try {
          await fetchActivityFeed().catch(err => {
            console.error('Error fetching activity feed:', err?.message || JSON.stringify(err) || 'Unknown error');
            // Set empty data to prevent UI issues
            setActivityFeed([]);
            setActivityFeedError('Failed to load activity feed');
          });
        } catch (err) {
          console.error('Error in activity feed outer try/catch:', err);
          // Make sure activity feed is set to empty array to avoid rendering issues
          setActivityFeed([]);
        }
        
        try {
          await fetchNotifications();
        } catch (err) {
          console.error('Error fetching notifications:', err);
        }
        
        try {
          await fetchProductRecommendations();
        } catch (err) {
          console.error('Error fetching product recommendations:', err);
        }
        
        try {
          await fetchWishList();
        } catch (err) {
          console.error('Error fetching wishlist:', err);
        }
        
        try {
          await refreshProducts();
        } catch (err) {
          console.error('Error refreshing products:', err);
        }
      };
      
      fetchAllData();
    }
  }, [user]);
  
  // Effect to fetch activity feed and notifications on initial load
  useEffect(() => {
    if (user && supabase) {
      fetchActivityFeed();
      fetchNotifications();
    }
  }, [user, supabase]);
  
  // Add the getSustainableAlternatives to the interface definition
  const getSustainableAlternatives = async (productId?: string): Promise<any[]> => {
    // This will be the endpoint to get sustainable alternatives
    let endpoint = '/api/products/sustainable';
    
    if (productId) {
      endpoint += `?productId=${productId}`;
    }
    
    try {
      // In production, this would be a real API call
      // For now, let's simulate a response with mock data
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulating API delay
      
      // Mock data - in production, this would be real data from the API
      const mockSustainableProducts = [
        {
          product_id: 'sus_prod_1',
          name: 'Organic Cotton T-Shirt',
          brand: 'EcoWear',
          image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
          price: 29.99,
          category: 'Tops',
          tags: ['Organic', 'Basic', 'Casual'],
          sustainability_score: 85,
          sustainability_metrics: [
            { label: 'Materials', score: 90, description: 'Made from 100% GOTS certified organic cotton' },
            { label: 'Production', score: 80, description: 'Made in factories with renewable energy' },
            { label: 'Transport', score: 75, description: 'Carbon-neutral shipping' }
          ],
          sustainable_materials: ['Organic Cotton', 'Natural Dyes'],
          certifications: ['GOTS Certified', 'Fair Trade'],
          brand_ethics_rating: 4
        },
        {
          product_id: 'sus_prod_2',
          name: 'Recycled Polyester Jacket',
          brand: 'GreenThread',
          image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
          price: 89.99,
          category: 'Outerwear',
          tags: ['Recycled', 'Water-resistant'],
          sustainability_score: 78,
          sustainability_metrics: [
            { label: 'Materials', score: 85, description: 'Made from recycled plastic bottles' },
            { label: 'Production', score: 70, description: 'Low-impact manufacturing' },
            { label: 'Transport', score: 65, description: 'Regional production' }
          ],
          sustainable_materials: ['Recycled Polyester', 'Recycled Nylon'],
          certifications: ['GRS Certified'],
          brand_ethics_rating: 4
        },
        {
          product_id: 'sus_prod_3',
          name: 'Hemp Blend Jeans',
          brand: 'Terra Denim',
          image_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
          price: 79.99,
          category: 'Bottoms',
          tags: ['Denim', 'Hemp', 'Durable'],
          sustainability_score: 92,
          sustainability_metrics: [
            { label: 'Materials', score: 95, description: 'Hemp requires less water than cotton' },
            { label: 'Production', score: 90, description: 'No toxic chemicals or pesticides' },
            { label: 'Transport', score: 85, description: 'Local manufacturing' }
          ],
          sustainable_materials: ['Hemp', 'Organic Cotton'],
          certifications: ['OEKO-TEX', 'B Corp'],
          brand_ethics_rating: 5
        },
        {
          product_id: 'sus_prod_4',
          name: 'Tencel Lyocell Dress',
          brand: 'Eco Couture',
          image_url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
          price: 119.99,
          category: 'Dresses',
          tags: ['Tencel', 'Formal', 'Biodegradable'],
          sustainability_score: 88,
          sustainability_metrics: [
            { label: 'Materials', score: 90, description: 'Made from sustainably-harvested wood pulp' },
            { label: 'Production', score: 85, description: 'Closed-loop production process' },
            { label: 'Transport', score: 75, description: 'Efficient packaging' }
          ],
          sustainable_materials: ['Tencel Lyocell', 'Organic Cotton Lining'],
          certifications: ['EU Ecolabel', 'OEKO-TEX'],
          brand_ethics_rating: 4
        },
        {
          product_id: 'sus_prod_5',
          name: 'Cork Footbed Sandals',
          brand: 'Eco Steps',
          image_url: 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
          price: 69.99,
          category: 'Footwear',
          tags: ['Cork', 'Vegan', 'Handmade'],
          sustainability_score: 83,
          sustainability_metrics: [
            { label: 'Materials', score: 85, description: 'Renewable cork and natural rubber' },
            { label: 'Production', score: 80, description: 'Artisanal production methods' },
            { label: 'Transport', score: 75, description: 'Carbon offset shipping' }
          ],
          sustainable_materials: ['Cork', 'Natural Rubber', 'Organic Cotton Straps'],
          certifications: ['Vegan Society', 'FSC'],
          brand_ethics_rating: 5
        },
        {
          product_id: 'sus_prod_6',
          name: 'Bamboo Fiber Sweater',
          brand: 'Bamboo Basics',
          image_url: 'https://images.unsplash.com/photo-1584030373081-f37b7bb4fa8e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
          price: 59.99,
          category: 'Tops',
          tags: ['Bamboo', 'Soft', 'Thermal'],
          sustainability_score: 75,
          sustainability_metrics: [
            { label: 'Materials', score: 80, description: 'Fast-growing bamboo requires minimal resources' },
            { label: 'Production', score: 70, description: 'Water-saving processing' },
            { label: 'Transport', score: 65, description: 'Consolidated shipping' }
          ],
          sustainable_materials: ['Bamboo Fiber', 'Recycled Polyester'],
          certifications: ['Oeko-Tex'],
          brand_ethics_rating: 3
        }
      ];
      
      // If productId is provided, return alternatives for that product
      if (productId) {
        // In a real implementation, the API would return alternatives specifically
        // suited to replace the given product. For now, we'll just return all items
        // excluding a random one to simulate different results per product
        const randomExcludeIndex = Math.floor(Math.random() * mockSustainableProducts.length);
        return mockSustainableProducts.filter((_, index) => index !== randomExcludeIndex);
      }
      
      // Otherwise return all sustainable products
      return mockSustainableProducts;
    } catch (error) {
      console.error('Error fetching sustainable alternatives:', error);
      throw new Error('Failed to fetch sustainable alternatives');
    }
  };
  
  return (
    <WardrobeContext.Provider
      value={{
        wardrobeItems,
        setWardrobeItems,
        wardrobeRanking,
        isLoading,
        error,
        addItem,
        removeItem,
        updateItem,
        getCategoryCount,
        getTotalItems,
        uploadImage,
        refreshSession,
        refreshRanking,
        refreshWardrobeItems,
        
        outfits,
        isLoadingOutfits,
        outfitError,
        addOutfit,
        updateOutfit,
        removeOutfit,
        getOutfit,
        
        addItemToOutfit,
        removeItemFromOutfit,
        getOutfitItems,
        
        logItemAsWorn,
        logOutfitAsWorn,
        
        updateItemVisibility,
        updateOutfitVisibility,
        
        getMostWornItems,
        getLeastWornItems,
        getRecentlyWornItems,
        
        followWardrobe,
        unfollowWardrobe,
        isFollowingWardrobe,
        getFollowedWardrobes,
        getWardrobeFollowers,
        
        inspirationBoards,
        isLoadingInspirationBoards,
        inspirationBoardError,
        createInspirationBoard,
        updateInspirationBoard,
        deleteInspirationBoard,
        getInspirationBoard,
        getInspirationBoardItems,
        addItemToInspirationBoard,
        removeItemFromInspirationBoard,
        refreshInspirationBoards,
        
        // Activity Feed
        activityFeed,
        isLoadingActivityFeed,
        activityFeedError,
        fetchActivityFeed,
        addActivityFeedItem,
        refreshActivityFeed,
        
        // Comments
        addComment,
        getComments,
        updateComment,
        deleteComment,
        
        // Notifications
        notifications,
        unreadNotificationsCount,
        isLoadingNotifications,
        notificationsError,
        fetchNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        refreshNotifications,
        
        // User search
        searchUsers,
        
        // Popular users/items
        getPopularUsers,
        getPopularItems,
        
        // Marketplace functionality
        products,
        wishListItems,
        productRecommendations,
        isLoadingProducts,
        productsError,
        isLoadingWishList,
        wishListError,
        isLoadingRecommendations,
        recommendationsError,
        
        // Product methods
        fetchSimilarProducts,
        searchProducts,
        getProductDetails,
        refreshProducts,
        
        // Wishlist methods
        addToWishList,
        removeFromWishList,
        updateWishListItem,
        refreshWishList,
        
        // Product recommendation methods
        getProductRecommendations,
        markRecommendationAsViewed,
        markRecommendationAsClicked,
        refreshRecommendations,
        
        // Price tracking methods
        getPriceHistory,
        
        // Affiliate tracking methods
        trackProductClick,
        
        // Add the getSustainableAlternatives to the interface definition
        getSustainableAlternatives,
      }}
    >
      {children}
    </WardrobeContext.Provider>
  );
}

export function useWardrobe() {
  const context = useContext(WardrobeContext);
  if (context === undefined) {
    throw new Error('useWardrobe must be used within a WardrobeProvider');
  }
  return context;
} 