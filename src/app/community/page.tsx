import { Suspense } from 'react';
import { Metadata } from 'next';
import CommunityFeed from '../components/community-feed';
import LoadingSpinner from '../components/loading-spinner';

export const metadata: Metadata = {
  title: 'Community Feed | Lookbook',
  description: 'Discover trending outfits shared by the Lookbook community',
};

export default function CommunityPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Community Feed</h1>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Trending Outfits</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Discover outfits that are trending in the Lookbook community.
        </p>
        
        <Suspense fallback={<LoadingSpinner />}>
          <CommunityFeed filter="trending" />
        </Suspense>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Recently Shared</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Check out the latest outfits shared by the community.
        </p>
        
        <Suspense fallback={<LoadingSpinner />}>
          <CommunityFeed filter="recent" />
        </Suspense>
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold mb-4">Featured Outfits</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Curated outfits selected for their style and creativity.
        </p>
        
        <Suspense fallback={<LoadingSpinner />}>
          <CommunityFeed filter="featured" />
        </Suspense>
      </div>
    </div>
  );
} 