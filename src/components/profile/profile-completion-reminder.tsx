'use client';

import { useState, useEffect } from 'react';
import { X, UserCheck } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { calculateProfileCompletion } from '@/utils/profile-synchronization';

interface ProfileCompletionReminderProps {
  userId?: string;
  className?: string;
  threshold?: number; // Percentage threshold below which to show the reminder
}

export default function ProfileCompletionReminder({
  userId,
  className = '',
  threshold = 70
}: ProfileCompletionReminderProps) {
  const [showReminder, setShowReminder] = useState(false);
  const [percentage, setPercentage] = useState(100);
  const [incompleteFields, setIncompleteFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  
  const fieldLabels: Record<string, string> = {
    avatar_url: 'Profile Picture',
    display_name: 'Display Name',
    bio: 'Bio',
    username: 'Username',
    social_links: 'Social Links',
    location: 'Location',
    wardrobe_items: 'Wardrobe Items',
  };

  // Check if reminder was dismissed in the last 24 hours
  const checkDismissed = () => {
    const dismissed = localStorage.getItem('profile_reminder_dismissed');
    if (dismissed) {
      const dismissedTime = new Date(dismissed).getTime();
      const now = new Date().getTime();
      const dayInMs = 24 * 60 * 60 * 1000;
      
      if (now - dismissedTime < dayInMs) {
        return true;
      }
    }
    return false;
  };

  // Save dismissed state
  const dismissReminder = () => {
    localStorage.setItem('profile_reminder_dismissed', new Date().toISOString());
    setShowReminder(false);
  };

  useEffect(() => {
    async function checkProfileCompletion() {
      try {
        // Don't show if previously dismissed
        if (checkDismissed()) {
          setShowReminder(false);
          setLoading(false);
          return;
        }

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

        // Calculate completion
        const completion = calculateProfileCompletion(profileWithWardrobe);
        setPercentage(completion.percentage);
        setIncompleteFields(completion.incompleteFields);
        
        // Show reminder only if completion is below threshold
        setShowReminder(completion.percentage < threshold);
        setLoading(false);
      } catch (error) {
        console.error('Error checking profile completion:', error);
        setLoading(false);
      }
    }

    checkProfileCompletion();
  }, [userId, supabase, threshold]);

  // Don't render anything while loading or if no reminder needed
  if (loading || !showReminder) {
    return null;
  }

  // Get the most important fields to complete (limit to 3)
  const priorityFields = incompleteFields.slice(0, 3);

  return (
    <div className={`bg-primary/10 border border-primary/20 p-4 rounded-lg mb-4 ${className}`}>
      <div className="flex items-start">
        <UserCheck className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
        
        <div className="flex-grow">
          <h3 className="text-sm font-medium mb-1">Complete your profile</h3>
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
            Your profile is {percentage}% complete. Enhance your experience by adding:
          </p>
          
          <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-300 mb-3">
            {priorityFields.map(field => (
              <li key={field}>{fieldLabels[field] || field}</li>
            ))}
          </ul>
          
          <div className="flex items-center mt-2">
            <Link 
              href={`/profile/edit`}
              className="text-xs bg-primary text-white py-1 px-3 rounded-md hover:bg-primary/90 transition-colors"
            >
              Complete Profile
            </Link>
            <button 
              onClick={dismissReminder}
              className="text-xs ml-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Remind me later
            </button>
          </div>
        </div>
        
        <button 
          onClick={dismissReminder}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
} 