'use client';

import * as Dialog from '@radix-ui/react-dialog';
import * as Label from '@radix-ui/react-label';
import { X, Upload, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { useWardrobe } from '../context/WardrobeContext';

interface AddWardrobeItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Maximum file size: 10MB instead of 5MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function AddWardrobeItemModal({
  isOpen,
  onClose,
}: AddWardrobeItemModalProps) {
  const {
    addItem,
    uploadImage,
    isLoading,
    wardrobeItems,
    setWardrobeItems = (items) => {} // Add fallback in case it's not in context
  } = useWardrobe();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [style, setStyle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > MAX_FILE_SIZE) {
      setError('Image size should be less than 10MB');
      return;
    }

    setImageFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const resetForm = () => {
    setName('');
    setCategory('');
    setColor('');
    setBrand('');
    setStyle('');
    setDescription('');
    setImageFile(null);
    setImagePreview(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setIsUploading(true);

      // Upload image if selected
      let imagePath = '';
      if (imageFile) {
        imagePath = await uploadImage(imageFile);
      }

      // Prepare the item data
      const itemData = {
        name,
        category,
        color,
        brand,
        style,
        description,
        image_path: imagePath || undefined,
        metadata: {
          source: 'manual_entry'
        }
      };

      // First try the new server API endpoint
      try {
        const response = await fetch('/api/wardrobe/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(itemData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to add item via API');
        }

        const newItem = await response.json();
        // Update local state with the new item
        setWardrobeItems(prev => [...prev, newItem]);
      } catch (apiError) {
        console.error('API error, falling back to client method:', apiError);
        // Fallback to the client-side method
        await addItem(itemData);
      }

      resetForm();
      onClose();
    } catch (err: any) {
      if (err.message?.includes('logged in')) {
        setError('You must be logged in to add wardrobe items');
      } else {
        setError(err.message || 'Failed to add item');
      }
      console.error('Error adding item:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetForm();
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-gray-100/80 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-xl z-50 p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-xl font-semibold text-gray-900">
              Add New Item
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close"
                disabled={isLoading || isUploading}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </Dialog.Close>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label.Root
                htmlFor="image"
                className="text-sm font-medium text-gray-700"
              >
                Image
              </Label.Root>
              <input
                ref={fileInputRef}
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <div
                onClick={triggerFileInput}
                className="cursor-pointer border-2 border-dashed border-gray-300 rounded-md p-4 flex flex-col items-center justify-center text-center"
              >
                {imagePreview ? (
                  <div className="relative w-full">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-48 object-contain mx-auto rounded-md"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      Click to upload an image
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Max size: 10MB
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Basic Fields */}
            <div className="space-y-2">
              <Label.Root
                htmlFor="name"
                className="text-sm font-medium text-gray-700"
              >
                Item Name*
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
                htmlFor="category"
                className="text-sm font-medium text-gray-700"
              >
                Category*
              </Label.Root>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a category</option>
                <option value="top">Tops</option>
                <option value="bottom">Bottoms</option>
                <option value="dress">Dresses</option>
                <option value="outerwear">Outerwear</option>
                <option value="shoes">Shoes</option>
                <option value="accessories">Accessories</option>
                <option value="bags">Bags</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Additional Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label.Root
                  htmlFor="color"
                  className="text-sm font-medium text-gray-700"
                >
                  Color
                </Label.Root>
                <input
                  id="color"
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label.Root
                  htmlFor="brand"
                  className="text-sm font-medium text-gray-700"
                >
                  Brand
                </Label.Root>
                <input
                  id="brand"
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label.Root
                htmlFor="style"
                className="text-sm font-medium text-gray-700"
              >
                Style
              </Label.Root>
              <input
                id="style"
                type="text"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                disabled={isLoading || isUploading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || isUploading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center"
              >
                {(isLoading || isUploading) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Add Item
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 