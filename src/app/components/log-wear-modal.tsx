'use client';

import { useState, useEffect } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import * as Dialog from '@radix-ui/react-dialog';
import * as Label from '@radix-ui/react-label';
import { X, Calendar, CloudSun, Thermometer, Tag, MessageSquare } from 'lucide-react';

type LogWearModalProps = {
  isOpen: boolean;
  onClose: () => void;
  itemId?: string;
  outfitId?: string;
  onSuccess?: () => void;
};

export function LogWearModal({
  isOpen,
  onClose,
  itemId,
  outfitId,
  onSuccess
}: LogWearModalProps) {
  const { logItemAsWorn, logOutfitAsWorn, wardrobeItems, outfits } = useWardrobe();
  
  const [wornDate, setWornDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [weather, setWeather] = useState<string>('');
  const [temperature, setTemperature] = useState<string>('');
  const [occasion, setOccasion] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemOrOutfit, setItemOrOutfit] = useState<{name: string, type: 'item' | 'outfit'} | null>(null);

  // Load item/outfit details
  useEffect(() => {
    if (itemId) {
      const item = wardrobeItems.find(item => item.item_id === itemId);
      if (item) {
        setItemOrOutfit({ name: item.name, type: 'item' });
      }
    } else if (outfitId) {
      const outfit = outfits.find(outfit => outfit.outfit_id === outfitId);
      if (outfit) {
        setItemOrOutfit({ name: outfit.name, type: 'outfit' });
      }
    }
  }, [itemId, outfitId, wardrobeItems, outfits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!wornDate) {
      setError('Please select a date');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const dateObj = new Date(wornDate);
      
      // Log to either item or outfit
      if (itemId) {
        await logItemAsWorn(itemId, dateObj);
      } else if (outfitId) {
        await logOutfitAsWorn(outfitId, dateObj);
      }
      
      // TODO: Implement detailed wear log API with metadata in a future iteration
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while logging wear');
      console.error('Error logging wear:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white dark:bg-gray-900 p-6 shadow-lg focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <Dialog.Title className="text-lg font-semibold">
            {itemOrOutfit ? `Log Wear: ${itemOrOutfit.name}` : 'Log Wear'}
          </Dialog.Title>
          
          <Dialog.Description className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Record when you wore this {itemOrOutfit?.type || 'item'} and add details for better insights.
          </Dialog.Description>
          
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label.Root
                htmlFor="wornDate"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Date Worn
              </Label.Root>
              <input
                id="wornDate"
                type="date"
                value={wornDate}
                onChange={(e) => setWornDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label.Root
                htmlFor="occasion"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center"
              >
                <Tag className="h-4 w-4 mr-2" />
                Occasion
              </Label.Root>
              <select
                id="occasion"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select an occasion</option>
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
                <option value="work">Work</option>
                <option value="party">Party</option>
                <option value="sport">Sport</option>
                <option value="travel">Travel</option>
                <option value="date">Date</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label.Root
                htmlFor="weather"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center"
              >
                <CloudSun className="h-4 w-4 mr-2" />
                Weather Conditions
              </Label.Root>
              <select
                id="weather"
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select weather conditions</option>
                <option value="sunny">Sunny</option>
                <option value="cloudy">Cloudy</option>
                <option value="rainy">Rainy</option>
                <option value="snowy">Snowy</option>
                <option value="windy">Windy</option>
                <option value="hot">Hot</option>
                <option value="cold">Cold</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label.Root
                htmlFor="temperature"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center"
              >
                <Thermometer className="h-4 w-4 mr-2" />
                Temperature (°C)
              </Label.Root>
              <input
                id="temperature"
                type="number"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            <div className="space-y-2">
              <Label.Root
                htmlFor="notes"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Notes
              </Label.Root>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did it feel? Would you wear it again?"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 min-h-[80px]"
              />
            </div>
            
            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Saving...
                  </>
                ) : (
                  'Log Wear'
                )}
              </button>
            </div>
          </form>
          
          <Dialog.Close className="absolute top-4 right-4 opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 