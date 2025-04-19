'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabaseClient';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  signIn: (session: Session) => void;
  refreshSession: () => Promise<Session | null>;
  updateUserAvatar: (avatarUrl: string) => Promise<void>;
  updateUserMetadata: (metadata: Record<string, any>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signOut: async () => {},
  signIn: () => {},
  refreshSession: async () => null,
  updateUserAvatar: async () => {},
  updateUserMetadata: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = getSupabaseClient();

  // Ensure user record exists in database
  const ensureUserRecord = async (currentUser: User) => {
    try {
      // Call the user-record API endpoint to create a record if it doesn't exist
      const response = await fetch('/api/user-record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        console.error('Error ensuring user record:', data.error);
      } else {
        const data = await response.json();
        console.log('User record status:', data.message);
      }
    } catch (err) {
      console.error('Failed to ensure user record exists:', err);
    }
  };

  // Function to refresh the session with better error handling
  const refreshSession = async (): Promise<Session | null> => {
    try {
      setError(null);
      
      if (!supabase) {
        setError("Supabase client is not initialized");
        return null;
      }
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        setError(error.message);
        return null;
      }
      
      if (data.session) {
        setUser(data.session.user);
        return data.session;
      }
      
      return null;
    } catch (err) {
      console.error('Unexpected error during session refresh:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error refreshing session';
      setError(errorMessage);
      return null;
    }
  };

  // Initialize auth state on first load with better error handling
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (!supabase) {
          setError("Supabase client is not initialized");
          setLoading(false);
          return;
        }
        
        setLoading(true);
        setError(null);
        
        // First, check if we have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          setError(sessionError.message);
          setLoading(false);
          return;
        }
        
        if (session) {
          setUser(session.user);
          setLoading(false);
          return;
        }
        
        // If no session, try to refresh it
        const refreshedSession = await refreshSession();
        if (!refreshedSession) {
          // No session and couldn't refresh - user is not logged in
          setUser(null);
        }
      } catch (err) {
        console.error('Unexpected error initializing auth:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown authentication error';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state change listener
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log('Auth state changed:', event, session?.user?.id);
          
          if (session?.user) {
            setUser(session.user);
            // Ensure user record exists on auth state change
            ensureUserRecord(session.user);
          } else {
            setUser(null);
          }
          
          setLoading(false);
        }
      );
  
      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Sign out with error handling
  const signOut = async () => {
    try {
      setError(null);
      
      if (!supabase) {
        setError("Supabase client is not initialized");
        return;
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        setError(error.message);
        return;
      }
      
      setUser(null);
    } catch (err) {
      console.error('Unexpected error signing out:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error signing out';
      setError(errorMessage);
    }
  };

  // Update user state when signing in
  const signIn = (session: Session) => {
    setUser(session.user);
    setError(null);
    // Ensure user record exists when signing in
    ensureUserRecord(session.user);
  };

  // Update user avatar
  const updateUserAvatar = async (avatarUrl: string) => {
    try {
      setError(null);
      
      if (!supabase) {
        setError("Supabase client is not initialized");
        return;
      }
      
      if (!user) {
        setError("No authenticated user");
        return;
      }
      
      // Update user metadata with the new avatar URL
      const { data, error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: avatarUrl,
        }
      });
      
      if (updateError) {
        console.error('Error updating user avatar:', updateError);
        setError(updateError.message);
        return;
      }
      
      // Update local user state
      if (data.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Unexpected error updating avatar:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error updating avatar';
      setError(errorMessage);
    }
  };
  
  // Update user metadata
  const updateUserMetadata = async (metadata: Record<string, any>) => {
    try {
      setError(null);
      
      if (!supabase) {
        setError("Supabase client is not initialized");
        return;
      }
      
      if (!user) {
        setError("No authenticated user");
        return;
      }
      
      // Get current metadata and merge with new metadata
      const currentMetadata = user.user_metadata || {};
      const updatedMetadata = { ...currentMetadata, ...metadata };
      
      // Update user metadata
      const { data, error: updateError } = await supabase.auth.updateUser({
        data: updatedMetadata
      });
      
      if (updateError) {
        console.error('Error updating user metadata:', updateError);
        setError(updateError.message);
        return;
      }
      
      // Update local user state
      if (data.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Unexpected error updating metadata:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error updating metadata';
      setError(errorMessage);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      signOut, 
      signIn, 
      refreshSession,
      updateUserAvatar,
      updateUserMetadata 
    }}>
      {children}
    </AuthContext.Provider>
  );
}