'use client';

import { useState, useEffect } from 'react';
import { useWardrobe } from '@/app/context/WardrobeContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ProductCard } from '@/components/marketplace/ProductCard';

export default function MarketplacePage() {
  const router = useRouter();
  const { 
    products,
    isLoadingProducts,
    productsError,
    getProductRecommendations,
    trackProductClick,
    addToWishList
  } = useWardrobe();

  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState<any[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoadingRecommendations(true);
      try {
        const recommendations = await getProductRecommendations('personalized', 6);
        setPersonalizedRecommendations(recommendations);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setIsLoadingRecommendations(false);
      }
    };

    fetchRecommendations();
  }, [getProductRecommendations]);

  useEffect(() => {
    // Set featured products from the general products list
    if (products.length > 0) {
      setFeaturedProducts(products.slice(0, 6));
    }
  }, [products]);

  const handleProductClick = (productId: string) => {
    trackProductClick(productId, 'marketplace_page');
    router.push(`/marketplace/product/${productId}`);
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

  if (isLoadingProducts) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  }

  if (productsError) {
    return <div className="p-6 text-center">Error loading marketplace: {productsError}</div>;
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold">Fashion Marketplace</h1>
        <p className="text-muted-foreground">Discover products that match your style and wardrobe</p>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-4">
        <Link href="/marketplace/product-matching" className="p-6 transition-all duration-200 border rounded-lg shadow-sm bg-primary/5 hover:shadow-md">
          <h2 className="mb-2 text-xl font-semibold">Product Matching</h2>
          <p className="text-muted-foreground">Find products similar to items in your wardrobe</p>
        </Link>
        <Link href="/marketplace/wishlist" className="p-6 transition-all duration-200 border rounded-lg shadow-sm bg-primary/5 hover:shadow-md">
          <h2 className="mb-2 text-xl font-semibold">Your Wishlist</h2>
          <p className="text-muted-foreground">Track and manage products you want to buy</p>
        </Link>
        <Link href="/marketplace/recommendations" className="p-6 transition-all duration-200 border rounded-lg shadow-sm bg-primary/5 hover:shadow-md">
          <h2 className="mb-2 text-xl font-semibold">Recommendations</h2>
          <p className="text-muted-foreground">Personalized product suggestions based on your style</p>
        </Link>
        <Link href="/marketplace/sustainable-alternatives" className="p-6 transition-all duration-200 border rounded-lg shadow-sm bg-primary/5 hover:bg-emerald-50 hover:border-emerald-200 hover:shadow-md">
          <h2 className="mb-2 text-xl font-semibold flex items-center">
            <svg className="w-5 h-5 mr-1 text-emerald-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a9 9 0 0 1 9 9c0 3.18-1 5-3 8.5-2 3.5-6 6.5-6 6.5s-4-3-6-6.5C4 16 3 14.18 3 11a9 9 0 0 1 9-9Z"></path>
            </svg>
            Sustainable Picks
          </h2>
          <p className="text-muted-foreground">Discover eco-friendly and ethical fashion alternatives</p>
        </Link>
      </div>

      <div className="mb-12">
        <Tabs defaultValue="featured" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="featured">Featured Products</TabsTrigger>
            <TabsTrigger value="recommended">Recommended For You</TabsTrigger>
          </TabsList>
          
          <TabsContent value="featured">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
              {featuredProducts.length > 0 ? (
                featuredProducts.map((product) => (
                  <ProductCard 
                    key={product.product_id} 
                    product={product}
                    onProductClick={handleProductClick}
                    onAddToWishlist={handleAddToWishlist}
                    isAddingToWishlist={!!addingToWishlist[product.product_id]}
                  />
                ))
              ) : (
                <div className="col-span-3 p-12 text-center border rounded-lg bg-muted/10">
                  <p>No featured products available at the moment.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="recommended">
            {isLoadingRecommendations ? (
              <div className="flex justify-center p-12">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                {personalizedRecommendations.length > 0 ? (
                  personalizedRecommendations.map((recommendation) => (
                    <ProductCard
                      key={recommendation.id}
                      product={recommendation.product}
                      onProductClick={(productId) => {
                        handleProductClick(productId);
                      }}
                      onAddToWishlist={handleAddToWishlist}
                      isAddingToWishlist={!!addingToWishlist[recommendation.product?.product_id]}
                      reasonText="Based on your style preferences"
                    />
                  ))
                ) : (
                  <div className="col-span-3 p-12 text-center border rounded-lg bg-muted/10">
                    <p>No personalized recommendations available yet.</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Add more items to your wardrobe to receive better recommendations.
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 