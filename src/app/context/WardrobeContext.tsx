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
}

interface WardrobeContextType {
  wardrobeItems: WardrobeItem[];
  setWardrobeItems: React.Dispatch<React.SetStateAction<WardrobeItem[]>>;
  isLoading: boolean;
  error: string | null;
  addItem: (item: Omit<WardrobeItem, 'item_id' | 'user_id' | 'created_at'>) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateItem: (itemId: string, updates: Partial<WardrobeItem>) => Promise<void>;
  getCategoryCount: (category: string) => number;
  getTotalItems: () => number;
  uploadImage: (file: File) => Promise<string>;
  refreshSession: () => Promise<void>;
}

const WardrobeContext = createContext<WardrobeContextType | undefined>(undefined);

export function WardrobeProvider({ children }: { children: React.ReactNode }) {
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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
  
  // Fetch items from Supabase on mount and when user changes
  useEffect(() => {
    const fetchWardrobeItems = async () => {
      if (!user) {
        setWardrobeItems([]);
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
      } catch (err: any) {
        console.error('Error fetching wardrobe items:', err);
        setError(err.message || 'Failed to fetch wardrobe items');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWardrobeItems();
  }, [user, supabase]);
  
  // Upload image to Supabase storage
  const uploadImage = async (file: File): Promise<string> => {
    if (!user || !user.id) {
      throw new Error('You must be logged in to upload images');
    }
    
    try {
      // Try to refresh the session but don't fail if it doesn't work
      try {
        await refreshSession();
      } catch (sessionError) {
        console.error('Session refresh error during upload:', sessionError);
        // Continue with potentially expired token - API might still work
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      console.log('Attempting to upload to path:', filePath);
      
      // Try the client upload first
      try {
        const { error: uploadError } = await supabase.storage
          .from('wardrobe')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (uploadError) {
          console.error('Upload error details:', uploadError);
          
          // For any error, try the server API as fallback
          console.log('Upload failed, attempting via server API...');
          
          // Create a form data object to send to the server
          const formData = new FormData();
          formData.append('file', file);
          formData.append('userId', user.id);
          
          try {
            const response = await fetch('/api/wardrobe/upload', {
              method: 'POST',
              body: formData,
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to upload via API');
            }
            
            const data = await response.json();
            console.log('Upload via API succeeded:', data.publicUrl);
            return data.publicUrl;
          } catch (apiError: any) {
            console.error('API upload failed:', apiError);
            throw new Error(`Upload failed: ${apiError.message}`);
          }
        }
        
        const { data } = supabase.storage
          .from('wardrobe')
          .getPublicUrl(filePath);
        
        console.log('Upload succeeded via client:', data.publicUrl);
        return data.publicUrl;
      } catch (clientError) {
        console.error('Unexpected client upload error:', clientError);
        
        // Try the server API as fallback for any client-side errors
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', user.id);
        
        try {
          const response = await fetch('/api/wardrobe/upload', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to upload via API');
          }
          
          const data = await response.json();
          console.log('Upload via API succeeded (after client error):', data.publicUrl);
          return data.publicUrl;
        } catch (apiError: any) {
          console.error('API upload failed after client error:', apiError);
          throw new Error(`Upload failed: ${apiError.message}`);
        }
      }
    } catch (err: any) {
      console.error('Error uploading image:', err);
      throw new Error(err.message || 'Failed to upload image');
    }
  };
  
  // Add new item to Supabase
  const addItem = async (item: Omit<WardrobeItem, 'item_id' | 'user_id' | 'created_at'>) => {
    if (!user || !user.id) {
      throw new Error('You must be logged in to add items');
    }
    
    try {
      // First, get a fresh session to ensure authentication
      try {
        await refreshSession();
      } catch (sessionError) {
        console.error('Session refresh error:', sessionError);
        // Continue with potentially expired token - API might still work
      }
      
      // Create a new item object, ensuring required fields are present
      const itemToInsert = {
        ...item,
        user_id: user.id,
        item_id: uuidv4(),
        // Ensure name and category are present as they are required fields
        name: item.name || 'Unnamed item',
        category: item.category || 'other'
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
          
          // If we get a schema error mentioning some column
          if (error.message && (
              error.message.includes('description') || 
              error.message.includes('name') || 
              error.message.includes('column')
          )) {
            console.log('Schema issue detected, trying API route');
            return await tryInsertViaAPI(itemToInsert);
          }
          
          // If it's an authentication error
          if (error.message && (
              error.message.includes('auth') || 
              error.message.includes('key') || 
              error.message.includes('JWT') ||
              error.message.includes('session')
          )) {
            console.log('Authentication issue detected, trying API route');
            return await tryInsertViaAPI(itemToInsert);
          }
          
          // If it's an RLS issue
          if (error.message && error.message.includes('row-level security')) {
            console.log('RLS issue detected, trying API route');
            return await tryInsertViaAPI(itemToInsert);
          }
          
          // For any other errors
          console.log('Unknown error, trying API route');
          return await tryInsertViaAPI(itemToInsert);
        }
        
        if (data && data.length > 0) {
          setWardrobeItems(prev => [...prev, data[0]]);
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
    console.log('RLS error, attempting to use server API...');
    
    try {
      const response = await fetch('/api/wardrobe/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(item)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add item via API');
      }
      
      const apiData = await response.json();
      setWardrobeItems(prev => [...prev, apiData]);
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
    
    try {
      const { error } = await supabase
        .from('wardrobe')
        .delete()
        .eq('item_id', itemId)
        .eq('user_id', user.id);
        
      if (error) {
        if (error.message.includes('row-level security')) {
          throw new Error('Permission denied. You can only delete your own items.');
        }
        throw error;
      }
      
      // Also remove the image if it exists
      const itemToRemove = wardrobeItems.find(item => item.item_id === itemId);
      if (itemToRemove?.image_path) {
        const imagePath = itemToRemove.image_path.split('/').slice(-2).join('/');
        await supabase.storage.from('wardrobe').remove([imagePath]);
      }
      
      setWardrobeItems(prev => prev.filter(item => item.item_id !== itemId));
    } catch (err: any) {
      console.error('Error removing wardrobe item:', err);
      setError(err.message || 'Failed to remove wardrobe item');
      throw err;
    }
  };
  
  // Update item in Supabase
  const updateItem = async (itemId: string, updates: Partial<WardrobeItem>) => {
    if (!user || !user.id) {
      throw new Error('You must be logged in to update items');
    }
    
    try {
      const { data, error } = await supabase
        .from('wardrobe')
        .update(updates)
        .eq('item_id', itemId)
        .eq('user_id', user.id)
        .select();
        
      if (error) {
        if (error.message.includes('row-level security')) {
          throw new Error('Permission denied. You can only update your own items.');
        }
        throw error;
      }
      
      setWardrobeItems(prev => 
        prev.map(item => (item.item_id === itemId ? data[0] : item))
      );
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
  
  return (
    <WardrobeContext.Provider
      value={{
        wardrobeItems,
        setWardrobeItems,
        isLoading,
        error,
        addItem,
        removeItem,
        updateItem,
        getCategoryCount,
        getTotalItems,
        uploadImage,
        refreshSession
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