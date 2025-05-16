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
      wishlist: {
        Row: {
          id: string
          created_at: string
          user_id: string
          product_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          product_id: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          product_id?: string
        }
      }
      cart: {
        Row: {
          id: string
          created_at: string
          user_id: string
          product_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          product_id: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          product_id?: string
        }
      }
      products: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string
          price: number
          images: string[]
          category: string
          stock: number
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description: string
          price: number
          images: string[]
          category: string
          stock: number
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string
          price?: number
          images?: string[]
          category?: string
          stock?: number
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