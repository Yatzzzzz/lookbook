'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Leaf, Info, Heart, ExternalLink, Loader2 } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SustainabilityMetric {
  label: string;
  score: number;
  description: string;
}

interface SustainableAlternativeCardProps {
  product: {
    product_id: string;
    image_url: string;
    name: string;
    brand: string;
    price: number;
    category: string;
    tags?: string[];
    sustainability_score: number;
    sustainability_metrics?: SustainabilityMetric[];
    sustainable_materials?: string[];
    certifications?: string[];
    brand_ethics_rating?: number; // 1-5 rating
  };
  onProductClick: (productId: string) => void;
  onAddToWishlist: (productId: string) => void;
  isAddingToWishlist?: boolean;
  originalProductId?: string; // ID of the original product this is an alternative to
}

export default function SustainableAlternativeCard({
  product,
  onProductClick,
  onAddToWishlist,
  isAddingToWishlist = false,
  originalProductId
}: SustainableAlternativeCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const formatPrice = (price?: number) => {
    if (!price) return 'Price not available';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  const getSustainabilityColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    if (score >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div 
        className="relative h-48 overflow-hidden cursor-pointer"
        onClick={() => onProductClick(product.product_id)}
      >
        <Image 
          src={product.image_url || '/images/placeholder-product.jpg'} 
          alt={product.name}
          fill
          style={{ objectFit: 'cover' }}
        />
        <div className="absolute top-2 left-2">
          <div className={`flex items-center gap-1 px-2 py-1 text-xs text-white rounded-full ${getSustainabilityColor(product.sustainability_score)}`}>
            <Leaf className="w-3 h-3" />
            <span>{product.sustainability_score}%</span>
          </div>
        </div>
      </div>
      
      <CardHeader className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg truncate cursor-pointer" onClick={() => onProductClick(product.product_id)}>
              {product.name}
            </CardTitle>
            <CardDescription>{product.brand}</CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setShowDetails(!showDetails)}>
                  <Info className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View sustainability details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        <p className="font-semibold">{formatPrice(product.price)}</p>
        
        <div className="flex flex-wrap gap-1 mt-2">
          {product.sustainable_materials?.slice(0, 2).map((material, i) => (
            <Badge key={i} variant="outline" className="bg-emerald-50">{material}</Badge>
          ))}
          {product.certifications?.slice(0, 1).map((cert, i) => (
            <Badge key={i} variant="secondary">{cert}</Badge>
          ))}
        </div>
        
        {showDetails && (
          <div className="p-3 mt-3 border rounded-lg bg-muted/10">
            <h4 className="flex items-center mb-2 text-sm font-medium">
              <Leaf className="w-4 h-4 mr-1 text-emerald-500" />
              Sustainability Details
            </h4>
            
            {product.sustainability_metrics && (
              <div className="space-y-2">
                {product.sustainability_metrics.map((metric, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{metric.label}</span>
                      <span className="text-xs">{metric.score}/100</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getSustainabilityColor(metric.score)}`}
                        style={{ width: `${metric.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {product.certifications && product.certifications.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium">Certifications:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {product.certifications.map((cert, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{cert}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="grid grid-cols-2 gap-2 p-4 pt-0">
        <Button 
          variant="outline" 
          onClick={() => onProductClick(product.product_id)}
          className="flex items-center gap-1"
        >
          <ExternalLink className="w-4 h-4" />
          <span>View</span>
        </Button>
        <Button 
          variant="secondary" 
          onClick={() => onAddToWishlist(product.product_id)}
          disabled={isAddingToWishlist}
          className="flex items-center gap-1"
        >
          {isAddingToWishlist ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Heart className="w-4 h-4" />
          )}
          <span>Wishlist</span>
        </Button>
      </CardFooter>
    </Card>
  );
} 