'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from "@/components/ui/use-toast";

interface LookRatingProps {
  lookId: string;
  initialRating?: number;
  size?: 'sm' | 'md' | 'lg';
  onRatingChange?: (newRating: number) => void;
}

export default function LookRating({
  lookId,
  initialRating = 0,
  size = 'md',
  onRatingChange
}: LookRatingProps) {
  const [rating, setRating] = useState<number>(initialRating);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [userHasRated, setUserHasRated] = useState<boolean>(initialRating > 0);
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Check if user has already rated this look
    const checkExistingRating = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data, error } = await supabase
          .from('look_ratings')
          .select('rating')
          .eq('look_id', lookId)
          .eq('user_id', session.user.id)
          .single();

        if (data) {
          setRating(data.rating);
          setUserHasRated(true);
        }
      } catch (err) {
        console.error('Error checking existing rating:', err);
      }
    };

    checkExistingRating();
  }, [lookId, supabase]);

  const submitRating = async (value: number) => {
    setIsSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          title: "Please sign in",
          description: "You need to be signed in to rate looks",
          variant: "destructive",
        });
        return;
      }

      // Try primary rating endpoint first
      try {
        const response = await fetch('/api/gallery/vote', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            look_id: lookId,
            vote_type: 'rating',
            rating: value,
          }),
        });

        const result = await response.json();
        
        if (result.success) {
          setRating(value);
          setUserHasRated(true);
          
          if (onRatingChange) {
            onRatingChange(value);
          }
          
          toast({
            title: "Rating submitted!",
            description: result.message || "Your rating has been saved.",
          });
          
          return; // Success, exit early
        }
        
        // If we got here, the first API call failed
        console.log('Gallery vote API failed, trying fallback rating API');
      } catch (primaryError) {
        console.error('Error with gallery rating API:', primaryError);
        // Continue to fallback
      }
      
      // Fallback to alternative ratings endpoint
      const fallbackResponse = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lookId: lookId,
          rating: value,
          userId: session.user.id
        }),
      });
      
      const fallbackResult = await fallbackResponse.json();
      
      if (fallbackResult.success) {
        setRating(value);
        setUserHasRated(true);
        
        if (onRatingChange) {
          onRatingChange(value);
        }
        
        toast({
          title: "Rating submitted!",
          description: fallbackResult.message || "Your rating has been saved via alternative method.",
        });
      } else {
        throw new Error(fallbackResult.error || 'Failed to submit rating with both methods');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: "Rating failed",
        description: "There was a problem submitting your rating. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingClick = (value: number) => {
    if (isSubmitting) return;
    
    // If user has already rated with this value, don't submit again
    if (userHasRated && value === rating) return;
    
    submitRating(value);
  };

  // Determine star size based on the size prop
  const starSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;
  
  return (
    <div className={`flex items-center ${isSubmitting ? 'opacity-50' : ''}`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          disabled={isSubmitting}
          className="focus:outline-none p-1"
          onMouseEnter={() => setHoveredRating(value)}
          onMouseLeave={() => setHoveredRating(0)}
          onClick={() => handleRatingClick(value)}
          aria-label={`Rate ${value} out of 5 stars`}
        >
          <Star
            size={starSize}
            className={`
              transition-colors
              ${
                hoveredRating >= value
                  ? 'text-yellow-400 fill-yellow-400' 
                  : rating >= value
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300 dark:text-gray-600'
              }
            `}
          />
        </button>
      ))}
    </div>
  );
} 