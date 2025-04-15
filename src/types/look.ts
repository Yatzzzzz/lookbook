export interface Look {
  id: number;
  user_id: string;
  image_url: string;
  caption?: string;
  created_at: string;
  likes_count: number;
  views_count: number;
  saved_count: number;
  user: {
    username: string;
    avatar_url?: string;
    display_name?: string;
  };
  tags?: string[];
  products?: Product[];
  is_liked?: boolean;
  is_saved?: boolean;
}

export interface Product {
  id: number;
  name: string;
  brand: string;
  price: number;
  currency: string;
  image_url: string;
  product_url: string;
}

export interface LookFilter {
  category?: string;
  style?: string;
  sort?: 'latest' | 'popular' | 'trending';
  tag?: string;
}

export interface GalleryProps {
  initialLooks?: Look[];
  filter?: LookFilter;
}

export interface LookDetailProps {
  look: Look;
  relatedLooks?: Look[];
} 