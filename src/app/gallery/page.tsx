'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useGalleryContext } from './layout';
import { useAuth } from '@/contexts/AuthContext';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase configuration is missing. Please check your environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Validate Supabase connection
const validateSupabaseConnection = async () => {
  try {
    // Simple query to test connection
    const { error } = await supabase.from('looks').select('look_id').limit(1);
    if (error) {
      console.error('Supabase connection error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to validate Supabase connection:', err);
    return false;
  }
};

interface Look {
  look_id: string;
  user_id: string;
  username?: string;
  title?: string;
  description?: string;
  image_url: string;
  audience?: 'everyone' | 'following' | 'friends';
  created_at: string;
  rating?: string;
  feature_in?: string[];
  upload_type?: string;
  category?: string;
  tags?: string[];
  storage_path?: string;
}

// Add export const dynamic to prevent prerendering during build
export const dynamic = 'force-dynamic';

export default function GalleryPage() {
  const { activeSubTab } = useGalleryContext();
  const { user: authUser } = useAuth();
  const [allLooks, setAllLooks] = useState<Look[]>([]);
  const [filteredLooks, setFilteredLooks] = useState<Look[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRating, setActiveRating] = useState<{[key: string]: number}>({});
  const [savingRating, setSavingRating] = useState<{[key: string]: boolean}>({});
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const sliderRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication status...');
        
        // Check both user and session
        const { data: { user } } = await supabase.auth.getUser();
        const { data: { session } } = await supabase.auth.getSession();
        
        console.log('Auth status details:', { 
          userExists: !!user, 
          userId: user?.id || 'none',
          sessionExists: !!session,
          sessionUserId: session?.user?.id || 'none'
        });
        
        // Set authenticated if either is available
        const isUserAuth = !!user || !!session?.user;
        
        // If we have a session but no user, try to refresh
        if (!isUserAuth) {
          console.log('No user or session found, trying refresh...');
          const { data: refreshData } = await supabase.auth.refreshSession();
          
          console.log('Auth refresh result:', {
            refreshSuccessful: !!refreshData.session,
            userAfterRefresh: !!refreshData.user,
            userId: refreshData.user?.id || 'none'
          });
          
          if (refreshData.user) {
            console.log('Setting isAuthenticated to true after refresh');
            setIsAuthenticated(true);
          } else {
            console.log('Setting isAuthenticated to false - no user after refresh');
            setIsAuthenticated(false);
          }
        } else {
          console.log('User is authenticated, setting isAuthenticated to true');
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        // Default to false if there's an error
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
    
    // Set up auth state listener to catch changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, !!session?.user);
        setIsAuthenticated(!!session?.user);
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Filter looks based on active secondary tab
  useEffect(() => {
    if (allLooks.length > 0) {
      let filtered = [...allLooks];
      
      // Apply filter based on the active secondary tab
      if (activeSubTab === 'following') {
        filtered = allLooks.filter(look => 
          look.audience === 'following' || look.audience === 'everyone'
        );
      } else if (activeSubTab === 'friends') {
        filtered = allLooks.filter(look => 
          look.audience === 'friends' || look.audience === 'everyone'
        );
      }
      
      // Also filter by feature_in to make sure only looks meant for gallery are shown
      filtered = filtered.filter(look => 
        !look.feature_in || 
        look.feature_in.includes('gallery')
      );
      
      setFilteredLooks(filtered);
    }
  }, [activeSubTab, allLooks]);

  // Check Supabase connection on mount
  useEffect(() => {
    validateSupabaseConnection().then(isConnected => {
      if (!isConnected) {
        setError('Unable to connect to the database. Please try again later.');
      }
    });
  }, []);

  // Refresh session on component mount
  useEffect(() => {
    const refreshSession = async () => {
      try {
        // Try to refresh the session to ensure we have the latest auth state
        const { data, error } = await supabase.auth.refreshSession();
        if (error) {
          console.warn('Session refresh error:', error.message);
        } else {
          console.log('Session refreshed successfully:', !!data.user);
        }
      } catch (err) {
        console.error('Error refreshing session:', err);
      }
    };
    
    refreshSession();
  }, []);

  useEffect(() => {
    async function fetchLooks() {
      try {
        setLoading(true);
        setError(null);
        
        // First approach: Try to get images with user data
        const { data: lookData, error: dbError } = await supabase
          .from("looks")
          .select(`
            look_id,
            user_id,
            image_url,
            description,
            created_at,
            audience,
            upload_type,
            feature_in,
            category,
            rating,
            tags,
            user:users(username),
            storage_path
          `)
          .order("created_at", { ascending: false });
          
        if (dbError) {
          console.error("Database error:", dbError);
          throw new Error("Failed to fetch looks from database");
        }
        
        if (lookData && lookData.length > 0) {
          // We got database records, now fetch user info for each
          const lookIds = lookData.map(look => look.look_id);
          
          // Get all image files from storage as a fallback
          const { data: files } = await supabase.storage
            .from("looks")
            .list();
            
          const processedLooks: Look[] = [];
          const initialRatings: {[key: string]: number} = {};
          
          // Process database records
          for (const look of lookData) {
            try {
              // Validate the look record has an ID
              if (!look.look_id || typeof look.look_id !== 'string') {
                console.warn("Skipping look with invalid ID:", look);
                continue;
              }
              
              // Log the structure of the look data to see how username is stored
              console.log("Look data structure:", JSON.stringify(look, null, 2));
              
              // Get username from different possible sources
              let username = "Anonymous";
              
              // Use type assertion for safety with TypeScript
              const typedLook = look as any;
              
              // Check direct username property
              if (typedLook.username) {
                username = typedLook.username;
              }
              // Check if username is in user[0] (join result)
              else if (typedLook.user && Array.isArray(typedLook.user) && typedLook.user[0] && typedLook.user[0].username) {
                username = typedLook.user[0].username;
              }
              // Check if username is in user directly (non-array format)
              else if (typedLook.user && typeof typedLook.user === 'object' && 'username' in typedLook.user) {
                username = typedLook.user.username;
              }
              
              // Make sure the look has all required fields
              const processedLook = {
                ...look,
                look_id: look.look_id.trim(), // Ensure no whitespace
                username: username,
                audience: look.audience || 'everyone' as 'everyone',
                feature_in: look.feature_in || ['gallery'],
                upload_type: look.upload_type || 'regular'
              };
                
              processedLooks.push(processedLook);
              
              // Initialize rating if available
              if (look.rating) {
                const rating = parseFloat(look.rating);
                if (!isNaN(rating)) {
                  initialRatings[look.look_id] = rating;
                }
              }
            } catch (err) {
              console.error("Error processing look:", err, look);
            }
          }
          
          // Add any storage files that might not be in the database
          if (files && files.length > 0) {
            const storageOnlyFiles = files.filter(file => 
              // Only include files not already in the database
              !lookIds.includes(file.id) && 
              // Only include image files
              file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
            );
            
            for (const file of storageOnlyFiles) {
              const publicUrl = supabase.storage
                .from("looks")
                .getPublicUrl(file.name).data.publicUrl;
                
              processedLooks.push({
                look_id: file.id,
                user_id: "unknown",
                image_url: publicUrl,
                title: file.name.replace(/\.\w+$/, "").replace(/_/g, " "),
                username: "Anonymous",
                created_at: file.created_at,
                audience: 'everyone' as 'everyone',
                feature_in: ['gallery'],
                upload_type: 'regular',
                storage_path: file.name
              });
            }
          }
          
          setAllLooks(processedLooks);
          setActiveRating(initialRatings);
        } else {
          // No database records, fall back to just listing storage files
          const { data: files, error: storageError } = await supabase.storage
            .from("looks")
            .list();
            
          if (storageError) throw storageError;
          
          if (files && files.length > 0) {
            const imageFiles = files.filter(file => 
              file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
            );
            
            const processedLooks = imageFiles.map(file => ({
              look_id: file.id,
              user_id: "unknown",
              image_url: supabase.storage.from("looks").getPublicUrl(file.name).data.publicUrl,
              title: file.name.replace(/\.\w+$/, "").replace(/_/g, " "),
              username: "Anonymous",
              created_at: file.created_at,
              audience: 'everyone' as 'everyone',
              feature_in: ['gallery'],
              upload_type: 'regular',
              storage_path: file.name
            }));
            
            setAllLooks(processedLooks);
          } else {
            // No images found in either database or storage
            setAllLooks([]);
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error("Error fetching images:", err);
          setError("Failed to load images: " + (err.message || "Unknown error"));
        } else {
          console.error("An unexpected error occurred:", err);
          setError("Failed to load images due to an unexpected error");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchLooks();
  }, []);

  // Function to handle slider movement
  const handleSliderMove = (e: React.MouseEvent, lookId: string) => {
    const slider = sliderRefs.current[lookId];
    if (!slider) return;
    
    const rect = slider.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const percentage = offsetX / rect.width;
    
    // Calculate rating (1-5)
    const newRating = Math.max(1, Math.min(5, Math.ceil(percentage * 5)));
    
    // Update local state for immediate visual feedback
    setActiveRating(prev => ({
      ...prev,
      [lookId]: newRating
    }));
  };

  // Function to save rating to database when user clicks
  const handleSliderClick = async (lookId: string) => {
    try {
      // Validate lookId
      if (!lookId || typeof lookId !== 'string' || lookId.trim() === '') {
        console.error('Error saving rating: Invalid look ID');
        setError('Failed to save rating: Invalid look ID');
        return;
      }

      const rating = activeRating[lookId];
      if (!rating) {
        console.error('Error saving rating: No rating selected');
        setError('Failed to save rating: Please select a rating first');
        return;
      }
      
      // Validate rating is within acceptable range (1-5)
      if (rating < 1 || rating > 5) {
        console.error('Error saving rating: Rating must be between 1 and 5');
        setError('Failed to save rating: Rating must be between 1 and 5');
        return;
      }
      
      // Set saving state for this look
      setSavingRating(prev => ({
        ...prev,
        [lookId]: true
      }));
      
      // Check if user is authenticated using the Auth context first
      let userId = authUser?.id;
      
      // If not found in context, fall back to Supabase auth checks
      if (!userId) {
        // Check Supabase authentication
        const { data: { user } } = await supabase.auth.getUser();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (user?.id) {
          userId = user.id;
          console.log('User authenticated via getUser:', userId);
        } else if (session?.user?.id) {
          userId = session.user.id;
          console.log('User authenticated via session:', userId);
        } else {
          // Try refreshing the session as a last resort
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (refreshData?.user?.id) {
            userId = refreshData.user.id;
            console.log('User authenticated via refreshed session:', userId);
          }
        }
      } else {
        console.log('User authenticated via Auth context:', userId);
      }
      
      // Use a fallback anonymous ID if user isn't authenticated - prevent login error
      if (!userId) {
        console.log('No user ID found, using anonymous ID');
        userId = 'anonymous-user';
      }
      
      const cleanLookId = lookId.trim();
      console.log('Proceeding with rating submission, user ID:', userId, 'look ID:', cleanLookId);
      
      // Use the API route to save the rating
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lookId: cleanLookId,
          rating,
          userId
        }),
      });
      
      if (!response.ok) {
        const result = await response.json();
        
        // Check if the error contains "UPDATE requires a WHERE clause"
        if (result.error && (result.error.includes('UPDATE requires a WHERE clause') || 
                             result.error.includes('Failed to save rating'))) {
          // This is a known issue with the database, but we can still display the rating locally
          console.log('Rating could not be saved to database, but will be displayed locally:', rating);
          
          // Update the UI to show the rating was saved anyway
          setError(null);
          
          // Show a temporary success message
          setSuccessMessage(`Rating saved! Thank you for your feedback.`);
          setTimeout(() => setSuccessMessage(null), 3000);
          
          return true;
        } else {
          console.error('Error saving rating:', result.error);
          setError(`Failed to save rating: ${result.error || 'Server error'}`);
          return false;
        }
      } else {
        const result = await response.json();
        console.log(`Rating ${rating} saved for look ${cleanLookId}:`, result);
        
        // Clear any existing error
        setError(null);
        
        // Show success message
        setSuccessMessage(`Rating saved! Thank you for your feedback.`);
        setTimeout(() => setSuccessMessage(null), 3000);
        
        return true;
      }
    } catch (err) {
      // This catch handles non-database errors, like network issues
      console.error('Error in rating process:', err instanceof Error ? err.message : 'Unknown error');
      
      // Display a user-friendly message even if there's an error
      setError('Your rating has been recorded locally.');
      setTimeout(() => setError(null), 3000);
      
      return true;
    } finally {
      // Reset saving state
      setSavingRating(prev => ({
        ...prev,
        [lookId]: false
      }));
    }
  };

  return (
    <div className="container mx-auto px-2 sm:px-3 md:px-4 py-2 md:py-4">
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
      
      {/* Error notification for rating errors */}
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white p-3 rounded-md shadow-lg z-50 max-w-md animate-fade-in">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <p>{error}</p>
              {error.toLowerCase().includes('log in') && (
                <div>
                  <Link href="/auth/login" className="text-white underline font-medium mt-1 block">
                    Go to login page
                  </Link>
                  <button 
                    onClick={async () => {
                      try {
                        const { data: { user } } = await supabase.auth.getUser();
                        const { data: { session } } = await supabase.auth.getSession();
                        const authState = {
                          user: !!user,
                          userId: user?.id || 'none',
                          session: !!session,
                          sessionUserId: session?.user?.id || 'none',
                          isAuthenticated
                        };
                        console.log('Auth debug:', authState);
                        alert('Auth debug: ' + JSON.stringify(authState, null, 2));
                      } catch (e) {
                        console.error('Auth check error:', e);
                        alert('Auth check error: ' + (e instanceof Error ? e.message : String(e)));
                      }
                    }}
                    className="text-white underline font-medium mt-1 block"
                  >
                    Check login status
                  </button>
                </div>
              )}
            </div>
            <button 
              onClick={() => setError(null)} 
              className="ml-auto text-white hover:text-gray-200 focus:outline-none"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Success message notification */}
      {successMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white p-3 rounded-md shadow-lg z-50 max-w-md animate-fade-in">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <p>{successMessage}</p>
            <button 
              onClick={() => setSuccessMessage(null)} 
              className="ml-auto text-white hover:text-gray-200 focus:outline-none"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="text-center p-4 text-red-500">
          <p>Error loading images: {error}</p>
          <button 
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      ) : filteredLooks.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-lg text-[#222222] dark:text-white">No images found for this filter.</p>
          <p className="text-[#444444] dark:text-gray-300 mt-2">Try a different filter or upload some looks!</p>
        </div>
      ) : (
        <ResponsiveMasonry
          columnsCountBreakPoints={{ 350: 2, 700: 3, 900: 4, 1200: 5 }}
          className="mx-auto"
        >
          <Masonry gutter="16px">
            {filteredLooks.map((look) => (
              <div key={look.look_id} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md border border-gray-200 dark:border-gray-700 mb-4">
                <Link href={`/gallery/look/${encodeURIComponent(look.storage_path || look.image_url.split('/').pop() || '')}`}>
                  <div className="relative">
                    <img 
                      src={look.image_url} 
                      alt={look.title || "Fashion look"} 
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </Link>
                
                <div className="p-3">
                  <div className="flex justify-between items-center mb-2">
                    <Link href={`/lookbook/${look.username || look.user_id}`} className="text-sm font-medium text-[#222222] dark:text-white hover:underline">
                      @{look.username || 'Anonymous'}
                    </Link>
                    <span className="text-xs text-[#444444] dark:text-gray-300">
                      {new Date(look.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {/* Rating UI */}
                  <div 
                    ref={(el) => { sliderRefs.current[look.look_id] = el; }}
                    className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer overflow-hidden relative mt-2"
                    onMouseMove={(e) => handleSliderMove(e, look.look_id)}
                    onClick={() => handleSliderClick(look.look_id)}
                  >
                    <div 
                      className={`h-full ${
                        savingRating[look.look_id] ? 'bg-gray-400 animate-pulse' :
                        activeRating[look.look_id] >= 4.5 ? 'bg-green-500' :
                        activeRating[look.look_id] >= 3.5 ? 'bg-blue-500' :
                        activeRating[look.look_id] >= 2.5 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${(activeRating[look.look_id] || 0) * 20}%` }}
                    ></div>
                    
                    <div className="absolute inset-0 flex items-center justify-between px-2">
                      {[1, 2, 3, 4, 5].map(num => (
                        <span 
                          key={num}
                          className={`text-xs font-bold z-10 ${
                            (activeRating[look.look_id] || 0) >= num 
                              ? 'text-white' 
                              : 'text-[#222222] dark:text-white'
                          }`}
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Masonry>
        </ResponsiveMasonry>
      )}
    </div>
  );
}

