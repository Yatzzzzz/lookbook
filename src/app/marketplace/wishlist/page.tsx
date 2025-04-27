'use client';

import { useState, useEffect } from 'react';
import { useWardrobe } from '@/app/context/WardrobeContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function WishlistPage() {
  const router = useRouter();
  const { 
    wishListItems,
    isLoadingWishList,
    wishListError,
    removeFromWishList,
    updateWishListItem,
    trackProductClick,
    getPriceHistory
  } = useWardrobe();

  const [editItem, setEditItem] = useState<any>(null);
  const [notes, setNotes] = useState<string>('');
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [notifyPriceDrop, setNotifyPriceDrop] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState<boolean>(false);
  const [priceHistories, setPriceHistories] = useState<{[key: string]: any[]}>({});
  const [loadingPriceHistory, setLoadingPriceHistory] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (editItem) {
      setNotes(editItem.notes || '');
      setTargetPrice(editItem.target_price ? editItem.target_price.toString() : '');
      setNotifyPriceDrop(editItem.notify_price_drop || false);
    }
  }, [editItem]);

  const loadPriceHistory = async (productId: string) => {
    if (loadingPriceHistory[productId] || priceHistories[productId]) return;
    
    setLoadingPriceHistory(prev => ({ ...prev, [productId]: true }));
    
    try {
      const history = await getPriceHistory(productId);
      setPriceHistories(prev => ({ ...prev, [productId]: history }));
    } catch (error) {
      console.error('Error loading price history:', error);
    } finally {
      setLoadingPriceHistory(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleSaveWishlistItem = async () => {
    if (!editItem) return;
    
    setIsEditing(true);
    
    try {
      await updateWishListItem(editItem.id, {
        notes,
        target_price: targetPrice ? parseFloat(targetPrice) : undefined,
        notify_price_drop: notifyPriceDrop
      });
      
      setEditItem(null);
    } catch (error) {
      console.error('Error updating wishlist item:', error);
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteWishlistItem = async () => {
    if (!removingItemId) return;
    
    setIsDeletingItem(true);
    
    try {
      await removeFromWishList(removingItemId);
      setRemovingItemId(null);
    } catch (error) {
      console.error('Error removing wishlist item:', error);
    } finally {
      setIsDeletingItem(false);
    }
  };

  const handleProductClick = (productId: string) => {
    trackProductClick(productId, 'wishlist');
    router.push(`/marketplace/product/${productId}`);
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

  const getPriceChange = (wishlistItem: any) => {
    if (!wishlistItem.product?.price || !wishlistItem.price_at_addition) {
      return null;
    }
    
    const difference = wishlistItem.product.price - wishlistItem.price_at_addition;
    const percentChange = (difference / wishlistItem.price_at_addition) * 100;
    
    return {
      difference,
      percentChange,
      isPositive: difference > 0
    };
  };

  if (isLoadingWishList) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  }

  if (wishListError) {
    return <div className="p-6 text-center">Error loading wishlist: {wishListError}</div>;
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold">Your Wishlist</h1>
        <p className="text-muted-foreground">Track products you want to purchase</p>
      </div>

      {wishListItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {wishListItems.map((item) => {
            const priceChange = getPriceChange(item);
            return (
              <Card key={item.id} className="overflow-hidden">
                <div className="relative h-48 cursor-pointer" onClick={() => handleProductClick(item.product_id)}>
                  <Image 
                    src={item.product?.image_url || '/images/placeholder-product.jpg'} 
                    alt={item.product?.name || 'Product'}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <CardHeader className="p-4">
                  <div onClick={() => handleProductClick(item.product_id)} className="cursor-pointer">
                    <CardTitle className="text-lg truncate">
                      {item.product?.name || 'Product'}
                    </CardTitle>
                  </div>
                  <CardDescription>{item.product?.brand}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{formatPrice(item.product?.price)}</p>
                    {priceChange && (
                      <Badge variant={priceChange.isPositive ? "destructive" : "secondary"}>
                        {priceChange.isPositive ? "+" : ""}{formatPrice(priceChange.difference)} ({priceChange.percentChange.toFixed(1)}%)
                      </Badge>
                    )}
                  </div>
                  
                  {item.target_price && (
                    <div className="mt-2">
                      <span className="text-sm text-muted-foreground">Target price: </span>
                      <span className="font-medium">{formatPrice(item.target_price)}</span>
                    </div>
                  )}
                  
                  {item.notes && (
                    <div className="p-2 mt-3 text-sm border rounded-md bg-muted/10">
                      <p className="font-medium">Notes:</p>
                      <p>{item.notes}</p>
                    </div>
                  )}
                  
                  <div className="mt-3">
                    <Tabs className="w-full" onValueChange={(value) => {
                      if (value === 'price-history') {
                        loadPriceHistory(item.product_id);
                      }
                    }}>
                      <TabsList className="w-full">
                        <TabsTrigger value="info" className="flex-1">Info</TabsTrigger>
                        <TabsTrigger value="price-history" className="flex-1">Price History</TabsTrigger>
                      </TabsList>
                      <TabsContent value="info" className="py-2">
                        <div className="grid gap-1">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Added on:</span>
                            <span className="text-sm">{formatDate(item.created_at)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Price at addition:</span>
                            <span className="text-sm">{formatPrice(item.price_at_addition)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Price alerts:</span>
                            <span className="text-sm">{item.notify_price_drop ? 'Enabled' : 'Disabled'}</span>
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="price-history">
                        {loadingPriceHistory[item.product_id] ? (
                          <div className="flex justify-center p-4">
                            <LoadingSpinner />
                          </div>
                        ) : priceHistories[item.product_id]?.length ? (
                          <div className="h-32 overflow-y-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr>
                                  <th className="text-left">Date</th>
                                  <th className="text-right">Price</th>
                                </tr>
                              </thead>
                              <tbody>
                                {priceHistories[item.product_id].map((history) => (
                                  <tr key={history.id}>
                                    <td>{formatDate(history.recorded_at)}</td>
                                    <td className="text-right">{formatPrice(history.price)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="py-4 text-sm text-center text-muted-foreground">
                            No price history available
                          </p>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                </CardContent>
                <CardFooter className="grid grid-cols-2 gap-2 p-4 pt-0">
                  <Button
                    variant="outline"
                    onClick={() => setEditItem(item)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setRemovingItemId(item.id)}
                  >
                    Remove
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center border rounded-lg bg-muted/10">
          <h2 className="mb-2 text-xl font-semibold">Your wishlist is empty</h2>
          <p className="mb-6 text-muted-foreground">
            Browse the marketplace to add products to your wishlist.
          </p>
          <Button asChild>
            <Link href="/marketplace">Browse Marketplace</Link>
          </Button>
        </div>
      )}

      {/* Edit Wishlist Item Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open: boolean) => !open && setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Wishlist Item</DialogTitle>
            <DialogDescription>
              Update your preferences for this wishlist item.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
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
            <Button variant="outline" onClick={() => setEditItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveWishlistItem} disabled={isEditing}>
              {isEditing ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={!!removingItemId} onOpenChange={(open: boolean) => !open && setRemovingItemId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from Wishlist</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this item from your wishlist?
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemovingItemId(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteWishlistItem} 
              disabled={isDeletingItem}
            >
              {isDeletingItem ? 'Removing...' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 