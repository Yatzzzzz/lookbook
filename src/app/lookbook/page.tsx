'use client';

import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import * as Tabs from '@radix-ui/react-tabs';
import { Search, ArrowRight, Camera, X, Edit, Save } from 'lucide-react';
import { useWardrobe } from '@/app/context/WardrobeContext';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

type Look = {
  look_id: string;
  image_url: string;
  description: string | null;
  created_at: string;
  feature_in?: string[];
  upload_type?: string;
};

export default function LookbookPage() {
  const router = useRouter();
  const { user, signOut, updateUserAvatar, updateUserMetadata } = useAuth();
  const supabase = createClientComponentClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [activeLookTab, setActiveLookTab] = useState('saved');
  const [userLooks, setUserLooks] = useState<Look[]>([]);
  const [savedLooks, setSavedLooks] = useState<Look[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const { wardrobeItems, isLoading: wardrobeLoading } = useWardrobe();
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isBioEditOpen, setIsBioEditOpen] = useState(false);
  const [bio, setBio] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const photoCanvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const MAX_BIO_LENGTH = 100;

  const topNavItems = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
    { id: 'orders', name: 'Orders', icon: '📦' },
    { id: 'wallet', name: 'Wallet', icon: '💰' },
    { id: 'cart', name: 'Cart', icon: '🛒' },
  ];

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Set initial bio from user metadata
    if (user.user_metadata?.bio) {
      setBio(user.user_metadata.bio);
    }

    // Set initial avatar URL
    if (user.user_metadata?.avatar_url) {
      setProfilePhotoUrl(user.user_metadata.avatar_url);
    }

    if (activeLookTab === 'my-lookbook') {
      fetchUserLooks();
    } else if (activeLookTab === 'saved') {
      fetchSavedLooks();
    }
  }, [activeLookTab, user, router]);

  const fetchUserLooks = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('looks')
        .select('look_id, image_url, description, created_at, feature_in, upload_type')
        .eq('user_id', user.id)
        .or(`upload_type.eq.regular,feature_in.cs.{lookbook}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setUserLooks(data || []);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error fetching user looks:', error);
        setError(error.message);
      } else {
        console.error('An unexpected error occurred:', error);
        setError('An unexpected error occurred while fetching user looks');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedLooks = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // This would typically involve a saved_looks join table
      // For now, just show some mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      setSavedLooks([]);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error fetching saved looks:', error);
        setError(error.message);
      } else {
        console.error('An unexpected error occurred:', error);
        setError('An unexpected error occurred while fetching saved looks');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  // Filter options based on active tab
  const getFilterOptions = () => {
    if (activeLookTab === 'saved') {
      return [
        { id: 'all', label: 'All Saved' },
        { id: 'recent', label: 'Recent' },
        { id: 'favorite', label: 'Favorites' }
      ];
    }
    if (activeLookTab === 'wardrobe') {
      return [
        { id: 'all', label: 'All Items' },
        { id: 'tops', label: 'Tops' },
        { id: 'bottoms', label: 'Bottoms' },
        { id: 'shoes', label: 'Shoes' },
        { id: 'accessories', label: 'Accessories' }
      ];
    }
    return [
      { id: 'all', label: 'All Looks' },
      { id: 'casual', label: 'Casual' },
      { id: 'formal', label: 'Formal' },
      { id: 'sport', label: 'Sport' },
      { id: 'party', label: 'Party' }
    ];
  };

  // Handle profile photo upload
  const handleProfilePhotoClick = () => {
    // Open dialog with camera or file upload options
    setIsCameraOpen(true);
  };

  // Handle file input change
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUpdating(true);
      
      // Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        throw new Error("Authentication error");
      }
      
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `avatars/${currentUser.id}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the URL
      const { data: publicUrlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);
      
      const avatarUrl = publicUrlData.publicUrl;
      
      // Update user metadata
      await updateUserAvatar(avatarUrl);
      setProfilePhotoUrl(avatarUrl);
      toast.success('Profile picture updated successfully');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error('Failed to update profile picture');
    } finally {
      setIsCameraOpen(false);
      setIsUpdating(false);
      setCapturedImage(null);
    }
  };

  // Handle camera capture
  const startCamera = async () => {
    try {
      if (videoRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' }
        });
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      toast.error('Could not access camera');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const takePicture = () => {
    if (videoRef.current && photoCanvasRef.current) {
      const video = videoRef.current;
      const canvas = photoCanvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        // Match canvas size to video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to data URL
        const imageDataURL = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageDataURL);
        
        // Stop camera
        stopCamera();
      }
    }
  };

  const handleImageApprove = async () => {
    if (!capturedImage) return;
    
    try {
      setIsUpdating(true);
      
      // Convert data URL to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      
      // Create a file from the blob
      const file = new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' });
      
      // Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        throw new Error("Authentication error");
      }
      
      // Upload to storage
      const fileName = `avatars/${currentUser.id}-${Date.now()}.jpg`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the URL
      const { data: publicUrlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);
      
      const avatarUrl = publicUrlData.publicUrl;
      
      // Update user metadata
      await updateUserAvatar(avatarUrl);
      setProfilePhotoUrl(avatarUrl);
      toast.success('Profile picture updated successfully');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error('Failed to update profile picture');
    } finally {
      setIsCameraOpen(false);
      setIsUpdating(false);
      setCapturedImage(null);
    }
  };

  const handleRetakePicture = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleSaveBio = async () => {
    try {
      setIsUpdating(true);
      
      // Update user metadata
      await updateUserMetadata({ bio: bio.trim() });
      setIsBioEditOpen(false);
      toast.success('Bio updated successfully');
    } catch (error) {
      console.error('Error updating bio:', error);
      toast.error('Failed to update bio');
    } finally {
      setIsUpdating(false);
    }
  };

  // Camera dialog effect
  useEffect(() => {
    if (isCameraOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isCameraOpen]);

  if (!user) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <div className="pb-16">
      {/* Top Navigation */}
      <div className="flex overflow-x-auto py-2 border-b">
        {topNavItems.map((item) => (
          <button
            key={item.id}
            className={`flex flex-col items-center px-4 py-2 min-w-[70px] ${
              activeTab === item.id
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="text-xl mb-1">{item.icon}</span>
            <span className="text-xs">{item.name}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div>
            <div className="flex mb-6">
              {/* Profile Picture + User Info (50%) */}
              <div className="flex items-center w-1/2">
                <div 
                  onClick={handleProfilePhotoClick}
                  className="relative h-14 w-14 bg-gray-300 rounded-full flex items-center justify-center text-lg cursor-pointer overflow-hidden"
                >
                  {profilePhotoUrl ? (
                    <img 
                      src={profilePhotoUrl} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user.email?.charAt(0).toUpperCase() || "U"
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="ml-3">
                  <h2 className="text-sm font-semibold">{user.user_metadata?.username || 'User'}</h2>
                </div>
              </div>
              
              {/* Bio Section (50%) */}
              <div className="w-1/2 pl-4">
                <div className="flex items-start">
                  <p 
                    onClick={() => {
                      setBio(user.user_metadata?.bio || '');
                      setIsBioEditOpen(true);
                    }}
                    className="text-gray-600 text-xs cursor-pointer flex-1"
                  >
                    {user.user_metadata?.bio || (
                      <span className="text-blue-500 hover:underline">No bio yet. Click here to add one!</span>
                    )}
                  </p>
                  {user.user_metadata?.bio && (
                    <button 
                      onClick={() => {
                        setBio(user.user_metadata?.bio || '');
                        setIsBioEditOpen(true);
                      }}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Stats Section */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <h3 className="font-medium mb-2 text-sm">Stats</h3>
              <div className="grid grid-cols-2 gap-1 text-center">
                <div>
                  <div className="text-lg font-bold">0</div>
                  <div className="text-xs text-gray-500">Looks</div>
                </div>
                <div>
                  <div className="text-lg font-bold">0</div>
                  <div className="text-xs text-gray-500">Followers</div>
                </div>
              </div>
            </div>
            
            {/* Tabs for saved looks, my lookbook, etc. */}
            <Tabs.Root 
              value={activeLookTab} 
              onValueChange={setActiveLookTab}
              className="w-full"
            >
              <Tabs.List className="flex w-full border-b border-gray-200 dark:border-gray-700 mb-4 overflow-x-auto">
                <Tabs.Trigger 
                  value="saved"
                  className="px-3 py-1 text-xs font-medium border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 whitespace-nowrap flex flex-col items-center"
                >
                  <span>Saved</span>
                  <span>Looks</span>
                </Tabs.Trigger>
                <Tabs.Trigger 
                  value="my-lookbook"
                  className="px-3 py-1 text-xs font-medium border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 whitespace-nowrap flex flex-col items-center"
                >
                  <span>My</span>
                  <span>Lookbook</span>
                </Tabs.Trigger>
                <Tabs.Trigger 
                  value="virtual"
                  className="px-3 py-1 text-xs font-medium border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 whitespace-nowrap flex flex-col items-center"
                >
                  <span>Virtual</span>
                  <span>Looks</span>
                </Tabs.Trigger>
                <Tabs.Trigger 
                  value="wardrobe"
                  className="px-3 py-1 text-xs font-medium border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 whitespace-nowrap flex flex-col items-center"
                  onClick={() => router.push('/wardrobe')}
                >
                  <span>My</span>
                  <span>Wardrobe</span>
                </Tabs.Trigger>
              </Tabs.List>
              
              {/* Filter and search bar */}
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex overflow-x-auto w-full sm:w-auto">
                  {getFilterOptions().map(filter => (
                    <button
                      key={filter.id}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full mr-2 whitespace-nowrap
                        ${activeFilter === filter.id 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      onClick={() => setActiveFilter(filter.id)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
                
                <div className="relative w-full sm:w-64">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Tab content */}
              <Tabs.Content value="saved" className="outline-none">
                {loading ? (
                  <div className="text-center py-10">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                    <p className="mt-2 text-gray-500">Loading saved looks...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-10">
                    <p className="text-red-500">Error loading saved looks</p>
                    <p className="text-sm text-gray-500">{error}</p>
                  </div>
                ) : savedLooks.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No saved looks yet</p>
                    <button className="mt-2 text-blue-600 hover:underline">Explore looks to save</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {savedLooks.map((look) => (
                      <div key={look.look_id} className="relative rounded-lg overflow-hidden shadow-md">
                        <img 
                          src={look.image_url} 
                          alt="Look" 
                          className="w-full h-auto object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                          <p className="text-white text-xs truncate">{look.description || 'No description'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Tabs.Content>
              
              <Tabs.Content value="my-lookbook" className="outline-none">
                {loading ? (
                  <div className="text-center py-10">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                    <p className="mt-2 text-gray-500">Loading your looks...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-10">
                    <p className="text-red-500">Error loading your looks</p>
                    <p className="text-sm text-gray-500">{error}</p>
                  </div>
                ) : userLooks.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No looks in your lookbook yet</p>
                    <button 
                      onClick={() => router.push('/look')}
                      className="mt-2 text-blue-600 hover:underline"
                    >
                      Create your first look
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {userLooks.map((look) => (
                      <div key={look.look_id} className="relative rounded-lg overflow-hidden shadow-md">
                        <img 
                          src={look.image_url} 
                          alt="Look" 
                          className="w-full h-auto object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                          <p className="text-white text-xs truncate">{look.description || 'No description'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Tabs.Content>
              
              <Tabs.Content value="virtual" className="outline-none">
                <div className="text-center py-10">
                  <p className="text-gray-500">Virtual looks coming soon</p>
                  <p className="text-sm text-gray-400">Create virtual outfits with AI</p>
                </div>
              </Tabs.Content>
              
              <Tabs.Content value="wardrobe" className="outline-none">
                {wardrobeLoading ? (
                  <div className="text-center py-10">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                    <p className="mt-2 text-gray-500">Loading your wardrobe...</p>
                  </div>
                ) : wardrobeItems.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500">Your wardrobe is empty</p>
                    <button 
                      onClick={() => router.push('/wardrobe')}
                      className="mt-2 text-blue-600 hover:underline"
                    >
                      Add your first item
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Wardrobe Statistics */}
                    <div className="bg-white rounded-lg shadow-md p-4">
                      <h3 className="font-medium mb-3 text-sm">Wardrobe Summary</h3>
                      <div className="grid grid-cols-3 gap-2 text-center mb-4">
                        <div className="bg-blue-50 p-2 rounded-lg">
                          <div className="text-lg font-bold">{wardrobeItems.filter(item => item.category === 'top').length}</div>
                          <div className="text-xs text-gray-500">Tops</div>
                        </div>
                        <div className="bg-blue-50 p-2 rounded-lg">
                          <div className="text-lg font-bold">{wardrobeItems.filter(item => item.category === 'bottom').length}</div>
                          <div className="text-xs text-gray-500">Bottoms</div>
                        </div>
                        <div className="bg-blue-50 p-2 rounded-lg">
                          <div className="text-lg font-bold">{wardrobeItems.filter(item => item.category === 'shoes').length}</div>
                          <div className="text-xs text-gray-500">Shoes</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-blue-50 p-2 rounded-lg">
                          <div className="text-lg font-bold">{wardrobeItems.filter(item => item.category === 'dress').length}</div>
                          <div className="text-xs text-gray-500">Dresses</div>
                        </div>
                        <div className="bg-blue-50 p-2 rounded-lg">
                          <div className="text-lg font-bold">{wardrobeItems.filter(item => item.category === 'accessories').length}</div>
                          <div className="text-xs text-gray-500">Accessories</div>
                        </div>
                        <div className="bg-blue-50 p-2 rounded-lg">
                          <div className="text-lg font-bold">{wardrobeItems.filter(item => !['top', 'bottom', 'shoes', 'dress', 'accessories'].includes(item.category)).length}</div>
                          <div className="text-xs text-gray-500">Other</div>
                        </div>
                      </div>
                      <div className="mt-4 text-center">
                        <div className="text-xl font-bold">{wardrobeItems.length}</div>
                        <div className="text-sm text-gray-500">Total Items</div>
                      </div>
                    </div>
                    
                    {/* Recently Added Items */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium text-sm">Recently Added</h3>
                        <button 
                          onClick={() => router.push('/wardrobe')}
                          className="text-blue-600 text-xs flex items-center hover:underline"
                        >
                          View All <ArrowRight className="ml-1 h-3 w-3" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        {wardrobeItems.slice(0, 3).map(item => (
                          <div key={item.item_id} className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-100">
                              {item.image_path ? (
                                <img 
                                  src={item.image_path} 
                                  alt={item.name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  No image
                                </div>
                              )}
                            </div>
                            <div className="p-2">
                              <h4 className="text-xs font-medium truncate">{item.name}</h4>
                              <p className="text-xs text-gray-500 truncate">{item.category}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <button 
                        onClick={() => router.push('/wardrobe')}
                        className="w-full mt-4 py-2 text-center border border-blue-600 text-blue-600 rounded-lg text-sm hover:bg-blue-50 transition-colors"
                      >
                        Go to Full Wardrobe
                      </button>
                    </div>
                  </div>
                )}
              </Tabs.Content>
            </Tabs.Root>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
              <div className="border-b p-4">
                <h3 className="font-medium">Account Settings</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span>Edit Profile</span>
                  <button className="text-blue-600">Edit</button>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span>Notifications</span>
                  <button className="text-blue-600">Manage</button>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span>Privacy</span>
                  <button className="text-blue-600">Edit</button>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span>Password</span>
                  <button className="text-blue-600">Change</button>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
              <div className="border-b p-4">
                <h3 className="font-medium">App Settings</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span>Language</span>
                  <div className="text-gray-500">English</div>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span>Theme</span>
                  <div className="text-gray-500">Light</div>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full py-2 mt-4 bg-red-600 text-white rounded-lg"
            >
              Log Out
            </button>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Orders</h2>
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-2">No orders yet</p>
              <button className="text-blue-600">Start Shopping</button>
            </div>
          </div>
        )}

        {/* Wallet Tab */}
        {activeTab === 'wallet' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Wallet</h2>
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500 text-sm">Current Balance</p>
                  <p className="text-2xl font-bold">$0.00</p>
                </div>
                <button className="bg-blue-500 text-white px-4 py-2 rounded-lg">Add Funds</button>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="border-b p-4">
                <h3 className="font-medium">Transaction History</h3>
              </div>
              <div className="p-4">
                <p className="text-center text-gray-500">No transactions yet</p>
              </div>
            </div>
          </div>
        )}

        {/* Cart Tab */}
        {activeTab === 'cart' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Cart</h2>
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-2">Your cart is empty</p>
              <button className="text-blue-600">Start Shopping</button>
            </div>
          </div>
        )}
      </div>

      {/* Camera Dialog */}
      <Dialog.Root open={isCameraOpen} onOpenChange={setIsCameraOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5/6 max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg font-semibold dark:text-white">Update Profile Photo</Dialog.Title>
              <Dialog.Close asChild>
                <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>
            
            {!capturedImage ? (
              <>
                <div className="relative bg-gray-200 dark:bg-gray-700 aspect-square mb-4 flex items-center justify-center rounded-lg overflow-hidden">
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={photoCanvasRef} className="hidden" />
                </div>
                
                <div className="flex justify-between">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                    disabled={isUpdating}
                  >
                    Upload Image
                  </button>
                  <button 
                    onClick={takePicture}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md dark:bg-blue-700 dark:hover:bg-blue-800"
                    disabled={isUpdating}
                  >
                    Take Photo
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="relative bg-gray-200 dark:bg-gray-700 aspect-square mb-4 flex items-center justify-center rounded-lg overflow-hidden">
                  <img 
                    src={capturedImage} 
                    alt="Captured" 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex justify-between">
                  <button 
                    onClick={handleRetakePicture}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                    disabled={isUpdating}
                  >
                    Re-take
                  </button>
                  <button 
                    onClick={handleImageApprove}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md dark:bg-green-700 dark:hover:bg-green-800"
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Saving...' : 'Approve'}
                  </button>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Bio Edit Dialog */}
      <Dialog.Root open={isBioEditOpen} onOpenChange={setIsBioEditOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5/6 max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg font-semibold dark:text-white">Update Your Bio</Dialog.Title>
              <Dialog.Close asChild>
                <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>
            
            <div className="mb-4">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO_LENGTH))}
                placeholder="Write a short bio about yourself..."
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows={4}
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex justify-between">
                <span>Keep it short and sweet</span>
                <span>{bio.length}/{MAX_BIO_LENGTH}</span>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button 
                onClick={handleSaveBio}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center dark:bg-blue-700 dark:hover:bg-blue-800"
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    Save Bio
                  </>
                )}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <BottomNav />
    </div>
  );
} 