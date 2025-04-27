'use client';

import { useState, useEffect } from 'react';
import { useWardrobe } from '@/app/context/WardrobeContext';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { RecommendationItem } from '@/components/marketplace/RecommendationItem';
import { ActivityFeedFallback } from '@/components/marketplace/ActivityFeedFallback';

export default function RecommendationsPage() {
  const router = useRouter();
  const { 
    getProductRecommendations,
    trackProductClick,
    addToWishList,
    markRecommendationAsViewed,
    markRecommendationAsClicked,
    activityFeedError,
    refreshActivityFeed
  } = useWardrobe();

  const [personalizedRecommendations, setPersonalizedRecommendations] = useState<any[]>([]);
  const [styleRecommendations, setStyleRecommendations] = useState<any[]>([]);
  const [wardrobeGapRecommendations, setWardrobeGapRecommendations] = useState<any[]>([]);
  const [outfitCompletionRecommendations, setOutfitCompletionRecommendations] = useState<any[]>([]);
  const [loadingPersonalized, setLoadingPersonalized] = useState<boolean>(true);
  const [loadingStyle, setLoadingStyle] = useState<boolean>(false);
  const [loadingGaps, setLoadingGaps] = useState<boolean>(false);
  const [loadingOutfits, setLoadingOutfits] = useState<boolean>(false);
  const [addingToWishlist, setAddingToWishlist] = useState<{[key: string]: boolean}>({});
  const [activeTab, setActiveTab] = useState<string>('personalized');

  useEffect(() => {
    // Mark all visible recommendations as viewed
    const markRecommendationsAsViewed = async () => {
      let currentRecommendations: any[] = [];
      
      switch (activeTab) {
        case 'personalized':
          currentRecommendations = personalizedRecommendations;
          break;
        case 'style':
          currentRecommendations = styleRecommendations;
          break;
        case 'wardrobe-gaps':
          currentRecommendations = wardrobeGapRecommendations;
          break;
        case 'outfit-completion':
          currentRecommendations = outfitCompletionRecommendations;
          break;
      }
      
      for (const recommendation of currentRecommendations) {
        if (!recommendation.is_viewed) {
          await markRecommendationAsViewed(recommendation.id);
        }
      }
    };
    
    markRecommendationsAsViewed();
  }, [activeTab, personalizedRecommendations, styleRecommendations, wardrobeGapRecommendations, outfitCompletionRecommendations, markRecommendationAsViewed]);

  useEffect(() => {
    const fetchPersonalizedRecommendations = async () => {
      setLoadingPersonalized(true);
      try {
        const recommendations = await getProductRecommendations('personalized', 9);
        setPersonalizedRecommendations(recommendations);
      } catch (error) {
        console.error('Error fetching personalized recommendations:', error);
      } finally {
        setLoadingPersonalized(false);
      }
    };

    fetchPersonalizedRecommendations();
  }, [getProductRecommendations]);

  const loadStyleRecommendations = async () => {
    if (styleRecommendations.length > 0 || loadingStyle) return;
    
    setLoadingStyle(true);
    try {
      const recommendations = await getProductRecommendations('style', 9);
      setStyleRecommendations(recommendations);
    } catch (error) {
      console.error('Error fetching style recommendations:', error);
    } finally {
      setLoadingStyle(false);
    }
  };

  const loadWardrobeGapRecommendations = async () => {
    if (wardrobeGapRecommendations.length > 0 || loadingGaps) return;
    
    setLoadingGaps(true);
    try {
      const recommendations = await getProductRecommendations('wardrobe_gap', 9);
      setWardrobeGapRecommendations(recommendations);
    } catch (error) {
      console.error('Error fetching wardrobe gap recommendations:', error);
    } finally {
      setLoadingGaps(false);
    }
  };

  const loadOutfitCompletionRecommendations = async () => {
    if (outfitCompletionRecommendations.length > 0 || loadingOutfits) return;
    
    setLoadingOutfits(true);
    try {
      const recommendations = await getProductRecommendations('outfit_completion', 9);
      setOutfitCompletionRecommendations(recommendations);
    } catch (error) {
      console.error('Error fetching outfit completion recommendations:', error);
    } finally {
      setLoadingOutfits(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    switch (value) {
      case 'style':
        loadStyleRecommendations();
        break;
      case 'wardrobe-gaps':
        loadWardrobeGapRecommendations();
        break;
      case 'outfit-completion':
        loadOutfitCompletionRecommendations();
        break;
    }
  };

  const handleProductClick = async (recommendationId: string) => {
    const recommendation = findRecommendationById(recommendationId);
    
    if (recommendation) {
      await markRecommendationAsClicked(recommendation.id);
      await trackProductClick(recommendation.product?.product_id, `recommendation_${activeTab}`);
      router.push(`/marketplace/product/${recommendation.product?.product_id}`);
    }
  };

  const findRecommendationById = (id: string) => {
    switch (activeTab) {
      case 'personalized':
        return personalizedRecommendations.find(rec => rec.id === id);
      case 'style':
        return styleRecommendations.find(rec => rec.id === id);
      case 'wardrobe-gaps':
        return wardrobeGapRecommendations.find(rec => rec.id === id);
      case 'outfit-completion':
        return outfitCompletionRecommendations.find(rec => rec.id === id);
      default:
        return null;
    }
  };

  const handleAddToWishlist = async (productId: string) => {
    setAddingToWishlist(prev => ({ ...prev, [productId]: true }));
    
    try {
      await addToWishList(productId);
      // Success notification could be added here
    } catch (error) {
      console.error('Error adding to wishlist:', error);
    } finally {
      setAddingToWishlist(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Retry activity feed loading if there was an error
  useEffect(() => {
    if (activityFeedError) {
      const retryTimeout = setTimeout(() => {
        refreshActivityFeed();
      }, 3000); // Retry after 3 seconds
      
      return () => clearTimeout(retryTimeout);
    }
  }, [activityFeedError, refreshActivityFeed]);

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold">Product Recommendations</h1>
        <p className="text-muted-foreground">Personalized product suggestions based on your style profile and wardrobe</p>
      </div>

      {activityFeedError && <ActivityFeedFallback />}

      <Tabs defaultValue="personalized" className="w-full" onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="personalized">Personalized</TabsTrigger>
          <TabsTrigger value="style">Style Matches</TabsTrigger>
          <TabsTrigger value="wardrobe-gaps">Wardrobe Gaps</TabsTrigger>
          <TabsTrigger value="outfit-completion">Outfit Completion</TabsTrigger>
        </TabsList>
        
        <TabsContent value="personalized">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Personalized Recommendations</h2>
            <p className="text-muted-foreground">Products selected based on your overall preferences and browsing history</p>
          </div>
          
          {loadingPersonalized ? (
            <div className="flex justify-center p-12">
              <LoadingSpinner />
            </div>
          ) : personalizedRecommendations.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
              {personalizedRecommendations.map((recommendation) => (
                <RecommendationItem
                  key={recommendation.id}
                  recommendation={recommendation}
                  onProductClick={handleProductClick}
                  onAddToWishlist={handleAddToWishlist}
                  isAddingToWishlist={!!addingToWishlist[recommendation.product?.product_id]}
                />
              ))}
            </div>
          ) : (
            <EmptyRecommendations type="personalized" />
          )}
        </TabsContent>
        
        <TabsContent value="style">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Style Matches</h2>
            <p className="text-muted-foreground">Products that match your dominant style preferences</p>
          </div>
          
          {loadingStyle ? (
            <div className="flex justify-center p-12">
              <LoadingSpinner />
            </div>
          ) : styleRecommendations.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
              {styleRecommendations.map((recommendation) => (
                <RecommendationItem
                  key={recommendation.id}
                  recommendation={recommendation}
                  onProductClick={handleProductClick}
                  onAddToWishlist={handleAddToWishlist}
                  isAddingToWishlist={!!addingToWishlist[recommendation.product?.product_id]}
                />
              ))}
            </div>
          ) : (
            <EmptyRecommendations type="style" />
          )}
        </TabsContent>
        
        <TabsContent value="wardrobe-gaps">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Wardrobe Gap Fillers</h2>
            <p className="text-muted-foreground">Products that could fill gaps in your current wardrobe</p>
          </div>
          
          {loadingGaps ? (
            <div className="flex justify-center p-12">
              <LoadingSpinner />
            </div>
          ) : wardrobeGapRecommendations.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
              {wardrobeGapRecommendations.map((recommendation) => (
                <RecommendationItem
                  key={recommendation.id}
                  recommendation={recommendation}
                  onProductClick={handleProductClick}
                  onAddToWishlist={handleAddToWishlist}
                  isAddingToWishlist={!!addingToWishlist[recommendation.product?.product_id]}
                />
              ))}
            </div>
          ) : (
            <EmptyRecommendations type="wardrobe-gaps" />
          )}
        </TabsContent>
        
        <TabsContent value="outfit-completion">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Outfit Completion</h2>
            <p className="text-muted-foreground">Products that would complement your existing outfits</p>
          </div>
          
          {loadingOutfits ? (
            <div className="flex justify-center p-12">
              <LoadingSpinner />
            </div>
          ) : outfitCompletionRecommendations.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
              {outfitCompletionRecommendations.map((recommendation) => (
                <RecommendationItem
                  key={recommendation.id}
                  recommendation={recommendation}
                  onProductClick={handleProductClick}
                  onAddToWishlist={handleAddToWishlist}
                  isAddingToWishlist={!!addingToWishlist[recommendation.product?.product_id]}
                />
              ))}
            </div>
          ) : (
            <EmptyRecommendations type="outfit-completion" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyRecommendations({ type }: { type: string }) {
  let message = '';
  let actionMessage = '';
  
  switch (type) {
    case 'personalized':
      message = 'No personalized recommendations available yet.';
      actionMessage = 'Add more items to your wardrobe and browse products to receive better recommendations.';
      break;
    case 'style':
      message = 'No style-based recommendations available yet.';
      actionMessage = 'Update your style preferences in your profile to receive style matches.';
      break;
    case 'wardrobe-gaps':
      message = 'No wardrobe gap recommendations available yet.';
      actionMessage = 'Complete your wardrobe inventory to identify potential gaps.';
      break;
    case 'outfit-completion':
      message = 'No outfit completion suggestions available yet.';
      actionMessage = 'Create more outfits in your wardrobe to receive completion suggestions.';
      break;
    default:
      message = 'No recommendations available.';
      actionMessage = 'Try again later.';
  }
  
  return (
    <div className="p-12 text-center border rounded-lg bg-muted/10">
      <p>{message}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        {actionMessage}
      </p>
      <Button className="mt-4" asChild>
        <a href="/wardrobe">Go to Wardrobe</a>
      </Button>
    </div>
  );
} 