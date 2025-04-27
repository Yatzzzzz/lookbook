'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart } from 'lucide-react';

interface ProductCardProps {
  product: {
    product_id: string;
    name: string;
    brand?: string;
    category: string;
    image_url?: string;
    price?: number;
    tags?: string[];
  };
  onProductClick?: (productId: string) => void;
  onAddToWishlist?: (productId: string) => void;
  isAddingToWishlist?: boolean;
  showWishlistButton?: boolean;
  reasonText?: string;
}

export function ProductCard({ 
  product, 
  onProductClick, 
  onAddToWishlist,
  isAddingToWishlist = false,
  showWishlistButton = true,
  reasonText
}: ProductCardProps) {
  const router = useRouter();

  const formatPrice = (price?: number) => {
    if (!price) return 'Price not available';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  const handleProductClick = () => {
    if (onProductClick) {
      onProductClick(product.product_id);
    } else {
      router.push(`/marketplace/product/${product.product_id}`);
    }
  };

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToWishlist) {
      onAddToWishlist(product.product_id);
    }
  };

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
        {reasonText && (
          <p className="mt-2 text-sm text-muted-foreground">
            {reasonText}
          </p>
        )}
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