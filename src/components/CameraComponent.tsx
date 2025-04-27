import React, { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// Types for the component props
interface CameraComponentProps {
  onMediaCapture: (media: MediaCaptureResult) => void;
  onCancel?: () => void;
  allowVideo?: boolean;
  maxDuration?: number; // Video recording max duration in seconds
  className?: string;
  enableAITagging?: boolean;
  taggingContext?: 'wardrobe' | 'search' | 'general';
  enableBackgroundRemoval?: boolean; // New prop for background removal feature
}

// Media capture result type
export interface MediaCaptureResult {
  type: 'image' | 'video';
  file: File;
  preview: string;
  tags?: string[];
  backgroundRemoved?: string; // URL for background-removed version
}

// Timer options in seconds
const TIMER_OPTIONS = [0, 3, 5, 10];

const CameraComponent: React.FC<CameraComponentProps> = ({
  onMediaCapture,
  onCancel,
  allowVideo = true,
  maxDuration = 30,
  className,
  enableAITagging = false,
  taggingContext = 'general',
  enableBackgroundRemoval = false, // Default to false
}) => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<'user' | 'environment'>('environment');
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedTimer, setSelectedTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerCount, setTimerCount] = useState(0);
  const [capturedMedia, setCapturedMedia] = useState<MediaCaptureResult | null>(null);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [fileInputRef] = useState(React.createRef<HTMLInputElement>());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [backgroundRemoved, setBackgroundRemoved] = useState<string | null>(null);

  // Initialize available cameras
  const initializeCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
    } catch (err) {
      console.error('Error enumerating devices:', err);
    }
  }, []);

  // Start camera with the selected facing mode
  const startCamera = useCallback(async () => {
    setError(null);
    setIsInitializing(true);
    
    try {
      // Stop any existing stream first
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: selectedCamera,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: mode === 'video'
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
      }
      
      // Get available cameras after successful initialization
      await initializeCameras();
    } catch (err: any) {
      console.error('Error starting camera:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setIsInitializing(false);
    }
  }, [selectedCamera, mode, initializeCameras]);

  // Switch between front and back cameras
  const switchCamera = useCallback(() => {
    const newMode = selectedCamera === 'user' ? 'environment' : 'user';
    setSelectedCamera(newMode);
  }, [selectedCamera]);

  // After the capturePhoto function, add this new function for background removal
  const removeBackground = async (imageFile: File, preview: string): Promise<string | null> => {
    if (!enableBackgroundRemoval) return null;
    
    try {
      setIsRemovingBackground(true);
      
      // Convert the file to base64
      const reader = new FileReader();
      const imageBase64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });
      
      const imageBase64 = await imageBase64Promise;
      
      // Call the background removal API
      const response = await fetch('/api/background-removal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageBase64 }),
      });
      
      if (!response.ok) {
        throw new Error('Background removal failed');
      }
      
      const result = await response.json();
      
      // In a real implementation, this would return a processed image
      // For this demo, we'll just use the original image but record that we attempted removal
      console.log('Background removal result:', result);
      
      // In a production app, this would be the URL to the background-removed image
      // Here we're just using the original for demonstration
      return preview;
    } catch (err) {
      console.error('Error removing background:', err);
      return null;
    } finally {
      setIsRemovingBackground(false);
    }
  };

  // Modify the capturePhoto function to include background removal if enabled
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !mediaStreamRef.current) {
      setError('Camera not ready');
      return;
    }
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas size to match video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setError('Could not get canvas context');
        return;
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob and create file
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setError('Failed to capture image');
          return;
        }
        
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const preview = URL.createObjectURL(blob);
        
        const result: MediaCaptureResult = {
          type: 'image',
          file,
          preview
        };
        
        // Attempt to remove background if enabled
        if (enableBackgroundRemoval) {
          try {
            const removedBgUrl = await removeBackground(file, preview);
            if (removedBgUrl) {
              result.backgroundRemoved = removedBgUrl;
              setBackgroundRemoved(removedBgUrl);
            }
          } catch (err) {
            console.error('Background removal failed:', err);
          }
        }
        
        // If AI tagging is enabled, process the image to extract tags
        if (enableAITagging) {
          setIsProcessing(true);
          try {
            const tags = await mockAITagging(file, taggingContext);
            result.tags = tags;
          } catch (err) {
            console.error('Error during AI tagging:', err);
          } finally {
            setIsProcessing(false);
          }
        }
        
        setCapturedMedia(result);
      }, 'image/jpeg', 0.9);
    } catch (err) {
      console.error('Error capturing photo:', err);
      setError('Failed to capture photo');
    }
  }, [enableAITagging, taggingContext, enableBackgroundRemoval]);

  // Start video recording
  const startVideoRecording = useCallback(() => {
    if (!mediaStreamRef.current || !videoRef.current) {
      setError('Camera not ready');
      return;
    }
    
    try {
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      const mediaRecorder = new MediaRecorder(mediaStreamRef.current, options);
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const file = new File([blob], `video-${Date.now()}.webm`, { type: 'video/webm' });
        const preview = URL.createObjectURL(blob);
        
        const result: MediaCaptureResult = {
          type: 'video',
          file,
          preview
        };
        
        // If AI tagging is enabled, process the video to extract tags
        if (enableAITagging) {
          setIsProcessing(true);
          try {
            // Extract a frame from the video for tagging
            const tags = await mockAITagging(file, taggingContext);
            result.tags = tags;
          } catch (err) {
            console.error('Error during AI tagging:', err);
          } finally {
            setIsProcessing(false);
          }
        }
        
        setCapturedMedia(result);
        setIsRecording(false);
        setRecordingTime(0);
      };
      
      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      
      // Set up recording timer
      let time = 0;
      const interval = setInterval(() => {
        time += 1;
        setRecordingTime(time);
        
        // Stop recording if max duration reached
        if (time >= maxDuration) {
          stopVideoRecording();
          clearInterval(interval);
        }
      }, 1000);
      
      timerRef.current = interval;
    } catch (err) {
      console.error('Error starting video recording:', err);
      setError('Failed to start video recording');
    }
  }, [enableAITagging, maxDuration, taggingContext]);

  // Stop video recording
  const stopVideoRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Start timer for delayed capture
  const startCaptureTimer = useCallback(() => {
    if (selectedTimer === 0) {
      // No timer selected, capture immediately
      if (mode === 'photo') {
        capturePhoto();
      } else {
        startVideoRecording();
      }
      return;
    }
    
    setTimerActive(true);
    setTimerCount(selectedTimer);
    
    const interval = setInterval(() => {
      setTimerCount((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerActive(false);
          
          // Perform capture after timer completes
          if (mode === 'photo') {
            capturePhoto();
          } else {
            startVideoRecording();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    timerRef.current = interval;
  }, [selectedTimer, mode, capturePhoto, startVideoRecording]);

  // Handle file selection from device gallery
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsProcessing(true);
    
    try {
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        if (!event.target?.result) return;
        
        const result: MediaCaptureResult = {
          type: isVideo ? 'video' : 'image',
          file,
          preview: URL.createObjectURL(file)
        };
        
        // If AI tagging is enabled, process the file to extract tags
        if (enableAITagging) {
          try {
            const tags = await mockAITagging(file, taggingContext);
            result.tags = tags;
          } catch (err) {
            console.error('Error during AI tagging:', err);
          }
        }
        
        setCapturedMedia(result);
        setIsProcessing(false);
      };
      
      reader.onerror = () => {
        setError('Error reading file');
        setIsProcessing(false);
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error processing file:', err);
      setError('Failed to process file');
      setIsProcessing(false);
    }
  };

  // Approve captured media
  const approveMedia = () => {
    if (capturedMedia) {
      onMediaCapture(capturedMedia);
      resetState();
    }
  };

  // Reject captured media and go back to camera
  const rejectMedia = () => {
    if (capturedMedia) {
      URL.revokeObjectURL(capturedMedia.preview);
      setCapturedMedia(null);
    }
  };

  // Reset component state
  const resetState = () => {
    if (capturedMedia) {
      URL.revokeObjectURL(capturedMedia.preview);
    }
    
    setCapturedMedia(null);
    setIsRecording(false);
    setRecordingTime(0);
    setTimerActive(false);
    setTimerCount(0);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Mock AI tagging function - this would be replaced with actual API call
  const mockAITagging = async (file: File, context: string): Promise<string[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Sample tags based on context
    if (context === 'wardrobe') {
      return ['Dress', 'Casual', 'Summer', 'Cotton', 'Blue'];
    } else if (context === 'search') {
      return ['Top', 'Blouse', 'Shirt', 'Casual', 'Cotton', 'Pattern'];
    } else {
      return ['Fashion', 'Style', 'Outfit', 'Trend', 'Casual'];
    }
  };

  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      // Stop media stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Clear any running timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Revoke any object URLs
      if (capturedMedia) {
        URL.revokeObjectURL(capturedMedia.preview);
      }
    };
  }, [capturedMedia]);

  // Initialize camera on component mount
  useEffect(() => {
    startCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle camera switching
  useEffect(() => {
    if (isCameraActive) {
      startCamera();
    }
  }, [selectedCamera, isCameraActive, startCamera]);

  return (
    <div className={cn('relative w-full max-w-md mx-auto flex flex-col', className)}>
      {/* Canvas used for capturing photos (hidden) */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Error message display */}
      {error && (
        <div className="bg-red-500 text-white p-2 text-sm rounded-md mb-2">
          {error}
        </div>
      )}
      
      {/* Processing indicator */}
      {(isProcessing || isRemovingBackground) && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-20">
          <div className="text-white text-center">
            <div className="inline-block w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
            <p>{isRemovingBackground ? 'Removing background...' : 'Processing...'}</p>
          </div>
        </div>
      )}
      
      {/* Media preview and approval/rejection UI */}
      {capturedMedia ? (
        <div className="relative w-full bg-black rounded-lg overflow-hidden">
          {capturedMedia.type === 'image' ? (
            <img 
              src={capturedMedia.preview} 
              alt="Captured" 
              className="w-full object-contain max-h-[70vh]" 
            />
          ) : (
            <video 
              src={capturedMedia.preview} 
              controls 
              className="w-full max-h-[70vh]" 
            />
          )}
          
          {/* AI tags display */}
          {capturedMedia.tags && capturedMedia.tags.length > 0 && (
            <div className="p-3 bg-black bg-opacity-70">
              <p className="text-white text-sm mb-1">AI detected:</p>
              <div className="flex flex-wrap gap-2">
                {capturedMedia.tags.map((tag, index) => (
                  <span 
                    key={index} 
                    className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Background removed preview */}
          {capturedMedia.backgroundRemoved && (
            <div className="absolute top-4 right-4 p-2 bg-black bg-opacity-70 rounded-md">
              <p className="text-white text-xs mb-1">Background removed</p>
            </div>
          )}
          
          {/* Approval/rejection buttons */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-8">
            <button 
              onClick={rejectMedia}
              className="p-3 bg-red-500 rounded-full"
              aria-label="Reject"
            >
              <Image 
                src="/svg icons/xmark-solid.svg" 
                alt="Reject" 
                width={24} 
                height={24} 
                className="object-contain" 
              />
            </button>
            <button 
              onClick={approveMedia}
              className="p-3 bg-green-500 rounded-full"
              aria-label="Approve"
            >
              <Image 
                src="/svg icons/thumbs-up-solid.svg" 
                alt="Approve" 
                width={24} 
                height={24} 
                className="object-contain" 
              />
            </button>
          </div>
        </div>
      ) : (
        /* Camera capture UI */
        <div className="relative bg-black rounded-lg overflow-hidden">
          {/* Video element for camera preview */}
          <video 
            ref={videoRef} 
            className="w-full max-h-[70vh] object-cover" 
            autoPlay 
            playsInline 
            muted 
          />
          
          {/* Camera initializing state */}
          {isInitializing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          {/* Timer countdown display */}
          {timerActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
              <span className="text-white text-6xl font-bold">{timerCount}</span>
            </div>
          )}
          
          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-white text-sm">
                {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:
                {(recordingTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
          
          {/* Camera controls */}
          <div className="absolute bottom-4 left-0 right-0">
            {/* Mode selection: Photo/Video */}
            {allowVideo && (
              <div className="flex justify-center mb-4">
                <div className="bg-black bg-opacity-50 rounded-full p-1 flex">
                  <button 
                    onClick={() => setMode('photo')}
                    className={`px-4 py-2 rounded-full text-sm ${mode === 'photo' ? 'bg-white text-black' : 'text-white'}`}
                  >
                    Photo
                  </button>
                  <button 
                    onClick={() => setMode('video')}
                    className={`px-4 py-2 rounded-full text-sm ${mode === 'video' ? 'bg-white text-black' : 'text-white'}`}
                  >
                    Video
                  </button>
                </div>
              </div>
            )}
            
            {/* Bottom control bar */}
            <div className="flex items-center justify-between px-8">
              {/* Timer selection */}
              <div className="flex flex-col items-center">
                <button 
                  onClick={() => setSelectedTimer(
                    TIMER_OPTIONS[(TIMER_OPTIONS.indexOf(selectedTimer) + 1) % TIMER_OPTIONS.length]
                  )}
                  className="p-3 bg-black bg-opacity-50 rounded-full"
                  disabled={isRecording}
                >
                  <Image 
                    src="/svg icons/clock.svg" 
                    alt="Timer" 
                    width={24} 
                    height={24} 
                    className="object-contain" 
                    onError={(e) => {
                      // Fallback if the clock.svg is not available
                      const target = e.target as HTMLImageElement;
                      target.src = '/svg icons/timeline-solid.svg';
                    }}
                  />
                </button>
                {selectedTimer > 0 && (
                  <span className="text-white text-xs mt-1">{selectedTimer}s</span>
                )}
              </div>
              
              {/* Capture button */}
              <button 
                onClick={
                  isRecording 
                    ? stopVideoRecording 
                    : startCaptureTimer
                }
                className={`p-5 rounded-full ${isRecording ? 'bg-red-500' : 'bg-white'}`}
                disabled={timerActive}
              >
                {isRecording ? (
                  <div className="w-6 h-6 bg-white rounded-sm"></div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-gray-800"></div>
                )}
              </button>
              
              {/* Gallery picker button */}
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-black bg-opacity-50 rounded-full"
                disabled={isRecording}
              >
                <Image 
                  src="/svg icons/images-solid.svg" 
                  alt="Gallery" 
                  width={24} 
                  height={24} 
                  className="object-contain" 
                />
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept={mode === 'photo' ? 'image/*' : 'video/*,image/*'} 
                  onChange={handleFileSelect} 
                />
              </button>
            </div>
          </div>
          
          {/* Camera switch button */}
          <button 
            onClick={switchCamera}
            className="absolute top-4 right-4 p-3 bg-black bg-opacity-50 rounded-full"
            disabled={isRecording || timerActive}
          >
            <Image 
              src="/svg icons/camera-flip.svg" 
              alt="Switch Camera" 
              width={24} 
              height={24} 
              className="object-contain" 
              onError={(e) => {
                // Fallback if the camera-flip.svg is not available
                const target = e.target as HTMLImageElement;
                target.src = '/svg icons/camera-solid.svg';
              }}
            />
          </button>
          
          {/* Cancel button */}
          {onCancel && (
            <button 
              onClick={onCancel}
              className="absolute top-4 left-4 p-3 bg-black bg-opacity-50 rounded-full"
              disabled={isRecording}
            >
              <Image 
                src="/svg icons/xmark-solid.svg" 
                alt="Cancel" 
                width={24} 
                height={24} 
                className="object-contain" 
              />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CameraComponent; 