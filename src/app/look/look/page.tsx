'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tag, X, ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import CameraUpload from '../components/camera-upload';
import AudienceSelector, { AudienceType } from '../components/audience-selector';
import SupabaseImage from '@/components/ui/supabase-image';

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
  const handleAudienceComplete = async (selectedAudience: AudienceType, selectedExcludedPeople: Person[]) => {
    setAudience(selectedAudience);
    setExcludedPeople(selectedExcludedPeople);
    setLoading(true);
    
    try {
      // First, upload the image to Supabase storage
      const base64Data = imageData!.split(',')[1];
      const byteArray = Buffer.from(base64Data, 'base64');
      
      // Generate a unique file name
      const fileName = `look_${Date.now()}.jpg`;
      
      // Upload to Supabase storage
      const { data: storageData, error: storageError } = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          fileData: imageData,
        }),
      }).then(res => res.json());
      
      if (storageError) {
        throw new Error(`Storage error: ${storageError.message}`);
      }
      
      // Now save the look data to the database
      const { data: { publicUrl } } = await fetch('/api/public-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath: storageData.path,
        }),
      }).then(res => res.json());
      
      // Get current user information including username
      const { data: userData, error: userError } = await fetch('/api/user/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(res => res.json());
      
      if (userError) {
        console.error("Error fetching user data:", userError);
      }
      
      // Save look metadata to the database
      const lookData = {
        image_url: publicUrl,
        tags: tags,
        audience: selectedAudience,
        // Store the file name separately to make it retrievable by the details page
        file_name: fileName,
        feature_in: ['gallery'], // Explicitly mark this look to appear in the gallery
        // Include username directly with the look if available
        username: userData?.username || null,
      };
      
      const { data: dbData, error: dbError } = await fetch('/api/looks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lookData),
      }).then(res => res.json());
      
      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }
      
      console.log('Look data saved successfully:', dbData);
      
      // Return to the main options page
      router.push('/look');
    } catch (err) {
      console.error('Error saving look:', err);
      setError(err instanceof Error ? err.message : 'Failed to save your look');
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-background">
      <div className="container pb-16">
        {/* Handle different steps */}
        {step === 'upload' && (
          <div className="pt-4">
            <h1 className="text-2xl font-bold mb-4">Upload a Look</h1>
            <CameraUpload onImageCapture={handleImageCapture} />
          </div>
        )}

        {step === 'tags' && (
          <div className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Add Tags</h1>
              <button 
                onClick={goToAudienceStep}
                className="px-4 py-2 bg-primary text-white rounded-lg flex items-center"
              >
                <span>Next</span>
                <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>
            
            {imageData && (
              <div className="relative mb-4 h-64 md:h-96 rounded-lg overflow-hidden">
                <img src={imageData} alt="Your look" className="object-cover h-full w-full" />
              </div>
            )}
            
            {loading && (
              <div className="flex items-center space-x-2 mb-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p>Analyzing your look...</p>
              </div>
            )}
            
            {error && (
              <div className="bg-red-100 text-red-600 p-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <div className="mb-4">
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  className="flex-1 p-2 border rounded-lg"
                  placeholder="Add a tag (e.g., casual, summer)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                />
                <button 
                  onClick={addTag}
                  className="p-2 bg-primary text-white rounded-lg"
                >
                  <Tag className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <div 
                    key={index} 
                    className="bg-muted px-3 py-1 rounded-full flex items-center"
                  >
                    <span>{tag}</span>
                    <button 
                      onClick={() => removeTag(index)}
                      className="ml-1 p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {tags.length === 0 && (
                  <p className="text-sm text-muted-foreground">No tags yet. Add some to describe your look.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 'audience' && (
          <div className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => setStep('tags')}
                className="flex items-center text-primary"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                <span>Back</span>
              </button>
              <h1 className="text-2xl font-bold">Choose Audience</h1>
              <div className="w-16"></div> {/* Placeholder for balance */}
            </div>
            
            {imageData && (
              <div className="relative mb-4 h-48 md:h-64 rounded-lg overflow-hidden">
                <img src={imageData} alt="Your look" className="object-cover h-full w-full" />
              </div>
            )}
            
            <AudienceSelector 
              onComplete={handleAudienceComplete} 
              loading={loading}
            />
          </div>
        )}
      </div>
    </div>
  );
} 