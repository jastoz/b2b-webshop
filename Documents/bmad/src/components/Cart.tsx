'use client';

import { useState, useMemo } from 'react';
import type { Cart, CartItem } from '@/types';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  Download,
  X,
  Package
} from 'lucide-react';

interface CartProps {
  cart: Cart;
  onUpdateQuantity: (productCode: string, quantity: number) => void;
  onRemoveItem: (productCode: string) => void;
  onExport: () => void;
  loading?: boolean;
}

export default function Cart({ cart, onUpdateQuantity, onRemoveItem, onExport, loading = false }: CartProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('hr-HR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(price);
  };

  const handleClearAll = () => {
    cart.items.forEach(item => onRemoveItem(item.productCode));
  };

  const handleExport = () => {
    onExport();
    setIsOpen(false);
  };

  const isEmpty = cart.items.length === 0;

  return (
    <>
      {/* Floating Cart Toggle Button */}
      <div className="fixed top-4 right-4 z-40">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              size="lg"
              className={`relative shadow-lg hover:shadow-xl transition-all duration-200 ${
                isEmpty 
                  ? 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  : 'bg-primary hover:bg-primary/90'
              }`}
              aria-label={`Košarica (${cart.totalItems} stavki)`}
            >
              <ShoppingCart className="h-5 w-5" />
              {!isEmpty && (
                <Badge 
                  variant="secondary"
                  className="absolute -top-2 -right-2 h-6 min-w-6 rounded-full bg-destructive text-destructive-foreground border-2 border-background"
                >
                  {cart.totalItems > 99 ? '99+' : cart.totalItems}
                </Badge>
              )}
            </Button>
          </SheetTrigger>

          <SheetContent className="w-full max-w-md sm:max-w-lg flex flex-col" side="right">
            <SheetHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <SheetTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Košarica ({cart.totalItems} proizvoda)
                </SheetTitle>
                {!isEmpty && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Očisti sve
                  </Button>
                )}
              </div>
              <SheetDescription className="text-left">
                {cart.customerName}
              </SheetDescription>
            </SheetHeader>

            {isEmpty ? (
              // Empty State
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <div className="rounded-full bg-muted p-6 mb-4">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Košarica je prazna
                </h3>
                <p className="text-muted-foreground text-sm">
                  Dodajte artikle u košaricu za naručivanje
                </p>
              </div>
            ) : (
              <>
                {/* Cart Summary */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div className="space-y-1">
                      <div className="font-semibold text-foreground">{cart.totalItems}</div>
                      <div className="text-muted-foreground">proizvoda</div>
                    </div>
                    <div className="space-y-1">
                      <div className="font-semibold text-foreground">{cart.items.reduce((sum, item) => sum + item.quantity, 0)}</div>
                      <div className="text-muted-foreground">artikala</div>
                    </div>
                    <div className="space-y-1">
                      <div className="font-semibold text-primary">{formatPrice(cart.totalValue)}</div>
                      <div className="text-muted-foreground">ukupno</div>
                    </div>
                  </div>
                </div>

                {/* Cart Items */}
                <ScrollArea className="flex-1 -mx-6 px-6">
                  <div className="space-y-3 py-2">
                    {cart.items.map((item) => (
                      <div key={item.productCode} className="bg-card border rounded-lg p-4 space-y-3">
                        {/* Product Header */}
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground text-sm leading-5 line-clamp-2">
                              {item.productName}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-muted-foreground">
                                {item.supplier}
                              </p>
                              <span className="text-xs text-muted-foreground">•</span>
                              <p className="text-xs text-muted-foreground">
                                {formatPrice(item.pricePerUnit)} / {item.unit.toLowerCase()}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRemoveItem(item.productCode)}
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                            aria-label="Ukloni iz košarice"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Quantity Controls & Price */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => onUpdateQuantity(item.productCode, Math.max(1, item.quantity - 1))}
                              className="h-8 w-8"
                              disabled={item.quantity <= 1}
                              aria-label="Smanji količinu"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <div className="min-w-12 text-center">
                              <span className="text-sm font-medium">{item.quantity}</span>
                              <span className="text-xs text-muted-foreground ml-1">{item.unit}</span>
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => onUpdateQuantity(item.productCode, item.quantity + 1)}
                              className="h-8 w-8"
                              aria-label="Povećaj količinu"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="text-right">
                            <div className="text-sm font-semibold text-foreground">
                              {formatPrice(item.totalPrice)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Cart Footer */}
                <SheetFooter className="flex-col gap-4 pt-4 border-t">
                  {/* Total */}
                  <div className="flex items-center justify-between text-lg font-semibold w-full">
                    <span className="text-foreground">Ukupno:</span>
                    <span className="text-primary">
                      {formatPrice(cart.totalValue)}
                    </span>
                  </div>

                  {/* Export Button */}
                  <Button
                    onClick={handleExport}
                    disabled={loading}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                        Izvozim...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Izvezi narudžbu
                      </>
                    )}
                  </Button>

                  {/* Customer Info */}
                  <p className="text-xs text-muted-foreground text-center w-full">
                    Narudžba za: {cart.customerName}
                  </p>
                </SheetFooter>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}