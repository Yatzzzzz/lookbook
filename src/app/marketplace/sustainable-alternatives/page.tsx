'use client';

import { useState, useEffect } from 'react';
import { useWardrobe } from '@/app/context/WardrobeContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import SustainableAlternativeCard from '@/components/marketplace/SustainableAlternativeCard';
import { ArrowLeft, Filter, Leaf, AlertTriangle } from 'lucide-react';

export default function SustainableAlternativesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId'); // The ID of the product to find alternatives for
  
  const { 
    getProductDetails,
    getSustainableAlternatives,
    trackProductClick,
    addToWishList
  } = useWardrobe();

  const [originalProduct, setOriginalProduct] = useState<any | null>(null);
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToWishlist, setAddingToWishlist] = useState<{[key: string]: boolean}>({});
  const [activeTab, setActiveTab] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('sustainability');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (productId) {
          // Fetch original product details
          const product = await getProductDetails(productId);
          setOriginalProduct(product);
          
          // Fetch sustainable alternatives
          const sustainableAlts = await getSustainableAlternatives(productId);
          setAlternatives(sustainableAlts);
        } else {
          // If no product ID is provided, fetch curated sustainable products
          const sustainableProducts = await getSustainableAlternatives();
          setAlternatives(sustainableProducts);
        }
      } catch (err) {
        console.error('Error fetching sustainable alternatives:', err);
        setError('Failed to load sustainable alternatives. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [productId, getProductDetails, getSustainableAlternatives]);

  const handleProductClick = (productId: string) => {
    trackProductClick(productId, 'sustainable_alternatives');
    router.push(`/marketplace/product/${productId}`);
  };

  const handleAddToWishlist = async (productId: string) => {
    setAddingToWishlist(prev => ({ ...prev, [productId]: true }));
    
    try {
      await addToWishList(productId);
      // Success notification could be added here
    } catch (err) {
      console.error('Error adding to wishlist:', err);
    } finally {
      setAddingToWishlist(prev => ({ ...prev, [productId]: false }));
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'Price not available';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  const filteredAlternatives = alternatives.filter(alt => {
    switch (activeTab) {
      case 'high-score':
        return alt.sustainability_score >= 80;
      case 'certified':
        return alt.certifications && alt.certifications.length > 0;
      case 'affordable':
        return originalProduct ? alt.price <= originalProduct.price : true;
      case 'premium':
        return originalProduct ? alt.price > originalProduct.price : false;
      default:
        return true;
    }
  });

  const sortedAlternatives = [...filteredAlternatives].sort((a, b) => {
    switch (sortBy) {
      case 'sustainability':
        return b.sustainability_score - a.sustainability_score;
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="p-6 text-center border rounded-lg bg-destructive/10">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h2 className="mb-2 text-xl font-bold">{error}</h2>
          <Button asChild className="mt-4">
            <Link href="/marketplace">Back to Marketplace</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <Button 
        variant="ghost" 
        className="mb-6"
        onClick={() => router.back()}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="mb-8 space-y-2">
        <div className="flex items-center">
          <Leaf className="w-6 h-6 mr-2 text-emerald-500" />
          <h1 className="text-3xl font-bold">Sustainable Alternatives</h1>
        </div>
        <p className="text-muted-foreground">
          {originalProduct 
            ? `Eco-friendly alternatives to ${originalProduct.name}`
            : 'Discover sustainable and eco-friendly fashion products'}
        </p>
      </div>

      {originalProduct && (
        <Card className="p-4 mb-8">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-shrink-0 w-24 h-24 overflow-hidden rounded-md">
              <Image 
                src={originalProduct.image_url || '/images/placeholder-product.jpg'} 
                alt={originalProduct.name}
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Original Product</h2>
              <p className="font-medium">{originalProduct.name}</p>
              <p className="text-muted-foreground">{originalProduct.brand}</p>
              <p className="mt-1">{formatPrice(originalProduct.price)}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-col justify-between gap-4 mb-6 md:flex-row md:items-center">
        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="high-score">Highly Sustainable</TabsTrigger>
            <TabsTrigger value="certified">Certified</TabsTrigger>
            <TabsTrigger value="affordable">Affordable</TabsTrigger>
            <TabsTrigger value="premium">Premium</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center w-full gap-2 md:w-auto">
          <Filter className="w-4 h-4" />
          <span className="text-sm">Sort by:</span>
          <Select defaultValue="sustainability" onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sustainability">Sustainability</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {sortedAlternatives.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sortedAlternatives.map((alternative) => (
            <SustainableAlternativeCard
              key={alternative.product_id}
              product={alternative}
              onProductClick={handleProductClick}
              onAddToWishlist={handleAddToWishlist}
              isAddingToWishlist={!!addingToWishlist[alternative.product_id]}
              originalProductId={productId || undefined}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center border rounded-lg bg-muted/10">
          <Leaf className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-bold">No sustainable alternatives found</h2>
          <p className="text-muted-foreground">
            {originalProduct
              ? "We couldn't find sustainable alternatives for this product at the moment."
              : "No sustainable products are available at the moment."}
          </p>
          <Button asChild className="mt-6">
            <Link href="/marketplace">Browse Marketplace</Link>
          </Button>
        </div>
      )}
    </div>
  );
} 