import React, { useState } from 'react';
import CameraComponent, { MediaCaptureResult } from './CameraComponent';

// Wardrobe Example: Adding a new item to wardrobe with automatic tagging
export const WardrobeCameraExample = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedItem, setCapturedItem] = useState<MediaCaptureResult | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    style: '',
    color: '',
    season: '',
    material: ''
  });

  const handleCapture = (media: MediaCaptureResult) => {
    setCapturedItem(media);
    setShowCamera(false);
    
    // Auto-populate form fields based on AI tags if available
    if (media.tags) {
      // Example mapping of AI tags to form fields
      const tagMap: Record<string, string> = {
        'Dress': 'category',
        'Top': 'category',
        'Blouse': 'category',
        'Shirt': 'category',
        'Pants': 'category',
        'Jeans': 'category',
        'Skirt': 'category',
        'Casual': 'style',
        'Formal': 'style',
        'Business': 'style',
        'Sport': 'style',
        'Summer': 'season',
        'Winter': 'season',
        'Spring': 'season',
        'Fall': 'season',
        'Cotton': 'material',
        'Linen': 'material',
        'Denim': 'material',
        'Silk': 'material',
        'Blue': 'color',
        'Red': 'color',
        'Black': 'color',
        'White': 'color'
      };
      
      // Update form with tag values
      const newFormData = { ...formData };
      media.tags.forEach(tag => {
        const field = tagMap[tag];
        if (field && !newFormData[field as keyof typeof newFormData]) {
          newFormData[field as keyof typeof newFormData] = tag;
        }
      });
      
      setFormData(newFormData);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Add Item to Wardrobe</h2>
      
      {showCamera ? (
        <CameraComponent 
          onMediaCapture={handleCapture}
          onCancel={() => setShowCamera(false)}
          allowVideo={false} // Only photos for wardrobe items
          enableAITagging={true}
          taggingContext="wardrobe"
        />
      ) : (
        <div className="space-y-4">
          {/* Preview of captured image */}
          {capturedItem && (
            <div className="mb-4">
              <div className="relative aspect-square w-full max-w-md mx-auto mb-2 rounded-lg overflow-hidden">
                <img 
                  src={capturedItem.preview} 
                  alt="Item" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              {capturedItem.tags && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {capturedItem.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Item form */}
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-2 border rounded-md" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input 
                type="text" 
                value={formData.category} 
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full p-2 border rounded-md" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Style</label>
              <input 
                type="text" 
                value={formData.style} 
                onChange={(e) => setFormData({...formData, style: e.target.value})}
                className="w-full p-2 border rounded-md" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <input 
                type="text" 
                value={formData.color} 
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                className="w-full p-2 border rounded-md" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Season</label>
              <input 
                type="text" 
                value={formData.season} 
                onChange={(e) => setFormData({...formData, season: e.target.value})}
                className="w-full p-2 border rounded-md" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Material</label>
              <input 
                type="text" 
                value={formData.material} 
                onChange={(e) => setFormData({...formData, material: e.target.value})}
                className="w-full p-2 border rounded-md" 
              />
            </div>
            
            <div className="flex space-x-4">
              <button 
                type="button"
                onClick={() => setShowCamera(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center"
              >
                {capturedItem ? 'Retake Photo' : 'Take Photo'}
              </button>
              
              <button 
                type="button"
                className="px-4 py-2 bg-green-600 text-white rounded-md"
              >
                Save Item
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// Search Example: Capturing an image to search for similar items
export const SearchCameraExample = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<MediaCaptureResult | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [priceFilter, setPriceFilter] = useState<string | null>(null);

  const handleCapture = (media: MediaCaptureResult) => {
    setCapturedMedia(media);
    setShowCamera(false);
    // Simulate search
    performSearch(media);
  };

  // Mock search function
  const performSearch = (media: MediaCaptureResult) => {
    setIsSearching(true);
    
    // Simulate API delay
    setTimeout(() => {
      // Mock search results
      setSearchResults([
        { id: 1, name: 'Similar Dress', price: 99, image: '/Background/alexandra-leru-8HeCH1kKmbs-unsplash.jpg' },
        { id: 2, name: 'Designer Blouse', price: 199, image: '/Background/annalisa-overgaard-haXoAIkEbQo-unsplash.jpg' },
        { id: 3, name: 'Premium Top', price: 299, image: '/Background/artur-rekstad-5PlT4DFk8Jo-unsplash.jpg' },
        { id: 4, name: 'Luxury Outfit', price: 399, image: '/Background/cristian-cojocarita-Waz2eaTB0IY-unsplash.jpg' },
      ]);
      
      setIsSearching(false);
    }, 2000);
  };

  const filterByPrice = (price: string) => {
    setPriceFilter(price === priceFilter ? null : price);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Find Similar Items</h2>
      
      {showCamera ? (
        <CameraComponent 
          onMediaCapture={handleCapture}
          onCancel={() => setShowCamera(false)}
          allowVideo={false}
          enableAITagging={true}
          taggingContext="search"
        />
      ) : (
        <div>
          {/* Search section */}
          <div className="mb-8">
            {capturedMedia ? (
              <div className="relative aspect-square w-full max-w-md mx-auto mb-4 rounded-lg overflow-hidden">
                <img 
                  src={capturedMedia.preview} 
                  alt="Search reference" 
                  className="w-full h-full object-cover"
                />
                
                {capturedMedia.tags && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-3">
                    <div className="flex flex-wrap gap-2">
                      {capturedMedia.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-600 text-white rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex justify-center mb-4">
                <button 
                  onClick={() => setShowCamera(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center"
                >
                  Take a Photo to Search
                </button>
              </div>
            )}
            
            {capturedMedia && (
              <div className="flex justify-center space-x-4 mb-4">
                <button 
                  onClick={() => setShowCamera(true)}
                  className="px-4 py-2 bg-gray-200 rounded-md"
                >
                  New Search
                </button>
              </div>
            )}
          </div>
          
          {/* Results section */}
          {capturedMedia && (
            <div>
              {/* Price filters */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-sm font-medium mr-2">Price range:</span>
                {['$99', '$199', '$299', '$399'].map((price) => (
                  <button 
                    key={price}
                    onClick={() => filterByPrice(price)}
                    className={`px-3 py-1 rounded-full text-sm border ${priceFilter === price 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-800 border-gray-300'}`}
                  >
                    {price}
                  </button>
                ))}
              </div>
              
              {isSearching ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                  <p>Searching for similar items...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {searchResults
                    .filter(item => !priceFilter || `$${item.price}` === priceFilter)
                    .map(item => (
                      <div key={item.id} className="border rounded-lg overflow-hidden">
                        <div className="aspect-square relative">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-3">
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-blue-600 font-bold">${item.price}</p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Social Post Example: Creating a post with image/video and editing
export const SocialPostCameraExample = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<MediaCaptureResult | null>(null);
  const [caption, setCaption] = useState('');
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null);
  const [showBackgrounds, setShowBackgrounds] = useState(false);
  
  // Sample backgrounds from your public directory
  const backgrounds = [
    '/Background/alexandra-leru-8HeCH1kKmbs-unsplash.jpg',
    '/Background/annalisa-overgaard-haXoAIkEbQo-unsplash.jpg',
    '/Background/artur-rekstad-5PlT4DFk8Jo-unsplash.jpg',
    '/Background/cristian-cojocarita-Waz2eaTB0IY-unsplash.jpg',
    '/Background/elisaveta-bunduche-hhQglLJxVKs-unsplash.jpg',
    '/Background/hey-porter-HtlsIQN7eDM-unsplash.jpg'
  ];

  const handleCapture = (media: MediaCaptureResult) => {
    setCapturedMedia(media);
    setShowCamera(false);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Create Post</h2>
      
      {showCamera ? (
        <CameraComponent 
          onMediaCapture={handleCapture}
          onCancel={() => setShowCamera(false)}
          allowVideo={true} // Allow both photo and video
          maxDuration={60} // 1 minute max
          enableAITagging={true}
          taggingContext="general"
        />
      ) : (
        <div>
          {capturedMedia ? (
            <div className="space-y-4">
              {/* Media preview */}
              <div className="relative">
                <div className={`w-full rounded-lg overflow-hidden ${selectedBackground ? 'aspect-square' : ''}`}>
                  {selectedBackground && (
                    <img 
                      src={selectedBackground} 
                      alt="Background" 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  
                  <div className={`${selectedBackground ? 'absolute inset-0 flex items-center justify-center' : ''}`}>
                    {capturedMedia.type === 'image' ? (
                      <img 
                        src={capturedMedia.preview} 
                        alt="Post media" 
                        className={`${selectedBackground ? 'max-w-[80%] max-h-[80%] object-contain' : 'w-full'}`}
                      />
                    ) : (
                      <video 
                        src={capturedMedia.preview} 
                        controls 
                        className="w-full"
                      />
                    )}
                  </div>
                </div>
                
                {/* Edit buttons */}
                <div className="absolute bottom-4 right-4 flex space-x-2">
                  <button
                    onClick={() => setShowBackgrounds(!showBackgrounds)}
                    className="p-2 bg-black bg-opacity-70 rounded-full"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Background selector */}
              {showBackgrounds && (
                <div className="bg-gray-100 p-3 rounded-lg">
                  <h3 className="text-sm font-medium mb-2">Choose Background</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div 
                      className={`aspect-square bg-white rounded cursor-pointer ${!selectedBackground ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => setSelectedBackground(null)}
                    >
                      <div className="flex items-center justify-center h-full text-gray-400">
                        None
                      </div>
                    </div>
                    
                    {backgrounds.map((bg, i) => (
                      <div 
                        key={i}
                        className={`aspect-square rounded overflow-hidden cursor-pointer ${selectedBackground === bg ? 'ring-2 ring-blue-500' : ''}`}
                        onClick={() => setSelectedBackground(bg)}
                      >
                        <img src={bg} alt={`Background ${i+1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Caption input */}
              <div>
                <textarea
                  placeholder="Write a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full p-3 border rounded-lg resize-none"
                  rows={3}
                />
              </div>
              
              {/* AI suggested tags */}
              {capturedMedia.tags && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Suggested tags:</h3>
                  <div className="flex flex-wrap gap-2">
                    {capturedMedia.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                        #{tag.toLowerCase().replace(' ', '')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Action buttons */}
              <div className="flex space-x-4">
                <button 
                  onClick={() => {
                    setCapturedMedia(null);
                    setCaption('');
                    setSelectedBackground(null);
                    setShowBackgrounds(false);
                  }}
                  className="px-4 py-2 border rounded-md"
                >
                  Discard
                </button>
                
                <button 
                  onClick={() => setShowCamera(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  Retake
                </button>
                
                <button 
                  className="px-4 py-2 bg-green-600 text-white rounded-md ml-auto"
                >
                  Post
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <p className="text-gray-600">Take a photo or video for your post</p>
              <button 
                onClick={() => setShowCamera(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Open Camera
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Example Usage Component
const CameraComponentExamples = () => {
  const [activeTab, setActiveTab] = useState<'wardrobe' | 'search' | 'social'>('wardrobe');
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Camera Component Examples</h1>
      
      {/* Tab navigation */}
      <div className="flex border-b mb-6">
        <button 
          onClick={() => setActiveTab('wardrobe')}
          className={`px-4 py-2 ${activeTab === 'wardrobe' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
        >
          Wardrobe
        </button>
        <button 
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 ${activeTab === 'search' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
        >
          Search
        </button>
        <button 
          onClick={() => setActiveTab('social')}
          className={`px-4 py-2 ${activeTab === 'social' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
        >
          Social Post
        </button>
      </div>
      
      {/* Active example */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {activeTab === 'wardrobe' && <WardrobeCameraExample />}
        {activeTab === 'search' && <SearchCameraExample />}
        {activeTab === 'social' && <SocialPostCameraExample />}
      </div>
    </div>
  );
};

export default CameraComponentExamples; 