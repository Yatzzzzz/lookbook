'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  Share2, 
  Bookmark, 
  Heart, 
  Star, 
  ShoppingCart, 
  Shirt, 
  User, 
  ThumbsUp,
  Tag,
  ChevronLeft,
  ChevronRight,
  ImageOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface LookData {
  look_id: string;
  user_id: string;
  username?: string;
  title?: string;
  description?: string;
  image_url: string;
  created_at: string;
  rating?: string;
  tags?: string[];
}

interface ProductData {
  id: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  description: string;
  image_url: string;
  product_url: string;
  category: string;
}

export default function LookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fileName = decodeURIComponent(params.name as string);
  
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lookData, setLookData] = useState<LookData | null>(null);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);
  const [following, setFollowing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [rating, setRating] = useState(0);
  const [showRatingSlider, setShowRatingSlider] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLookDetails() {
      try {
        setLoading(true);
        
        // Get the file name from the URL params
        const fileName = decodeURIComponent(params.name as string);
        console.log('Looking up file with name:', fileName);
        
        // First, try to find the look by its file name in the storage path
        let { data: looksByPath, error: pathError } = await supabase
          .from('looks')
          .select('*, users:user_id(username)')
          .ilike('storage_path', `%${fileName}%`)
          .single();
          
        if (pathError) {
          console.log('No look found by path with name:', fileName);
          
          // If we can't find by path, get the public URL and try to find by URL
          const { data: { publicUrl } } = supabase.storage
            .from('looks')
            .getPublicUrl(fileName);
            
          setImageUrl(publicUrl);
          
          // Try to find look by image_url
          let { data: lookByUrl, error: urlError } = await supabase
            .from('looks')
            .select('*, users:user_id(username)')
            .eq('image_url', publicUrl)
            .maybeSingle();
          
          if (!lookByUrl) {
            console.log('No look found by exact URL, trying partial match...');
            // Try partial match on image_url
            const { data: looksByPartialUrl, error: partialUrlError } = await supabase
              .from('looks')
              .select('*, users:user_id(username)')
              .ilike('image_url', `%${fileName}%`);
              
            if (looksByPartialUrl && looksByPartialUrl.length > 0) {
              lookByUrl = looksByPartialUrl[0];
            }
          }
          
          if (lookByUrl) {
            looksByPath = lookByUrl;
          } else {
            // Last resort: Try the original method with file_name
            const { data: lookMetadata, error: lookError } = await supabase
              .from('looks')
              .select('*, users:user_id(username)')
              .eq('file_name', fileName)
              .maybeSingle();
              
            if (lookMetadata) {
              looksByPath = lookMetadata;
            }
          }
        }
        
        if (looksByPath) {
          console.log('Found look metadata:', looksByPath);
          
          // Ensure we have the image URL
          if (!imageUrl && looksByPath.image_url) {
            setImageUrl(looksByPath.image_url);
          }
          
          // Check if we have username from the join
          if (looksByPath.users && looksByPath.users.username) {
            looksByPath.username = looksByPath.users.username;
          }
          
          // If we still don't have a username, try to get it directly
          if (!looksByPath.username && looksByPath.user_id) {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('username')
              .eq('id', looksByPath.user_id)
              .single();
              
            if (!userError && userData && userData.username) {
              looksByPath.username = userData.username;
            }
          }
          
          setLookData(looksByPath);
          
          // Fetch real products from Supabase if tags exist
          if (looksByPath.tags && looksByPath.tags.length > 0) {
            const { data: productData, error: productError } = await supabase
              .from('products')
              .select('*')
              .in('category', looksByPath.tags);
              
            if (!productError && productData) {
              setProducts(productData);
            }
          }
        } else {
          console.error('No look metadata found for:', fileName);
          setError('Could not find details for this look');
        }
        
      } catch (err: unknown) {
        console.error('Error fetching look details:', err);
        if (err instanceof Error) {
          setError(err.message || 'Failed to load look details');
        } else {
          setError('An unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    }

    if (fileName) {
      fetchLookDetails();
    }
    
  }, [fileName]);
  
  // Handler for rating slider
  const handleSliderMove = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const percentage = offsetX / rect.width;
    
    // Calculate rating (1-5)
    const newRating = Math.max(1, Math.min(5, Math.ceil(percentage * 5)));
    setRating(newRating);
  };
  
  // Function to show success message
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };
  
  // Action handlers
  const handleShare = () => {
    showSuccess('Look shared successfully!');
  };
  
  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        showSuccess('Please log in to save looks');
        return;
      }
      
      if (!lookData?.look_id) {
        showSuccess('Cannot save this look');
        return;
      }
      
      const newSavedState = !saved;
      setSaved(newSavedState);
      
      // Update the saved_looks table
      if (newSavedState) {
        await supabase
          .from('saved_looks')
          .insert({
            user_id: user.id,
            look_id: lookData.look_id
          });
      } else {
        await supabase
          .from('saved_looks')
          .delete()
          .match({
            user_id: user.id,
            look_id: lookData.look_id
          });
      }
      
      showSuccess(saved ? 'Look removed from saved collection' : 'Look saved to your collection!');
    } catch (err) {
      console.error('Error saving look:', err);
      showSuccess('Error saving look');
    }
  };
  
  const handleFollow = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        showSuccess('Please log in to follow users');
        return;
      }
      
      if (!lookData?.user_id) {
        showSuccess('Cannot follow this user');
        return;
      }
      
      const newFollowingState = !following;
      setFollowing(newFollowingState);
      
      // Update the followers table
      if (newFollowingState) {
        await supabase
          .from('followers')
          .insert({
            follower_id: user.id,
            following_id: lookData.user_id
          });
      } else {
        await supabase
          .from('followers')
          .delete()
          .match({
            follower_id: user.id,
            following_id: lookData.user_id
          });
      }
      
      showSuccess(following ? 'Unfollowed user' : 'Now following this user!');
    } catch (err) {
      console.error('Error following user:', err);
      showSuccess('Error updating follow status');
    }
  };
  
  const handleRateClick = () => {
    setShowRatingSlider(!showRatingSlider);
  };
  
  const handleWishlist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        showSuccess('Please log in to add to wishlist');
        return;
      }
      
      if (!lookData?.look_id) {
        showSuccess('Cannot add to wishlist');
        return;
      }
      
      const newWishlistedState = !wishlisted;
      setWishlisted(newWishlistedState);
      
      // Update the wishlist table
      if (newWishlistedState) {
        await supabase
          .from('wishlist')
          .insert({
            user_id: user.id,
            look_id: lookData.look_id
          });
      } else {
        await supabase
          .from('wishlist')
          .delete()
          .match({
            user_id: user.id,
            look_id: lookData.look_id
          });
      }
      
      showSuccess(wishlisted ? 'Removed from wishlist' : 'Added to your wishlist!');
    } catch (err) {
      console.error('Error updating wishlist:', err);
      showSuccess('Error updating wishlist');
    }
  };
  
  const handleBuy = () => {
    if (selectedProduct) {
      window.open(selectedProduct.product_url, '_blank');
    } else {
      showSuccess('Please select a product to buy');
    }
  };
  
  const handleTryOn = () => {
    if (lookData?.look_id) {
      router.push(`/tryon/${lookData.look_id}`);
    } else {
      showSuccess('Virtual try-on is not available for this look');
    }
  };
  
  const handleTagClick = async (tag: string) => {
    setSelectedTag(tag);
    
    try {
      // Find a product that matches this tag
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('category', tag)
        .single();
        
      if (productError) {
        console.error('Error fetching product by tag:', productError);
      } else if (productData) {
        setSelectedProduct(productData);
      }
    } catch (err) {
      console.error('Error fetching product by tag:', err);
    }
  };
  
  const closeProductDetails = () => {
    setSelectedTag(null);
    setSelectedProduct(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Error loading look details</p>
          <p>{error}</p>
        </div>
        <Link href="/gallery" className="text-blue-600 hover:underline">
          &larr; Back to Gallery
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Success message notification */}
      {successMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white p-3 rounded-md shadow-lg z-50 max-w-md animate-fade-in">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <p>{successMessage}</p>
            <button 
              onClick={() => setSuccessMessage(null)} 
              className="ml-auto text-white hover:text-gray-200 focus:outline-none"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center mb-6">
          <Link href="/gallery" className="text-blue-600 hover:underline flex items-center">
            <ChevronLeft size={16} className="mr-1" />
            Back to Gallery
          </Link>
        </div>
        
        {/* Main content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Product details overlay */}
          {selectedProduct && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b flex justify-between items-center">
                  <h2 className="text-xl font-bold">{selectedProduct.name}</h2>
                  <button 
                    onClick={closeProductDetails}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                <div className="md:flex">
                  <div className="md:w-1/2">
                    <img 
                      src={selectedProduct.image_url} 
                      alt={selectedProduct.name}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                  <div className="p-6 md:w-1/2">
                    <div className="mb-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Brand</span>
                      <h3 className="text-lg font-semibold">{selectedProduct.brand}</h3>
                    </div>
                    
                    <div className="mb-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Price</span>
                      <p className="text-2xl font-bold">{selectedProduct.currency} {selectedProduct.price.toFixed(2)}</p>
                    </div>
                    
                    <div className="mb-6">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Description</span>
                      <p className="text-gray-700 dark:text-gray-300">{selectedProduct.description}</p>
                    </div>
                    
                    <div className="space-y-3">
                      <a 
                        href={selectedProduct.product_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center justify-center"
                      >
                        <ShoppingCart size={16} className="mr-2" />
                        Shop Now
                      </a>
                      
                      <button 
                        onClick={handleWishlist}
                        className="w-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 py-2 px-4 rounded-md flex items-center justify-center"
                      >
                        <Heart 
                          size={16} 
                          className={cn("mr-2", wishlisted && "fill-red-500 text-red-500")} 
                        />
                        {wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      </button>
                      
                      <button 
                        onClick={handleTryOn}
                        className="w-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 py-2 px-4 rounded-md flex items-center justify-center"
                      >
                        <Shirt size={16} className="mr-2" />
                        Virtual Try-On
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="md:flex flex-col md:flex-row">
            <div className="md:w-3/5">
              <div className="relative pb-[100%] overflow-hidden bg-black rounded-lg">
                {imageUrl ? (
                  <img 
                    src={imageUrl}
                    alt="Fashion look"
                    className="absolute top-0 left-0 w-full h-full object-contain"
                    onError={(e) => {
                      console.error('Image failed to load:', imageUrl);
                      setError('The image could not be loaded');
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
                    <ImageOff size={48} />
                  </div>
                )}
              </div>
              
              {/* Look details */}
              <div className="mt-4">
                {/* Creator info */}
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                    {lookData?.username ? lookData.username.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div>
                    <p className="font-medium">@{lookData?.username || 'Anonymous'}</p>
                    <p className="text-xs text-gray-500">
                      {lookData?.created_at ? new Date(lookData.created_at).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>
                
                {/* Action buttons under the image */}
                <div className="p-4 grid grid-cols-7 gap-2 border-b">
                  <button 
                    onClick={handleShare}
                    className="flex flex-col items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    aria-label="Share"
                  >
                    <Share2 size={20} className="mb-1" />
                    <span className="text-xs">Share</span>
                  </button>
                  
                  <button 
                    onClick={handleSave}
                    className="flex flex-col items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    aria-label="Save"
                  >
                    <Bookmark 
                      size={20} 
                      className={cn("mb-1", saved && "fill-blue-500 text-blue-500")} 
                    />
                    <span className="text-xs">Save</span>
                  </button>
                  
                  <button 
                    onClick={handleFollow}
                    className="flex flex-col items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    aria-label="Follow"
                  >
                    <User 
                      size={20} 
                      className={cn("mb-1", following && "text-blue-500")} 
                    />
                    <span className="text-xs">{following ? 'Following' : 'Follow'}</span>
                  </button>
                  
                  <button 
                    onClick={handleRateClick}
                    className="flex flex-col items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    aria-label="Rate"
                  >
                    <Star 
                      size={20} 
                      className={cn("mb-1", rating > 0 && "fill-yellow-400 text-yellow-400")} 
                    />
                    <span className="text-xs">Rate</span>
                  </button>
                  
                  <button 
                    onClick={handleTryOn}
                    className="flex flex-col items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    aria-label="Try On"
                  >
                    <Shirt size={20} className="mb-1" />
                    <span className="text-xs">Try On</span>
                  </button>
                  
                  <button 
                    onClick={handleWishlist}
                    className="flex flex-col items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    aria-label="Wishlist"
                  >
                    <Heart 
                      size={20} 
                      className={cn("mb-1", wishlisted && "fill-red-500 text-red-500")} 
                    />
                    <span className="text-xs">Wishlist</span>
                  </button>
                  
                  <button 
                    onClick={handleBuy}
                    className="flex flex-col items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    aria-label="Buy"
                  >
                    <ShoppingCart size={20} className="mb-1" />
                    <span className="text-xs">Buy</span>
                  </button>
                </div>
                
                {/* Tags section */}
                <div className="p-4">
                  <h2 className="text-lg font-semibold mb-3 flex items-center">
                    <Tag size={16} className="mr-2" />
                    Items in this look
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {lookData?.tags?.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleTagClick(tag)}
                        className={cn(
                          "px-3 py-1 rounded-full text-sm",
                          selectedTag === tag 
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" 
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                        )}
                      >
                        #{tag}
                      </button>
                    ))}
                    {(!lookData?.tags || lookData.tags.length === 0) && (
                      <span className="text-gray-500 dark:text-gray-400 text-sm">No tags available for this look</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 md:w-2/5">
              {/* Look title and description */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">
                  {lookData?.title || fileName.replace(/\.\w+$/, '').replace(/_/g, ' ')}
                </h1>
                
                {lookData?.description && (
                  <p className="text-gray-700 dark:text-gray-300">{lookData.description}</p>
                )}
              </div>
              
              {/* Product recommendations - only show if we have products */}
              {products.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-lg font-semibold mb-3">Shop this look</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {products.map((product) => (
                      <div 
                        key={product.id} 
                        className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-md"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <div className="aspect-square relative overflow-hidden">
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-2">
                          <p className="text-sm font-medium line-clamp-1">{product.name}</p>
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-sm font-semibold">{product.currency} {product.price.toFixed(2)}</p>
                            <span className="text-xs text-gray-500">{product.brand}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Related looks */}
              <div>
                <h2 className="text-lg font-semibold mb-3">You might also like</h2>
                <div className="grid grid-cols-3 gap-2">
                  {/* We'll load this from the API dynamically */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
