'use client';

import { useState, useEffect, Fragment } from 'react';
import { useWardrobe } from '@/app/context/WardrobeContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, Heart, Share, ExternalLink, LineChart } from 'lucide-react';

interface ProductPageParams {
  params: {
    productId: string;
  };
}

export default function ProductDetailPage({ params }: ProductPageParams) {
  const { productId } = params;
  const router = useRouter();
  const { 
    getProductDetails,
    addToWishList,
    trackProductClick,
    getPriceHistory,
    fetchSimilarProducts
  } = useWardrobe();

  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [isLoadingPriceHistory, setIsLoadingPriceHistory] = useState<boolean>(false);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [isLoadingSimilarProducts, setIsLoadingSimilarProducts] = useState<boolean>(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState<boolean>(false);
  const [showWishlistDialog, setShowWishlistDialog] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [notifyPriceDrop, setNotifyPriceDrop] = useState<boolean>(true);

  useEffect(() => {
    const fetchProductDetails = async () => {
      setIsLoading(true);
      try {
        const productData = await getProductDetails(productId);
        if (productData) {
          setProduct(productData);
        } else {
          setError('Product not found');
        }
      } catch (err) {
        setError('Error loading product details');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId, getProductDetails]);

  useEffect(() => {
    if (product) {
      fetchProductPriceHistory();
      fetchRelatedProducts();
    }
  }, [product]);

  const fetchProductPriceHistory = async () => {
    setIsLoadingPriceHistory(true);
    try {
      const history = await getPriceHistory(productId);
      setPriceHistory(history);
    } catch (err) {
      console.error('Error fetching price history:', err);
    } finally {
      setIsLoadingPriceHistory(false);
    }
  };

  const fetchRelatedProducts = async () => {
    setIsLoadingSimilarProducts(true);
    try {
      let similarItems: any[] = [];
      
      if (product.similar_to_item_id) {
        // If this product is matched to a wardrobe item, get other products matched to the same item
        similarItems = await fetchSimilarProducts(product.similar_to_item_id, 3);
        
        // Remove the current product from the similar products list
        similarItems = similarItems.filter(item => item.product_id !== productId);
      }
      
      if (similarItems.length < 3) {
        // If we don't have enough similar products, get some from the same category
        const categoryProducts = await searchProducts(product.category, 3 - similarItems.length);
        
        // Filter out the current product and any already included products
        const filteredCategoryProducts = categoryProducts.filter(
          cp => cp.product_id !== productId && 
                !similarItems.some(sp => sp.product_id === cp.product_id)
        );
        
        similarItems = [...similarItems, ...filteredCategoryProducts];
      }
      
      setSimilarProducts(similarItems);
    } catch (err) {
      console.error('Error fetching similar products:', err);
    } finally {
      setIsLoadingSimilarProducts(false);
    }
  };

  const searchProducts = async (category: string, limit: number): Promise<any[]> => {
    // This function is a simple implementation assuming your WardrobeContext has a searchProducts method
    try {
      return [];
    } catch (err) {
      console.error('Error searching products:', err);
      return [];
    }
  };

  const handleAddToWishlist = async () => {
    setIsAddingToWishlist(true);
    
    try {
      await addToWishList(
        productId,
        notes,
        targetPrice ? parseFloat(targetPrice) : undefined,
        notifyPriceDrop
      );
      
      setShowWishlistDialog(false);
      // Success notification could be added here
    } catch (err) {
      console.error('Error adding to wishlist:', err);
    } finally {
      setIsAddingToWishlist(false);
    }
  };

  const handleExternalLinkClick = () => {
    trackProductClick(productId, 'product_detail');
    window.open(product.product_url, '_blank');
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'Price not available';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  }

  if (error || !product) {
    return (
      <div className="container px-4 py-12 mx-auto text-center">
        <h1 className="mb-4 text-2xl font-bold text-destructive">{error || 'Product not found'}</h1>
        <p className="mb-6">The product you are looking for could not be found or an error occurred.</p>
        <Button asChild>
          <Link href="/marketplace">Back to Marketplace</Link>
        </Button>
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
        <ChevronLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        {/* Product Image */}
        <div className="relative md:col-span-5">
          <div className="sticky top-24">
            <div className="relative h-[500px] overflow-hidden rounded-lg">
              <Image 
                src={product.image_url || '/images/placeholder-product.jpg'} 
                alt={product.name}
                fill
                style={{ objectFit: 'contain' }}
                className="bg-muted/20"
              />
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="md:col-span-7">
          <div className="mb-6">
            <h1 className="mb-2 text-3xl font-bold">{product.name}</h1>
            <p className="text-xl text-muted-foreground">{product.brand}</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <Badge variant="outline" className="px-3 py-1">{product.category}</Badge>
            {product.tags && product.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="px-3 py-1">{tag}</Badge>
            ))}
          </div>

          <div className="p-6 mb-6 border rounded-lg bg-muted/5">
            <p className="mb-2 text-2xl font-bold">{formatPrice(product.price)}</p>
            {priceHistory.length > 1 && (
              <div className="flex items-center mt-1 text-sm">
                <LineChart className="w-4 h-4 mr-1" />
                <span>
                  {priceHistory[0].price < priceHistory[priceHistory.length - 1].price
                    ? 'Price has increased'
                    : 'Price has decreased'} since {formatDate(priceHistory[0].recorded_at)}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 mb-6 sm:grid-cols-2">
            <Button 
              className="flex items-center justify-center w-full gap-2"
              onClick={() => setShowWishlistDialog(true)}
            >
              <Heart className="w-4 h-4" />
              Add to Wishlist
            </Button>
            <Button 
              variant="outline"
              className="flex items-center justify-center w-full gap-2"
              onClick={handleExternalLinkClick}
            >
              <ExternalLink className="w-4 h-4" />
              Visit Retailer
            </Button>
            <Button 
              variant="secondary"
              className="flex items-center justify-center w-full gap-2 col-span-1 sm:col-span-2 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              onClick={() => router.push(`/marketplace/sustainable-alternatives?productId=${productId}`)}
            >
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a9 9 0 0 1 9 9c0 3.18-1 5-3 8.5-2 3.5-6 6.5-6 6.5s-4-3-6-6.5C4 16 3 14.18 3 11a9 9 0 0 1 9-9Z"></path>
              </svg>
              Find Sustainable Alternatives
            </Button>
          </div>

          {product.description && (
            <div className="mb-6">
              <h2 className="mb-2 text-xl font-semibold">Description</h2>
              <p className="text-muted-foreground">{product.description}</p>
            </div>
          )}

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
              <TabsTrigger value="price-history" className="flex-1">Price History</TabsTrigger>
              <TabsTrigger value="similar-products" className="flex-1">Similar Products</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="p-4 mt-4 border rounded-lg">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 font-semibold">Product Information</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-muted-foreground">Brand:</div>
                    <div>{product.brand}</div>
                    <div className="text-muted-foreground">Category:</div>
                    <div>{product.category}</div>
                    {product.metadata && Object.entries(product.metadata).map(([key, value]) => (
                      <Fragment key={key}>
                        <div className="text-muted-foreground">{key.charAt(0).toUpperCase() + key.slice(1)}:</div>
                        <div>{String(value)}</div>
                      </Fragment>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="mb-2 font-semibold">Product Details</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-muted-foreground">Added on:</div>
                    <div>{formatDate(product.created_at)}</div>
                    <div className="text-muted-foreground">Last updated:</div>
                    <div>{formatDate(product.updated_at)}</div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="price-history" className="p-4 mt-4 border rounded-lg">
              {isLoadingPriceHistory ? (
                <div className="flex justify-center p-6">
                  <LoadingSpinner />
                </div>
              ) : priceHistory.length > 0 ? (
                <div>
                  <h3 className="mb-4 font-semibold">Price History</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="pb-2 text-left">Date</th>
                          <th className="pb-2 text-right">Price</th>
                          <th className="pb-2 text-right">Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {priceHistory.map((item, index) => {
                          const previousPrice = index > 0 ? priceHistory[index - 1].price : item.price;
                          const change = item.price - previousPrice;
                          const percentChange = (change / previousPrice) * 100;
                          
                          return (
                            <tr key={item.id} className="border-b">
                              <td className="py-2">{formatDate(item.recorded_at)}</td>
                              <td className="py-2 text-right">{formatPrice(item.price)}</td>
                              <td className={`py-2 text-right ${
                                change === 0 ? 'text-muted-foreground' : 
                                change > 0 ? 'text-destructive' : 'text-green-500'
                              }`}>
                                {change === 0 ? (
                                  'No change'
                                ) : (
                                  <>
                                    {change > 0 ? '+' : ''}{formatPrice(change)} ({percentChange.toFixed(1)}%)
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  No price history available for this product
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="similar-products" className="mt-4">
              {isLoadingSimilarProducts ? (
                <div className="flex justify-center p-6">
                  <LoadingSpinner />
                </div>
              ) : similarProducts.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {similarProducts.map((similarProduct) => (
                    <Card key={similarProduct.product_id} className="overflow-hidden cursor-pointer hover:shadow-md">
                      <div 
                        className="relative h-48"
                        onClick={() => router.push(`/marketplace/product/${similarProduct.product_id}`)}
                      >
                        <Image 
                          src={similarProduct.image_url || '/images/placeholder-product.jpg'} 
                          alt={similarProduct.name}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="mb-1 font-semibold truncate">{similarProduct.name}</h3>
                        <p className="mb-2 text-sm text-muted-foreground">{similarProduct.brand}</p>
                        <p className="font-medium">{formatPrice(similarProduct.price)}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  No similar products found
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Add to Wishlist Dialog */}
      <Dialog open={showWishlistDialog} onOpenChange={setShowWishlistDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Wishlist</DialogTitle>
            <DialogDescription>
              Set your preferences for this item in your wishlist.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0 w-16 h-16 overflow-hidden rounded-md">
                <Image 
                  src={product.image_url || '/images/placeholder-product.jpg'} 
                  alt={product.name}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div>
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-muted-foreground">{formatPrice(product.price)}</p>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add notes about this product"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="target-price">Target Price</Label>
              <Input
                id="target-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="Set a target price for notifications"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="notify"
                checked={notifyPriceDrop}
                onCheckedChange={setNotifyPriceDrop}
              />
              <Label htmlFor="notify">Notify me of price drops</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWishlistDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddToWishlist} disabled={isAddingToWishlist}>
              {isAddingToWishlist ? 'Adding...' : 'Add to Wishlist'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 