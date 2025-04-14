export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          email: string
          created_at: string
        }
        Insert: {
          id: string
          username: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          created_at?: string
        }
      }
      looks: {
        Row: {
          look_id: string
          user_id: string
          title?: string
          description?: string
          image_url: string
          audience?: string
          created_at: string
          rating?: string
        }
        Insert: {
          look_id?: string
          user_id: string
          title?: string
          description?: string
          image_url: string
          audience?: string
          created_at?: string
          rating?: string
        }
        Update: {
          look_id?: string
          user_id?: string
          title?: string
          description?: string
          image_url?: string
          audience?: string
          created_at?: string
          rating?: string
        }
      }
      wardrobe: {
        Row: {
          item_id: string
          user_id: string
          name: string
          category: string
          color?: string
          image_path?: string
          brand?: string
          style?: string
          created_at: string
          metadata?: Json
          description?: string
        }
        Insert: {
          item_id?: string
          user_id: string
          name: string
          category: string
          color?: string
          image_path?: string
          brand?: string
          style?: string
          created_at?: string
          metadata?: Json
          description?: string
        }
        Update: {
          item_id?: string
          user_id?: string
          name?: string
          category?: string
          color?: string
          image_path?: string
          brand?: string
          style?: string
          created_at?: string
          metadata?: Json
          description?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
