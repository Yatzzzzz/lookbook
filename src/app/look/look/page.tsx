'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tag, X, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import CameraUpload from '../components/camera-upload';
import AudienceSelector, { AudienceType } from '../components/audience-selector';

interface Person {
  id: string;
  name: string;
  avatar: string;
}

interface LookData {
  imageData: string;
  tags: string[];
  audience: AudienceType;
  excludedPeople: Person[];
}

export default function LookPage() {
  const router = useRouter();
  const [step, setStep] = useState<'upload' | 'tags' | 'audience'>('upload');
  const [imageData, setImageData] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [audience, setAudience] = useState<AudienceType>('everyone');
  const [excludedPeople, setExcludedPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle image capture from camera or file upload
  const handleImageCapture = (capturedImageData: string) => {
    setImageData(capturedImageData);
    setStep('tags');
    analyzeImage(capturedImageData);
  };

  // Analyze image for tags using the API
  const analyzeImage = async (imageData: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Call the clothes-finder API to get tags
      const res = await fetch('/api/clothes-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageBase64: imageData,
          mode: 'tag' 
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `API error: ${res.status}`);
      }
      
      const result = await res.json();
      
      if (Array.isArray(result.tags)) {
        setTags(result.tags);
      } else if (typeof result.tags === 'string') {
        // Parse string tags and filter out empty ones
        const parsedTags = result.tags
          .split('\n')
          .map((tag: string) => tag.trim())
          .filter((tag: string) => tag);
        setTags(parsedTags);
      } else {
        setTags([]);
        setError('Could not process analysis results. Please add tags manually.');
      }
    } catch (err: any) {
      console.error('Error analyzing image:', err);
      setError(`${err.message || 'Failed to analyze the image'}. You can add tags manually.`);
    } finally {
      setLoading(false);
    }
  };

  // Add a new tag
  const addTag = () => {
    if (tagInput.trim()) {
      // Avoid duplicate tags
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  // Remove a tag
  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  // Handle tag input key down event
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Go to audience selection step
  const goToAudienceStep = () => {
    setStep('audience');
  };

  // Handle audience selection complete
  const handleAudienceComplete = (selectedAudience: AudienceType, selectedExcludedPeople: Person[]) => {
    setAudience(selectedAudience);
    setExcludedPeople(selectedExcludedPeople);
    
    // In a real application, save the look data to a database
    const lookData: LookData = {
      imageData: imageData!,
      tags,
      audience: selectedAudience,
      excludedPeople: selectedExcludedPeople
    };
    
    console.log('Look data saved:', lookData);
    
    // Return to the main options page
    router.push('/look');
  };

  // Handle back button
  const handleBack = () => {
    if (step === 'tags') {
      setStep('upload');
      setImageData(null);
      setTags([]);
    } else if (step === 'audience') {
      setStep('tags');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Share Your Look</h1>
      
      {/* Step 1: Upload/Camera */}
      {step === 'upload' && (
        <div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Take a photo of your outfit or upload an existing image
          </p>
          <CameraUpload onImageCapture={handleImageCapture} />
        </div>
      )}
      
      {/* Step 2: Tags */}
      {step === 'tags' && imageData && (
        <div>
          <button 
            onClick={handleBack}
            className="mb-4 flex items-center text-blue-500 hover:text-blue-600"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Image preview */}
            <div>
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img 
                  src={imageData} 
                  alt="Your look" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* Tags section */}
            <div>
              <h2 className="text-lg font-medium mb-2">Add Tags</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Tags help people find your look
              </p>
              
              {loading ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-2"></div>
                  <p>Analyzing your image...</p>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="text-sm text-red-500 mb-4">
                      {error}
                    </div>
                  )}
                  
                  {/* Tag input */}
                  <div className="flex mb-3">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagInputKeyDown}
                      placeholder="Add a tag..."
                      className="flex-1 px-3 py-2 border border-green-500 dark:border-green-500 rounded-l-md bg-green-50 dark:bg-green-900/20 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                    <button
                      onClick={addTag}
                      className="px-3 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 flex items-center"
                    >
                      <Tag className="w-4 h-4 mr-1" />
                      Add
                    </button>
                  </div>
                  
                  {/* Tag list */}
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <div
                          key={index}
                          className="flex items-center bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full text-sm"
                        >
                          <span>#{tag}</span>
                          <button
                            onClick={() => removeTag(index)}
                            className="ml-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {tags.length === 0 && (
                        <div className="text-sm text-gray-500 italic">
                          No tags added yet
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Next button */}
                  <button
                    onClick={goToAudienceStep}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center"
                  >
                    Next 
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Step 3: Audience Selection */}
      {step === 'audience' && (
        <div>
          <button 
            onClick={handleBack}
            className="mb-4 flex items-center text-blue-500 hover:text-blue-600"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          
          <AudienceSelector onComplete={handleAudienceComplete} />
        </div>
      )}
    </div>
  );
} 