'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { tryOnOutfit } from '../../lib/klingai';

type TryOnType = 'full' | 'upper' | 'lower';

export default function TryOnLookPage() {
  const params = useParams();
  const router = useRouter();
  const lookId = params?.lookId as string;
  
  const [loading, setLoading] = useState(true);
  const [processingTryOn, setProcessingTryOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookData, setLookData] = useState<any>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [tryOnType, setTryOnType] = useState<TryOnType>('full');
  
  // Fetch the look data
  useEffect(() => {
    async function fetchLookData() {
      try {
        setLoading(true);
        setError(null);
        
        // Use localStorage to get saved user photos for try-on
        const savedPhotos = localStorage.getItem('userTryOnPhotos');
        if (savedPhotos) {
          try {
            const photos = JSON.parse(savedPhotos);
            if (photos.length > 0) {
              setUserImage(photos[0]); // Use the most recent photo
            }
          } catch (e) {
            console.error('Error parsing saved photos:', e);
          }
        }
        
        // Fetch look data from API
        const response = await fetch(`/api/look/${lookId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch look data');
        }
        
        const data = await response.json();
        setLookData(data);
      } catch (err) {
        console.error('Error fetching look data:', err);
        setError('Failed to load look data');
      } finally {
        setLoading(false);
      }
    }
    
    if (lookId) {
      fetchLookData();
    }
  }, [lookId]);
  
  // Handle file upload for user photo
  const handleUserPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          // Save the photo to state
          setUserImage(event.target.result);
          
          // Also save to localStorage for future use
          try {
            const savedPhotos = localStorage.getItem('userTryOnPhotos');
            const photos = savedPhotos ? JSON.parse(savedPhotos) : [];
            photos.unshift(event.target.result); // Add to beginning of array
            
            // Limit to 5 photos to avoid storage issues
            const limitedPhotos = photos.slice(0, 5);
            localStorage.setItem('userTryOnPhotos', JSON.stringify(limitedPhotos));
          } catch (e) {
            console.error('Error saving photos to localStorage:', e);
          }
        }
      };
      
      reader.readAsDataURL(file);
    }
  };
  
  // Process the virtual try-on
  const handleTryOn = async () => {
    if (!userImage || !lookData?.image_url) {
      setError('Both your photo and the look image are required');
      return;
    }
    
    setProcessingTryOn(true);
    setError(null);
    
    try {
      // Option 1: Use the client-side utility that calls the API
      const result = await tryOnOutfit({
        userImageUrl: userImage,
        outfitImageUrl: lookData.image_url,
        tryOnType: tryOnType,
      });
      
      setResultImage(result);
      
      // Option 2: Direct API call (alternative approach)
      /*
      const response = await fetch('/api/tryon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: userImage,
          outfitUrl: lookData.image_url,
          type: tryOnType,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process virtual try-on');
      }
      
      setResultImage(data.resultImageUrl);
      */
    } catch (err: any) {
      console.error('Virtual try-on error:', err);
      setError(err.message || 'An error occurred during virtual try-on');
    } finally {
      setProcessingTryOn(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Virtual Try-On</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Virtual Try-On</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md"
        >
          Go Back
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Virtual Try-On</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Look Image */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <h2 className="text-xl font-semibold p-4 bg-gray-50 dark:bg-gray-700">Look</h2>
          <div className="p-4">
            {lookData?.image_url ? (
              <img 
                src={lookData.image_url} 
                alt="Look to try on" 
                className="w-full h-auto object-contain aspect-[3/4]"
              />
            ) : (
              <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center">
                <p className="text-gray-500">Image not available</p>
              </div>
            )}
            <div className="mt-2 text-sm text-gray-500">
              {lookData?.title && <p className="font-medium">{lookData.title}</p>}
              {lookData?.description && <p>{lookData.description}</p>}
            </div>
          </div>
        </div>
        
        {/* User Photo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <h2 className="text-xl font-semibold p-4 bg-gray-50 dark:bg-gray-700">Your Photo</h2>
          <div className="p-4">
            <div className="aspect-[3/4] bg-gray-100 mb-3 flex items-center justify-center">
              {userImage ? (
                <img 
                  src={userImage} 
                  alt="Your photo" 
                  className="w-full h-auto object-contain"
                />
              ) : (
                <div className="text-center text-gray-400">
                  <p>Upload your photo</p>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleUserPhotoUpload}
              className="w-full"
            />
          </div>
        </div>
        
        {/* Try-On Result */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <h2 className="text-xl font-semibold p-4 bg-gray-50 dark:bg-gray-700">Result</h2>
          <div className="p-4">
            <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center">
              {processingTryOn ? (
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                  <p className="mt-2">Processing...</p>
                </div>
              ) : resultImage ? (
                <img 
                  src={resultImage} 
                  alt="Try-On Result" 
                  className="w-full h-auto object-contain" 
                />
              ) : (
                <div className="text-center text-gray-400">
                  <p>Try-on result will appear here</p>
                </div>
              )}
            </div>
            
            {resultImage && (
              <div className="mt-3">
                <a 
                  href={resultImage} 
                  download="virtual-tryon-result.jpg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-green-500 text-white rounded-md block text-center"
                >
                  Save Result
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <h2 className="text-xl font-semibold mb-4">Try-On Options</h2>
        
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Try-On Type</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTryOnType('full')}
              className={`px-4 py-2 rounded-md ${tryOnType === 'full' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Full Outfit
            </button>
            <button
              onClick={() => setTryOnType('upper')}
              className={`px-4 py-2 rounded-md ${tryOnType === 'upper' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Upper Body
            </button>
            <button
              onClick={() => setTryOnType('lower')}
              className={`px-4 py-2 rounded-md ${tryOnType === 'lower' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Lower Body
            </button>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleTryOn}
            disabled={!userImage || !lookData?.image_url || processingTryOn}
            className={`px-6 py-2 rounded-md ${
              !userImage || !lookData?.image_url || processingTryOn
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {processingTryOn ? 'Processing...' : 'Try It On'}
          </button>
          
          <Link 
            href="/gallery"
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
          >
            Back to Gallery
          </Link>
        </div>
      </div>
    </div>
  );
} 