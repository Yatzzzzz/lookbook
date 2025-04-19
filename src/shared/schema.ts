export interface Look {
  look_id: string;
  image_url: string;
  caption: string;
  username: string;
  avatar_url?: string;
  tags?: string[];
  user_rating?: string;
  is_saved?: boolean;
  rating?: number;
  rating_count?: number;
  created_at?: string;
  likes_count?: number;
  comments_count?: number;
  views_count?: number;
  user_id?: string;
} 