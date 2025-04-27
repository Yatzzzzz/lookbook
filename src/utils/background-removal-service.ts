/**
 * Background Removal Service
 * 
 * This service handles background removal for clothing items in the outfit builder.
 * It uses the /api/background-removal endpoint which leverages Google Vision API
 * for object detection and segmentation.
 */

/**
 * Removes the background from an image using the background removal API
 * @param imageFile - The image file to process
 * @returns A promise that resolves to the URL of the processed image or null if failed
 */
export async function removeBackground(imageFile: File): Promise<string | null> {
  try {
    // Convert the file to base64
    const imageBase64 = await fileToBase64(imageFile);
    
    // Call the background removal API
    const response = await fetch('/api/background-removal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageBase64 }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Background removal failed');
    }
    
    const result = await response.json();
    
    // In a real implementation with full background removal capability,
    // the result would contain a URL to the processed image
    // For now, we just return the bounding box information for client-side cropping
    if (result.success && result.boundingBox) {
      // Apply client-side cropping based on bounding box
      return await cropImageToBoundingBox(imageFile, result.boundingBox);
    }
    
    // If no bounding box is available, return the original image
    return URL.createObjectURL(imageFile);
  } catch (error) {
    console.error('Error in background removal service:', error);
    return null;
  }
}

/**
 * Converts a file to a base64 string
 * @param file - The file to convert
 * @returns A promise that resolves to the base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Crops an image to a specified bounding box
 * @param imageFile - The image file to crop
 * @param boundingBox - The normalized coordinates for cropping
 * @returns A promise that resolves to the URL of the cropped image
 */
async function cropImageToBoundingBox(
  imageFile: File, 
  boundingBox: Array<{x: number, y: number}>
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create image element from file
    const img = new Image();
    img.src = URL.createObjectURL(imageFile);
    
    img.onload = () => {
      try {
        // Create canvas for cropping
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Calculate bounding box coordinates in pixels
        const minX = Math.min(...boundingBox.map(point => point.x)) * img.width;
        const minY = Math.min(...boundingBox.map(point => point.y)) * img.height;
        const maxX = Math.max(...boundingBox.map(point => point.x)) * img.width;
        const maxY = Math.max(...boundingBox.map(point => point.y)) * img.height;
        
        const width = maxX - minX;
        const height = maxY - minY;
        
        // Set canvas size to bounding box size
        canvas.width = width;
        canvas.height = height;
        
        // Draw the cropped image onto the canvas
        ctx.drawImage(
          img,
          minX, minY, width, height,  // Source rectangle
          0, 0, width, height        // Destination rectangle
        );
        
        // Convert canvas to blob and then to URL
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            resolve(url);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        }, imageFile.type);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
  });
}

/**
 * Cache for storing processed images to avoid redundant processing
 */
interface CacheEntry {
  url: string;
  timestamp: number;
}

const backgroundRemovalCache = new Map<string, CacheEntry>();
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Gets a cached background-removed image URL or processes a new one
 * @param imageFile - The image file to process
 * @returns A promise that resolves to the URL of the processed image or null if failed
 */
export async function getCachedOrProcessImage(imageFile: File): Promise<string | null> {
  // Generate a cache key based on filename and last modified time
  const cacheKey = `${imageFile.name}-${imageFile.lastModified}`;
  
  // Check if we have a valid cached version
  const cached = backgroundRemovalCache.get(cacheKey);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp < CACHE_EXPIRY)) {
    return cached.url;
  }
  
  // Process the image
  const processedUrl = await removeBackground(imageFile);
  
  // Cache the result if successful
  if (processedUrl) {
    backgroundRemovalCache.set(cacheKey, {
      url: processedUrl,
      timestamp: now
    });
  }
  
  return processedUrl;
} 