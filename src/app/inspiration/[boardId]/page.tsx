'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWardrobe, InspirationItem } from '../../context/WardrobeContext';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { PlusIcon, Cross1Icon, ExternalLinkIcon, Pencil2Icon, Cross2Icon } from '@radix-ui/react-icons';

export default function InspirationBoardPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.boardId as string;
  const { user } = useAuth();
  const { 
    inspirationBoards,
    getInspirationBoard,
    getInspirationBoardItems,
    addItemToInspirationBoard,
    removeItemFromInspirationBoard,
    wardrobeItems,
    outfits,
    getOutfitItems,
    refreshInspirationBoards
  } = useWardrobe();

  const [boardItems, setBoardItems] = useState<InspirationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addType, setAddType] = useState<'wardrobe' | 'outfit' | 'external'>('wardrobe');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [externalImage, setExternalImage] = useState('');
  const [note, setNote] = useState('');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InspirationItem | null>(null);
  const [loadedWardrobeItems, setLoadedWardrobeItems] = useState<Record<string, any>>({});
  const [loadedOutfitItems, setLoadedOutfitItems] = useState<Record<string, any[]>>({});

  const board = getInspirationBoard(boardId);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!boardId) {
      router.push('/inspiration');
      return;
    }

    const fetchBoardItems = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const items = await getInspirationBoardItems(boardId);
        setBoardItems(items);
        
        // Pre-load wardrobe items
        const wardrobeItemsToLoad = items
          .filter(item => item.source_type === 'wardrobe' && item.item_id)
          .map(item => item.item_id as string);
        
        const outfitsToLoad = items
          .filter(item => item.source_type === 'outfit' && item.outfit_id)
          .map(item => item.outfit_id as string);
        
        // Load wardrobe items data
        const wardrobeItemsData: Record<string, any> = {};
        wardrobeItemsToLoad.forEach(itemId => {
          const item = wardrobeItems.find(i => i.item_id === itemId);
          if (item) {
            wardrobeItemsData[itemId] = item;
          }
        });
        setLoadedWardrobeItems(wardrobeItemsData);
        
        // Load outfit items data
        const outfitItemsData: Record<string, any[]> = {};
        for (const outfitId of outfitsToLoad) {
          const outfitItems = await getOutfitItems(outfitId);
          outfitItemsData[outfitId] = outfitItems;
        }
        setLoadedOutfitItems(outfitItemsData);
      } catch (err: any) {
        console.error('Error fetching board items:', err);
        setError(err.message || 'Failed to load board items');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoardItems();
  }, [user, router, boardId, getInspirationBoardItems, wardrobeItems, outfits, getOutfitItems]);

  const handleAddItem = async () => {
    try {
      if (addType === 'external' && (!externalUrl || !externalImage)) {
        setError('Please provide both URL and image for external items');
        return;
      }

      if ((addType === 'wardrobe' || addType === 'outfit') && !selectedItemId) {
        setError('Please select an item to add');
        return;
      }

      await addItemToInspirationBoard(
        boardId,
        addType,
        selectedItemId || undefined,
        externalUrl || undefined,
        externalImage || undefined,
        note || undefined
      );

      // Reset form
      setSelectedItemId(null);
      setExternalUrl('');
      setExternalImage('');
      setNote('');
      setIsAddModalOpen(false);

      // Refresh board items
      const updatedItems = await getInspirationBoardItems(boardId);
      setBoardItems(updatedItems);
    } catch (err: any) {
      console.error('Error adding item to board:', err);
      setError(err.message || 'Failed to add item to board');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItemFromInspirationBoard(boardId, itemId);
      setBoardItems(prev => prev.filter(item => item.id !== itemId));
    } catch (err: any) {
      console.error('Error removing item from board:', err);
      setError(err.message || 'Failed to remove item from board');
    }
  };

  const handleItemClick = (item: InspirationItem) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  if (!board) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">Board not found</span>
        </div>
        <button
          onClick={() => router.push('/inspiration')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Back to Inspiration Boards
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.push('/inspiration')}
          className="mr-4 px-3 py-2 border rounded-md flex items-center"
        >
          <Cross1Icon className="w-4 h-4 mr-2" />
          Back
        </button>
        <h1 className="text-2xl font-bold">{board.name}</h1>
        <span className="ml-3 px-2 py-1 text-xs rounded-full bg-gray-200">
          {board.visibility === 'public' ? 'Public' : 'Private'}
        </span>
      </div>
      
      {board.description && (
        <p className="text-gray-600 mb-6">{board.description}</p>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          {boardItems.length} {boardItems.length === 1 ? 'Item' : 'Items'}
        </h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Item
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      ) : boardItems.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-4">This board is empty. Add some items to get started!</p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Add First Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {boardItems.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow relative group"
            >
              <div 
                className="h-48 bg-gray-100 relative cursor-pointer"
                onClick={() => handleItemClick(item)}
              >
                {item.source_type === 'wardrobe' && item.item_id && loadedWardrobeItems[item.item_id] ? (
                  <Image
                    src={loadedWardrobeItems[item.item_id].image_path || '/placeholder-image.jpg'}
                    alt={loadedWardrobeItems[item.item_id].name || 'Wardrobe item'}
                    fill
                    className="object-cover"
                  />
                ) : item.source_type === 'outfit' && item.outfit_id ? (
                  <div className="h-full flex items-center justify-center bg-gray-200">
                    <span className="text-gray-600">Outfit</span>
                  </div>
                ) : item.source_type === 'external' && item.external_image ? (
                  <Image
                    src={item.external_image}
                    alt="External inspiration"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-200">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveItem(item.id);
                  }}
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove item"
                  title="Remove from board"
                >
                  <Cross2Icon className="w-4 h-4 text-gray-700" />
                </button>
              </div>
              
              <div className="p-3">
                <div className="flex justify-between items-start">
                  <div>
                    {item.source_type === 'wardrobe' && item.item_id && loadedWardrobeItems[item.item_id] ? (
                      <h3 className="font-medium truncate">{loadedWardrobeItems[item.item_id].name}</h3>
                    ) : item.source_type === 'outfit' && item.outfit_id ? (
                      <h3 className="font-medium truncate">
                        {outfits.find(o => o.outfit_id === item.outfit_id)?.name || 'Outfit'}
                      </h3>
                    ) : item.source_type === 'external' ? (
                      <div className="flex items-center">
                        <h3 className="font-medium truncate">External Item</h3>
                        {item.external_url && (
                          <a 
                            href={item.external_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            onClick={(e) => e.stopPropagation()}
                            className="ml-1"
                          >
                            <ExternalLinkIcon className="w-4 h-4 text-blue-500" />
                          </a>
                        )}
                      </div>
                    ) : (
                      <h3 className="font-medium truncate">Unknown Item</h3>
                    )}
                  </div>
                </div>
                
                {item.note && (
                  <p className="text-gray-600 mt-1 text-sm line-clamp-2">{item.note}</p>
                )}
                
                <div className="mt-2">
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                    {item.source_type.charAt(0).toUpperCase() + item.source_type.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">Add to Inspiration Board</h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">Item Type</label>
              <div className="flex space-x-4 mb-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="itemType"
                    value="wardrobe"
                    checked={addType === 'wardrobe'}
                    onChange={() => setAddType('wardrobe')}
                    className="mr-2"
                  />
                  Wardrobe Item
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="itemType"
                    value="outfit"
                    checked={addType === 'outfit'}
                    onChange={() => setAddType('outfit')}
                    className="mr-2"
                  />
                  Outfit
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="itemType"
                    value="external"
                    checked={addType === 'external'}
                    onChange={() => setAddType('external')}
                    className="mr-2"
                  />
                  External
                </label>
              </div>
            </div>
            
            {addType === 'wardrobe' && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Select Wardrobe Item
                </label>
                <select
                  value={selectedItemId || ''}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select an item</option>
                  {wardrobeItems.map((item) => (
                    <option key={item.item_id} value={item.item_id}>
                      {item.name} ({item.category})
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {addType === 'outfit' && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Select Outfit
                </label>
                <select
                  value={selectedItemId || ''}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select an outfit</option>
                  {outfits.map((outfit) => (
                    <option key={outfit.outfit_id} value={outfit.outfit_id}>
                      {outfit.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {addType === 'external' && (
              <>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    External URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="https://example.com/fashion-item"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Image URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={externalImage}
                    onChange={(e) => setExternalImage(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="https://example.com/fashion-image.jpg"
                    required
                  />
                </div>
              </>
            )}
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Note
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Add a note about this item"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedItemId(null);
                  setExternalUrl('');
                  setExternalImage('');
                  setNote('');
                  setIsAddModalOpen(false);
                  setError(null);
                }}
                className="px-4 py-2 border rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                disabled={
                  (addType === 'external' && (!externalUrl || !externalImage)) ||
                  ((addType === 'wardrobe' || addType === 'outfit') && !selectedItemId)
                }
              >
                Add to Board
              </button>
            </div>
            
            {error && (
              <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Item Detail Modal */}
      {isDetailModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">Item Details</h2>
              <button
                onClick={() => {
                  setSelectedItem(null);
                  setIsDetailModalOpen(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <Cross1Icon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-100 relative rounded-lg overflow-hidden">
                {selectedItem.source_type === 'wardrobe' && selectedItem.item_id && loadedWardrobeItems[selectedItem.item_id] ? (
                  <Image
                    src={loadedWardrobeItems[selectedItem.item_id].image_path || '/placeholder-image.jpg'}
                    alt={loadedWardrobeItems[selectedItem.item_id].name || 'Wardrobe item'}
                    fill
                    className="object-cover"
                  />
                ) : selectedItem.source_type === 'external' && selectedItem.external_image ? (
                  <Image
                    src={selectedItem.external_image}
                    alt="External inspiration"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-200">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
              </div>
              
              <div>
                <div className="mb-4">
                  <h3 className="font-medium text-lg">
                    {selectedItem.source_type === 'wardrobe' && selectedItem.item_id && loadedWardrobeItems[selectedItem.item_id]
                      ? loadedWardrobeItems[selectedItem.item_id].name
                      : selectedItem.source_type === 'outfit' && selectedItem.outfit_id
                      ? outfits.find(o => o.outfit_id === selectedItem.outfit_id)?.name || 'Outfit'
                      : 'External Item'}
                  </h3>
                  
                  {selectedItem.source_type === 'wardrobe' && selectedItem.item_id && loadedWardrobeItems[selectedItem.item_id] && (
                    <div className="mt-2 space-y-2 text-sm">
                      <p><span className="font-medium">Category:</span> {loadedWardrobeItems[selectedItem.item_id].category}</p>
                      {loadedWardrobeItems[selectedItem.item_id].brand && (
                        <p><span className="font-medium">Brand:</span> {loadedWardrobeItems[selectedItem.item_id].brand}</p>
                      )}
                      {loadedWardrobeItems[selectedItem.item_id].color && (
                        <p><span className="font-medium">Color:</span> {loadedWardrobeItems[selectedItem.item_id].color}</p>
                      )}
                      {loadedWardrobeItems[selectedItem.item_id].description && (
                        <p><span className="font-medium">Description:</span> {loadedWardrobeItems[selectedItem.item_id].description}</p>
                      )}
                    </div>
                  )}
                  
                  {selectedItem.source_type === 'external' && selectedItem.external_url && (
                    <div className="mt-2">
                      <a 
                        href={selectedItem.external_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        Visit Source <ExternalLinkIcon className="w-4 h-4 ml-1" />
                      </a>
                    </div>
                  )}
                </div>
                
                {selectedItem.note && (
                  <div className="mb-4">
                    <h4 className="font-medium text-sm text-gray-700 mb-1">Note</h4>
                    <p className="text-gray-600">{selectedItem.note}</p>
                  </div>
                )}
                
                <div className="mb-4">
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Added on</h4>
                  <p className="text-gray-600">{new Date(selectedItem.created_at).toLocaleDateString()}</p>
                </div>
                
                <button
                  onClick={() => handleRemoveItem(selectedItem.id)}
                  className="mt-4 px-4 py-2 border border-red-500 text-red-500 hover:bg-red-50 rounded-md flex items-center"
                >
                  <Cross2Icon className="w-4 h-4 mr-2" />
                  Remove from Board
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 