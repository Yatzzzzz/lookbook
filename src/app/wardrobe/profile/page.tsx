'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProfileRedirectPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push(`/wardrobe/profile/${user.id}`);
      } else {
        router.push('/login?redirect=/wardrobe/profile');
      }
    }
  }, [user, loading, router]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-gray-600 dark:text-gray-400">Redirecting to your profile...</p>
    </div>
  );
} 