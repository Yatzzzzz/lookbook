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
      looks: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string | null
          image_url: string
          user_id: string
          tags: string[] | null
          likes: number
          is_private: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description?: string | null
          image_url: string
          user_id: string
          tags?: string[] | null
          likes?: number
          is_private?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string | null
          image_url?: string
          user_id?: string
          tags?: string[] | null
          likes?: number
          is_private?: boolean
        }
      }
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          bio: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      battle_votes: {
        Row: {
          id: string
          user_id: string
          look_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          look_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          look_id?: string
          created_at?: string
        }
      }
      saved_looks: {
        Row: {
          id: string
          user_id: string
          look_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          look_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          look_id?: string
          created_at?: string
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 