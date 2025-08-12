'use client';

import { useState } from 'react';
import { Minus, Plus, ShoppingCart, CheckCircle2 } from 'lucide-react';
import type { ProductWithPrice } from '@/types';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface ProductCardProps {
  product: ProductWithPrice;
  onAddToCart: (product: ProductWithPrice, quantity: number) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState('1');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    onAddToCart(product, quantity);
    
    // Reset quantity and show success feedback
    setTimeout(() => {
      setIsAdding(false);
      setQuantity(1);
      setQuantityInput('1');
    }, 800);
  };

  const handleQuantityChange = (value: string) => {
    setQuantityInput(value);
    if (value === '') {
      // Don't set quantity when empty, wait for blur or valid input
      return;
    }
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      setQuantity(numValue);
    }
  };

  const handleQuantityBlur = () => {
    if (quantityInput === '' || quantityInput === '0') {
      setQuantityInput('1');
      setQuantity(1);
    }
  };

  const handleQuantityFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const decreaseQuantity = () => {
    const newValue = Math.max(1, quantity - 1);
    setQuantity(newValue);
    setQuantityInput(newValue.toString());
  };

  const increaseQuantity = () => {
    const newValue = quantity + 1;
    setQuantity(newValue);
    setQuantityInput(newValue.toString());
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('hr-HR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(price);
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
      <CardHeader className="pb-3 h-24">
        <div className="h-full flex flex-col">
          <div className="flex-1">
            <CardTitle className="text-base line-clamp-2 leading-tight mb-1">
              {product.name}
            </CardTitle>
            {product.altName && (
              <CardDescription className="text-xs">
                {product.altName}
              </CardDescription>
            )}
          </div>
          <Badge variant="secondary" className="text-xs w-fit mt-auto">
            {product.category.subcategoryName}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {/* Product Details */}
        <div className="h-8 flex items-center">
          <div className="flex justify-between items-center text-xs w-full">
            <span className="text-muted-foreground">Jed.:</span>
            <span className="font-medium">{product.unit}</span>
          </div>
        </div>

        {/* Price Section */}
        <div className="bg-primary/5 rounded-lg p-3 text-center border border-primary/10 h-16 flex flex-col justify-center">
          <div className="text-xl font-bold text-primary mb-1">
            {formatPrice(product.price)}
          </div>
          <div className="text-xs text-primary/70">
            po {product.unit.toLowerCase()}
          </div>
        </div>

        {/* Quantity Selector */}
        <div className="space-y-1 h-16">
          <label className="text-sm font-medium text-muted-foreground">
            Količina:
          </label>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={decreaseQuantity}
              disabled={quantity <= 1 || isAdding}
              className="h-8 w-8"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Input
              type="text"
              value={quantityInput}
              onChange={(e) => handleQuantityChange(e.target.value)}
              onBlur={handleQuantityBlur}
              onFocus={handleQuantityFocus}
              disabled={isAdding}
              className="w-16 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={increaseQuantity}
              disabled={isAdding}
              className="h-8 w-8"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Total Price Preview */}
        {quantity > 1 && (
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Ukupno:</div>
            <div className="font-semibold text-primary">
              {formatPrice(product.price * quantity)}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex-col space-y-2 pt-3">
        {/* Add to Cart Button */}
        <Button
          onClick={handleAddToCart}
          disabled={isAdding}
          className={`w-full transition-all duration-300 text-xs ${
            isAdding 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : ''
          }`}
          size="sm"
        >
          {isAdding ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4 animate-pulse" />
              Dodano
            </>
          ) : (
            <>
              <ShoppingCart className="mr-1 h-3 w-3" />
              U košaricu
            </>
          )}
        </Button>

        {/* Contract Info */}
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground pt-2 border-t">
          <span>Ugovor #{product.contractId}</span>
          {!product.isActive && (
            <Badge variant="destructive" className="text-xs">
              Istekao
            </Badge>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}