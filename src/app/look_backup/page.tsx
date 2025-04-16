"use client"

import * as React from 'react'
import { useState, useRef, FormEvent, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

// Interfaces for Vision API results
interface DetectedClothingItem {
    name: string | null | undefined;
    confidence: number | null | undefined;
    boundingBox: Array<{ x: number | null | undefined; y: number | null | undefined }> | null | undefined;
}

interface VisionAnalysisResult {
    isSafe: boolean;
    labels: string[];
    colors: string[];
    error?: string;
    detectedClothing: DetectedClothingItem[];
    dominantColors: Array<{ hex: string; score: number | null | undefined; pixelFraction: number | null | undefined }>;
}

export default function LookUploadPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<VisionAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset states
    setImageFile(null);
    setPreviewUrl(null);
    setImageBase64(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    setUploadError(null);
    setUploadSuccess(null);

    if (file) {
      if (!file.type.startsWith('image/')) {
        setAnalysisError('Please select a valid image file.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setAnalysisError('Image file is too large (max 10MB).');
        return;
      }

      setImageFile(file);

      // Generate Preview and Base64
      const readerPreview = new FileReader();
      readerPreview.onloadend = () => {
        setPreviewUrl(readerPreview.result as string);
      };
      readerPreview.readAsDataURL(file);

      const readerBase64 = new FileReader();
      readerBase64.onloadend = async () => {
        const base64Data = readerBase64.result as string;
        setImageBase64(base64Data);

        // Call Vision API
        setIsAnalyzing(true);
        setAnalysisError(null);
        try {
          const response = await fetch('/api/vision/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64Data }),
          });
          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.error || 'Failed to analyze image.');
          }
          console.log("Vision Analysis Result:", result);
          setAnalysisResult(result); 

          // Check safety immediately
          if (!result.isSafe) {
            setAnalysisError("Image cannot be uploaded as it might contain unsafe content.");
          }

        } catch (e: unknown) {
          console.error("Vision Analysis Error:", e);
          setAnalysisError(e instanceof Error ? e.message : "Error analyzing image.");
          setAnalysisResult(null);
        } finally {
          setIsAnalyzing(false);
        }
      };
      readerBase64.readAsDataURL(file);
    }
  };

  const handleDescriptionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(event.target.value);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!imageFile || !imageBase64 || isAnalyzing || isUploading) {
      setUploadError('Please select an image and wait for analysis to complete.');
      return;
    }
    
    // Prevent upload if analysis failed or deemed unsafe
    if (analysisError || (analysisResult && !analysisResult.isSafe)) {
      setUploadError(analysisError || "Cannot upload potentially unsafe image.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const response = await fetch('/api/looks/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageBase64,
          description: description,
          audience: 'everyone'
        }),
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `Upload failed: ${response.status}`);
      }
      
      setUploadSuccess('Look uploaded successfully!');
      // Reset form
      setImageFile(null);
      setImageBase64(null);
      setPreviewUrl(null);
      setDescription('');
      setAnalysisResult(null);
      
      setTimeout(() => { router.push('/gallery'); }, 1500);
    } catch (e: unknown) {
      console.error('Upload error:', e);
      setUploadError(e instanceof Error ? e.message : 'Failed to upload look.');
    } finally {
      setIsUploading(false);
    }
  };

  // Determine if submit should be disabled
  const isSubmitDisabled = Boolean(isUploading) || 
                          Boolean(isAnalyzing) || 
                          !imageFile || 
                          Boolean(analysisError) || 
                          Boolean(analysisResult && analysisResult.isSafe === false);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Upload Your Look</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-6">
          <button
            type="button"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isAnalyzing}
          >
            {imageFile ? 'Change Image' : 'Select Image'}
          </button>
          
          <input
            type="file"
            accept="image/jpeg, image/png, image/webp, image/gif"
            onChange={handleImageChange}
            ref={fileInputRef}
            className="hidden"
            disabled={isUploading || isAnalyzing}
          />
          
          {previewUrl && (
            <div className="mt-4 flex justify-center">
              <div className="relative w-full max-w-md h-80">
                <Image
                  src={previewUrl}
                  alt="Look Preview"
                  fill
                  style={{ objectFit: 'contain' }}
                  className="rounded-md"
                />
              </div>
            </div>
          )}
          
          {/* Analysis Status */}
          {isAnalyzing && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-600 rounded-md flex items-center">
              <div className="mr-2 animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600"></div>
              Analyzing image...
            </div>
          )}
          
          {analysisError && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
              {analysisError}
            </div>
          )}
          
          {analysisResult && !analysisResult.isSafe && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md font-semibold">
              ⚠️ This image might contain unsafe content and cannot be uploaded.
            </div>
          )}
        </div>
        
        {/* Display Analysis Results */}
        {analysisResult && analysisResult.isSafe && (
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <h4 className="text-lg font-semibold mb-2">Analysis Results:</h4>
            
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-1">Detected Clothing Items:</p>
              <div className="flex flex-wrap gap-2">
                {analysisResult.detectedClothing.length > 0 ? (
                  analysisResult.detectedClothing.map((item, index) => (
                    <span key={index} className="inline-block px-2 py-1 bg-gray-200 text-gray-800 text-xs rounded-md">
                      {item.name} ({Math.round((item.confidence ?? 0) * 100)}%)
                    </span>
                  ))
                ) : (
                  <div className="text-gray-500 text-sm w-full text-center py-2 italic">
                    No clothing items were detected. Would you like to try another image?
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={handleDescriptionChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Add a description for your look..."
            disabled={isUploading || isAnalyzing}
          />
        </div>
        
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={isSubmitDisabled}
        >
          {isUploading ? 'Uploading...' : 'Upload Look'}
        </button>
        
        {uploadError && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
            {uploadError}
          </div>
        )}
        
        {uploadSuccess && (
          <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md">
            {uploadSuccess}
          </div>
        )}
      </form>
    </div>
  );
}
