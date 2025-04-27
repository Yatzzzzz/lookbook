'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/app/context/SupabaseProvider';
import { useAuth } from '@/contexts/AuthContext';
import { useWardrobe } from '@/app/context/WardrobeContext';
import { 
  Folder, FolderPlus, Globe, Lock, Eye, Users, 
  MoreHorizontal, Pencil, Trash2, X, Check
} from 'lucide-react';
import Image from 'next/image';

interface Collection {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  visibility: string;
  created_at: string;
  outfit_count?: number;
}

interface OutfitCollectionsProps {
  userId?: string; // If not provided, shows current user's collections
  canCreate?: boolean;
  showVisibility?: boolean;
  maxDisplay?: number;
  onCollectionClick?: (collectionId: string) => void;
}

export default function OutfitCollections({
  userId,
  canCreate = true,
  showVisibility = true,
  maxDisplay = 8,
  onCollectionClick
}: OutfitCollectionsProps) {
  const router = useRouter();
  const { supabase } = useSupabase();
  const { user } = useAuth();
  const { refreshWardrobeItems } = useWardrobe();
  
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [newCollectionVisibility, setNewCollectionVisibility] = useState('private');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  
  // Only allow creation and visibility options for the current user's collections
  const isCurrentUser = !userId || (user && userId === user.id);

  useEffect(() => {
    const fetchCollections = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const targetUserId = userId || user?.id;
        
        if (!targetUserId) {
          setCollections([]);
          return;
        }
        
        let query = supabase
          .from('outfit_collections')
          .select('*, collection_items(count)')
          .eq('user_id', targetUserId);
        
        // If viewing someone else's collections, only show public/community ones
        if (!isCurrentUser) {
          query = query.in('visibility', ['public', 'community']);
        }
        
        const { data, error: fetchError } = await query;
        
        if (fetchError) throw fetchError;
        
        const formattedCollections = data.map(collection => ({
          ...collection,
          outfit_count: collection.collection_items?.[0]?.count || 0
        }));
        
        setCollections(formattedCollections);
      } catch (err: any) {
        console.error('Error fetching collections:', err);
        setError('Failed to load collections');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user || userId) {
      fetchCollections();
    }
  }, [supabase, user, userId, isCurrentUser]);

  const handleCreateCollection = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!newCollectionName.trim()) {
      setError('Collection name is required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const { data, error: insertError } = await supabase
        .from('outfit_collections')
        .insert({
          user_id: user.id,
          name: newCollectionName.trim(),
          description: newCollectionDescription.trim() || null,
          visibility: newCollectionVisibility
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      setCollections(prev => [...prev, { ...data, outfit_count: 0 }]);
      setNewCollectionName('');
      setNewCollectionDescription('');
      setNewCollectionVisibility('private');
      setShowNewCollection(false);
    } catch (err: any) {
      console.error('Error creating collection:', err);
      setError(err.message || 'Failed to create collection');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCollection = async () => {
    if (!user || !editingCollection) return;
    
    if (!newCollectionName.trim()) {
      setError('Collection name is required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const { error: updateError } = await supabase
        .from('outfit_collections')
        .update({
          name: newCollectionName.trim(),
          description: newCollectionDescription.trim() || null,
          visibility: newCollectionVisibility
        })
        .eq('id', editingCollection.id)
        .eq('user_id', user.id);
      
      if (updateError) throw updateError;
      
      setCollections(prev => prev.map(collection => 
        collection.id === editingCollection.id 
          ? { 
              ...collection, 
              name: newCollectionName.trim(), 
              description: newCollectionDescription.trim() || null,
              visibility: newCollectionVisibility
            } 
          : collection
      ));
      
      setEditingCollection(null);
      setNewCollectionName('');
      setNewCollectionDescription('');
      setNewCollectionVisibility('private');
    } catch (err: any) {
      console.error('Error updating collection:', err);
      setError(err.message || 'Failed to update collection');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    if (!user) return;
    
    if (!window.confirm('Are you sure you want to delete this collection? This action cannot be undone.')) {
      return;
    }
    
    try {
      const { error: deleteError } = await supabase
        .from('outfit_collections')
        .delete()
        .eq('id', collectionId)
        .eq('user_id', user.id);
      
      if (deleteError) throw deleteError;
      
      setCollections(prev => prev.filter(collection => collection.id !== collectionId));
    } catch (err: any) {
      console.error('Error deleting collection:', err);
      setError(err.message || 'Failed to delete collection');
    }
  };

  const handleEditClick = (collection: Collection) => {
    setEditingCollection(collection);
    setNewCollectionName(collection.name);
    setNewCollectionDescription(collection.description || '');
    setNewCollectionVisibility(collection.visibility);
  };

  const renderVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Globe className="h-4 w-4 text-green-500" />;
      case 'community':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'private':
      default:
        return <Lock className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const visibilityLabel = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return 'Public - Anyone can view';
      case 'community':
        return 'Community - Only Lookbook users can view';
      case 'private':
      default:
        return 'Private - Only you can view';
    }
  };

  const handleCollectionCardClick = (collectionId: string) => {
    if (onCollectionClick) {
      onCollectionClick(collectionId);
    } else {
      router.push(`/outfits/collections/${collectionId}`);
    }
  };

  const displayedCollections = showAll 
    ? collections 
    : collections.slice(0, maxDisplay);

  if (isLoading) {
    return (
      <div className="animate-pulse grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, index) => (
          <div key={index} className="bg-gray-200 dark:bg-gray-700 rounded-lg aspect-square"></div>
        ))}
      </div>
    );
  }

  if (error && collections.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-2">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (collections.length === 0 && !showNewCollection) {
    return (
      <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Collections Found</h3>
        
        {isCurrentUser ? (
          <>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Create collections to organize your outfits
            </p>
            {canCreate && (
              <button 
                onClick={() => setShowNewCollection(true)}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                Create Collection
              </button>
            )}
          </>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            This user hasn't created any public collections yet
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      
      {showNewCollection && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Create New Collection</h3>
            <button 
              onClick={() => setShowNewCollection(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="collection-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name*
              </label>
              <input
                id="collection-name"
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Collection name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            <div>
              <label htmlFor="collection-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (optional)
              </label>
              <textarea
                id="collection-description"
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
                placeholder="Collection description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              ></textarea>
            </div>
            
            {showVisibility && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Visibility
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      checked={newCollectionVisibility === 'private'}
                      onChange={() => setNewCollectionVisibility('private')}
                      className="text-primary focus:ring-primary"
                    />
                    <Lock className="h-4 w-4 text-gray-500" />
                    <span>Private - Only you can view</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="visibility"
                      value="community"
                      checked={newCollectionVisibility === 'community'}
                      onChange={() => setNewCollectionVisibility('community')}
                      className="text-primary focus:ring-primary"
                    />
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>Community - Only Lookbook users can view</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={newCollectionVisibility === 'public'}
                      onChange={() => setNewCollectionVisibility('public')}
                      className="text-primary focus:ring-primary"
                    />
                    <Globe className="h-4 w-4 text-green-500" />
                    <span>Public - Anyone can view</span>
                  </label>
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <button 
                onClick={handleCreateCollection}
                disabled={isSubmitting || !newCollectionName.trim()}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting ? 'Creating...' : 'Create Collection'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {editingCollection && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Edit Collection</h3>
            <button 
              onClick={() => setEditingCollection(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="edit-collection-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name*
              </label>
              <input
                id="edit-collection-name"
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Collection name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            <div>
              <label htmlFor="edit-collection-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (optional)
              </label>
              <textarea
                id="edit-collection-description"
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
                placeholder="Collection description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              ></textarea>
            </div>
            
            {showVisibility && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Visibility
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="edit-visibility"
                      value="private"
                      checked={newCollectionVisibility === 'private'}
                      onChange={() => setNewCollectionVisibility('private')}
                      className="text-primary focus:ring-primary"
                    />
                    <Lock className="h-4 w-4 text-gray-500" />
                    <span>Private - Only you can view</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="edit-visibility"
                      value="community"
                      checked={newCollectionVisibility === 'community'}
                      onChange={() => setNewCollectionVisibility('community')}
                      className="text-primary focus:ring-primary"
                    />
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>Community - Only Lookbook users can view</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="edit-visibility"
                      value="public"
                      checked={newCollectionVisibility === 'public'}
                      onChange={() => setNewCollectionVisibility('public')}
                      className="text-primary focus:ring-primary"
                    />
                    <Globe className="h-4 w-4 text-green-500" />
                    <span>Public - Anyone can view</span>
                  </label>
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <button 
                onClick={handleUpdateCollection}
                disabled={isSubmitting || !newCollectionName.trim()}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {displayedCollections.map((collection) => (
          <div 
            key={collection.id}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer relative ${
              selectedCollection === collection.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleCollectionCardClick(collection.id)}
          >
            <div className="relative aspect-square bg-gray-200 dark:bg-gray-700">
              {collection.cover_image_url ? (
                <Image 
                  src={collection.cover_image_url} 
                  alt={collection.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Folder className="h-12 w-12 text-gray-400" />
                </div>
              )}
              
              {isCurrentUser && (
                <div 
                  className="absolute top-2 right-2 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative group">
                    <button className="p-1 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800">
                      <MoreHorizontal className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </button>
                    
                    <div className="absolute right-0 mt-1 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-800 shadow-lg rounded-md py-1 w-36 z-10">
                      <button 
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        onClick={() => handleEditClick(collection)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                      <button 
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 flex items-center gap-2"
                        onClick={() => handleDeleteCollection(collection.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium truncate">{collection.name}</h3>
                {showVisibility && (
                  <div title={visibilityLabel(collection.visibility)}>
                    {renderVisibilityIcon(collection.visibility)}
                  </div>
                )}
              </div>
              
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {collection.outfit_count} outfit{collection.outfit_count !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        ))}
        
        {/* Add new collection button */}
        {canCreate && isCurrentUser && !showNewCollection && (
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center aspect-square"
            onClick={() => setShowNewCollection(true)}
          >
            <div className="text-center p-4">
              <FolderPlus className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Create Collection</p>
            </div>
          </div>
        )}
      </div>
      
      {collections.length > maxDisplay && !showAll && (
        <div className="mt-6 text-center">
          <button 
            onClick={() => setShowAll(true)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-200"
          >
            Show All Collections ({collections.length})
          </button>
        </div>
      )}
      
      {collections.length > maxDisplay && showAll && (
        <div className="mt-6 text-center">
          <button 
            onClick={() => setShowAll(false)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-200"
          >
            Show Fewer Collections
          </button>
        </div>
      )}
    </div>
  );
} 