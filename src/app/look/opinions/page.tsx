'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import CameraUpload from '../components/camera-upload';
import AudienceSelector, { AudienceType } from '../components/audience-selector';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/hooks/use-toast';

export interface Person {
  id: string;
  name: string;
  avatar: string;
}
  
// Common topic suggestions
const topicSuggestions = [
  "Style advice",
  "Color combination",
  "Outfit matching",
  "Accessories",
  "Shoes choice",
  "Casual or formal",
  "Season appropriate",
  "Trend feedback",
  "Fabric choice",
  "Pattern mixing",
];

export default function OpinionsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const [step, setStep] = useState<'upload' | 'topic' | 'audience'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [topic, setTopic] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  // Handle image capture from camera or file upload
  const handleImageCapture = (capturedImageData: string, capturedFile: File | null) => {
    setImageData(capturedImageData);
    setFile(capturedFile);
    setStep('topic');
  };

  // Go to audience selection step
  const goToAudienceStep = () => {
    if (topic.trim()) {
      setStep('audience');
    }
  };

  // Handle audience selection complete
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAudienceComplete = async (selectedAudience: AudienceType, excludedPeople: Person[]) => {
    if (!file || !imageData) {
      toast({
        title: "Error",
        description: "Image is missing. Please try again.",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error(`Authentication error: ${userError.message}`);
      }
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to upload",
          variant: "destructive"
        });
        return;
      }
      
      // Get username for storage path
      const { data: profiles, error: profileError } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
        // Continue with user.id as fallback
      }
        
      const username = profiles?.username || user.id;
      
      // Ensure file extension is included and normalized to lowercase
      const fileExtMatch = file.name.match(/\.([^.]+)$/);
      const fileExt = fileExtMatch ? fileExtMatch[1].toLowerCase() : 'jpg';
      const uniqueId = Date.now().toString();
      
      // Construct a cleaner path - ensure username is safe for paths
      const safeUsername = username.replace(/[^a-zA-Z0-9_-]/g, '_');
      
      // Create a more reliable filename structure
      const fileName = `${safeUsername}/${uniqueId}.${fileExt}`;
      
      // Upload with optimized approach
      const { error: uploadError } = await supabase.storage
        .from('opinions')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        // Try one more time with upsert if first attempt failed
        if (uploadError.message.includes('duplicate')) {
          const { error: retryError } = await supabase.storage
            .from('opinions')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: true
            });
            
          if (retryError) {
            throw new Error(`Upload retry failed: ${retryError.message}`);
          }
        } else {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }
      }
      
      // Generate public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('opinions')
        .getPublicUrl(fileName);
      
      if (!publicUrlData?.publicUrl) {
        throw new Error('Failed to generate a public URL for the image');
      }
      
      // Insert record into looks table
      const lookData = {
        user_id: user.id,
        image_url: publicUrlData.publicUrl,
        description: topic.trim(),
        upload_type: 'opinions',
        feature_in: ['opinions'],
        audience: selectedAudience,
        storage_bucket: 'opinions',
        storage_path: fileName
      };
      
      const { error: insertError } = await supabase
        .from('looks')
        .insert(lookData);
        
      if (insertError) {
        throw new Error(`Database error: ${insertError.message}`);
      }
      
      toast({
        title: "Success!",
        description: "Your image has been uploaded for opinions",
      });
      
      // Return to the main options page
      router.push('/look');
    } catch (err: any) {
      console.error('Error saving opinions request:', err);
      
      let errorMessage = 'There was a problem uploading your image';
      
      if (err.message.includes('permission')) {
        errorMessage = 'You do not have permission to upload to this location. Please log in again.';
      } else if (err.message.includes('limit')) {
        errorMessage = 'The file size exceeds the maximum allowed limit.';
      } else if (err.message.includes('format')) {
        errorMessage = 'The file format is not supported.';
      } else if (err.message.includes('auth') || err.message.includes('session')) {
        errorMessage = 'Authentication error. Please log in again.';
        // Refresh auth session
        await supabase.auth.refreshSession();
      }
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // Handle back button
  const handleBack = () => {
    if (step === 'topic') {
      setStep('upload');
      setImageData(null);
      setFile(null);
    } else if (step === 'audience') {
      setStep('topic');
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setTopic(suggestion);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Get Opinions</h1>
      
      {/* Step 1: Upload/Camera */}
      {step === 'upload' && (
        <div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Take a photo of your outfit to get detailed opinions from the community
          </p>
          <CameraUpload onImageCapture={handleImageCapture} />
        </div>
      )}
      
      {/* Step 2: Topic Input */}
      {step === 'topic' && imageData && (
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
                <Image 
                  src={imageData} 
                  alt="Your outfit" 
                  className="object-cover"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>
            
            {/* Topic section */}
            <div>
              <h2 className="text-lg font-medium mb-2">What opinions do you want?</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Specify what feedback you're looking for
              </p>
              
              {/* Topic input */}
              <div className="mb-4">
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Example: Does this color match my shoes? Is this formal enough?"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[100px]"
                  id="opinion-topic"
                  name="opinion-topic"
                />
              </div>
              
              {/* Topic suggestions */}
              <div className="mb-6">
                <p className="text-sm font-medium mb-2">Suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {topicSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Preview */}
              {topic && (
                <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <p className="font-medium mb-2">Preview:</p>
                  <p>{topic}</p>
                </div>
              )}
              
              {/* Next button */}
              <button
                onClick={goToAudienceStep}
                disabled={!topic.trim()}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next 
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
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
          
          <AudienceSelector 
            onComplete={handleAudienceComplete}
            loading={uploading} 
          />
        </div>
      )}
    </div>
  );
} 