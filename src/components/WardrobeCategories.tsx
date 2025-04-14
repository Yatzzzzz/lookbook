'use client';

import { useState } from 'react';
import { useWardrobe } from '@/app/context/WardrobeContext';
import { Trash2, Edit } from 'lucide-react';

export default function WardrobeCategories() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { wardrobeItems, removeItem } = useWardrobe();

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

  // Filter items by selected category
  const filteredItems = selectedCategory
    ? wardrobeItems.filter(item => item.category === selectedCategory)
    : wardrobeItems;

  const handleEdit = (itemId: string) => {
    // This will be implemented by the parent component
    const event = new CustomEvent('editWardrobeItem', { detail: { itemId } });
    window.dispatchEvent(event);
  };
  
  const handleDelete = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await removeItem(itemId);
      } catch (err) {
        console.error('Error deleting item:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.key || 'all'}
            onClick={() => setSelectedCategory(category.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${selectedCategory === category.key 
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
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No items found</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {selectedCategory 
              ? `You don't have any ${categories.find(c => c.key === selectedCategory)?.name.toLowerCase() || ''} in your wardrobe yet.` 
              : "Your wardrobe is empty. Add some items to get started!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div key={item.item_id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              {item.image_path ? (
                <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden">
                  <img 
                    src={item.image_path} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-w-1 aspect-h-1 w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-500 dark:text-gray-400">No image</span>
                </div>
              )}
              
              <div className="p-4">
                <h3 className="font-medium text-gray-900 dark:text-white">{item.name}</h3>
                
                <div className="mt-1 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {categories.find(c => c.key === item.category)?.name || item.category}
                  </span>
                  
                  {item.color && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                      {item.color}
                    </span>
                  )}
                  
                  {item.brand && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                      {item.brand}
                    </span>
                  )}
                </div>
                
                {item.description && (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {item.description}
                  </p>
                )}
                
                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => handleEdit(item.item_id)}
                    className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                    aria-label="Edit item"
                  >
                    <Edit size={18} />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(item.item_id)}
                    className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                    aria-label="Delete item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 