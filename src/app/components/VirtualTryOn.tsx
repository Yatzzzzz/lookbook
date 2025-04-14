'use client';

import { useState } from 'react';

type TryOnType = 'full' | 'upper' | 'lower';

export default function VirtualTryOn() {
  const [userImage, setUserImage] = useState<string | null>(null);
  const [clothingImage, setClothingImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [tryOnType, setTryOnType] = useState<TryOnType>('full');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelVersion, setModelVersion] = useState<'v1' | 'v1.5'>('v1.5');

  const handleUserImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setUserImage(event.target.result);
          setError(null);
        }
      };

      reader.readAsDataURL(file);
    }
  };

  const handleClothingImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setClothingImage(event.target.result);
          setError(null);
        }
      };

      reader.readAsDataURL(file);
    }
  };

  const handleTryOn = async () => {
    if (!userImage || !clothingImage) {
      setError('Both your photo and a clothing item are required');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultImage(null);

    try {
      const response = await fetch('/api/tryon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: userImage,
          outfitBase64: clothingImage,
          type: tryOnType,
          modelVersion: modelVersion
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process virtual try-on');
      }

      setResultImage(data.resultImageUrl);
    } catch (err: any) {
      setError(err.message || 'An error occurred during virtual try-on');
      console.error('Virtual try-on error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setUserImage(null);
    setClothingImage(null);
    setResultImage(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Virtual Try-On</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* User Image Section */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-medium mb-2">Your Photo</h2>
          <div className="aspect-[3/4] bg-gray-100 mb-2 flex items-center justify-center">
            {userImage ? (
              <img
                src={userImage}
                alt="User"
                className="max-h-full max-w-full object-contain"
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
            onChange={handleUserImageChange}
            className="w-full"
          />
        </div>

        {/* Clothing Image Section */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-medium mb-2">Clothing Item</h2>
          <div className="aspect-[3/4] bg-gray-100 mb-2 flex items-center justify-center">
            {clothingImage ? (
              <img
                src={clothingImage}
                alt="Clothing"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="text-center text-gray-400">
                <p>Upload clothing item</p>
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleClothingImageChange}
            className="w-full"
          />
        </div>

        {/* Result Image Section */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-medium mb-2">Result</h2>
          <div className="aspect-[3/4] bg-gray-100 mb-2 flex items-center justify-center">
            {isLoading ? (
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                <p className="mt-2">Processing...</p>
              </div>
            ) : resultImage ? (
              <img
                src={resultImage}
                alt="Try-On Result"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="text-center text-gray-400">
                <p>Try-on result will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-2">Try-On Type</h2>
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

      {/* Model Version Section */}
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-2">AI Model Version</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setModelVersion('v1.5')}
            className={`px-4 py-2 rounded-md ${modelVersion === 'v1.5' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Latest (v1.5)
          </button>
          <button
            onClick={() => setModelVersion('v1')}
            className={`px-4 py-2 rounded-md ${modelVersion === 'v1' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Standard (v1)
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleTryOn}
          disabled={!userImage || !clothingImage || isLoading}
          className={`px-6 py-2 rounded-md ${
            !userImage || !clothingImage || isLoading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isLoading ? 'Processing...' : 'Try It On'}
        </button>

        <button
          onClick={handleReset}
          className="px-6 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
        >
          Reset
        </button>
      </div>

      {/* Save Button (only show when there's a result) */}
      {resultImage && (
        <div className="mt-4">
          <a 
            href={resultImage} 
            download="virtual-tryon-result.jpg"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 inline-block"
          >
            Save Result
          </a>
        </div>
      )}
    </div>
  );
} 