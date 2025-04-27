'use client';

import * as Dialog from '@radix-ui/react-dialog';
import * as Label from '@radix-ui/react-label';
import { X, Upload, Loader2, Wand2, ChevronDown, ChevronRight, Camera, Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import * as Tabs from '@radix-ui/react-tabs';
import * as Collapsible from '@radix-ui/react-collapsible';
import { OnboardingFlow } from '../../components/wardrobe/onboarding-flow';
import { BarcodeScanner } from '../../components/wardrobe/barcode-scanner';
import { WebImageImporter } from '../../components/wardrobe/web-image-importer';

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
  
  // New state for enhanced fields
  const [visibility, setVisibility] = useState('private');
  const [brandUrl, setBrandUrl] = useState('');
  const [size, setSize] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [material, setMaterial] = useState('');
  const [season, setSeason] = useState<string[]>([]);
  const [occasion, setOccasion] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);

  // AI tagging state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add state for advanced mode and onboarding
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showAlternateInputs, setShowAlternateInputs] = useState(false);
  const [showOnboardingFlow, setShowOnboardingFlow] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showWebImporter, setShowWebImporter] = useState(false);
  const [quickAddMode, setQuickAddMode] = useState(true);

  // Function to analyze clothing with AI
  const analyzeClothingImage = async (imageBase64: string) => {
    if (!aiEnabled) return;
    
    try {
      setIsAnalyzing(true);
      setError(null);
      
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
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze image');
      }
      
      const { tags } = await response.json();
      
      if (tags && Array.isArray(tags)) {
        console.log("AI Tags:", tags);
        
        // Auto-populate fields based on detected tags
        // Try to find category
        const categories = {
          'top': ['shirt', 'blouse', 't-shirt', 'sweater', 'top', 'hoodie', 'sweatshirt', 'tank'],
          'bottom': ['pants', 'jeans', 'shorts', 'skirt', 'trousers', 'leggings', 'bottom'],
          'dress': ['dress', 'gown'],
          'outerwear': ['jacket', 'coat', 'blazer', 'cardigan', 'outerwear'],
          'shoes': ['shoes', 'sneakers', 'boots', 'heels', 'sandals', 'footwear'],
          'accessories': ['hat', 'scarf', 'gloves', 'jewelry', 'watch', 'accessory', 'accessories', 'necklace', 'bracelet'],
          'bags': ['bag', 'purse', 'backpack', 'handbag', 'tote']
        };
        
        // Store found item details
        let foundColor = '';
        let foundCategory = '';
        let foundStyle = '';
        let foundBrand = '';
        let foundDescription = '';
        let foundMaterial = '';
        let suggestedSeason: string[] = [];
        let suggestedOccasion: string[] = [];
        
        // Join all tags into one string for easier searching
        const allText = tags.join(' ').toLowerCase();
        
        // Find category
        for (const [category, keywords] of Object.entries(categories)) {
          for (const keyword of keywords) {
            if (allText.includes(keyword.toLowerCase())) {
              foundCategory = category;
              break;
            }
          }
          if (foundCategory) break;
        }
        
        // Basic name detection - use first item or most prominent item
        if (tags.length > 0) {
          // Clean up the first tag for a name
          const cleanName = tags[0].replace(/^[\d\.\-\*]+\s*/, '').trim()
            .split(',')[0] // Take only first part before any comma
            .replace(/^a\s+|^an\s+|^the\s+/i, ''); // Remove articles
            
          setName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
        }
        
        // Detect colors
        const colors = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'purple', 'pink', 
                       'orange', 'brown', 'gray', 'navy', 'beige', 'teal', 'maroon', 'burgundy'];
        for (const color of colors) {
          if (allText.includes(color)) {
            foundColor = color.charAt(0).toUpperCase() + color.slice(1);
            break;
          }
        }
        
        // Detect season
        const seasons = {
          'summer': ['summer', 'hot', 'beach', 'light', 'tropical'],
          'winter': ['winter', 'cold', 'warm', 'thick', 'snow', 'cozy'],
          'spring': ['spring', 'floral', 'rain', 'light'],
          'fall': ['fall', 'autumn', 'layering', 'cool']
        };
        
        for (const [season, keywords] of Object.entries(seasons)) {
          for (const keyword of keywords) {
            if (allText.includes(keyword)) {
              suggestedSeason.push(season);
              break;
            }
          }
        }
        
        // Detect occasions
        const occasions = {
          'casual': ['casual', 'everyday', 'street', 'lounge', 'relaxed'],
          'formal': ['formal', 'business', 'dressy', 'elegant', 'professional'],
          'work': ['work', 'office', 'business', 'professional'],
          'party': ['party', 'club', 'night out', 'festive', 'celebration'],
          'sport': ['sport', 'athletic', 'workout', 'gym', 'exercise'],
          'travel': ['travel', 'vacation', 'outdoor', 'adventure']
        };
        
        for (const [occasion, keywords] of Object.entries(occasions)) {
          for (const keyword of keywords) {
            if (allText.includes(keyword)) {
              suggestedOccasion.push(occasion);
              break;
            }
          }
        }
        
        // Detect materials
        const materials = ['cotton', 'silk', 'leather', 'denim', 'wool', 'linen', 'polyester', 
                          'nylon', 'cashmere', 'velvet', 'suede', 'satin'];
        
        for (const material of materials) {
          if (allText.includes(material)) {
            foundMaterial += material + ', ';
          }
        }
        
        // Clean up material string
        if (foundMaterial) {
          foundMaterial = foundMaterial.slice(0, -2); // Remove trailing comma and space
        }
        
        // Set the detected values
        if (foundCategory) setCategory(foundCategory);
        if (foundColor) setColor(foundColor);
        if (foundStyle) setStyle(foundStyle);
        if (foundBrand) setBrand(foundBrand);
        if (foundMaterial) setMaterial(foundMaterial);
        if (suggestedSeason.length > 0) setSeason(suggestedSeason);
        if (suggestedOccasion.length > 0) setOccasion(suggestedOccasion);
        
        // Generate a description from tags
        setDescription(tags.slice(0, 3).join('. '));
      }
    } catch (err: any) {
      console.error('Error analyzing image:', err);
      setError(`AI analysis error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

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
      const preview = reader.result as string;
      setImagePreview(preview);
      
      // Automatically analyze the image if AI is enabled
      if (aiEnabled) {
        analyzeClothingImage(preview);
      }
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
    
    // Reset new fields
    setVisibility('private');
    setBrandUrl('');
    setSize('');
    setPurchaseDate('');
    setPurchasePrice('');
    setMaterial('');
    setSeason([]);
    setOccasion([]);
    setFeatured(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      
      // Validate required fields
      if (!name.trim()) {
        setError('Item name is required');
        return;
      }
      
      if (!category) {
        setError('Category is required');
        return;
      }
      
      setIsUploading(true);

      // Upload image if selected
      let imagePath = '';
      if (imageFile) {
        try {
          imagePath = await uploadImage(imageFile);
        } catch (imageError: any) {
          console.error('Error uploading image:', imageError);
          setError(imageError.message || 'Failed to upload image');
          setIsUploading(false);
          return;
        }
      }

      // Prepare the item data with new fields
      const itemData = {
        name: name.trim(),
        category,
        color: color || undefined,
        brand: brand || undefined,
        style: style || undefined,
        description: description || undefined,
        image_path: imagePath || undefined,
        // Add new fields
        visibility,
        brand_url: brandUrl || undefined,
        size: size || undefined,
        purchase_date: purchaseDate || undefined,
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : undefined,
        material: material ? material.split(',').map(m => m.trim()) : [],
        season,
        occasion,
        featured,
        metadata: {
          source: 'manual_entry',
          ai_detected: aiEnabled && imagePreview ? true : false
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
        
        // Reset form and close modal
        resetForm();
        onClose();
      } catch (apiError: any) {
        console.error('API error, falling back to client method:', apiError);
        try {
          // Fallback to the client-side method
          await addItem(itemData);
          
          // If successful, reset form and close modal
          resetForm();
          onClose();
        } catch (clientError: any) {
          console.error('Client method also failed:', clientError);
          setError(clientError.message || 'Failed to add item');
        }
      }
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

  // Helper function to handle season and occasion selection
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

  // Add an effect to listen for pre-populated data from camera analysis
  useEffect(() => {
    const handlePrePopulateEvent = (event: CustomEvent) => {
      const itemData = event.detail;
      if (itemData) {
        // Pre-populate form fields with analyzed data
        if (itemData.name) setName(itemData.name);
        if (itemData.category) setCategory(itemData.category);
        if (itemData.color) setColor(itemData.color);
        if (itemData.brand) setBrand(itemData.brand);
        if (itemData.material) setMaterial(itemData.material);
        if (itemData.description) setDescription(itemData.description);
        if (itemData.brandUrl) setBrandUrl(itemData.brandUrl);
        
        // Handle image preview and file
        if (itemData.imageFile) setImageFile(itemData.imageFile);
        if (itemData.imagePreview) setImagePreview(itemData.imagePreview);
      }
    };
    
    window.addEventListener('prePopulateWardrobeItem', handlePrePopulateEvent as EventListener);
    
    return () => {
      window.removeEventListener('prePopulateWardrobeItem', handlePrePopulateEvent as EventListener);
    };
  }, []);

  // Add handlers for onboarding components
  const handleProductFound = (product: any) => {
    // Set the form data from the product
    setName(product.name || '');
    setCategory(product.category || '');
    setColor(product.color || '');
    setBrand(product.brand || '');
    setDescription(product.description || '');
    
    // If the product has an image URL, fetch and set it
    if (product.image_url) {
      fetchImageFromUrl(product.image_url);
    }
    
    // Set additional fields if available
    if (product.material) setMaterial(product.material);
    if (product.style) setStyle(product.style);
    
    // Close the modal that provided the product
    setShowBarcodeScanner(false);
    setShowWebImporter(false);
  };

  // Function to fetch image from URL and convert to File
  const fetchImageFromUrl = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const fileName = url.split('/').pop() || 'image.jpg';
      const file = new File([blob], fileName, { type: blob.type });
      
      setImageFile(file);
      
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error fetching image:', error);
      setError('Failed to fetch image from URL');
    }
  };

  // Add a "quick add" mode which only shows essential fields
  const renderQuickAddForm = () => (
    <div className="space-y-4">
      <div className="mb-6 flex justify-center">
        <div
          className="relative w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden cursor-pointer"
          onClick={triggerFileInput}
        >
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <Upload className="h-6 w-6 text-gray-400" />
              <span className="text-xs text-gray-500 mt-2">Upload Image</span>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label.Root htmlFor="name" className="block text-sm font-medium mb-2">
            Name *
          </Label.Root>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g., Blue T-shirt"
            required
          />
        </div>

        <div>
          <Label.Root htmlFor="category" className="block text-sm font-medium mb-2">
            Category *
          </Label.Root>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          >
            <option value="" disabled>Select category</option>
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

        <div>
          <Label.Root htmlFor="color" className="block text-sm font-medium mb-2">
            Color
          </Label.Root>
          <input
            id="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g., Blue"
          />
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        <button
          type="button"
          onClick={() => setShowAdvancedOptions(true)}
          className="text-sm text-blue-600 dark:text-blue-400 flex items-center"
        >
          <ChevronRight size={16} className="mr-1" />
          Show Advanced Options
        </button>

        <button
          type="button"
          onClick={() => setShowAlternateInputs(!showAlternateInputs)}
          className="text-sm text-gray-600 dark:text-gray-400 flex items-center"
        >
          <ChevronDown size={16} className={`mr-1 transition-transform ${showAlternateInputs ? 'rotate-180' : ''}`} />
          Other Ways to Add
        </button>
      </div>

      {/* Alternate input methods */}
      {showAlternateInputs && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setShowBarcodeScanner(true)}
            className="flex items-center justify-center p-3 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Camera size={18} className="mr-2 text-blue-500" />
            <span className="text-sm">Scan Barcode</span>
          </button>
          <button
            type="button"
            onClick={() => setShowWebImporter(true)}
            className="flex items-center justify-center p-3 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Globe size={18} className="mr-2 text-blue-500" />
            <span className="text-sm">Import from Web</span>
          </button>
        </div>
      )}
    </div>
  );

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
              <div className="flex justify-between items-center">
                <Label.Root
                  htmlFor="image"
                  className="text-sm font-medium text-gray-700"
                >
                  Image
                </Label.Root>
                <div className="flex items-center space-x-2">
                  <Label.Root
                    htmlFor="ai-toggle"
                    className="text-xs font-medium text-gray-500"
                  >
                    AI Auto-Tag
                  </Label.Root>
                  <button
                    type="button"
                    id="ai-toggle"
                    onClick={() => setAiEnabled(!aiEnabled)}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full ${
                      aiEnabled ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                    aria-checked={aiEnabled}
                    role="switch"
                  >
                    <span
                      className={`${
                        aiEnabled ? 'translate-x-5' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                    />
                  </button>
                </div>
              </div>

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
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-md">
                        <div className="bg-white p-2 rounded-md flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                          <span className="text-xs font-medium">Analyzing image...</span>
                        </div>
                      </div>
                    )}
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
                    {aiEnabled && (
                      <p className="text-xs text-blue-500 flex items-center mt-2">
                        <Wand2 className="w-3 h-3 mr-1" />
                        AI will analyze your image and suggest tags
                      </p>
                    )}
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

            {/* Enhanced Fields */}
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
                htmlFor="brandUrl"
                className="text-sm font-medium text-gray-700"
              >
                Brand URL
              </Label.Root>
              <input
                id="brandUrl"
                type="text"
                value={brandUrl}
                onChange={(e) => setBrandUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label.Root
                htmlFor="size"
                className="text-sm font-medium text-gray-700"
              >
                Size
              </Label.Root>
              <input
                id="size"
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label.Root
                htmlFor="purchaseDate"
                className="text-sm font-medium text-gray-700"
              >
                Purchase Date
              </Label.Root>
              <input
                id="purchaseDate"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label.Root
                htmlFor="purchasePrice"
                className="text-sm font-medium text-gray-700"
              >
                Purchase Price
              </Label.Root>
              <input
                id="purchasePrice"
                type="text"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label.Root
                htmlFor="material"
                className="text-sm font-medium text-gray-700"
              >
                Material
              </Label.Root>
              <input
                id="material"
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label.Root
                htmlFor="season"
                className="text-sm font-medium text-gray-700"
              >
                Season
              </Label.Root>
              <select
                id="season"
                value={season}
                onChange={(e) => handleArrayFieldChange('season', e.target.value, setSeason)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                multiple
              >
                <option value="spring">Spring</option>
                <option value="summer">Summer</option>
                <option value="fall">Fall</option>
                <option value="winter">Winter</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label.Root
                htmlFor="occasion"
                className="text-sm font-medium text-gray-700"
              >
                Occasion
              </Label.Root>
              <select
                id="occasion"
                value={occasion}
                onChange={(e) => handleArrayFieldChange('occasion', e.target.value, setOccasion)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                multiple
              >
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
                <option value="work">Work</option>
                <option value="party">Party</option>
                <option value="sport">Sport</option>
                <option value="travel">Travel</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label.Root
                htmlFor="featured"
                className="text-sm font-medium text-gray-700"
              >
                Featured
              </Label.Root>
              <input
                id="featured"
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 text-blue-500"
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