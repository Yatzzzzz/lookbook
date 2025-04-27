'use client';

import { useRouter } from 'next/navigation';
import { WardrobeAnalytics } from '../../components/wardrobe-analytics';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function WardrobeAnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      console.log('Not authenticated, redirecting to login');
      router.push('/login');
    } else if (!authLoading && user) {
      setAuthChecked(true);
    }
  }, [user, authLoading, router]);

  if (authLoading || !authChecked) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Wardrobe Analytics</h1>
          <button
            onClick={() => router.push('/wardrobe')}
            className="text-blue-600 text-sm hover:underline mt-1 flex items-center"
          >
            ← Back to Wardrobe
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <WardrobeAnalytics />
      </div>
    </div>
  );
} 