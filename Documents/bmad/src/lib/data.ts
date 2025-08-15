import fs from 'fs';
import path from 'path';
import { Customer, Product, ProductWithPrice } from '@/types';
import { getAuthenticatedUser, canAccessCustomer, isAdmin } from '@/lib/auth-utils';

// File paths
const DATA_DIR = path.join(process.cwd(), 'data');
const CUSTOMERS_FILE = path.join(DATA_DIR, 'customers.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const CUSTOMER_PRODUCTS_FILE = path.join(DATA_DIR, 'customer-products.json');

// Cache for performance
let customersCache: Customer[] | null = null;
let productsCache: Record<string, Product> | null = null;
let customerProductsCache: Record<string, Record<string, any>> | null = null;

/**
 * Load customers from JSON file (admin-only)
 */
export async function getCustomers(): Promise<Customer[]> {
  // Check if user has admin access
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    console.warn('Non-admin user attempted to access all customers');
    return [];
  }

  if (customersCache) {
    return customersCache;
  }

  try {
    const data = fs.readFileSync(CUSTOMERS_FILE, 'utf8');
    customersCache = JSON.parse(data);
    return customersCache || [];
  } catch (error) {
    console.error('Error loading customers:', error);
    return [];
  }
}

/**
 * Get customers for current user (role-aware)
 */
export async function getCustomersForUser(): Promise<Customer[]> {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    return [];
  }
  
  // Admin sees all customers
  if (user.role === 'admin') {
    return await getCustomers();
  }
  
  // Customer sees only their own customer info
  if (user.role === 'customer' && user.customer) {
    const customer = await getCustomerById(user.customer.id);
    return customer ? [customer] : [];
  }
  
  return [];
}

/**
 * Load products from JSON file
 */
export async function getProducts(): Promise<Record<string, Product>> {
  if (productsCache) {
    return productsCache;
  }

  try {
    const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    productsCache = JSON.parse(data);
    return productsCache || {};
  } catch (error) {
    console.error('Error loading products:', error);
    return {};
  }
}

/**
 * Load customer-products mapping from JSON file
 */
export async function getCustomerProducts(): Promise<Record<string, Record<string, any>>> {
  if (customerProductsCache) {
    return customerProductsCache;
  }

  try {
    const data = fs.readFileSync(CUSTOMER_PRODUCTS_FILE, 'utf8');
    customerProductsCache = JSON.parse(data);
    return customerProductsCache || {};
  } catch (error) {
    console.error('Error loading customer-products:', error);
    return {};
  }
}

/**
 * Get customer by ID (direct file access, no role check)
 */
export async function getCustomerById(customerId: string): Promise<Customer | null> {
  // Direct file access for customer lookup - bypass role checks
  if (customersCache) {
    return customersCache.find(c => c.id === customerId) || null;
  }

  try {
    const data = fs.readFileSync(CUSTOMERS_FILE, 'utf8');
    const customers = JSON.parse(data) as Customer[];
    customersCache = customers; // Cache it for future use
    return customers.find(c => c.id === customerId) || null;
  } catch (error) {
    console.error('Error loading customers:', error);
    return null;
  }
}

/**
 * Get products for specific customer with prices (access-controlled)
 */
export async function getCustomerProductsWithPrices(customerId: string): Promise<ProductWithPrice[]> {
  // TEMPORARY: Allow access without authentication for backward compatibility
  // This will be restricted once role-based system is fully implemented
  const user = await getAuthenticatedUser();
  
  if (user) {
    // If user is logged in, check role-based access
    const hasAccess = await canAccessCustomer(customerId);
    if (!hasAccess) {
      console.warn(`User attempted to access customer ${customerId} without permission`);
      return [];
    }
  } else {
    // If no user is logged in, allow access (legacy behavior)
    console.log(`Anonymous access to customer ${customerId} products (legacy mode)`);
  }

  const [products, customerProducts] = await Promise.all([
    getProducts(),
    getCustomerProducts()
  ]);

  const customerProductMap = customerProducts[customerId];
  if (!customerProductMap) {
    return [];
  }

  const result: ProductWithPrice[] = [];

  for (const [productCode, customerProduct] of Object.entries(customerProductMap)) {
    const product = products[productCode];
    if (product) {
      result.push({
        ...product,
        price: customerProduct.price,
        contractId: customerProduct.contractId,
        isActive: customerProduct.isActive
      });
    }
  }

  // Sort by product name
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Search products for a customer
 */
export async function searchCustomerProducts(
  customerId: string,
  query: string,
  filters: {
    category?: string;
    supplier?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'name' | 'price' | 'supplier';
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<ProductWithPrice[]> {
  let products = await getCustomerProductsWithPrices(customerId);

  // Text search
  if (query) {
    const lowerQuery = query.toLowerCase();
    products = products.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      (p.altName && p.altName.toLowerCase().includes(lowerQuery)) ||
      p.supplier.name.toLowerCase().includes(lowerQuery) ||
      p.category.name.toLowerCase().includes(lowerQuery)
    );
  }

  // Category filter
  if (filters.category) {
    products = products.filter(p => p.category.name === filters.category);
  }

  // Supplier filter
  if (filters.supplier) {
    products = products.filter(p => p.supplier.name === filters.supplier);
  }

  // Price filters
  if (filters.minPrice !== undefined) {
    products = products.filter(p => p.price >= filters.minPrice!);
  }
  if (filters.maxPrice !== undefined) {
    products = products.filter(p => p.price <= filters.maxPrice!);
  }

  // Sorting
  const sortBy = filters.sortBy || 'name';
  const sortOrder = filters.sortOrder || 'asc';
  
  products.sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'price':
        comparison = a.price - b.price;
        break;
      case 'supplier':
        comparison = a.supplier.name.localeCompare(b.supplier.name);
        break;
    }
    
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  return products;
}

/**
 * Get unique categories for a customer's products
 */
export async function getCustomerCategories(customerId: string): Promise<string[]> {
  const products = await getCustomerProductsWithPrices(customerId);
  const categories = [...new Set(products.map(p => p.category.name))];
  return categories.sort();
}

/**
 * Get unique suppliers for a customer's products
 */
export async function getCustomerSuppliers(customerId: string): Promise<string[]> {
  const products = await getCustomerProductsWithPrices(customerId);
  const suppliers = [...new Set(products.map(p => p.supplier.name))];
  return suppliers.sort();
}

/**
 * Get customer statistics
 */
export async function getCustomerStats() {
  const customers = await getCustomers();
  
  const stats = {
    totalCustomers: customers.length,
    totalProducts: Object.keys(await getProducts()).length,
    customerWithMostProducts: customers.reduce((max, customer) => 
      customer.productCount > max.productCount ? customer : max
    , customers[0]),
    averageProductsPerCustomer: Math.round(
      customers.reduce((sum, c) => sum + c.productCount, 0) / customers.length
    )
  };
  
  return stats;
}

/**
 * Clear cache (useful for development)
 */
export function clearCache() {
  customersCache = null;
  productsCache = null;
  customerProductsCache = null;
}