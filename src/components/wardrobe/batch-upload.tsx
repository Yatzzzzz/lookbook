'use client';

import React, { useState, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Upload, Loader2, AlertCircle, Check, XCircle, Image as ImageIcon } from 'lucide-react';
import { useWardrobe } from '@/app/context/WardrobeContext';

interface BatchItem {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  metadata?: {
    name?: string;
    category?: string;
    color?: string;
    brand?: string;
    description?: string;
  };
}

interface BatchUploadProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BatchUpload({ isOpen, onClose }: BatchUploadProps) {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadStats, setUploadStats] = useState({ success: 0, failed: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { addItem, uploadImage } = useWardrobe();
  
  // Maximum number of files that can be uploaded at once
  const MAX_FILES = 20;
  
  // Maximum file size (10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Limit the number of files
    const totalFiles = items.length + files.length;
    if (totalFiles > MAX_FILES) {
      alert(`You can upload a maximum of ${MAX_FILES} files at once.`);
      return;
    }
    
    // Convert FileList to array for processing
    const newFiles = Array.from(files).map(file => {
      // Generate a preview for the file
      const preview = URL.createObjectURL(file);
      
      return {
        id: crypto.randomUUID(),
        file,
        preview,
        status: 'pending' as const,
        progress: 0,
        metadata: {
          name: file.name.split('.')[0].replace(/[_-]/g, ' '),
          category: guessCategory(file.name),
        }
      };
    });
    
    setItems(prev => [...prev, ...newFiles]);
    
    // Reset the input
    if (event.target) {
      event.target.value = '';
    }
  };
  
  const guessCategory = (filename: string): string => {
    const lowerFilename = filename.toLowerCase();
    
    if (/shirt|tee|top|polo|blouse/.test(lowerFilename)) return 'top';
    if (/pant|jean|trouser|shorts|skirt/.test(lowerFilename)) return 'bottom';
    if (/jacket|coat|hoodie|sweater|cardigan/.test(lowerFilename)) return 'outerwear';
    if (/shoe|sneaker|boot|heel|sandal/.test(lowerFilename)) return 'shoes';
    if (/hat|scarf|glove|jewelry|watch|necklace|earring/.test(lowerFilename)) return 'accessories';
    if (/bag|purse|backpack|wallet/.test(lowerFilename)) return 'bags';
    if (/dress|gown/.test(lowerFilename)) return 'dress';
    
    return 'other';
  };
  
  const handleRemoveItem = (id: string) => {
    setItems(prev => {
      const item = prev.find(item => item.id === id);
      if (item) {
        URL.revokeObjectURL(item.preview);
      }
      return prev.filter(item => item.id !== id);
    });
  };
  
  const handleMetadataChange = (id: string, field: string, value: string) => {
    setItems(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, metadata: { ...item.metadata, [field]: value } } 
          : item
      )
    );
  };
  
  const uploadBatch = async () => {
    if (items.length === 0 || isUploading) return;
    
    setIsUploading(true);
    setUploadComplete(false);
    setUploadStats({ success: 0, failed: 0, total: items.length });
    
    // Process each item sequentially to avoid overloading the server
    for (const item of items) {
      try {
        // Update status to uploading
        setItems(prev => 
          prev.map(i => 
            i.id === item.id 
              ? { ...i, status: 'uploading', progress: 0 } 
              : i
          )
        );
        
        // Upload the image first
        const imageUrl = await uploadImage(item.file);
        
        // Update progress
        setItems(prev => 
          prev.map(i => 
            i.id === item.id 
              ? { ...i, progress: 50 } 
              : i
          )
        );
        
        // Prepare the item data
        const itemData = {
          name: item.metadata?.name || 'Clothing Item',
          category: item.metadata?.category || 'other',
          color: item.metadata?.color || '',
          brand: item.metadata?.brand || '',
          description: item.metadata?.description || '',
          image_path: imageUrl,
        };
        
        // Add the item to the wardrobe
        await addItem(itemData);
        
        // Update status to success
        setItems(prev => 
          prev.map(i => 
            i.id === item.id 
              ? { ...i, status: 'success', progress: 100 } 
              : i
          )
        );
        
        setUploadStats(prev => ({ ...prev, success: prev.success + 1 }));
      } catch (error: any) {
        console.error(`Error uploading item ${item.id}:`, error);
        
        // Update status to error
        setItems(prev => 
          prev.map(i => 
            i.id === item.id 
              ? { 
                  ...i, 
                  status: 'error', 
                  progress: 0, 
                  error: error.message || 'Failed to upload item' 
                } 
              : i
          )
        );
        
        setUploadStats(prev => ({ ...prev, failed: prev.failed + 1 }));
      }
    }
    
    setIsUploading(false);
    setUploadComplete(true);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Create a fake input event
      const inputEvent = {
        target: {
          files: e.dataTransfer.files,
          value: ''
        }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      
      handleFileChange(inputEvent);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const resetForm = () => {
    // Revoke all object URLs to prevent memory leaks
    items.forEach(item => {
      URL.revokeObjectURL(item.preview);
    });
    
    setItems([]);
    setIsUploading(false);
    setUploadComplete(false);
    setUploadStats({ success: 0, failed: 0, total: 0 });
  };
  
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-overlayShow" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[800px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white dark:bg-gray-900 p-6 shadow-lg focus:outline-none data-[state=open]:animate-contentShow overflow-auto">
          <Dialog.Title className="m-0 font-medium text-lg mb-4">
            Batch Upload
          </Dialog.Title>
          <Dialog.Description className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Upload multiple clothing items at once to your wardrobe.
          </Dialog.Description>
          
          {uploadComplete ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <Check size={32} className="text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-medium mb-2">Upload Complete</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {uploadStats.success} of {uploadStats.total} items were added to your wardrobe.
                {uploadStats.failed > 0 && ` ${uploadStats.failed} items failed to upload.`}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Upload More
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              <div
                className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md p-6 text-center mb-6"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center">
                  <Upload size={48} className="text-gray-400 mb-4" />
                  <h3 className="font-medium text-lg mb-1">Drop files here</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">or</p>
                  <button
                    onClick={triggerFileInput}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Select Files
                  </button>
                  <input 
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
              
              {items.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Selected Files ({items.length})</h3>
                  <div className="max-h-[300px] overflow-y-auto border rounded-md">
                    {items.map(item => (
                      <div key={item.id} className="p-4 border-b last:border-b-0 dark:border-gray-700 flex items-center">
                        <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                          {item.preview ? (
                            <img 
                              src={item.preview} 
                              alt={item.file.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon size={24} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-4 flex-grow">
                          <div className="flex items-center justify-between mb-1">
                            <input 
                              type="text" 
                              value={item.metadata?.name || ''} 
                              onChange={(e) => handleMetadataChange(item.id, 'name', e.target.value)}
                              placeholder="Item name"
                              className="text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-0 p-0 w-full"
                            />
                            {item.status === 'pending' && (
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="ml-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                              >
                                <X size={16} />
                              </button>
                            )}
                            {item.status === 'uploading' && (
                              <div className="flex items-center">
                                <Loader2 size={16} className="animate-spin text-blue-500" />
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                  {item.progress}%
                                </span>
                              </div>
                            )}
                            {item.status === 'success' && (
                              <Check size={16} className="text-green-500" />
                            )}
                            {item.status === 'error' && (
                              <div className="flex items-center text-red-500 dark:text-red-400">
                                <XCircle size={16} />
                                <span className="text-xs ml-2">{item.error}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2 flex-wrap">
                            <select
                              value={item.metadata?.category || 'other'}
                              onChange={(e) => handleMetadataChange(item.id, 'category', e.target.value)}
                              className="text-xs bg-gray-100 dark:bg-gray-800 border-none rounded px-2 py-1"
                              disabled={item.status !== 'pending'}
                            >
                              <option value="top">Top</option>
                              <option value="bottom">Bottom</option>
                              <option value="dress">Dress</option>
                              <option value="outerwear">Outerwear</option>
                              <option value="shoes">Shoes</option>
                              <option value="accessories">Accessories</option>
                              <option value="bags">Bags</option>
                              <option value="other">Other</option>
                            </select>
                            
                            <input
                              type="text"
                              placeholder="Color"
                              value={item.metadata?.color || ''}
                              onChange={(e) => handleMetadataChange(item.id, 'color', e.target.value)}
                              className="text-xs bg-gray-100 dark:bg-gray-800 border-none rounded px-2 py-1 max-w-[80px]"
                              disabled={item.status !== 'pending'}
                            />
                            
                            <input
                              type="text"
                              placeholder="Brand"
                              value={item.metadata?.brand || ''}
                              onChange={(e) => handleMetadataChange(item.id, 'brand', e.target.value)}
                              className="text-xs bg-gray-100 dark:bg-gray-800 border-none rounded px-2 py-1 max-w-[80px]"
                              disabled={item.status !== 'pending'}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  onClick={uploadBatch}
                  disabled={items.length === 0 || isUploading}
                  className={`px-4 py-2 rounded transition-colors ${
                    items.length === 0 || isUploading
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isUploading ? (
                    <span className="flex items-center">
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Uploading...
                    </span>
                  ) : (
                    `Upload ${items.length > 0 ? `(${items.length})` : ''}`
                  )}
                </button>
              </div>
            </>
          )}
          
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