'use client';

import { useEffect, useState } from 'react';
import type { ProductWithPrice } from '@/types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: ProductWithPrice[];
  onAddToCart: (product: ProductWithPrice, quantity: number) => void;
}

export default function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Show loading state during hydration
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="bg-gray-200 animate-pulse h-80 rounded-lg" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🔍</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nema pronađenih artikala
        </h3>
        <p className="text-gray-600">
          Pokušajte s drugim pojmom pretrage ili resetirajte filtere.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3">
      {products.map((product) => (
        <ProductCard
          key={product.code}
          product={product}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}