'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

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
  audience?: string;
  created_at: string;
  rating?: string;
}

export default function GalleryPage() {
  const [looks, setLooks] = useState<Look[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"gallery" | "battle" | "yayornay" | "crowd">("gallery");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [activeRating, setActiveRating] = useState<{[key: string]: number}>({});
  const sliderRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  
  // Add proper CSS for true masonry layout and slider
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      /* True masonry layout using CSS columns */
      .masonry-container {
        column-count: 1;
        column-gap: 16px;
      }
      
      @media (min-width: 640px) {
        .masonry-container {
          column-count: 2;
        }
      }
      
      @media (min-width: 768px) {
        .masonry-container {
          column-count: 3;
        }
      }
      
      @media (min-width: 1024px) {
        .masonry-container {
          column-count: 4;
        }
      }
      
      .masonry-item {
        break-inside: avoid;
        margin-bottom: 16px;
        display: inline-block;
        width: 100%;
      }
      
      /* Rating slider styles */
      .rating-slider {
        position: relative;
        height: 32px;
        background: rgba(0, 0, 0, 0.7);
        border-radius: 16px;
        overflow: hidden;
      }
      
      .rating-background {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        background: linear-gradient(90deg, #f59e0b, #ef4444);
        border-radius: 16px;
        z-index: 1;
        transition: width 0.1s ease-out;
      }
      
      .rating-labels {
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative;
        height: 100%;
        z-index: 2;
        padding: 0 12px;
      }
      
      .rating-label {
        color: white;
        font-size: 12px;
        font-weight: bold;
      }
      
      .rating-value-box {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-size: 14px;
        font-weight: bold;
        background: rgba(0, 0, 0, 0.7);
        padding: 2px 8px;
        border-radius: 10px;
        z-index: 3;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
            } catch (_) {
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
          
          setLooks(processedLooks);
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
            
            setLooks(processedLooks);
          } else {
            // No images found in either database or storage
            setLooks([]);
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

  // Function to handle rating slider visibility
  const handleHover = (index: number | null) => {
    setHoverIndex(index);
  };

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

  // Content for different tabs
  const renderTabContent = () => {
    switch (activeTab) {
      case 'gallery':
        return (
          <div className="masonry-container">
            {looks.map((look, index) => (
              <div 
                key={look.look_id || index} 
                className="masonry-item"
                onMouseEnter={() => handleHover(index)}
                onMouseLeave={() => handleHover(null)}
                onTouchStart={() => handleHover(index === hoverIndex ? null : index)}
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                  <div className="relative overflow-hidden">
                    {/* Share and Save buttons - at TOP */}
                    <div className="absolute top-3 left-3 z-10">
                      <button className="p-1 bg-white bg-opacity-70 rounded-full shadow-md hover:bg-opacity-100 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                        </svg>
                      </button>
                    </div>
        
                    <div className="absolute top-3 right-3 z-10">
                      <button className="p-1 bg-white bg-opacity-70 rounded-full shadow-md hover:bg-opacity-100 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                        </svg>
                      </button>
                    </div>
        
                    <img
                      src={look.image_url}
                      alt={look.title || `Fashion look ${index + 1}`} 
                      className="w-full h-auto object-contain" 
                    />
                    
                    {/* Interactive Rating Slider - correct implementation for mobile */}
                    {hoverIndex === index && (
                      <div className="absolute bottom-0 left-0 right-0 p-2 z-10">
                        <div 
                          ref={(el: HTMLDivElement | null) => {
                            sliderRefs.current[look.look_id] = el;
                            return undefined;
                          }}
                          className="rating-slider"
                          onMouseMove={(e) => handleSliderMove(e, look.look_id)}
                          onClick={() => handleSliderClick(look.look_id)}
                          onTouchMove={(e) => {
                            // Handle touch events for mobile
                            const touch = e.touches[0];
                            if (touch) {
                              handleSliderMove({
                                clientX: touch.clientX,
                                clientY: touch.clientY
                              } as React.MouseEvent, look.look_id);
                            }
                          }}
                        >
                          {/* The filled background that moves with rating */}
                          <div 
                            className="rating-background"
                            style={{ 
                              width: `${((activeRating[look.look_id] || 0) / 5) * 100}%`
                            }}
                          />
                          
                          {/* Only show "Ok" on left and "Amazing" on right */}
                          <div className="rating-labels">
                            <span className="rating-label">Ok</span>
                            <span className="rating-label">Amazing</span>
                          </div>
                          
                          {/* Current rating displayed in the middle */}
                          <div className="rating-value-box">
                            {activeRating[look.look_id] || 0}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-gray-300 mr-2 flex items-center justify-center">
                        {look.username?.charAt(0).toUpperCase() || "A"}
                      </div>
                      <span className="font-medium text-sm">{look.username || "Anonymous"}</span>
                    </div>
                    
                    <h2 className="text-lg font-semibold mb-2 truncate">
                      {look.title || `Look ${index + 1}`}
                    </h2>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {new Date(look.created_at).toLocaleDateString()}
                      </span>
                      <Link 
                        href={`/gallery/look/${look.look_id || encodeURIComponent(look.image_url.split('/').pop() || '')}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
        
      case 'battle':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Battle Mode</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Compare outfits side by side and vote for your favorite option!
            </p>
            <div className="py-8 px-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="text-lg">Coming soon!</p>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Battle mode is currently under development.
              </p>
                    </div>
                  </div>
        );
        
      case 'yayornay':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Yay or Nay</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Vote on outfits for specific occasions with a simple Yay or Nay!
            </p>
            <div className="py-8 px-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="text-lg">Coming soon!</p>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Yay or Nay mode is currently under development.
                    </p>
                  </div>
                  </div>
        );
        
      case 'crowd':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Crowd Opinions</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Get fashion advice and suggestions from the community!
            </p>
            <div className="py-8 px-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="text-lg">Coming soon!</p>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Crowd Opinions feature is currently under development.
              </p>
                  </div>
                </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Fashion Gallery</h1>
        <Link 
          href="/look" 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Upload New Look
        </Link>
      </div>
      
      {/* Navigation Tabs */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("gallery")}
            className={`py-4 px-1 font-medium text-sm border-b-2 ${
              activeTab === "gallery" 
                ? "border-blue-500 text-blue-600" 
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Gallery
          </button>
          <button
            onClick={() => setActiveTab("battle")}
            className={`py-4 px-1 font-medium text-sm border-b-2 ${
              activeTab === "battle" 
                ? "border-blue-500 text-blue-600" 
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Battle
          </button>
          <button
            onClick={() => setActiveTab("yayornay")}
            className={`py-4 px-1 font-medium text-sm border-b-2 ${
              activeTab === "yayornay" 
                ? "border-blue-500 text-blue-600" 
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Yay or Nay
          </button>
          <button
            onClick={() => setActiveTab("crowd")}
            className={`py-4 px-1 font-medium text-sm border-b-2 ${
              activeTab === "crowd" 
                ? "border-blue-500 text-blue-600" 
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Crowd Opinions
          </button>
        </nav>
              </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Error loading gallery</p>
          <p>{error}</p>
            </div>
          )}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500 text-xl">Loading images...</p>
        </div>
      ) : looks.length === 0 && activeTab === "gallery" ? (
        <div className="text-center py-12 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h2 className="text-2xl font-semibold mb-2">No images found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Be the first to share your fashion style!</p>
          <Link 
            href="/look" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Upload Look
          </Link>
      </div>
      ) : (
        renderTabContent()
      )}
    </div>
  );
}

