'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/contexts/AuthContext';

type Look = {
  look_id: string;
  image_url: string;
  description: string | null;
  created_at: string;
};

export const dynamic = 'force-dynamic';

export default function LookbookPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const supabase = createClientComponentClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [userLooks, setUserLooks] = useState<Look[]>([]);
  const [savedLooks, setSavedLooks] = useState<Look[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tabs = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
    { id: 'orders', name: 'Orders', icon: '📦' },
    { id: 'wallet', name: 'Wallet', icon: '💰' },
    { id: 'cart', name: 'Cart', icon: '🛒' },
    { id: 'saved', name: 'Saved', icon: '❤️' },
    { id: 'my-lookbook', name: 'My Lookbook', icon: '👗' },
    { id: 'virtual-looks', name: 'Virtual Looks', icon: '🔮' },
    { id: 'wardrobe', name: 'My Wardrobe', icon: '👚' },
  ];

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (activeTab === 'my-lookbook') {
      fetchUserLooks();
    } else if (activeTab === 'saved') {
      fetchSavedLooks();
    }
  }, [activeTab, user, router]);

  const fetchUserLooks = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('looks')
        .select('look_id, image_url, description, created_at')
        .eq('user_id', user.id)
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

  if (!user) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <div className="pb-16">
      <h1 className="text-2xl font-bold p-4">My Lookbook</h1>
      
      {/* Scrollable tabs */}
      <div className="flex overflow-x-auto pb-2 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`flex flex-col items-center px-4 py-2 min-w-[70px] ${
              activeTab === tab.id
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="text-xl mb-1">{tab.icon}</span>
            <span className="text-xs">{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div>
            <div className="flex items-center mb-6">
              <div className="h-20 w-20 bg-gray-300 rounded-full flex items-center justify-center text-2xl">
                {user.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold">{user.user_metadata?.username || 'User'}</h2>
                <p className="text-gray-600 text-sm">{user.email}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <h3 className="font-medium mb-3">Stats</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold">0</div>
                  <div className="text-xs text-gray-500">Looks</div>
                </div>
                <div>
                  <div className="text-xl font-bold">0</div>
                  <div className="text-xs text-gray-500">Followers</div>
                </div>
                <div>
                  <div className="text-xl font-bold">0</div>
                  <div className="text-xs text-gray-500">Following</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-medium mb-3">Bio</h3>
              <p className="text-gray-600 text-sm">
                {user.user_metadata?.bio || 'No bio yet. Update your profile to add one!'}
              </p>
            </div>
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
            <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg p-4 text-white mb-6">
              <h3 className="font-medium mb-2">Your Balance</h3>
              <div className="text-3xl font-bold mb-1">$0.00</div>
              <p className="text-sm text-blue-100">Earn rewards by sharing looks</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button className="bg-white p-3 rounded-lg shadow-md flex flex-col items-center">
                <span className="text-xl mb-1">💸</span>
                <span className="text-sm">Add Funds</span>
              </button>
              <button className="bg-white p-3 rounded-lg shadow-md flex flex-col items-center">
                <span className="text-xl mb-1">🏦</span>
                <span className="text-sm">Withdraw</span>
              </button>
            </div>
            
            <h3 className="font-medium mb-2">Transaction History</h3>
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No transactions yet</p>
            </div>
          </div>
        )}

        {/* Cart Tab */}
        {activeTab === 'cart' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Cart</h2>
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-2">Your cart is empty</p>
              <button className="text-blue-600">Discover Items</button>
            </div>
          </div>
        )}

        {/* Saved Looks Tab */}
        {activeTab === 'saved' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Saved Looks</h2>
            {loading ? (
              <div className="text-center py-8">Loading saved looks...</div>
            ) : error ? (
              <div className="bg-red-100 text-red-700 p-3 rounded-lg">
                {error}
              </div>
            ) : savedLooks.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-2">No saved looks yet</p>
                <button className="text-blue-600">Explore Gallery</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {savedLooks.map((look) => (
                  <div key={look.look_id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="h-40">
                      <img
                        src={look.image_url}
                        alt={look.description || 'Saved look'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2">
                      <p className="text-xs text-gray-500 truncate">
                        {look.description || 'No description'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Lookbook Tab */}
        {activeTab === 'my-lookbook' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">My Uploads</h2>
            {loading ? (
              <div className="text-center py-8">Loading your looks...</div>
            ) : error ? (
              <div className="bg-red-100 text-red-700 p-3 rounded-lg">
                {error}
              </div>
            ) : userLooks.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-2">You haven&apos;t uploaded any looks yet</p>
                <button 
                  className="text-blue-600"
                  onClick={() => router.push('/look')}
                >
                  Upload your first look
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {userLooks.map((look) => (
                  <div key={look.look_id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="h-40">
                      <img
                        src={look.image_url}
                        alt={look.description || 'Your look'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2">
                      <p className="text-xs text-gray-500 truncate">
                        {look.description || 'No description'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Virtual Looks Tab */}
        {activeTab === 'virtual-looks' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">AI-Generated Looks</h2>
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-2">No virtual looks yet</p>
              <button className="text-blue-600">Generate with AI</button>
            </div>
          </div>
        )}

        {/* My Wardrobe Tab */}
        {activeTab === 'wardrobe' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">My Wardrobe</h2>
            <p className="text-sm text-gray-600 mb-4">
              A digital inventory of your clothing items
            </p>
            
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">Categories</h3>
                <button className="text-blue-600 text-sm">Add Item</button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {['Tops', 'Bottoms', 'Dresses', 'Shoes', 'Accessories', 'Outerwear', 'Bags', 'Other'].map((category) => (
                  <div key={category} className="bg-gray-100 rounded-lg p-2 text-center">
                    <div className="text-xs">{category}</div>
                    <div className="text-sm font-medium">0</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-2">Your wardrobe is empty</p>
              <button className="text-blue-600">Add Items</button>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
} 