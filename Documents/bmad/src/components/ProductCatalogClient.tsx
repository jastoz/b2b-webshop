'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Customer, ProductWithPrice, SearchFilters, CartItem } from '@/types';
import ProductGrid from './ProductGrid';
import ProductFilters from './ProductFilters';
import Cart from './Cart';
import { useToast } from '@/hooks/use-toast';

interface ProductCatalogClientProps {
  customer: Customer;
  products: ProductWithPrice[];
  categories: string[];
  suppliers: string[];
}

export default function ProductCatalogClient({
  customer,
  products,
  categories,
  suppliers
}: ProductCatalogClientProps) {
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Text search
    if (searchFilters.query) {
      const query = searchFilters.query.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        (product.altName && product.altName.toLowerCase().includes(query)) ||
        product.supplier.name.toLowerCase().includes(query) ||
        product.category.name.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (searchFilters.category) {
      filtered = filtered.filter(product => product.category.name === searchFilters.category);
    }

    // Supplier filter
    if (searchFilters.supplier) {
      filtered = filtered.filter(product => product.supplier.name === searchFilters.supplier);
    }

    // Price filters
    if (searchFilters.minPrice !== undefined) {
      filtered = filtered.filter(product => product.price >= searchFilters.minPrice!);
    }
    if (searchFilters.maxPrice !== undefined) {
      filtered = filtered.filter(product => product.price <= searchFilters.maxPrice!);
    }

    // Sort products - ensure deterministic sorting by adding secondary sort by code
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (searchFilters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'supplier':
          comparison = a.supplier.name.localeCompare(b.supplier.name);
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }
      
      // If items are equal, sort by product code for deterministic order
      if (comparison === 0) {
        comparison = a.code.localeCompare(b.code);
      }
      
      return searchFilters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [products, searchFilters]);

  const handleAddToCart = useCallback((product: ProductWithPrice, quantity: number) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.productCode === product.code);
      
      if (existingItem) {
        toast({
          title: "Artikal ažuriran u košarici",
          description: `${product.name} - nova količina: ${existingItem.quantity + quantity} ${product.unit}`,
          duration: 3000,
        });
        
        return prev.map(item =>
          item.productCode === product.code
            ? {
                ...item,
                quantity: item.quantity + quantity,
                totalPrice: (item.quantity + quantity) * item.pricePerUnit
              }
            : item
        );
      } else {
        toast({
          title: "Artikal dodan u košaricu",
          description: `${product.name} - ${quantity} ${product.unit}`,
          duration: 3000,
        });
        
        const newItem: CartItem = {
          productCode: product.code,
          productName: product.name,
          unit: product.unit,
          quantity,
          pricePerUnit: product.price,
          totalPrice: quantity * product.price,
          supplier: product.supplier.name
        };
        return [...prev, newItem];
      }
    });
  }, [toast]);

  const handleUpdateCartQuantity = useCallback((productCode: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(prev => prev.filter(item => item.productCode !== productCode));
    } else {
      setCartItems(prev =>
        prev.map(item =>
          item.productCode === productCode
            ? {
                ...item,
                quantity,
                totalPrice: quantity * item.pricePerUnit
              }
            : item
        )
      );
    }
  }, []);

  const handleRemoveFromCart = useCallback((productCode: string) => {
    setCartItems(prev => {
      const item = prev.find(item => item.productCode === productCode);
      if (item) {
        toast({
          title: "Artikal uklonjen iz košarice",
          description: `${item.productName} uklonjen`,
          duration: 3000,
        });
      }
      return prev.filter(item => item.productCode !== productCode);
    });
  }, [toast]);

  const cart = useMemo(() => ({
    customerId: customer.id,
    customerName: customer.name,
    items: cartItems,
    totalItems: cartItems.length,
    totalValue: cartItems.reduce((sum, item) => sum + item.totalPrice, 0),
    lastUpdated: new Date()
  }), [customer, cartItems]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <ProductFilters
        filters={searchFilters}
        onFiltersChange={setSearchFilters}
        categories={categories}
        suppliers={suppliers}
        productCount={filteredProducts.length}
        totalProducts={products.length}
      />

      {/* Products Grid - Full Width */}
      <ProductGrid
        products={filteredProducts}
        onAddToCart={handleAddToCart}
      />

      {/* Floating Cart */}
      <Cart
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onExport={() => {
          toast({
            title: "Export narudžbe",
            description: "Export funkcionalnost će biti implementirana uskoro!",
            duration: 4000,
          });
        }}
      />
    </div>
  );
}