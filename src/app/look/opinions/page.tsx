'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import CameraUpload from '../components/camera-upload';
import AudienceSelector, { AudienceType } from '../components/audience-selector';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/hooks/use-toast';

interface Person {
  id: string;
  name: string;
  avatar: string;
}

interface OpinionData {
  imageUrl: string;
  topic: string;
  audience: AudienceType;
  excludedPeople: Person[];
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
  const [audience, setAudience] = useState<AudienceType>('everyone');
  const [excludedPeople, setExcludedPeople] = useState<Person[]>([]);
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
  const handleAudienceComplete = async (selectedAudience: AudienceType, selectedExcludedPeople: Person[]) => {
    setAudience(selectedAudience);
    setExcludedPeople(selectedExcludedPeople);
    
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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to upload",
          variant: "destructive"
        });
        return;
      }
      
      // Get username for storage path
      const { data: profiles } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single();
        
      const username = profiles?.username || user.id;
      
      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${username}/${Date.now()}.${fileExt}`;
      
      // Upload the file to Supabase Storage (opinions bucket)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('opinions')
        .upload(fileName, file);
      
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw uploadError;
      }
      
      // Get the public URL for the uploaded image
      const { data: publicUrlData } = supabase.storage
        .from('opinions')
        .getPublicUrl(fileName);
      
      const publicUrl = publicUrlData.publicUrl;
      
      // Insert record into looks table
      const lookData = {
        user_id: user.id,
        image_url: publicUrl,
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
        console.error('Error inserting look:', insertError);
        throw insertError;
      }
      
      toast({
        title: "Success!",
        description: "Your image has been uploaded for opinions",
      });
      
      // Return to the main options page
      router.push('/look');
    } catch (err: any) {
      console.error('Error saving opinions request:', err);
      
      toast({
        title: "Upload Failed",
        description: err.message || "There was a problem uploading your image",
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
                <img 
                  src={imageData} 
                  alt="Your outfit" 
                  className="w-full h-full object-cover"
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
            isLoading={uploading} 
          />
        </div>
      )}
    </div>
  );
} 