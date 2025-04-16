'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useGalleryContext } from './layout';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

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
}

// Add export const dynamic to prevent prerendering during build
export const dynamic = 'force-dynamic';

export default function GalleryPage() {
  const { activeSubTab } = useGalleryContext();
  const [allLooks, setAllLooks] = useState<Look[]>([]);
  const [filteredLooks, setFilteredLooks] = useState<Look[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRating, setActiveRating] = useState<{[key: string]: number}>({});
  const sliderRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  
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
      
      setFilteredLooks(filtered);
    }
  }, [activeSubTab, allLooks]);

  useEffect(() => {
    async function fetchLooks() {
      try {
        setLoading(true);
        setError(null);
        
        // First approach: Try to get images with user data
        const { data: lookData, error: dbError } = await supabase
          .from("looks")
          .select("*")
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
              // Try to get user info
              const { data: userData } = await supabase
                .from("users")
                .select("username")
                .eq("id", look.user_id)
                .single();
                
              processedLooks.push({
                ...look,
                username: userData?.username || "Anonymous"
              });
              
              // Initialize rating if it exists
              if (look.rating) {
                const ratingValue = parseInt(look.rating, 10);
                if (!isNaN(ratingValue) && ratingValue >= 1 && ratingValue <= 5) {
                  initialRatings[look.look_id] = ratingValue;
                }
              }
            } catch {
              // If user fetch fails, still add the look without username
              processedLooks.push({
                ...look,
                username: "Anonymous"
              });
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
                created_at: file.created_at
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
              created_at: file.created_at
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
          setError(err.message || "Failed to load images");
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
      const rating = activeRating[lookId];
      if (!rating) return;
      
      // Save to database
      const { error } = await supabase
        .from('looks')
        .update({ rating: rating.toString() })
        .eq('look_id', lookId);

      if (error) {
        console.error('Error saving rating:', error);
      } else {
        console.log(`Rating ${rating} saved for look ${lookId}`);
      }
    } catch (err) {
      console.error('Error saving rating:', err);
    }
  };

  return (
    <div className="container mx-auto px-2 sm:px-3 md:px-4 py-2 md:py-4">
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
          <p className="text-lg">No images found for this filter.</p>
          <p className="text-gray-500 mt-2">Try a different filter or upload some looks!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredLooks.map((look) => (
            <div key={look.look_id} className="rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
              <Link href={`/gallery/look/${look.look_id}`}>
                <div className="relative w-full aspect-square bg-gray-100">
                  <img 
                    src={look.image_url} 
                    alt={look.title || "Fashion look"} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </Link>
              
              <div className="p-2">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-sm font-medium truncate max-w-[140px]">
                      {look.title || (look.look_id.length > 10 ? `look-${look.look_id.substring(0, 8)}` : 'Look')}
                    </h3>
                    <p className="text-xs text-gray-500">@{look.username || "anonymous"}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(look.created_at).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                
                <div 
                  className="relative h-6 bg-gray-200 rounded-full overflow-hidden cursor-pointer"
                  ref={el => sliderRefs.current[look.look_id] = el}
                  onClick={(e) => {
                    handleSliderClick(look.look_id);
                    // Also process the click position
                    if (sliderRefs.current[look.look_id]) {
                      const rect = sliderRefs.current[look.look_id]!.getBoundingClientRect();
                      const offsetX = e.clientX - rect.left;
                      const percentage = offsetX / rect.width;
                      const newRating = Math.max(1, Math.min(5, Math.ceil(percentage * 5)));
                      setActiveRating(prev => ({ ...prev, [look.look_id]: newRating }));
                    }
                  }}
                  onMouseMove={e => handleSliderMove(e, look.look_id)}
                  onTouchMove={e => {
                    const touch = e.touches[0];
                    if (touch && sliderRefs.current[look.look_id]) {
                      const rect = sliderRefs.current[look.look_id]!.getBoundingClientRect();
                      const offsetX = Math.max(0, Math.min(rect.width, touch.clientX - rect.left));
                      const percentage = offsetX / rect.width;
                      const newRating = Math.max(1, Math.min(5, Math.ceil(percentage * 5)));
                      setActiveRating(prev => ({ ...prev, [look.look_id]: newRating }));
                    }
                  }}
                >
                  <div 
                    className="absolute top-0 left-0 h-full bg-amber-500 transition-all duration-150"
                    style={{ width: `${(activeRating[look.look_id] || 0) * 20}%` }}
                  ></div>
                  <div className="flex justify-between px-2 py-1 relative z-10 text-xs font-medium">
                    <span>1</span>
                    <span>5</span>
                  </div>
                  {activeRating[look.look_id] > 0 && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white text-xs px-1.5 py-0.5 rounded z-20">
                      {activeRating[look.look_id].toFixed(1)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

