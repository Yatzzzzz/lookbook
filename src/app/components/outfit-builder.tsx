'use client';

import { useState, useEffect } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import { WardrobeItem, Outfit, OutfitItem } from '../context/WardrobeContext';
import { Loader2, Save, Trash2, X, PlusCircle } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Label from '@radix-ui/react-label';

interface OutfitBuilderProps {
  outfitId?: string; // If provided, edit existing outfit
  onSave?: (outfitId: string) => void;
  onCancel?: () => void;
}

export function OutfitBuilder({ outfitId, onSave, onCancel }: OutfitBuilderProps) {
  const {
    wardrobeItems,
    outfits,
    addOutfit,
    updateOutfit,
    getOutfit,
    getOutfitItems,
    addItemToOutfit,
    removeItemFromOutfit,
    isLoading,
    isLoadingOutfits,
  } = useWardrobe();

  // Outfit metadata
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [season, setSeason] = useState<string[]>([]);
  const [occasion, setOccasion] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Selected items
  const [selectedItems, setSelectedItems] = useState<WardrobeItem[]>([]);
  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  // Modal for adding items
  const [isAddItemsModalOpen, setIsAddItemsModalOpen] = useState(false);

  // Load outfit data if editing an existing outfit
  useEffect(() => {
    if (outfitId) {
      // Get the outfit metadata
      const outfit = getOutfit(outfitId);
      if (outfit) {
        setName(outfit.name);
        setDescription(outfit.description || '');
        setVisibility(outfit.visibility || 'private');
        setSeason(outfit.season || []);
        setOccasion(outfit.occasion || []);
      }

      // Get the outfit items
      const loadOutfitItems = async () => {
        try {
          const items = await getOutfitItems(outfitId);
          setSelectedItems(items);
        } catch (err) {
          console.error('Error loading outfit items:', err);
          setError('Failed to load outfit items');
        }
      };

      loadOutfitItems();
    }
  }, [outfitId, getOutfit, getOutfitItems]);

  // Helper function to handle array field changes
  const handleArrayFieldChange = (
    field: 'season' | 'occasion',
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter(prev => {
      if (prev.includes(value)) {
        return prev.filter(item => item !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  // Add an item to the outfit
  const handleAddItem = (item: WardrobeItem) => {
    setSelectedItems(prev => {
      // Check if item is already in the outfit
      if (prev.some(i => i.item_id === item.item_id)) {
        return prev;
      }
      return [...prev, item];
    });
  };

  // Remove an item from the outfit
  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.item_id !== itemId));
  };

  // Save the outfit
  const handleSave = async () => {
    try {
      setError(null);
      setIsSaving(true);

      if (!name) {
        setError('Please provide a name for the outfit');
        setIsSaving(false);
        return;
      }

      // Create or update the outfit
      let savedOutfitId = outfitId;
      if (outfitId) {
        // Update existing outfit
        await updateOutfit(outfitId, {
          name,
          description,
          visibility,
          season,
          occasion,
        });
      } else {
        // Create new outfit
        savedOutfitId = await addOutfit({
          name,
          description,
          visibility,
          season,
          occasion,
        });
      }

      if (!savedOutfitId) {
        throw new Error('Failed to create outfit');
      }

      // Get the current items in the outfit (if editing)
      let currentItems: WardrobeItem[] = [];
      if (outfitId) {
        currentItems = await getOutfitItems(outfitId);
      }

      // Add new items
      for (const item of selectedItems) {
        if (!currentItems.some(i => i.item_id === item.item_id)) {
          await addItemToOutfit(savedOutfitId, item.item_id);
        }
      }

      // Remove deleted items
      for (const item of currentItems) {
        if (!selectedItems.some(i => i.item_id === item.item_id)) {
          await removeItemFromOutfit(savedOutfitId, item.item_id);
        }
      }

      // Call the onSave callback if provided
      if (onSave) {
        onSave(savedOutfitId);
      }
    } catch (err: any) {
      console.error('Error saving outfit:', err);
      setError(err.message || 'Failed to save outfit');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  // Filter wardrobe items by category
  const filteredItems = categoryFilter
    ? wardrobeItems.filter(item => item.category === categoryFilter)
    : wardrobeItems;

  if (isLoading || isLoadingOutfits) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const categories = [
    { name: 'All Items', key: null },
    { name: 'Tops', key: 'top' },
    { name: 'Bottoms', key: 'bottom' },
    { name: 'Dresses', key: 'dress' },
    { name: 'Shoes', key: 'shoes' },
    { name: 'Accessories', key: 'accessories' },
    { name: 'Outerwear', key: 'outerwear' },
    { name: 'Bags', key: 'bags' },
    { name: 'Other', key: 'other' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4">
          {outfitId ? 'Edit Outfit' : 'Create New Outfit'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label.Root
              htmlFor="name"
              className="text-sm font-medium text-gray-700"
            >
              Outfit Name*
            </Label.Root>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label.Root
              htmlFor="description"
              className="text-sm font-medium text-gray-700"
            >
              Description
            </Label.Root>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label.Root
              htmlFor="visibility"
              className="text-sm font-medium text-gray-700"
            >
              Visibility
            </Label.Root>
            <select
              id="visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label.Root
              htmlFor="season"
              className="text-sm font-medium text-gray-700"
            >
              Season
            </Label.Root>
            <div className="flex flex-wrap gap-2">
              {['spring', 'summer', 'fall', 'winter'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleArrayFieldChange('season', s, setSeason)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    season.includes(s)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label.Root
              htmlFor="occasion"
              className="text-sm font-medium text-gray-700"
            >
              Occasion
            </Label.Root>
            <div className="flex flex-wrap gap-2">
              {['casual', 'formal', 'work', 'party', 'sport', 'travel'].map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => handleArrayFieldChange('occasion', o, setOccasion)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    occasion.includes(o)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {o.charAt(0).toUpperCase() + o.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Items in this Outfit</h3>
          <button
            onClick={() => setIsAddItemsModalOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Items
          </button>
        </div>

        {selectedItems.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-md">
            <p className="text-gray-500">No items added yet. Add items to create your outfit.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {selectedItems.map((item) => (
              <div key={item.item_id} className="bg-white border rounded-md overflow-hidden shadow-sm relative">
                {item.image_path ? (
                  <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden">
                    <img
                      src={item.image_path}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-w-1 aspect-h-1 w-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">No image</span>
                  </div>
                )}
                <div className="p-2">
                  <h4 className="font-medium text-sm truncate">{item.name}</h4>
                  <p className="text-xs text-gray-500 truncate">{item.category}</p>
                </div>
                <button
                  onClick={() => handleRemoveItem(item.item_id)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-4 pt-2">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {outfitId ? 'Update Outfit' : 'Save Outfit'}
        </button>
      </div>

      {/* Add Items Modal */}
      <Dialog.Root
        open={isAddItemsModalOpen}
        onOpenChange={(open) => setIsAddItemsModalOpen(open)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-gray-100/80 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-white rounded-lg shadow-xl z-50 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                Add Items to Outfit
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </Dialog.Close>
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map((category) => (
                <button
                  key={category.key || 'all'}
                  onClick={() => setCategoryFilter(category.key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                    ${categoryFilter === category.key 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                  {category.name} 
                  {category.key !== null && (
                    <span className="ml-1 text-xs">
                      ({wardrobeItems.filter(item => item.category === category.key).length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Items grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-2">
              {filteredItems.map((item) => (
                <div
                  key={item.item_id}
                  className={`bg-white border rounded-md overflow-hidden shadow-sm cursor-pointer transition-transform hover:scale-105 ${
                    selectedItems.some(i => i.item_id === item.item_id)
                      ? 'ring-2 ring-blue-500'
                      : ''
                  }`}
                  onClick={() => handleAddItem(item)}
                >
                  {item.image_path ? (
                    <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden">
                      <img
                        src={item.image_path}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-w-1 aspect-h-1 w-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">No image</span>
                    </div>
                  )}
                  <div className="p-2">
                    <h4 className="font-medium text-sm truncate">{item.name}</h4>
                    <p className="text-xs text-gray-500 truncate">{item.category}</p>
                    {selectedItems.some(i => i.item_id === item.item_id) && (
                      <p className="text-xs text-blue-500 mt-1">Added to outfit</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Done
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
} 