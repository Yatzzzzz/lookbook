'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThumbsUp, ThumbsDown, ArrowLeft, ArrowRight } from 'lucide-react';
import CameraUpload from '../components/camera-upload';
import AudienceSelector, { AudienceType } from '../components/audience-selector';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/hooks/use-toast';
import { H1, H2, Paragraph, Muted, HighContrastText, Highlight } from '@/components/ui/typography';

interface Person {
  id: string;
  name: string;
  avatar: string;
}

interface YayOrNayData {
  imageUrl: string;
  occasion: string;
  audience: AudienceType;
  excludedPeople: Person[];
}

// Common occasion suggestions
const occasionSuggestions = [
  "Work meeting",
  "First date",
  "Job interview",
  "Casual Friday",
  "Wedding",
  "Dinner party",
  "Meeting the parents",
  "Night out",
  "Beach day",
  "Formal event",
];

export default function YayOrNayPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const [step, setStep] = useState<'upload' | 'occasion' | 'audience'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [occasion, setOccasion] = useState<string>('');
  const [audience, setAudience] = useState<AudienceType>('everyone');
  const [excludedPeople, setExcludedPeople] = useState<Person[]>([]);
  const [uploading, setUploading] = useState(false);

  // Handle image capture from camera or file upload
  const handleImageCapture = (capturedImageData: string, capturedFile: File | null) => {
    setImageData(capturedImageData);
    setFile(capturedFile);
    setStep('occasion');
  };

  // Go to audience selection step
  const goToAudienceStep = () => {
    if (occasion.trim()) {
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
      const { data: profiles } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single();
        
      const username = profiles?.username || user.id;
      
      // Generate a unique filename with username directory
      const fileExt = file.name.split('.').pop();
      const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const fileName = `${username}/${uniqueId}.${fileExt}`;
      
      console.log('Attempting to upload file:', fileName);
      
      // Upload the file to Supabase Storage (yaynay bucket)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('yaynay')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(`Error uploading file: ${uploadError.message}`);
      }
      
      // Get the public URL for the uploaded image
      const { data: publicUrlData } = supabase.storage
        .from('yaynay')
        .getPublicUrl(fileName);
      
      const publicUrl = publicUrlData.publicUrl;
      console.log('File uploaded successfully, public URL:', publicUrl);
      
      // Insert record into looks table
      const lookData = {
        user_id: user.id,
        image_url: publicUrl,
        description: `Can I wear this to ${occasion.trim()}?`,
        upload_type: 'yayornay',
        feature_in: ['yayornay'],
        audience: selectedAudience
      };
      
      // Add storage fields if they exist
      try {
        const { data: columnsData, error: columnsError } = await supabase.rpc('get_columns_for_table', { 
          target_table: 'looks' 
        });
        
        if (columnsData && !columnsError) {
          const columns = columnsData.map(col => col.column_name);
          if (columns.includes('storage_bucket')) {
            lookData.storage_bucket = 'yaynay';
          }
          if (columns.includes('storage_path')) {
            lookData.storage_path = fileName;
          }
        }
      } catch (e) {
        // If the RPC doesn't exist, just continue without the storage fields
        console.log('Could not check for columns, continuing without storage fields');
      }
      
      console.log('Inserting look data:', lookData);
      
      const { data: lookInsertData, error: insertError } = await supabase
        .from('looks')
        .insert(lookData)
        .select();
        
      if (insertError) {
        throw new Error(`Error inserting look: ${insertError.message}`);
      }
      
      toast({
        title: "Success!",
        description: "Your image has been uploaded for yay or nay voting",
      });
      
      // Return to the main options page
      router.push('/look');
    } catch (err: any) {
      console.error('Error saving yayornay request:', err);
      
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
    if (step === 'occasion') {
      setStep('upload');
      setImageData(null);
      setFile(null);
    } else if (step === 'audience') {
      setStep('occasion');
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setOccasion(suggestion);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <H1 className="mb-4">Yay or Nay</H1>
      
      {/* Step 1: Upload/Camera */}
      {step === 'upload' && (
        <div>
          <HighContrastText className="mb-4">
            Take a photo of your outfit for the community to vote on
          </HighContrastText>
          <CameraUpload onImageCapture={handleImageCapture} />
        </div>
      )}
      
      {/* Step 2: Occasion Input */}
      {step === 'occasion' && imageData && (
        <div>
          <button 
            onClick={handleBack}
            className="mb-4 flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span>Back</span>
          </button>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Image preview */}
            <div>
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
                <img 
                  src={imageData} 
                  alt="Your outfit" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* Occasion section */}
            <div>
              <H2 className="mb-2">Can I wear this to...</H2>
              <Highlight className="mb-4 inline-block">
                Specify the occasion for others to give better feedback
              </Highlight>
              
              {/* Occasion input */}
              <div className="mb-4 mt-4">
                <textarea
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  placeholder="Example: Job interview, First date, etc."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              
              {/* Occasion suggestions */}
              <div className="mb-6">
                <HighContrastText className="mb-2">Suggestions:</HighContrastText>
                <div className="flex flex-wrap gap-2">
                  {occasionSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Next button */}
              <button
                onClick={goToAudienceStep}
                disabled={!occasion.trim()}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-md"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
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
            className="mb-4 flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span>Back</span>
          </button>
          
          <div className="mb-6">
            <H2 className="mb-2">Who can see this?</H2>
            <Highlight className="mb-4 inline-block">
              Choose who can view and vote on your outfit
            </Highlight>
          </div>
          
          <AudienceSelector 
            initialAudience={audience}
            initialExcludedPeople={excludedPeople}
            onComplete={handleAudienceComplete}
            loading={uploading}
          />
        </div>
      )}
    </div>
  );
} 