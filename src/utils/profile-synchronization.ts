import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { CookieOptions, RequestCookies } from 'next/dist/server/web/spec-extension/cookies';

export type ProfileUpdateData = {
  display_name?: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  is_active?: boolean;
  location?: string;
  social_links?: Record<string, string> | null;
  website?: string;
  [key: string]: any;
};

/**
 * Updates a user profile while ensuring data consistency between users and profiles tables
 * For client components
 */
export async function updateUserProfile(
  userId: string,
  profileData: ProfileUpdateData
) {
  const supabase = createClientComponentClient();
  
  // Use the user_profiles view which will properly sync data
  const { data, error } = await supabase
    .from('user_profiles')
    .update(profileData)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  return data;
}

/**
 * Gets the combined user profile data from the user_profiles view
 * For client components
 */
export async function getUserProfile(userId?: string) {
  const supabase = createClientComponentClient();
  
  try {
    // If no userId is provided, get the current user
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }
      userId = user.id;
    }
    
    // Fetch the profile from the user_profiles view
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

// Type for the cookies parameter to make it compatible with both App Router and Pages Router
type CookieGetterFn = (name: string) => string | undefined;
interface CookiesInterface {
  get: CookieGetterFn;
  [key: string]: any;
}

/**
 * Server-side function to update a user profile
 * For server components and API routes
 * @param userId - The user ID
 * @param profileData - The profile data to update
 * @param cookiesObj - Cookies object from either App Router or Pages Router
 */
export async function updateUserProfileServer(
  userId: string,
  profileData: ProfileUpdateData,
  cookiesObj: CookiesInterface | RequestCookies
) {
  // Import createServerClient dynamically to avoid importing next/headers
  const { createServerClient } = require('@supabase/auth-helpers-nextjs');
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Handle both App Router cookies() and Pages Router req.cookies
          if (typeof cookiesObj.get === 'function') {
            const cookie = cookiesObj.get(name);
            return typeof cookie === 'object' ? cookie?.value : cookie;
          } else {
            // Handle Pages API routes
            return cookiesObj[name];
          }
        },
      },
    }
  );
  
  // Update the profile data
  const { data, error } = await supabase
    .from('user_profiles')
    .update(profileData)
    .eq('id', userId)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating profile on server:', error);
    throw new Error(`Failed to update profile: ${error.message}`);
  }
  
  return data;
}

/**
 * Server-side function to get a user profile
 * For server components and API routes
 * @param userId - The user ID
 * @param cookiesObj - Cookies object from either App Router or Pages Router
 */
export async function getUserProfileServer(
  userId: string,
  cookiesObj: CookiesInterface | RequestCookies
) {
  // Import createServerClient dynamically to avoid importing next/headers
  const { createServerClient } = require('@supabase/auth-helpers-nextjs');
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Handle both App Router cookies() and Pages Router req.cookies
          if (typeof cookiesObj.get === 'function') {
            const cookie = cookiesObj.get(name);
            return typeof cookie === 'object' ? cookie?.value : cookie;
          } else {
            // Handle Pages API routes
            return cookiesObj[name];
          }
        },
      },
    }
  );
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) {
    console.error('Error fetching profile on server:', error);
    throw error;
  }
  
  return data;
}

/**
 * Calculates profile completion percentage
 * Returns a percentage and list of incomplete fields
 */
export function calculateProfileCompletion(profile: any) {
  const fieldWeights = {
    avatar_url: 20,
    display_name: 15,
    bio: 15,
    username: 15,
    social_links: 10,
    location: 10,
    wardrobe_items: 15,
  };

  let totalWeight = 0;
  let earnedWeight = 0;
  const incompleteFields: string[] = [];

  for (const [field, weight] of Object.entries(fieldWeights)) {
    totalWeight += weight;
    
    const fieldValue = profile[field];
    const isComplete = fieldValue && 
                     (typeof fieldValue === 'boolean' ? fieldValue : 
                      typeof fieldValue === 'string' ? fieldValue.trim() !== '' : 
                      typeof fieldValue === 'number' ? true : 
                      Array.isArray(fieldValue) ? fieldValue.length > 0 : 
                      typeof fieldValue === 'object' ? Object.keys(fieldValue).length > 0 : 
                      !!fieldValue);
    
    if (isComplete) {
      earnedWeight += weight;
    } else {
      incompleteFields.push(field);
    }
  }

  const percentage = Math.round((earnedWeight / totalWeight) * 100);
  
  return {
    percentage,
    incompleteFields
  };
} 