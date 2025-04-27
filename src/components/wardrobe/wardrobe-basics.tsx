'use client';

import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { X, Plus, Check } from 'lucide-react';

interface BasicItem {
  id: string;
  name: string;
  category: string;
  description?: string;
  color?: string;
  image?: string;
  material?: string;
}

interface WardrobeBasicsProps {
  isOpen: boolean;
  onClose: () => void;
  onItemSelect: (item: BasicItem) => void;
}

export function WardrobeBasics({ isOpen, onClose, onItemSelect }: WardrobeBasicsProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  
  // Predefined basic wardrobe items by category
  const basicItems: BasicItem[] = [
    // Tops
    {
      id: 'top-1',
      name: 'White T-shirt',
      category: 'top',
      description: 'Classic white crew neck t-shirt',
      color: 'white',
      material: 'cotton',
      image: 'https://via.placeholder.com/150?text=WhiteTee'
    },
    {
      id: 'top-2',
      name: 'Black T-shirt',
      category: 'top',
      description: 'Classic black crew neck t-shirt',
      color: 'black',
      material: 'cotton',
      image: 'https://via.placeholder.com/150?text=BlackTee'
    },
    {
      id: 'top-3',
      name: 'Navy Blue Polo Shirt',
      category: 'top',
      description: 'Classic navy blue polo shirt',
      color: 'navy blue',
      material: 'cotton',
      image: 'https://via.placeholder.com/150?text=NavyPolo'
    },
    {
      id: 'top-4',
      name: 'White Button-Up Shirt',
      category: 'top',
      description: 'Classic white button-up shirt',
      color: 'white',
      material: 'cotton',
      image: 'https://via.placeholder.com/150?text=WhiteShirt'
    },
    
    // Bottoms
    {
      id: 'bottom-1',
      name: 'Blue Jeans',
      category: 'bottom',
      description: 'Classic blue denim jeans',
      color: 'blue',
      material: 'denim',
      image: 'https://via.placeholder.com/150?text=BlueJeans'
    },
    {
      id: 'bottom-2',
      name: 'Black Jeans',
      category: 'bottom',
      description: 'Classic black denim jeans',
      color: 'black',
      material: 'denim',
      image: 'https://via.placeholder.com/150?text=BlackJeans'
    },
    {
      id: 'bottom-3',
      name: 'Khaki Chinos',
      category: 'bottom',
      description: 'Classic khaki chino pants',
      color: 'khaki',
      material: 'cotton',
      image: 'https://via.placeholder.com/150?text=Chinos'
    },
    {
      id: 'bottom-4',
      name: 'Black Dress Pants',
      category: 'bottom',
      description: 'Classic black dress pants',
      color: 'black',
      material: 'polyester, wool',
      image: 'https://via.placeholder.com/150?text=DressPants'
    },
    
    // Outerwear
    {
      id: 'outerwear-1',
      name: 'Denim Jacket',
      category: 'outerwear',
      description: 'Classic blue denim jacket',
      color: 'blue',
      material: 'denim',
      image: 'https://via.placeholder.com/150?text=DenimJacket'
    },
    {
      id: 'outerwear-2',
      name: 'Black Leather Jacket',
      category: 'outerwear',
      description: 'Classic black leather jacket',
      color: 'black',
      material: 'leather',
      image: 'https://via.placeholder.com/150?text=LeatherJacket'
    },
    {
      id: 'outerwear-3',
      name: 'Navy Blazer',
      category: 'outerwear',
      description: 'Classic navy blue blazer',
      color: 'navy blue',
      material: 'wool, polyester',
      image: 'https://via.placeholder.com/150?text=NavyBlazer'
    },
    
    // Dresses
    {
      id: 'dress-1',
      name: 'Little Black Dress',
      category: 'dress',
      description: 'Classic little black dress',
      color: 'black',
      material: 'polyester',
      image: 'https://via.placeholder.com/150?text=BlackDress'
    },
    {
      id: 'dress-2',
      name: 'Floral Summer Dress',
      category: 'dress',
      description: 'Floral pattern summer dress',
      color: 'multicolor',
      material: 'cotton',
      image: 'https://via.placeholder.com/150?text=FloralDress'
    },
    
    // Shoes
    {
      id: 'shoes-1',
      name: 'White Sneakers',
      category: 'shoes',
      description: 'Classic white sneakers',
      color: 'white',
      material: 'leather, rubber',
      image: 'https://via.placeholder.com/150?text=WhiteSneakers'
    },
    {
      id: 'shoes-2',
      name: 'Black Dress Shoes',
      category: 'shoes',
      description: 'Classic black leather dress shoes',
      color: 'black',
      material: 'leather',
      image: 'https://via.placeholder.com/150?text=DressShoes'
    },
    {
      id: 'shoes-3',
      name: 'Brown Boots',
      category: 'shoes',
      description: 'Classic brown leather boots',
      color: 'brown',
      material: 'leather',
      image: 'https://via.placeholder.com/150?text=BrownBoots'
    },
    
    // Accessories
    {
      id: 'accessories-1',
      name: 'Black Belt',
      category: 'accessories',
      description: 'Classic black leather belt',
      color: 'black',
      material: 'leather',
      image: 'https://via.placeholder.com/150?text=BlackBelt'
    },
    {
      id: 'accessories-2',
      name: 'Brown Belt',
      category: 'accessories',
      description: 'Classic brown leather belt',
      color: 'brown',
      material: 'leather',
      image: 'https://via.placeholder.com/150?text=BrownBelt'
    },
    {
      id: 'accessories-3',
      name: 'Watch',
      category: 'accessories',
      description: 'Classic analog watch',
      color: 'silver',
      material: 'stainless steel',
      image: 'https://via.placeholder.com/150?text=Watch'
    }
  ];
  
  // Categories for tab navigation
  const categories = [
    { id: 'all', label: 'All' },
    { id: 'top', label: 'Tops' },
    { id: 'bottom', label: 'Bottoms' },
    { id: 'outerwear', label: 'Outerwear' },
    { id: 'dress', label: 'Dresses' },
    { id: 'shoes', label: 'Shoes' },
    { id: 'accessories', label: 'Accessories' }
  ];
  
  // Filter items by selected category
  const filteredItems = selectedCategory === 'all' 
    ? basicItems 
    : basicItems.filter(item => item.category === selectedCategory);
  
  const handleItemClick = (item: BasicItem) => {
    setSelectedItems(prev => ({
      ...prev,
      [item.id]: !prev[item.id]
    }));
  };
  
  const handleAddToWardrobe = () => {
    const itemsToAdd = basicItems.filter(item => selectedItems[item.id]);
    
    if (itemsToAdd.length === 0) {
      return;
    }
    
    // If only one item is selected, add it directly
    if (itemsToAdd.length === 1) {
      onItemSelect(itemsToAdd[0]);
      onClose();
      return;
    }
    
    // If multiple items are selected, add them one by one
    itemsToAdd.forEach(item => {
      onItemSelect(item);
    });
    
    onClose();
  };
  
  const selectedCount = Object.values(selectedItems).filter(Boolean).length;
  
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-overlayShow" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[800px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white dark:bg-gray-900 p-6 shadow-lg focus:outline-none data-[state=open]:animate-contentShow overflow-auto">
          <Dialog.Title className="m-0 font-medium text-lg mb-4">
            Wardrobe Basics
          </Dialog.Title>
          <Dialog.Description className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Quickly add common wardrobe essentials to your collection.
          </Dialog.Description>
          
          <Tabs.Root value={selectedCategory} onValueChange={setSelectedCategory}>
            <Tabs.List className="flex space-x-1 border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto pb-1">
              {categories.map(category => (
                <Tabs.Trigger
                  key={category.id}
                  value={category.id}
                  className="px-4 py-2 rounded-t-md text-sm font-medium bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 focus:outline-none"
                >
                  {category.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`rounded-md border ${
                    selectedItems[item.id]
                      ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/50 dark:ring-blue-400/50'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  } overflow-hidden transition-all cursor-pointer relative group`}
                >
                  <div className="aspect-square relative">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-500 dark:text-gray-400 text-sm">No image</span>
                      </div>
                    )}
                    
                    {selectedItems[item.id] && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                        <Check size={14} />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black/40 group-hover:opacity-100 opacity-0 transition-opacity flex items-center justify-center">
                      <button className="bg-white dark:bg-gray-800 rounded-full p-1">
                        <Plus size={20} className="text-blue-500 dark:text-blue-400" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <h3 className="font-medium text-sm">{item.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {item.color && `${item.color}, `}{item.material}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Tabs.Root>
          
          <div className="mt-6 flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleAddToWardrobe}
              disabled={selectedCount === 0}
              className={`px-4 py-2 rounded transition-colors ${
                selectedCount === 0
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Add to Wardrobe
            </button>
          </div>
          
          <Dialog.Close asChild>
            <button
              className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 