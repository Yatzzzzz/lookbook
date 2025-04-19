'use client';

import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import BottomNav from "@/components/BottomNav";

// Define types
interface Look {
  look_id: string;
  image_url: string;
  description?: string | null;
  user_id: string;
  username?: string;
  created_at: string;
  upload_type?: string;
  feature_in?: string[];
  category?: string;
  user?: { username: string };
}

export default function Page() {
  const [looks, setLooks] = useState<Look[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLookIndex, setCurrentLookIndex] = useState(0);
  const [vote, setVote] = useState<'yay' | 'nay' | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number | null>(null);
  const supabase = createClientComponentClient();
  
  // Fetch real yayornay looks from the database
  useEffect(() => {
    async function fetchLooks() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('looks')
          .select(`
            look_id,
            image_url,
            description,
            user_id,
            created_at,
            upload_type,
            feature_in,
            category,
            storage_bucket,
            user:users(username)
          `)
          .eq('storage_bucket', 'yaynay')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching yayornay looks:', error);
          throw error;
        }
        
        if (data && data.length > 0) {
          // Process the looks to ensure they have all required fields
          const processedLooks = data.map((look: any) => ({
            ...look,
            username: look.user?.username || 'Anonymous'
          })) as Look[];
          
          setLooks(processedLooks);
        } else {
          // No looks found
          setLooks([]);
        }
      } catch (err) {
        console.error('Error fetching looks:', err);
        setError(err instanceof Error ? err.message : 'Failed to load looks');
      } finally {
        setLoading(false);
      }
    }
    
    fetchLooks();
  }, [supabase]);
  
  const handleVote = (result: 'yay' | 'nay') => {
    if (looks.length === 0) return;
    
    const currentLook = looks[currentLookIndex];
    setVote(result);
    setSwipeDirection(result === 'yay' ? 'right' : 'left');
    
    // Save vote to database
    try {
      // In a production app, you would store this vote in a votes table
      console.log(`Voted ${result} for look ${currentLook.look_id}`);
      
      // Update the look's ratings count if needed
      // supabase.from('looks').update({...})
    } catch (error) {
      console.error('Error saving vote:', error);
    }
    
    // Move to next look after a short delay
    setTimeout(() => {
      if (currentLookIndex < looks.length - 1) {
        setCurrentLookIndex(currentLookIndex + 1);
        setVote(null);
        setSwipeDirection(null);
      } else {
        // End of items, could redirect to a thank you page or back to main gallery
        setSwipeDirection(null);
      }
    }, 500);
  };

  // Handle touch/mouse events for swipe
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (vote !== null) return;
    
    const clientX = 'touches' in e 
      ? e.touches[0].clientX 
      : (e as React.MouseEvent).clientX;
    
    startXRef.current = clientX;
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (vote !== null || startXRef.current === null || !cardRef.current) return;
    
    const clientX = 'touches' in e 
      ? e.touches[0].clientX 
      : (e as React.MouseEvent).clientX;
    
    const deltaX = clientX - startXRef.current;
    
    // Apply transformation during swipe
    if (Math.abs(deltaX) > 5) {
      const rotation = deltaX * 0.05; // Reduced rotation for more subtle effect
      cardRef.current.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`;
      
      // Show hint overlay based on swipe direction
      if (deltaX > 50) {
        cardRef.current.setAttribute('data-swipe', 'right');
      } else if (deltaX < -50) {
        cardRef.current.setAttribute('data-swipe', 'left');
      } else {
        cardRef.current.removeAttribute('data-swipe');
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (vote !== null || startXRef.current === null || !cardRef.current) return;
    
    const clientX = 'changedTouches' in e 
      ? e.changedTouches[0].clientX 
      : (e as React.MouseEvent).clientX;
    
    const deltaX = clientX - startXRef.current;
    
    // Reset card position if swipe wasn't far enough
    if (Math.abs(deltaX) < 100) {
      cardRef.current.style.transform = '';
      cardRef.current.removeAttribute('data-swipe');
    } else {
      // Swipe right = Yay, Swipe left = Nay
      handleVote(deltaX > 0 ? 'yay' : 'nay');
    }
    
    startXRef.current = null;
  };

  // Reset transform when current look changes
  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.style.transform = '';
      cardRef.current.removeAttribute('data-swipe');
    }
  }, [currentLookIndex]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pb-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-500">Loading fashion looks...</p>
        <BottomNav />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pb-16">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
          <p className="font-bold">Error loading looks</p>
          <p>{error}</p>
        </div>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
        <BottomNav />
      </div>
    );
  }

  if (looks.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pb-16">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold mb-2">No Yay or Nay Looks</h2>
          <p className="text-muted-foreground mb-4">
            Looks marked as yay or nay will appear here
          </p>
          <Button>
            <a href="/upload">Upload Look</a>
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (currentLookIndex >= looks.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pb-16">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold mb-2">You've seen all the looks!</h2>
          <p className="text-gray-500 mb-4">Check back later for more fashion to rate</p>
          <Button onClick={() => setCurrentLookIndex(0)}>Start Over</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const currentLook = looks[currentLookIndex];

  return (
    <div className="h-screen max-h-[812px] w-full max-w-[375px] mx-auto overflow-hidden flex flex-col bg-white">
      {/* Card with image that can be swiped */}
      <div 
        ref={cardRef}
        className={`relative flex-1 flex flex-col transition-transform ${
          swipeDirection === 'left' ? 'animate-swipe-left' : 
          swipeDirection === 'right' ? 'animate-swipe-right' : ''
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        {/* Image container */}
        <div className="relative flex-1 overflow-hidden">
          <img
            src={currentLook.image_url}
            alt={currentLook.description || "Fashion look"}
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Swipe overlays */}
          <div className="absolute inset-0 pointer-events-none">
            {/* YAY overlay - visible on right swipe */}
            <div className="absolute top-4 right-4 bg-green-500 text-white py-2 px-4 rounded-full font-bold rotate-12 opacity-0 card-yay">
              YAY
            </div>
            
            {/* NAY overlay - visible on left swipe */}
            <div className="absolute top-4 left-4 bg-red-500 text-white py-2 px-4 rounded-full font-bold -rotate-12 opacity-0 card-nay">
              NAY
            </div>
          </div>
        </div>
        
        {/* Description text - positioned at bottom of card */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="flex items-center mb-2">
            <span className="text-white text-sm mr-2">@{currentLook.username || 'Anonymous'}</span>
          </div>
          <h2 className="text-lg font-medium text-white">
            {currentLook.description || "What do you think of this look?"}
          </h2>
        </div>
      </div>
      
      {/* Footer with buttons */}
      <div className="p-4 flex justify-between items-center">
        <Button 
          onClick={() => handleVote('nay')}
          className="bg-red-500 hover:bg-red-600 text-white rounded-full w-14 h-14 p-0"
        >
          <ThumbsDown className="h-5 w-5" />
        </Button>
        
        <div className="text-sm text-center text-gray-500">
          {currentLookIndex + 1} of {looks.length}
        </div>
        
        <Button 
          onClick={() => handleVote('yay')}
          className="bg-green-500 hover:bg-green-600 text-white rounded-full w-14 h-14 p-0"
        >
          <ThumbsUp className="h-5 w-5" />
        </Button>
      </div>
      <BottomNav />
    </div>
  );
} 