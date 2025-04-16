'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, X, RefreshCw, Check } from 'lucide-react';

interface CameraUploadProps {
  onImageCapture: (imageData: string) => void;
  aspectRatio?: string;
}

export default function CameraUpload({ onImageCapture, aspectRatio = '3/4' }: CameraUploadProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Clean up camera resources when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);
  
  const startCamera = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Request camera access, preferring environment (rear) camera
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }
      });
      
      setStream(mediaStream);
      setCameraActive(true);
      setLoading(false);
    } catch (err) {
      console.error('Camera error:', err);
      setError('Failed to access camera. Please check permissions or try file upload instead.');
      setCameraActive(false);
      setLoading(false);
    }
  };
  
  // Handle video element after it's rendered
  useEffect(() => {
    if (cameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        // Ensure video plays
        videoRef.current?.play().catch(e => {
          console.error('Error playing video:', e);
          setError('Failed to play video stream');
        });
      };
    }
  }, [cameraActive, stream]);
  
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraActive(false);
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };
  
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera not properly initialized');
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      setError('Could not get canvas context');
      return;
    }
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current video frame to the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    try {
      // Convert canvas to data URL
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8); // 0.8 quality for compression
      setCapturedImage(imageDataUrl);
      setShowImagePreview(true);
    } catch (err) {
      console.error('Error capturing image:', err);
      setError('Failed to capture image');
    }
  };

  const approveImage = () => {
    if (capturedImage) {
      onImageCapture(capturedImage);
      stopCamera();
      setShowImagePreview(false);
      setCapturedImage(null);
    }
  };

  const rejectImage = () => {
    setCapturedImage(null);
    setShowImagePreview(false);
    // Keep camera active for another capture
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setError(null);
    setLoading(true);
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const imageDataUrl = event.target?.result as string;
      setLoading(false);
      onImageCapture(imageDataUrl);
    };
    
    reader.onerror = () => {
      setError('Failed to read the selected file');
      setLoading(false);
    };
    
    reader.readAsDataURL(file);
  };
  
  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4">
      {cameraActive ? (
        <div className="space-y-4">
          <div className={`relative w-full bg-black rounded-md overflow-hidden aspect-[${aspectRatio}]`}>
            {showImagePreview && capturedImage ? (
              <img 
                src={capturedImage} 
                alt="Captured preview" 
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={stopCamera}
                  className="absolute top-2 right-2 bg-red-500 p-2 rounded-full text-white z-10"
                  aria-label="Stop camera"
                >
                  <X size={18} />
                </button>
              </>
            )}

            {/* Capture controls */}
            {!showImagePreview ? (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <button
                  onClick={captureImage}
                  className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 flex items-center"
                >
                  <Camera size={18} className="mr-2" />
                  Take Photo
                </button>
              </div>
            ) : (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                <button
                  onClick={rejectImage}
                  className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 flex items-center"
                >
                  <X size={18} className="mr-2" />
                  Retake
                </button>
                <button
                  onClick={approveImage}
                  className="bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600 flex items-center"
                >
                  <Check size={18} className="mr-2" />
                  Use Photo
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center">
          <Camera className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-2" />
          <p className="text-lg font-medium">Capture or upload an image</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-6">
            Take a photo or choose from your gallery
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={startCamera}
              disabled={loading}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Camera size={18} className="mr-2" />
              {loading ? 'Starting...' : 'Start Camera'}
            </button>
            
            <label className="flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer">
              <Upload size={18} className="mr-2" />
              Upload Photo
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
          
          {error && (
            <div className="mt-4 text-sm text-red-500">
              {error}
            </div>
          )}
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
} 