'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface WishlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToWishlist: (data: {
    notes?: string;
    targetPrice?: number;
    notifyPriceDrop: boolean;
  }) => Promise<void>;
  productName: string;
  productPrice?: number;
  isLoading: boolean;
}

export function WishlistModal({
  open,
  onOpenChange,
  onAddToWishlist,
  productName,
  productPrice,
  isLoading
}: WishlistModalProps) {
  const [notes, setNotes] = useState<string>('');
  const [targetPrice, setTargetPrice] = useState<string>(
    productPrice ? (productPrice * 0.9).toFixed(2) : ''
  );
  const [notifyPriceDrop, setNotifyPriceDrop] = useState<boolean>(true);

  const handleSubmit = async () => {
    await onAddToWishlist({
      notes: notes.trim() || undefined,
      targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
      notifyPriceDrop
    });
    
    // Reset form
    setNotes('');
    setTargetPrice(productPrice ? (productPrice * 0.9).toFixed(2) : '');
    setNotifyPriceDrop(true);
  };

  const formatPrice = (price?: number) => {
    if (!price) return '';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add to Wishlist</DialogTitle>
          <DialogDescription>
            Add "{productName}" to your wishlist and set price alerts.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add notes about why you want this product..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          
          {productPrice && (
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="current-price">Current Price</Label>
                <span>{formatPrice(productPrice)}</span>
              </div>
            </div>
          )}
          
          <div className="grid gap-2">
            <Label htmlFor="target-price">Target Price (optional)</Label>
            <Input
              id="target-price"
              type="number"
              step="0.01"
              min="0"
              placeholder="Set a target price..."
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="w-full"
            />
            {productPrice && targetPrice && (
              <div className="text-xs text-muted-foreground">
                {parseFloat(targetPrice) < productPrice
                  ? `${(((productPrice - parseFloat(targetPrice)) / productPrice) * 100).toFixed(0)}% off current price`
                  : 'Target price is higher than current price'}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="notify-price-drop">Notify me about price drops</Label>
            <Switch
              id="notify-price-drop"
              checked={notifyPriceDrop}
              onCheckedChange={setNotifyPriceDrop}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Adding...' : 'Add to Wishlist'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 