export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      admins: {
        Row: {
          id: string
          email: string
          password_hash: string
          is_super_admin: boolean
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          is_super_admin?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          is_super_admin?: boolean
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          telegram_id: number
          username: string | null
          first_name: string | null
          last_name: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          telegram_id: number
          username?: string | null
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          telegram_id?: number
          username?: string | null
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          stock: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          stock?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          stock?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          status: string
          total_amount: number
          shipping_address: string | null
          tracking_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: string
          total_amount: number
          shipping_address?: string | null
          tracking_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: string
          total_amount?: number
          shipping_address?: string | null
          tracking_number?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          price?: number
          created_at?: string
        }
      }
      payment_requests: {
        Row: {
          id: string
          user_id: string
          amount: number
          payment_method: string
          payment_details: string
          status: string
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          payment_method: string
          payment_details: string
          status?: string
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          payment_method?: string
          payment_details?: string
          status?: string
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payment_settings: {
        Row: {
          id: string
          type: string
          account: string
          account_name: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: string
          account: string
          account_name?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: string
          account?: string
          account_name?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      shipping_updates: {
        Row: {
          id: string
          order_id: string
          status: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          status: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          status?: string
          description?: string | null
          created_at?: string
        }
      }
    }
  }
}
