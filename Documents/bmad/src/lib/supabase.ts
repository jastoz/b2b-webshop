import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string;
          name: string;
          product_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          product_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          product_count?: number;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          code: string;
          name: string;
          alt_name: string | null;
          unit: string;
          category_id: number | null;
          subcategory_id: number | null;
          supplier_id: number | null;
          weight: number;
          pack_size: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          name: string;
          alt_name?: string | null;
          unit?: string;
          category_id?: number | null;
          subcategory_id?: number | null;
          supplier_id?: number | null;
          weight?: number;
          pack_size?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          name?: string;
          alt_name?: string | null;
          unit?: string;
          category_id?: number | null;
          subcategory_id?: number | null;
          supplier_id?: number | null;
          weight?: number;
          pack_size?: number | null;
          updated_at?: string;
        };
      };
      customer_products: {
        Row: {
          id: string;
          customer_id: string;
          product_code: string;
          contract_id: number;
          price: number;
          discount: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          product_code: string;
          contract_id: number;
          price: number;
          discount?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          product_code?: string;
          contract_id?: number;
          price?: number;
          discount?: number;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: number;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
        };
      };
      subcategories: {
        Row: {
          id: number;
          category_id: number;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          category_id: number;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          category_id?: number;
          name?: string;
        };
      };
      suppliers: {
        Row: {
          id: number;
          code: number;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          code?: number;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          code?: number;
          name?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          customer_id: string;
          status: string;
          total_value: number;
          total_items: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          status?: string;
          total_value?: number;
          total_items?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          status?: string;
          total_value?: number;
          total_items?: number;
          notes?: string | null;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_code: string;
          product_name: string;
          unit: string;
          quantity: number;
          price_per_unit: number;
          total_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_code: string;
          product_name: string;
          unit: string;
          quantity: number;
          price_per_unit: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_code?: string;
          product_name?: string;
          unit?: string;
          quantity?: number;
          price_per_unit?: number;
        };
      };
    };
    Functions: {
      get_customer_products: {
        Args: {
          customer_id_param: string;
        };
        Returns: {
          product_code: string;
          product_name: string;
          alt_name: string | null;
          unit: string;
          price: number;
          category_name: string | null;
          subcategory_name: string | null;
          supplier_name: string | null;
          weight: number;
          pack_size: number | null;
          contract_id: number;
          discount: number;
          is_active: boolean;
        }[];
      };
      search_customer_products: {
        Args: {
          customer_id_param: string;
          search_term?: string;
          category_filter?: string;
          limit_count?: number;
        };
        Returns: {
          product_code: string;
          product_name: string;
          alt_name: string | null;
          unit: string;
          price: number;
          category_name: string | null;
          subcategory_name: string | null;
          supplier_name: string | null;
          weight: number;
        }[];
      };
    };
  };
}

export type CustomerProduct = Database['public']['Functions']['get_customer_products']['Returns'][0];
export type Customer = Database['public']['Tables']['customers']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];