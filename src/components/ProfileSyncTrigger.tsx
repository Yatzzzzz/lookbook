'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * Component that triggers profile sync with users table.
 * This can be used in admin panels or added to layout components
 * if you want automatic sync.
 */
export function ProfileSyncTrigger({ autoSync = false, children = null }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const syncProfiles = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/init-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync profiles');
      }
      
      toast({
        title: 'Profiles Synced',
        description: data.message,
      });
    } catch (error: any) {
      console.error('Error syncing profiles:', error);
      toast({
        title: 'Sync Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-sync on component mount if enabled
  useEffect(() => {
    if (autoSync && user) {
      syncProfiles();
    }
  }, [autoSync, user]);

  // If this component is just used for auto-sync and has children, render children
  if (autoSync && children) {
    return children;
  }

  // Otherwise, render a button to manually trigger sync
  return (
    <Button 
      onClick={syncProfiles} 
      disabled={loading || !user}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Syncing Profiles...
        </>
      ) : (
        'Sync User Profiles'
      )}
    </Button>
  );
} 