'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload, Loader2, X, Check, ArrowLeft, ArrowRight, PlusCircle } from 'lucide-react';
import AudienceSelector, { AudienceType } from '../components/audience-selector';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Person {
  id: string;
  name: string;
  avatar: string;
}

interface Look {
  image_url: string;
  caption: string;
}

interface BattleData {
  mainOutfit: Look;
  option1: Look;
  option2: Look;
  selectedOption: 'option1' | 'option2' | null;
  audience: AudienceType;
  excludedPeople: Person[];
}

// Main component content
function BattleContent() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [step, setStep] = useState<'upload-main' | 'upload-options' | 'review' | 'audience'>('upload-main');
  const [mainOutfit, setMainOutfit] = useState<Look | null>(null);
  const [option1, setOption1] = useState<Look | null>(null);
  const [option2, setOption2] = useState<Look | null>(null);
  const [selectedOption, setSelectedOption] = useState<'option1' | 'option2' | null>(null);
  const [audience, setAudience] = useState<AudienceType>('everyone');
  const [excludedPeople, setExcludedPeople] = useState<Person[]>([]);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [captureTarget, setCaptureTarget] = useState<'main' | 'option1' | 'option2'>('main');
  const [mainCaption, setMainCaption] = useState<string>('My main outfit');
  const [option1Caption, setOption1Caption] = useState<string>('Option 1');
  const [option2Caption, setOption2Caption] = useState<string>('Option 2');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputMainRef = useRef<HTMLInputElement>(null);
  const fileInputOption1Ref = useRef<HTMLInputElement>(null);
  const fileInputOption2Ref = useRef<HTMLInputElement>(null);

  // Handle camera activation
  const activateCamera = async (target: 'main' | 'option1' | 'option2') => {
    try {
      setIsCameraActive(true);
      setCaptureTarget(target);
      
      if (!videoRef.current) return;
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    } catch (error) {
      console.error("Error accessing camera:", error);
      setIsCameraActive(false);
    }
  };

  // Handle camera capture
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsCapturing(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to image URL
      const imageUrl = canvas.toDataURL('image/jpeg');
      
      // Stop camera stream
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      
      // Reset state and use the captured image
      setIsCameraActive(false);
      setIsCapturing(false);
      
      // Set the appropriate image based on the capture target
      if (captureTarget === 'main') {
        setMainOutfit({ image_url: imageUrl, caption: mainCaption });
        setStep('upload-options');
      } else if (captureTarget === 'option1') {
        setOption1({ image_url: imageUrl, caption: option1Caption });
      } else if (captureTarget === 'option2') {
        setOption2({ image_url: imageUrl, caption: option2Caption });
      }
    }
  };

  // Handle file upload for main outfit
  const handleMainFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('You must be logged in to upload');
        return;
      }
      
      // Get username for path
      const { data: profiles } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single();
      
      const username = profiles?.username || user.id;
      
      // Generate a unique filename
      const fileName = `${username}/${Date.now()}-main.${file.name.split('.').pop()}`;
      
      // Upload the file to Supabase Storage "battle" bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('battle')
        .upload(fileName, file);
      
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw uploadError;
      }
      
      // Get the public URL for the uploaded image
      const { data: publicUrlData } = supabase.storage
        .from('battle')
        .getPublicUrl(fileName);
      
      const imageUrl = publicUrlData.publicUrl;
      
      setMainOutfit({ image_url: imageUrl, caption: mainCaption });
      setStep('upload-options');
    } catch (error) {
      console.error('Error uploading image:', error);
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setMainOutfit({ image_url: imageUrl, caption: mainCaption });
        setStep('upload-options');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle file upload for option 1
  const handleOption1FileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('You must be logged in to upload');
        return;
      }
      
      // Get username for path
      const { data: profiles } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single();
      
      const username = profiles?.username || user.id;
      
      // Generate a unique filename
      const fileName = `${username}/${Date.now()}-option1.${file.name.split('.').pop()}`;
      
      // Upload the file to Supabase Storage "battle" bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('battle')
        .upload(fileName, file);
      
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw uploadError;
      }
      
      // Get the public URL for the uploaded image
      const { data: publicUrlData } = supabase.storage
        .from('battle')
        .getPublicUrl(fileName);
      
      const imageUrl = publicUrlData.publicUrl;
      
      setOption1({ image_url: imageUrl, caption: option1Caption });
    } catch (error) {
      console.error('Error uploading image:', error);
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setOption1({ image_url: imageUrl, caption: option1Caption });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle file upload for option 2
  const handleOption2FileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('You must be logged in to upload');
        return;
      }
      
      // Get username for path
      const { data: profiles } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single();
      
      const username = profiles?.username || user.id;
      
      // Generate a unique filename
      const fileName = `${username}/${Date.now()}-option2.${file.name.split('.').pop()}`;
      
      // Upload the file to Supabase Storage "battle" bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('battle')
        .upload(fileName, file);
      
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw uploadError;
      }
      
      // Get the public URL for the uploaded image
      const { data: publicUrlData } = supabase.storage
        .from('battle')
        .getPublicUrl(fileName);
      
      const imageUrl = publicUrlData.publicUrl;
      
      setOption2({ image_url: imageUrl, caption: option2Caption });
    } catch (error) {
      console.error('Error uploading image:', error);
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setOption2({ image_url: imageUrl, caption: option2Caption });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle camera close
  const closeCamera = () => {
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
    setIsCameraActive(false);
  };

  // Go to review step
  const goToReviewStep = () => {
    if (option1 && option2) {
      setStep('review');
    }
  };

  // Go to audience selection
  const goToAudienceStep = () => {
    setStep('audience');
  };

  // Handle option selection
  const handleOptionSelect = (option: 'option1' | 'option2') => {
    setSelectedOption(option);
  };

  // Handle audience selection complete
  const handleAudienceComplete = async (selectedAudience: AudienceType, selectedExcludedPeople: Person[]) => {
    setAudience(selectedAudience);
    setExcludedPeople(selectedExcludedPeople);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('You must be logged in to save battle data');
        return;
      }
      
      // In a real application, save the battle data to a database
      const battleData: BattleData = {
        mainOutfit: mainOutfit!,
        option1: option1!,
        option2: option2!,
        selectedOption,
        audience: selectedAudience,
        excludedPeople: selectedExcludedPeople
      };
      
      console.log('Battle data saved:', battleData);

      // Also store the battle in the looks table
      const lookData = {
        user_id: user.id,
        image_url: mainOutfit!.image_url,
        description: mainOutfit!.caption,
        upload_type: 'battle',
        feature_in: ['battle'],
        audience: selectedAudience,
        tags: ['battle'],
        battle_options: [
          {
            image_url: option1!.image_url,
            caption: option1!.caption
          },
          {
            image_url: option2!.image_url,
            caption: option2!.caption
          }
        ],
        selected_option: selectedOption === 'option1' ? 0 : selectedOption === 'option2' ? 1 : null
      };
      
      const { error: insertError } = await supabase
        .from('looks')
        .insert(lookData);
        
      if (insertError) {
        console.error('Error saving battle data to database:', insertError);
      }
    } catch (error) {
      console.error('Error saving battle data:', error);
    }
    
    // Return to the main options page
    router.push('/look');
  };

  // Handle back button
  const handleBack = () => {
    if (step === 'upload-options') {
      setStep('upload-main');
      setMainOutfit(null);
    } else if (step === 'review') {
      setStep('upload-options');
    } else if (step === 'audience') {
      setStep('review');
    }
  };

  // Upload main outfit screen
  if (step === 'upload-main') {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col mb-8">
          <h1 className="text-2xl font-bold">Fashion Battle</h1>
          <p className="text-gray-500 mt-2">
            Can't decide between different options? Upload your main outfit and two alternatives to get opinions.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Step 1: Upload Your Main Outfit</h2>
          </div>
          
          {isCameraActive ? (
            <div className="p-6">
              <div className="relative rounded-lg overflow-hidden bg-black aspect-[3/4] max-w-md mx-auto mb-4">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  autoPlay
                  muted
                />
                <button
                  onClick={closeCamera}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white"
                  aria-label="Close camera"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={captureImage}
                  disabled={isCapturing}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium flex items-center gap-2 disabled:opacity-70"
                >
                  {isCapturing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Capturing...
                    </>
                  ) : (
                    <>
                      <Camera className="h-5 w-5" />
                      Capture Photo
                    </>
                  )}
                </button>
              </div>
              
              {/* Hidden canvas for capture */}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          ) : (
            <div className="p-6 flex flex-col items-center">
              <div className="mb-6 text-center max-w-md">
                <p className="text-gray-600 dark:text-gray-400">
                  Start by taking a photo or uploading an image of your main outfit.
                </p>
              </div>
              
              <div className="w-full max-w-md mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={mainCaption}
                  onChange={(e) => setMainCaption(e.target.value)}
                  placeholder="Enter a description for your main outfit"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700"
                />
              </div>
              
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={() => activateCamera('main')}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium flex items-center gap-2"
                >
                  <Camera className="h-5 w-5" />
                  Take Photo
                </button>
                
                <button
                  onClick={() => fileInputMainRef.current?.click()}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-full font-medium flex items-center gap-2"
                >
                  <Upload className="h-5 w-5" />
                  Upload Image
                </button>
                
                <input
                  ref={fileInputMainRef}
                  type="file"
                  accept="image/*"
                  onChange={handleMainFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Upload options screen
  if (step === 'upload-options') {
    const bothOptionsUploaded = option1 && option2;
    
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button 
          onClick={handleBack}
          className="mb-4 flex items-center text-blue-500 hover:text-blue-600"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </button>
        
        <div className="flex flex-col mb-8">
          <h1 className="text-2xl font-bold">Fashion Battle</h1>
          <p className="text-gray-500 mt-2">
            Now upload your two alternative options that you're deciding between.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main outfit preview */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4">
            <h3 className="font-medium mb-3 text-center">Main Outfit</h3>
            <div className="aspect-[3/4] overflow-hidden rounded-lg mb-2">
              <img 
                src={mainOutfit?.image_url} 
                alt="Main outfit" 
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">{mainOutfit?.caption}</p>
          </div>
          
          {/* Option 1 upload/preview */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4">
            <h3 className="font-medium mb-3 text-center">Option 1</h3>
            {option1 ? (
              <>
                <div className="aspect-[3/4] overflow-hidden rounded-lg mb-2 relative">
                  <img 
                    src={option1.image_url} 
                    alt="Option 1" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setOption1(null)}
                    className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={option1Caption}
                    onChange={(e) => {
                      setOption1Caption(e.target.value);
                      setOption1({...option1, caption: e.target.value});
                    }}
                    placeholder="Description for option 1"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md"
                  />
                </div>
              </>
            ) : (
              <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center">
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => activateCamera('option1')}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm flex items-center gap-1"
                  >
                    <Camera className="h-4 w-4" />
                    Camera
                  </button>
                  <button
                    onClick={() => fileInputOption1Ref.current?.click()}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-md text-sm flex items-center gap-1"
                  >
                    <Upload className="h-4 w-4" />
                    Upload
                  </button>
                  <input
                    ref={fileInputOption1Ref}
                    type="file"
                    accept="image/*"
                    onChange={handleOption1FileUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center px-4">
                  Add your first alternative option
                </p>
              </div>
            )}
          </div>
          
          {/* Option 2 upload/preview */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4">
            <h3 className="font-medium mb-3 text-center">Option 2</h3>
            {option2 ? (
              <>
                <div className="aspect-[3/4] overflow-hidden rounded-lg mb-2 relative">
                  <img 
                    src={option2.image_url} 
                    alt="Option 2" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setOption2(null)}
                    className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={option2Caption}
                    onChange={(e) => {
                      setOption2Caption(e.target.value);
                      setOption2({...option2, caption: e.target.value});
                    }}
                    placeholder="Description for option 2"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md"
                  />
                </div>
              </>
            ) : (
              <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center">
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => activateCamera('option2')}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm flex items-center gap-1"
                  >
                    <Camera className="h-4 w-4" />
                    Camera
                  </button>
                  <button
                    onClick={() => fileInputOption2Ref.current?.click()}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-md text-sm flex items-center gap-1"
                  >
                    <Upload className="h-4 w-4" />
                    Upload
                  </button>
                  <input
                    ref={fileInputOption2Ref}
                    type="file"
                    accept="image/*"
                    onChange={handleOption2FileUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center px-4">
                  Add your second alternative option
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 flex justify-center">
          <button
            onClick={goToReviewStep}
            disabled={!bothOptionsUploaded}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowRight className="h-5 w-5" />
            Continue to Review
          </button>
        </div>
      </div>
    );
  }

  // Review screen
  if (step === 'review') {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button 
          onClick={handleBack}
          className="mb-4 flex items-center text-blue-500 hover:text-blue-600"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </button>
        
        <div className="flex flex-col mb-8">
          <h1 className="text-2xl font-bold">Review Your Battle</h1>
          <p className="text-gray-500 mt-2">
            Confirm your outfit options and make a selection if you have a preference
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Option 1 */}
          <div 
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 p-4
              ${selectedOption === 'option1' ? 'border-green-500' : 'border-transparent'} 
              hover:border-gray-300 cursor-pointer transition-colors`}
            onClick={() => handleOptionSelect('option1')}
          >
            <h3 className="font-medium mb-3 text-center">Option 1</h3>
            <div className="aspect-[3/4] overflow-hidden rounded-lg mb-2 relative">
              <img 
                src={option1?.image_url} 
                alt="Option 1" 
                className="w-full h-full object-cover"
              />
              {selectedOption === 'option1' && (
                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1 z-10">
                  <Check className="h-4 w-4" />
                </div>
              )}
            </div>
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">{option1?.caption}</p>
          </div>
          
          {/* Main outfit */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-blue-500 p-4">
            <h3 className="font-medium mb-3 text-center">Main Outfit</h3>
            <div className="aspect-[3/4] overflow-hidden rounded-lg mb-2">
              <img 
                src={mainOutfit?.image_url} 
                alt="Main outfit" 
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">{mainOutfit?.caption}</p>
          </div>
          
          {/* Option 2 */}
          <div 
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 p-4
              ${selectedOption === 'option2' ? 'border-green-500' : 'border-transparent'} 
              hover:border-gray-300 cursor-pointer transition-colors`}
            onClick={() => handleOptionSelect('option2')}
          >
            <h3 className="font-medium mb-3 text-center">Option 2</h3>
            <div className="aspect-[3/4] overflow-hidden rounded-lg mb-2 relative">
              <img 
                src={option2?.image_url} 
                alt="Option 2" 
                className="w-full h-full object-cover"
              />
              {selectedOption === 'option2' && (
                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1 z-10">
                  <Check className="h-4 w-4" />
                </div>
              )}
            </div>
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">{option2?.caption}</p>
          </div>
        </div>
        
        <div className="mt-8">
          <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
            {selectedOption 
              ? "You've selected an option. The community can still help confirm your choice!"
              : "Click on an option if you have a preference, or leave unselected to get neutral opinions"}
          </p>
          
          <div className="flex justify-center">
            <button
              onClick={goToAudienceStep}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2"
            >
              Continue to Audience Selection
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Audience selection step
  if (step === 'audience') {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button 
          onClick={handleBack}
          className="mb-4 flex items-center text-blue-500 hover:text-blue-600"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </button>
        
        <AudienceSelector 
          onComplete={handleAudienceComplete} 
        />
      </div>
    );
  }

  return null;
}

// Export component
export default function BattlePage() {
  return <BattleContent />;
} 