'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@radix-ui/react-progress';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@radix-ui/react-tooltip';
import { Info, CheckCircle, AlertCircle } from 'lucide-react';

interface ProfileCompletionIndicatorProps {
  userId?: string;
  showDetails?: boolean;
  className?: string;
}

export default function ProfileCompletionIndicator({
  userId,
  showDetails = true,
  className = '',
}: ProfileCompletionIndicatorProps) {
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [incompleteFields, setIncompleteFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  const fieldWeights = {
    avatar_url: 20,
    display_name: 15,
    bio: 15,
    username: 15,
    social_links: 10,
    location: 10,
    wardrobe_items: 15,
  };

  const fieldLabels: Record<string, string> = {
    avatar_url: 'Profile Picture',
    display_name: 'Display Name',
    bio: 'Bio',
    username: 'Username',
    social_links: 'Social Links',
    location: 'Location',
    wardrobe_items: 'Wardrobe Items',
  };

  useEffect(() => {
    async function calculateProfileCompletion() {
      try {
        setLoading(true);
        
        // Get current user if userId not provided
        let currentUserId = userId;
        if (!currentUserId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            setLoading(false);
            return;
          }
          currentUserId = user.id;
        }

        // Fetch user profile data
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', currentUserId)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          setLoading(false);
          return;
        }

        // Check if user has wardrobe items
        const { count: wardrobeCount, error: wardrobeError } = await supabase
          .from('wardrobe')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', currentUserId);

        if (wardrobeError) {
          console.error('Error fetching wardrobe count:', wardrobeError);
        }

        // Add wardrobe_items to profile data for evaluation
        const profileWithWardrobe = {
          ...profileData,
          wardrobe_items: wardrobeCount && wardrobeCount > 0 ? true : false,
          social_links: profileData.social_links || profileData.website || false,
        };

        // Calculate completion percentage
        let totalWeight = 0;
        let earnedWeight = 0;
        const incomplete: string[] = [];

        for (const [field, weight] of Object.entries(fieldWeights)) {
          totalWeight += weight;
          
          const fieldValue = profileWithWardrobe[field as keyof typeof profileWithWardrobe];
          const isComplete = fieldValue && 
                            (typeof fieldValue === 'boolean' ? fieldValue : 
                             typeof fieldValue === 'string' ? fieldValue.trim() !== '' : 
                             typeof fieldValue === 'number' ? true : 
                             Array.isArray(fieldValue) ? fieldValue.length > 0 : 
                             !!fieldValue);
          
          if (isComplete) {
            earnedWeight += weight;
          } else {
            incomplete.push(field);
          }
        }

        const percentage = Math.round((earnedWeight / totalWeight) * 100);
        setCompletionPercentage(percentage);
        setIncompleteFields(incomplete);
        setLoading(false);
      } catch (error) {
        console.error('Error calculating profile completion:', error);
        setLoading(false);
      }
    }

    calculateProfileCompletion();
  }, [userId, supabase]);

  const getCompletionColor = () => {
    if (completionPercentage < 40) return 'bg-red-500';
    if (completionPercentage < 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getCompletionIcon = () => {
    if (completionPercentage < 40) return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (completionPercentage < 70) return <Info className="h-4 w-4 text-amber-500" />;
    return <CheckCircle className="h-4 w-4 text-emerald-500" />;
  };

  if (loading) {
    return <div className="h-2 w-full animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          Profile completion: {completionPercentage}%
        </span>
        {getCompletionIcon()}
      </div>
      
      <Progress 
        value={completionPercentage} 
        className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700"
      >
        <div
          className={`h-full rounded-full ${getCompletionColor()}`}
          style={{ width: `${completionPercentage}%` }}
        />
      </Progress>
      
      {showDetails && incompleteFields.length > 0 && (
        <div className="mt-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Complete your profile by adding:
                  </span>
                  <ul className="mt-1 space-y-1">
                    {incompleteFields.map((field) => (
                      <li key={field} className="text-xs">
                        • {fieldLabels[field] || field}
                      </li>
                    ))}
                  </ul>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                Complete these items to improve your profile
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
} 