// Mock API functions for gallery features

export interface Look {
  look_id: string;
  user_id: string;
  image_url: string;
  caption: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
  user_rating?: string;
  username: string;
  avatar_url?: string;
  is_saved?: boolean;
  tags?: string[];
}

export interface ApiResponse {
  looks?: Look[];
  items?: any[];
  pagination: {
    has_more: boolean;
    total: number;
    page: number;
    limit: number;
  };
}

export interface LooksParams {
  tab?: string;
  filter?: string;
  page?: number;
  limit?: number;
}

// Generate random mock data
const generateMockLooks = (count: number): Look[] => {
  return Array.from({ length: count }, (_, i) => ({
    look_id: `look-${Math.random().toString(36).substring(2, 9)}`,
    user_id: `user-${Math.random().toString(36).substring(2, 9)}`,
    image_url: `https://picsum.photos/500/800?random=${Math.floor(Math.random() * 1000)}`,
    caption: `Look caption ${i + 1}`,
    created_at: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
    likes_count: Math.floor(Math.random() * 1000),
    comments_count: Math.floor(Math.random() * 100),
    views_count: Math.floor(Math.random() * 5000),
    username: `user${i + 1}`,
    avatar_url: `https://i.pravatar.cc/150?u=${i + 1}`,
    is_saved: Math.random() > 0.5,
    tags: ['casual', 'spring', 'summer', 'outfit', 'style'].sort(() => 0.5 - Math.random()).slice(0, 3)
  }));
};

export const getLooks = async (params: LooksParams): Promise<ApiResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const { tab = 'gallery', filter = 'all', page = 1, limit = 20 } = params;
  const mockLooks = generateMockLooks(limit);
  
  if (tab === 'gallery') {
    return {
      looks: mockLooks,
      pagination: {
        has_more: page < 3, // Only show 3 pages of content
        total: 60,
        page,
        limit
      }
    };
  } else {
    return {
      items: mockLooks.slice(0, 10), // Fewer items for other tabs
      pagination: {
        has_more: page < 2,
        total: 20,
        page,
        limit
      }
    };
  }
};

export const rateLook = async (lookId: string, rating: string): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log(`Rated look ${lookId} with ${rating}`);
};

export const saveLook = async (lookId: string): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log(`Saved look ${lookId}`);
};

export const shareLook = async (lookId: string): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log(`Shared look ${lookId}`);
}; 