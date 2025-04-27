'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RecommendationItemProps {
  recommendation: {
    id: string;
    recommendation_type: string;
    relevance_score?: number;
    product?: {
      product_id: string;
      name: string;
      brand?: string;
      category: string;
      image_url?: string;
      price?: number;
      tags?: string[];
    }
  };
  onProductClick: (recommendationId: string) => void;
  onAddToWishlist?: (productId: string) => void;
  isAddingToWishlist?: boolean;
  showWishlistButton?: boolean;
}

export function RecommendationItem({
  recommendation,
  onProductClick,
  onAddToWishlist,
  isAddingToWishlist = false,
  showWishlistButton = true
}: RecommendationItemProps) {
  const router = useRouter();

  if (!recommendation.product) {
    return null;
  }

  const formatPrice = (price?: number) => {
    if (!price) return 'Price not available';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  const handleProductClick = () => {
    onProductClick(recommendation.id);
  };

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToWishlist && recommendation.product) {
      onAddToWishlist(recommendation.product.product_id);
    }
  };

  const getRecommendationReason = () => {
    switch (recommendation.recommendation_type) {
      case 'personalized':
        return 'Based on your overall style profile';
      case 'style':
        return 'Matches your dominant style preferences';
      case 'wardrobe_gap':
        return 'Fills a gap in your wardrobe';
      case 'outfit_completion':
        return 'Completes your existing outfits';
      case 'trending':
        return 'Popular in the fashion community';
      case 'new_arrival':
        return 'New arrival that matches your style';
      default:
        return 'Recommended for you';
    }
  };

  const getRelevanceText = () => {
    if (recommendation.relevance_score === undefined) return null;
    
    const score = recommendation.relevance_score;
    if (score > 0.8) return 'Perfect match for you';
    if (score > 0.6) return 'Strong match for your style';
    if (score > 0.4) return 'Good match for your wardrobe';
    return 'Might complement your style';
  };

  const product = recommendation.product;

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <div 
        className="relative h-64 cursor-pointer" 
        onClick={handleProductClick}
      >
        <Image 
          src={product.image_url || '/images/placeholder-product.jpg'} 
          alt={product.name}
          fill
          style={{ objectFit: 'cover' }}
        />
      </div>
      <CardHeader className="p-4">
        <CardTitle className="text-lg truncate cursor-pointer" onClick={handleProductClick}>
          {product.name}
        </CardTitle>
        <CardDescription>{product.brand}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="font-semibold">{formatPrice(product.price)}</p>
        <div className="flex flex-wrap gap-1 mt-2">
          <Badge variant="outline">{product.category}</Badge>
          {product.tags && product.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary">{tag}</Badge>
          ))}
        </div>
        <div className="flex items-center mt-3 text-sm text-muted-foreground">
          <div className="flex-1">{getRecommendationReason()}</div>
          {recommendation.relevance_score !== undefined && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 ml-1" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getRelevanceText()}</p>
                  <p className="text-xs">Relevance: {Math.round(recommendation.relevance_score * 100)}%</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <div className="grid w-full gap-2">
          <Button 
            className="w-full" 
            onClick={handleProductClick}
          >
            View Product
          </Button>
          {showWishlistButton && onAddToWishlist && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleAddToWishlist}
              disabled={isAddingToWishlist}
            >
              <Heart className="w-4 h-4 mr-2" />
              {isAddingToWishlist ? 'Adding...' : 'Add to Wishlist'}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
} 