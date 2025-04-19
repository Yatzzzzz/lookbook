'use client';

import React, { useState, useEffect } from 'react';
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
  
  // Debug logging for props
  useEffect(() => {
    console.log('SupabaseImage - Rendering with props:', { 
      src: src?.substring(0, 100) + (src?.length > 100 ? '...' : ''),
      alt, 
      fill, 
      width, 
      height 
    });
  }, [src, alt, fill, width, height]);
  
  // Handle successful loading
  const handleLoad = () => {
    console.log('SupabaseImage - Successfully loaded:', src?.substring(0, 100) + (src?.length > 100 ? '...' : ''));
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };
  
  // Handle error - try fallback to regular img tag
  const handleError = () => {
    console.error('SupabaseImage - Error loading:', src?.substring(0, 100) + (src?.length > 100 ? '...' : ''));
    setIsLoading(false);
    
    if (!useImgFallback) {
      console.log('SupabaseImage - Trying fallback to img tag');
      // First failure, try with img tag
      setUseImgFallback(true);
    } else {
      // Both methods failed
      console.error('SupabaseImage - Both Next.js Image and img tag failed to load the image');
      setHasError(true);
      onError?.();
    }
  };
  
  // Create a safe URL - handle URL encoding issues
  const safeUrl = typeof src === 'string' ? 
    src.replace(/\s/g, '%20').replace(/\\/g, '/') : 
    '';

  // Fix common URL issues
  useEffect(() => {
    if (typeof src === 'string' && src) {
      // Additional sanitization for safety
      try {
        // Check if URL needs protocol
        if (src.startsWith('//')) {
          console.log('SupabaseImage - URL starts with //, adding https:');
          const fixedUrl = `https:${src}`;
          (window as any).__fixedImageUrls = (window as any).__fixedImageUrls || {};
          (window as any).__fixedImageUrls[src] = fixedUrl;
        }
        
        // Check for local or relative paths
        if (src.startsWith('/') && !src.startsWith('//')) {
          console.log('SupabaseImage - Possibly relative path detected, might need to convert to absolute URL');
        }
        
        if (!src.startsWith('http') && !src.startsWith('/')) {
          console.log('SupabaseImage - Non-absolute URL detected, might need to prefix with storage URL');
        }
      } catch (e) {
        console.error('SupabaseImage - Error checking URL format:', e);
      }
    }
  }, [src]);

  // Additional URL validation
  useEffect(() => {
    if (safeUrl) {
      try {
        const url = new URL(safeUrl);
        console.log('SupabaseImage - Valid URL:', url.toString().substring(0, 100) + (url.toString().length > 100 ? '...' : ''));
        
        // Try prefetching the image to check validity
        const img = new Image();
        img.onload = () => {
          console.log('SupabaseImage - Image prefetch successful');
        };
        img.onerror = () => {
          console.error('SupabaseImage - Image prefetch failed, URL might be invalid:', safeUrl.substring(0, 100) + (safeUrl.length > 100 ? '...' : ''));
        };
        img.src = safeUrl;
      } catch (e) {
        console.error('SupabaseImage - Invalid URL format:', safeUrl.substring(0, 100) + (safeUrl.length > 100 ? '...' : ''));
      }
    }
  }, [safeUrl]);
  
  // If we've had errors with both methods, show error UI
  if (hasError) {
    console.log('SupabaseImage - Showing error UI for:', safeUrl.substring(0, 100) + (safeUrl.length > 100 ? '...' : ''));
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 ${className}`} style={fill ? { width: '100%', height: '100%' } : { width, height }}>
        <ImageOff className="h-6 w-6 text-gray-400 mb-1" />
        <p className="text-xs text-gray-500">Image not available</p>
      </div>
    );
  }
  
  // Show loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`} style={fill ? { width: '100%', height: '100%' } : { width, height }}>
        <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
      </div>
    );
  }
  
  // Try with regular img tag as fallback
  if (useImgFallback) {
    console.log('SupabaseImage - Using img tag fallback for:', safeUrl.substring(0, 100) + (safeUrl.length > 100 ? '...' : ''));
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
        sizes={sizes || (fill ? '100vw' : undefined)}
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