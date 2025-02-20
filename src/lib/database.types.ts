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
      profiles: {
        Row: {
          id: string
          full_name: string
          role: 'provider' | 'client'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          role: 'provider' | 'client'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: 'provider' | 'client'
          created_at?: string
          updated_at?: string
        }
      }
      user_metadata: {
        Row: {
          id: string
          preferences: Json
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          preferences?: Json
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          preferences?: Json
          last_login?: string | null
          created_at?: string
          updated_at?: string
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