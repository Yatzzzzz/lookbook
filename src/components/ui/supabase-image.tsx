'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ImageOff, Loader2 } from 'lucide-react';

interface SupabaseImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * A special image component for handling Supabase storage URLs
 * with enhanced error handling and fallbacks
 */
export function SupabaseImage({
  src,
  alt,
  className = '',
  width,
  height,
  fill = false,
  priority = false,
  sizes,
  onLoad,
  onError,
}: SupabaseImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [useImgFallback, setUseImgFallback] = useState(false);
  
  // Base64 encoded transparent pixel for blur placeholder
  const blurDataURL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHBAJ/PchI7wAAAABJRU5ErkJggg==";
  
  // Handle successful loading
  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };
  
  // Handle error - try fallback to regular img tag
  const handleError = () => {
    setIsLoading(false);
    
    if (!useImgFallback) {
      // First failure, try with img tag
      setUseImgFallback(true);
    } else {
      // Both methods failed
      setHasError(true);
      onError?.();
    }
  };
  
  // Create a safe URL
  const safeUrl = src.replace(/\s/g, '%20');
  
  // If we've had errors with both methods, show error UI
  if (hasError) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 ${className}`}>
        <ImageOff className="h-6 w-6 text-gray-400 mb-1" />
        <p className="text-xs text-gray-500">Image not available</p>
      </div>
    );
  }
  
  // Show loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
      </div>
    );
  }
  
  // Try with regular img tag as fallback
  if (useImgFallback) {
    return (
      <img
        src={safeUrl}
        alt={alt}
        className={`${className} object-cover`}
        onLoad={handleLoad}
        onError={handleError}
        width={width}
        height={height}
        style={fill ? { objectFit: 'cover', width: '100%', height: '100%' } : undefined}
      />
    );
  }
  
  // Default: try with Next.js Image component
  return (
    <div className={`relative ${className}`} style={{ width: fill ? '100%' : width, height: fill ? '100%' : height }}>
      <Image
        src={safeUrl}
        alt={alt}
        className="object-cover"
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        sizes={sizes}
        priority={priority}
        onLoadingComplete={handleLoad}
        onError={handleError}
        unoptimized={true}
        blurDataURL={blurDataURL}
        placeholder="blur"
      />
    </div>
  );
}

export default SupabaseImage; 