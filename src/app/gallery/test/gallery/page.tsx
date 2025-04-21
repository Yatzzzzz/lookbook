'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import NavBar from '@/components/NavBar';
import BottomNav from '@/components/BottomNav';
import CustomTabs from '@/components/gallery/CustomTabs';
import YayOrNayGrid from '@/components/gallery/YayOrNayGrid/YayOrNayGrid';
import BattleGrid from '@/components/gallery/BattleGrid/BattleGrid';
import OpinionsGrid from '@/components/gallery/OpinionsGrid/OpinionsGrid';
import { getLooks, rateLook, saveLook, shareLook } from '@/lib/gallery-api';
import styles from './Gallery.module.css';
import { Loader2 } from 'lucide-react';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import Link from 'next/link';

function GalleryContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'gallery');
  const [filterTab, setFilterTab] = useState(searchParams.get('filter') || 'all');
  const [looks, setLooks] = useState<any[]>([]);
  const [yayNayItems, setYayNayItems] = useState<any[]>([]);
  const [battleItems, setBattleItems] = useState<any[]>([]);
  const [opinionItems, setOpinionItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchLooks();
  }, [activeTab, filterTab, page]);

  const fetchLooks = async () => {
    setLoading(true);

    try {
      const response = await getLooks({
        tab: activeTab,
        filter: filterTab,
        page,
        limit: 20
      });

      if (activeTab === 'gallery') {
        setLooks(prev => page === 1 ? response.looks || [] : [...prev, ...(response.looks || [])]);
      } else if (activeTab === 'yay_or_nay') {
        setYayNayItems(prev => page === 1 ? response.items || [] : [...prev, ...(response.items || [])]);
      } else if (activeTab === 'battle') {
        setBattleItems(prev => page === 1 ? response.items || [] : [...prev, ...(response.items || [])]);
      } else if (activeTab === 'opinions') {
        setOpinionItems(prev => page === 1 ? response.items || [] : [...prev, ...(response.items || [])]);
      }

      setHasMore(response.pagination.has_more);
    } catch (error) {
      console.error('Error fetching looks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleFilterChange = (filter: string) => {
    setFilterTab(filter);
    setPage(1);
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const handleRate = async (lookId: string, rating: string) => {
    try {
      await rateLook(lookId, rating);

      // Update local state
      setLooks(prev =>
        prev.map(look =>
          look.look_id === lookId ? { ...look, user_rating: rating } : look
        )
      );
    } catch (error) {
      console.error('Error rating look:', error);
    }
  };

  const handleSave = async (lookId: string) => {
    try {
      await saveLook(lookId);
      // Update local state to show saved status
      setLooks(prev =>
        prev.map(look =>
          look.look_id === lookId ? { ...look, is_saved: true } : look
        )
      );
    } catch (error) {
      console.error('Error saving look:', error);
    }
  };

  const handleShare = async (lookId: string) => {
    try {
      await shareLook(lookId);
    } catch (error) {
      console.error('Error sharing look:', error);
    }
  };
  
  const renderContent = () => {
    if (loading) {
      return <div className={styles.loading}>Loading...</div>;
    }

    switch (activeTab) {
      case 'gallery':
        return (
          <>
            <div className={styles.filterTabs}>
              <button
                className={`${styles.filterTab} ${filterTab === 'all' ? styles.active : ''}`}
                onClick={() => handleFilterChange('all')}
              >
                All
              </button>
              <button
                className={`${styles.filterTab} ${filterTab === 'friends' ? styles.active : ''}`}
                onClick={() => handleFilterChange('friends')}
              >
                Friends
              </button>
              <button
                className={`${styles.filterTab} ${filterTab === 'following' ? styles.active : ''}`}
                onClick={() => handleFilterChange('following')}
              >
                Following
              </button>
            </div>

            <ResponsiveMasonry
              columnsCountBreakPoints={{ 350: 2, 640: 2, 768: 3, 1024: 4, 1280: 4 }}
            >
              <Masonry gutter="2">
                {looks.map((look) => (
                  <div 
                    key={look.look_id} 
                    className="bg-white dark:bg-gray-800 overflow-hidden mb-[2px]"
                  >
                    <Link href={`/look/${look.look_id}`}>
                      <div className="relative">
                        <img
                          src={look.image_url}
                          alt={look.caption || "Fashion look"}
                          className="w-full h-auto object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1 text-xs text-white">
                          <div className="font-medium truncate">
                            {look.caption || "Untitled Look"}
                          </div>
                          <div className="opacity-80">
                            By {look.username || "Anonymous"}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </Masonry>
            </ResponsiveMasonry>
          </>
        );

      case 'yay_or_nay':
        return <YayOrNayGrid items={yayNayItems} />;

      case 'battle':
        return <BattleGrid items={battleItems} />;

      case 'opinions':
        return <OpinionsGrid items={opinionItems} />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <NavBar />

      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container flex items-center h-14">
          <div className="text-lg md:text-xl font-semibold">Fashion Gallery</div>
        </div>
      </div>

      <div className={styles.container}>
        <CustomTabs
          tabs={[
            { id: 'gallery', label: 'Gallery' },
            { id: 'yay_or_nay', label: 'Yay or Nay' },
            { id: 'battle', label: 'Battle' },
            { id: 'opinions', label: 'Opinions' }
          ]}
          activeTab={activeTab}
          onChange={handleTabChange}
        />

        {renderContent()}

        {hasMore && (
          <button
            className={styles.loadMoreButton}
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default function GalleryPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <GalleryContent />
    </Suspense>
  );
} 