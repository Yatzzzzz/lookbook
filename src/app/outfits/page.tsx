'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWardrobe } from '../context/WardrobeContext';
import { OutfitBuilder } from '../components/outfit-builder';
import { Loader2, Plus } from 'lucide-react';
import { OutfitActions } from '../components/outfit-actions';

export default function OutfitsPage() {
  const router = useRouter();
  const { outfits, removeOutfit, isLoadingOutfits } = useWardrobe();
  const [isCreating, setIsCreating] = useState(false);
  const [editingOutfitId, setEditingOutfitId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateOutfit = () => {
    setIsCreating(true);
    setEditingOutfitId(null);
  };

  const handleEditOutfit = (outfitId: string) => {
    setIsCreating(false);
    setEditingOutfitId(outfitId);
  };

  const handleSaveComplete = (outfitId: string) => {
    setIsCreating(false);
    setEditingOutfitId(null);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingOutfitId(null);
  };

  const handleDeleteOutfit = async (outfitId: string) => {
    if (window.confirm('Are you sure you want to delete this outfit?')) {
      try {
        setIsDeleting(true);
        await removeOutfit(outfitId);
      } catch (err: any) {
        console.error('Error deleting outfit:', err);
        setError(err.message || 'Failed to delete outfit');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">My Outfits</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage your outfit combinations
          </p>
        </div>
        <button
          onClick={handleCreateOutfit}
          className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Outfit
        </button>
      </div>

      {isCreating || editingOutfitId ? (
        <OutfitBuilder
          outfitId={editingOutfitId || undefined}
          onSaveComplete={handleSaveComplete}
          onCancel={handleCancel}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoadingOutfits ? (
            <div className="col-span-full flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : outfits.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                You haven't created any outfits yet
              </p>
              <button
                onClick={handleCreateOutfit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2 mx-auto hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Your First Outfit
              </button>
            </div>
          ) : (
            outfits.map((outfit) => {
              // Get a placeholder image for the outfit
              const displayImage = outfit.image_url || '/assets/outfit-placeholder.png';
              
              return (
                <div
                  key={outfit.outfit_id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative pt-[100%]">
                    <img
                      src={displayImage}
                      alt={outfit.name}
                      className="absolute top-0 left-0 w-full h-full object-cover"
                    />
                    {outfit.featured && (
                      <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                        Featured
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-lg font-semibold">{outfit.name}</h3>
                    
                    {outfit.description && (
                      <p className="text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {outfit.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      {outfit.season && outfit.season.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </span>
                      ))}
                      
                      {outfit.occasion && outfit.occasion.map((o) => (
                        <span
                          key={o}
                          className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                        >
                          {o.charAt(0).toUpperCase() + o.slice(1)}
                        </span>
                      ))}
                    </div>
                    
                    {outfit.wear_count && outfit.wear_count > 0 && (
                      <div className="mt-3 text-sm text-gray-600">
                        Worn {outfit.wear_count} times
                        {outfit.last_worn && (
                          <span> · Last worn: {new Date(outfit.last_worn).toLocaleDateString()}</span>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-4 flex justify-between items-center">
                      <OutfitActions
                        outfitId={outfit.outfit_id}
                        visibility={outfit.visibility || 'private'}
                        onEdit={() => handleEditOutfit(outfit.outfit_id)}
                        onDelete={() => handleDeleteOutfit(outfit.outfit_id)}
                        compact
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
} 