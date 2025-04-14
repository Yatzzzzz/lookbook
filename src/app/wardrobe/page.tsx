'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AddWardrobeItemModal } from '../components/add-wardrobe-item-modal';
import { EditWardrobeItemModal } from '../components/edit-wardrobe-item-modal';
import { useWardrobe } from '../context/WardrobeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, Edit, Loader2 } from 'lucide-react';
import WardrobeCategories from '@/components/WardrobeCategories';
import AddItemButton from '@/components/AddItemButton';

export default function Wardrobe() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const { wardrobeItems, removeItem, isLoading, error, refreshSession } = useWardrobe();
  const { user, loading: authLoading, error: authError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      console.log('Not authenticated, redirecting to login');
      router.push('/login');
    } else if (!authLoading && user) {
      setAuthChecked(true);
    }
  }, [user, authLoading, router]);

  // Listen for edit events from the WardrobeCategories component
  useEffect(() => {
    const handleEditEvent = (event: CustomEvent) => {
      const itemId = event.detail?.itemId;
      if (itemId) {
        setSelectedItem(itemId);
        setIsEditModalOpen(true);
      }
    };

    window.addEventListener('editWardrobeItem', handleEditEvent as EventListener);
    
    return () => {
      window.removeEventListener('editWardrobeItem', handleEditEvent as EventListener);
    };
  }, []);

  const handleAddItemClick = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
  };

  const handleEdit = (itemId: string) => {
    setSelectedItem(itemId);
    setIsEditModalOpen(true);
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

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Checking authentication...</p>
      </div>
    );
  }

  if (!authChecked) {
    return null; // Don't render anything while checking authentication
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Wardrobe</h1>
        <AddItemButton onClick={handleAddItemClick} />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading your wardrobe items...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 mb-2">Error loading your wardrobe</p>
          <p className="text-muted-foreground">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <WardrobeCategories />
      )}

      {isAddModalOpen && (
        <AddWardrobeItemModal isOpen={isAddModalOpen} onClose={handleCloseModal} />
      )}
      
      {selectedItem && (
        <EditWardrobeItemModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedItem(null);
          }}
          itemId={selectedItem}
        />
      )}
    </div>
  );
} 