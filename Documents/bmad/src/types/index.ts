// Core data types based on our CSV analysis and data model

// User roles for RBAC
export type UserRole = 'admin' | 'customer';

// User and authentication types
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

export interface AuthUser extends User {
  customer?: {
    id: string;
    name: string;
  };
  is_primary: boolean;
}

export interface Customer {
  id: string;
  name: string;
  contracts: Contract[];
  productCount: number;
}

export interface Contract {
  id: number;
  name: string;
  dateFrom: string;
  dateTo: string;
  paymentTerms: number;
  paymentMethod: string;
}

export interface Product {
  code: string;
  name: string;
  altName?: string;
  unit: string;
  category: ProductCategory;
  supplier: Supplier;
  weight: number;
  packSize?: number;
}

export interface ProductCategory {
  id: number;
  name: string;
  subcategoryId: number;
  subcategoryName: string;
}

export interface Supplier {
  code: number;
  name: string;
}

export interface CustomerProduct {
  contractId: number;
  price: number;
  discount: number;
  isActive: boolean;
}

export interface ProductWithPrice extends Product {
  price: number;
  contractId: number;
  isActive: boolean;
}

// Shopping cart types
export interface CartItem {
  productCode: string;
  productName: string;
  unit: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  supplier: string;
}

export interface Cart {
  customerId: string;
  customerName: string;
  items: CartItem[];
  totalItems: number;
  totalValue: number;
  lastUpdated: Date;
}

// Order types
export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  totalValue: number;
  createdAt: Date;
  status: 'draft' | 'exported' | 'sent';
}

export interface OrderItem {
  productCode: string;
  productName: string;
  unit: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  supplier: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
  error?: string;
}

export interface CustomerListResponse {
  success: boolean;
  data: Array<{
    id: string;
    name: string;
    contractCount: number;
    productCount: number;
  }>;
  count: number;
}

export interface CustomerProductsResponse {
  success: boolean;
  data: ProductWithPrice[];
  count: number;
  customer: {
    id: string;
    name: string;
  };
}

export interface ExportResponse {
  success: boolean;
  data: {
    orderId: string;
    filename: string;
    downloadUrl: string;
    items: number;
    totalValue: number;
  };
}

// Search and filter types
export interface SearchFilters {
  query: string;
  category?: string;
  supplier?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'name' | 'price' | 'supplier';
  sortOrder?: 'asc' | 'desc';
}

// Component props types
export interface CustomerSelectProps {
  customers: Customer[];
  selectedCustomerId?: string;
  onCustomerSelect: (customerId: string) => void;
  loading?: boolean;
}

export interface ProductGridProps {
  products: ProductWithPrice[];
  onAddToCart: (product: ProductWithPrice, quantity: number) => void;
  loading?: boolean;
  searchFilters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

export interface ProductCardProps {
  product: ProductWithPrice;
  onAddToCart: (product: ProductWithPrice, quantity: number) => void;
}

export interface CartProps {
  cart: Cart;
  onUpdateQuantity: (productCode: string, quantity: number) => void;
  onRemoveItem: (productCode: string) => void;
  onExport: () => void;
  loading?: boolean;
}

// Utility types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Local storage keys
export const STORAGE_KEYS = {
  CART: 'bmad_cart',
  SELECTED_CUSTOMER: 'bmad_selected_customer',
  SEARCH_FILTERS: 'bmad_search_filters',
} as const;