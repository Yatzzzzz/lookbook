'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AddWardrobeItemModal } from '../components/add-wardrobe-item-modal';
import { EditWardrobeItemModal } from '../components/edit-wardrobe-item-modal';
import { useWardrobe } from '../context/WardrobeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, Edit, Loader2, Camera } from 'lucide-react';
import WardrobeCategories from '@/components/WardrobeCategories';
import AddItemButton from '@/components/AddItemButton';
import WardrobeRankingCard from '@/components/WardrobeRankingCard';
import CameraComponent, { MediaCaptureResult } from '@/components/CameraComponent';

// Import AI service helpers
import { useLocalStorage } from '@/hooks/useLocalStorage';

export default function Wardrobe() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const { wardrobeItems, removeItem, isLoading, error, refreshSession, refreshWardrobeItems } = useWardrobe();
  const { user, loading: authLoading, error: authError } = useAuth();
  const router = useRouter();

  // Camera integration states
  const [showCamera, setShowCamera] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedItem, setAnalyzedItem] = useState<{
    itemName: string;
    category: string;
    color: string;
    brand: string;
    material: string;
    description: string;
    brandUrl: string;
    imageFile: File | null;
    imagePreview: string | null;
  } | null>(null);
  
  // Cache for AI analysis results
  const [aiCache, setAiCache] = useLocalStorage<Record<string, {
    timestamp: number;
    result: any;
  }>>('ai-analysis-cache', {});

  useEffect(() => {
    if (!authLoading && !user) {
      console.log('Not authenticated, redirecting to login');
      router.push('/login');
    } else if (!authLoading && user) {
      setAuthChecked(true);
    }
  }, [user, authLoading, router]);

  // Refresh wardrobe items when page loads
  useEffect(() => {
    if (user && !authLoading) {
      // Use a ref to ensure this only runs once
      const refreshOnce = () => {
        console.log('Refreshing wardrobe items once on page load');
        refreshWardrobeItems();
      };
      refreshOnce();
    }
  }, []);  // Empty dependency array means this only runs once on mount

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

  // Function to open camera for item capture
  const handleCameraClick = () => {
    setShowCamera(true);
  };

  // Add a simple offline tagging function that can be used when AI services are not available or fail
  const performOfflineTagging = (file: File, preview: string) => {
    // Extract basic information from filename and file type
    const filename = file.name.toLowerCase();
    let itemName = "New Item";
    let category = "";
    let detectedColor = "";
    
    // Try to determine category from filename
    const categoryTerms = {
      'shirt': 'top',
      'tshirt': 'top',
      't-shirt': 'top',
      'top': 'top',
      'blouse': 'top',
      'pants': 'bottom',
      'jeans': 'bottom',
      'skirt': 'bottom',
      'shorts': 'bottom',
      'dress': 'dress',
      'jacket': 'outerwear',
      'coat': 'outerwear',
      'shoes': 'shoes',
      'sneakers': 'shoes',
      'boots': 'shoes',
      'hat': 'accessories',
      'bag': 'bags',
      'purse': 'bags'
    };
    
    // Try to determine color from filename
    const colorTerms = ['black', 'white', 'red', 'blue', 'green', 'yellow', 
      'pink', 'purple', 'orange', 'brown', 'gray', 'grey'];
    
    // Check filename for category and color clues
    for (const [term, cat] of Object.entries(categoryTerms)) {
      if (filename.includes(term)) {
        category = cat;
        break;
      }
    }
    
    for (const colorTerm of colorTerms) {
      if (filename.includes(colorTerm)) {
        detectedColor = colorTerm.charAt(0).toUpperCase() + colorTerm.slice(1);
        break;
      }
    }
    
    // Try to create a better item name from the filename
    if (filename) {
      // Remove file extension and special characters
      const cleanName = filename
        .replace(/\.[^/.]+$/, "") // Remove extension
        .replace(/[-_]/g, " ") // Replace dashes and underscores with spaces
        .replace(/\s+/g, " ") // Normalize spaces
        .trim();
      
      if (cleanName) {
        // Capitalize first letter of each word
        itemName = cleanName
          .split(" ")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }
    }
    
    return {
      itemName,
      category,
      color: detectedColor,
      brand: "",
      material: "",
      description: "Item added manually without AI analysis.",
      brandUrl: "",
      imageFile: file,
      imagePreview: preview
    };
  };

  // Handle media captured from camera component
  const handleMediaCapture = async (media: MediaCaptureResult) => {
    if (media.type !== 'image') {
      // We only handle images for wardrobe items
      alert('Only photos are supported for wardrobe items.');
      return;
    }

    setShowCamera(false);
    setIsAnalyzing(true);

    try {
      // Generate a cache key based on image data
      const cacheKey = await generateCacheKey(media.file);
      const now = Date.now();
      const cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      // Check if we have a valid cached result
      const cachedResult = aiCache[cacheKey];
      if (cachedResult && (now - cachedResult.timestamp) < cacheExpiry) {
        console.log('Using cached AI analysis result');
        processAnalysisResult(cachedResult.result, media);
      } else {
        // If no cache or expired, perform new analysis
        console.log('Performing new AI analysis');
        
        // Convert image to base64 for API calls
        // If we have a background-removed version, use that for analysis
        const imageToAnalyze = media.backgroundRemoved || media.preview;
        const imageBase64 = media.backgroundRemoved 
          ? media.backgroundRemoved
          : await fileToBase64(media.file);
        
        // Try to get Vision results, but don't stop if it fails
        let visionResult = null;
        let geminiResult = null;
        
        try {
          // Try to get Vision API results
          visionResult = await analyzeWithGoogleVision(imageBase64);
        } catch (visionError) {
          console.error('Google Vision API failed:', visionError);
          // Continue without Vision API results
        }
        
        try {
          // Try to get Gemini results
          geminiResult = await analyzeWithGemini(imageBase64);
        } catch (geminiError) {
          console.error('Gemini API failed:', geminiError);
          // If both APIs failed, rethrow to show error to user
          if (!visionResult) {
            throw new Error('All AI services failed to analyze the image');
          }
        }
        
        // Combine results from different services (handle null cases)
        const combinedResult = {
          vision: visionResult || {},
          gemini: geminiResult || {}
        };
        
        // Cache the result
        setAiCache({
          ...aiCache,
          [cacheKey]: {
            timestamp: now,
            result: combinedResult
          }
        });
        
        // Process the result
        processAnalysisResult(combinedResult, media);
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      // Try to extract basic info from file metadata as a fallback
      const fallbackAnalysis = performOfflineTagging(media.file, media.preview);
      setAnalyzedItem(fallbackAnalysis);
      setIsAnalyzing(false);
    }
  };

  // Generate a hash-like key for caching based on image data
  const generateCacheKey = async (file: File): Promise<string> => {
    // For simplicity, we'll use file size, name, and last modified time
    return `${file.name}-${file.size}-${file.lastModified}`;
  };

  // Convert File to base64 string
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Call Google Vision API
  const analyzeWithGoogleVision = async (imageBase64: string) => {
    try {
      const response = await fetch('/api/vision/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageBase64 }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Google Vision API request failed with status ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Google Vision API error:', error);
      throw error; // Rethrow to be handled by caller
    }
  };

  // Call Gemini API
  const analyzeWithGemini = async (imageBase64: string) => {
    const response = await fetch('/api/clothes-finder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        imageBase64,
        mode: 'detail' // Get detailed analysis
      }),
    });
    
    if (!response.ok) {
      throw new Error('Gemini API request failed');
    }
    
    return await response.json();
  };

  // Process the combined analysis results
  const processAnalysisResult = (result: any, media: MediaCaptureResult) => {
    console.log('AI Analysis result:', result);
    
    // Extract information from vision results
    const visionInfo = result.vision || {};
    const detectedClothing = visionInfo.detectedClothing || [];
    const dominantColors = visionInfo.dominantColors || [];
    
    // Extract information from Gemini results
    const geminiInfo = result.gemini || {};
    const geminiTags = geminiInfo.tags || [];
    
    // Determine item name
    let itemName = '';
    if (detectedClothing.length > 0 && detectedClothing[0].name) {
      itemName = detectedClothing[0].name;
    } else if (geminiTags.length > 0) {
      itemName = geminiTags[0];
    }
    
    // Determine category based on detected clothing
    let category = '';
    if (detectedClothing.length > 0) {
      const clothingTypes = {
        'top': ['shirt', 'blouse', 't-shirt', 'tee', 'sweater', 'top', 'hoodie', 'sweatshirt', 'tank'],
        'bottom': ['pants', 'jeans', 'shorts', 'skirt', 'trousers', 'leggings'],
        'dress': ['dress', 'gown'],
        'outerwear': ['jacket', 'coat', 'blazer', 'cardigan'],
        'shoes': ['shoes', 'sneakers', 'boots', 'heels', 'sandals', 'footwear'],
        'accessories': ['hat', 'scarf', 'gloves', 'glasses', 'sunglasses', 'watch', 'accessory'],
        'bags': ['bag', 'purse', 'backpack', 'handbag', 'tote'],
      };
      
      for (const item of detectedClothing) {
        if (!item.name) continue;
        const name = item.name.toLowerCase();
        
        for (const [cat, keywords] of Object.entries(clothingTypes)) {
          if (keywords.some(kw => name.includes(kw))) {
            category = cat;
            break;
          }
        }
        if (category) break;
      }
    }
    
    // Determine color
    let color = '';
    if (dominantColors.length > 0) {
      // Convert hex to color name (simplified)
      const hexToColorName: Record<string, string> = {
        '#000000': 'Black',
        '#FFFFFF': 'White',
        '#FF0000': 'Red',
        '#00FF00': 'Green',
        '#0000FF': 'Blue',
        '#FFFF00': 'Yellow',
        '#FF00FF': 'Pink',
        '#00FFFF': 'Cyan',
        '#FFA500': 'Orange',
        '#800080': 'Purple',
        '#A52A2A': 'Brown',
        '#808080': 'Gray',
      };
      
      // Just take the most dominant color for now
      const dominantHex = dominantColors[0].hex;
      
      // Find the closest color name (very simplified)
      color = 'Multicolor'; // default
      
      for (const [hex, name] of Object.entries(hexToColorName)) {
        if (dominantHex === hex) {
          color = name;
          break;
        }
      }
      
      // If we couldn't match exactly, check for broader matches
      if (color === 'Multicolor') {
        for (const tag of geminiTags) {
          const colorWords = ['black', 'white', 'red', 'green', 'blue', 'yellow', 
            'pink', 'cyan', 'orange', 'purple', 'brown', 'gray', 'grey'];
          
          for (const colorWord of colorWords) {
            if (tag.toLowerCase().includes(colorWord)) {
              color = colorWord.charAt(0).toUpperCase() + colorWord.slice(1);
              break;
            }
          }
          if (color !== 'Multicolor') break;
        }
      }
    }
    
    // Extract brand and material information from Gemini tags
    let brand = '';
    let material = '';
    let description = geminiTags.join(', ');
    
    // Look for brand information in tags
    const commonBrands = ['Nike', 'Adidas', 'Puma', 'Gucci', 'Zara', 'H&M', 'Levis', 'Uniqlo', 'Gap'];
    for (const tag of geminiTags) {
      for (const brandName of commonBrands) {
        if (tag.includes(brandName)) {
          brand = brandName;
          break;
        }
      }
      if (brand) break;
    }
    
    // Look for material information in tags
    const commonMaterials = ['cotton', 'silk', 'wool', 'linen', 'leather', 'denim', 'polyester', 'nylon'];
    for (const tag of geminiTags) {
      for (const materialName of commonMaterials) {
        if (tag.toLowerCase().includes(materialName)) {
          material = materialName.charAt(0).toUpperCase() + materialName.slice(1);
          break;
        }
      }
      if (material) break;
    }
    
    // Set a brand URL (will be replaced with a real one in a production version)
    let brandUrl = '';
    if (brand) {
      brandUrl = `https://www.${brand.toLowerCase()}.com`;
    }
    
    // Set the analyzed item state
    setAnalyzedItem({
      itemName: itemName || 'New Item',
      category: category || 'unknown',
      color: color || 'unknown',
      brand: brand || '',
      material: material || '',
      description: description || '',
      brandUrl: brandUrl,
      imageFile: media.file,
      imagePreview: media.preview
    });
    
    setIsAnalyzing(false);
  };

  // Function to add the analyzed item to wardrobe
  const addAnalyzedItem = () => {
    if (!analyzedItem) return;
    
    // Open the add modal and pre-populate it with analyzed data
    setIsAddModalOpen(true);
    
    // Use setTimeout to ensure the modal is open before we try to access its fields
    setTimeout(() => {
      // The fields will be populated via effect in the AddWardrobeItemModal component
      // We'll use window custom event to pass the data
      const event = new CustomEvent('prePopulateWardrobeItem', { 
        detail: {
          name: analyzedItem.itemName,
          category: analyzedItem.category,
          color: analyzedItem.color,
          brand: analyzedItem.brand,
          material: analyzedItem.material,
          description: analyzedItem.description,
          brandUrl: analyzedItem.brandUrl,
          imageFile: analyzedItem.imageFile,
          imagePreview: analyzedItem.imagePreview
        }
      });
      window.dispatchEvent(event);
    }, 300);
    
    // Clear the analyzed item
    setAnalyzedItem(null);
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
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <CameraComponent 
              onMediaCapture={handleMediaCapture}
              onCancel={() => setShowCamera(false)}
              allowVideo={false} // Only photos for wardrobe items
              enableAITagging={false} // We'll do custom AI processing
              enableBackgroundRemoval={true} // Enable background removal
              className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden"
            />
          </div>
        </div>
      )}
      
      {isAnalyzing && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col items-center justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-white mb-4" />
          <p className="text-white text-xl">Analyzing Your Item...</p>
          <p className="text-gray-300 mt-2">Using AI to identify item details</p>
        </div>
      )}
      
      {analyzedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold">Item Detected</h2>
              <p className="text-sm text-gray-500">
                Our AI has analyzed your item. Review the details below.
              </p>
            </div>
            
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                {analyzedItem.imagePreview && (
                  <img 
                    src={analyzedItem.imagePreview} 
                    alt="Item preview" 
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                )}
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Item Name</p>
                  <p className="font-medium">{analyzedItem.itemName}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Category</p>
                  <p>{analyzedItem.category}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Color</p>
                  <p>{analyzedItem.color}</p>
                </div>
                
                {analyzedItem.brand && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Brand</p>
                    <p>{analyzedItem.brand}</p>
                  </div>
                )}
                
                {analyzedItem.material && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Material</p>
                    <p>{analyzedItem.material}</p>
                  </div>
                )}
                
                {analyzedItem.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <p className="text-sm">{analyzedItem.description}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t flex justify-end space-x-3">
              <button
                onClick={() => setAnalyzedItem(null)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={addAnalyzedItem}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Add to Wardrobe
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Your Wardrobe</h1>
          <button
            onClick={() => router.push('/lookbook')}
            className="text-blue-600 text-sm hover:underline mt-1 flex items-center"
          >
            ← Back to Lookbook
          </button>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => router.push('/profile/' + user?.id)}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md flex items-center"
          >
            <span className="mr-2">View Profile</span>
          </button>
          <button
            onClick={() => router.push('/following')}
            className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-md flex items-center"
          >
            <span className="mr-2">Following</span>
          </button>
          <button
            onClick={() => router.push('/wardrobe/analytics')}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-md flex items-center"
          >
            <span className="mr-2">Analytics</span>
          </button>
          <button
            onClick={() => router.push('/outfits')}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center"
          >
            <span className="mr-2">Outfits</span>
          </button>
          <button
            onClick={() => router.push('/inspiration')}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md flex items-center"
          >
            <span className="mr-2">Inspiration</span>
          </button>
          <button
            onClick={handleCameraClick}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md flex items-center"
          >
            <Camera className="w-5 h-5 mr-2" />
            <span>Add with Camera</span>
          </button>
          <AddItemButton onClick={handleAddItemClick} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
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
        </div>
        
        <div className="space-y-6">
          <WardrobeRankingCard />
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tips for Higher Ranking
            </h2>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Add items across different categories</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Include high-quality photos of your items</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Add detailed descriptions and brands</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Keep your wardrobe updated regularly</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

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