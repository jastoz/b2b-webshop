'use client';

import { useState } from 'react';
import { Search, ChevronDown, ChevronUp, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import type { SearchFilters } from '@/types';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface ProductFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  categories: string[];
  suppliers: string[];
  productCount: number;
  totalProducts: number;
}

export default function ProductFilters({
  filters,
  onFiltersChange,
  categories,
  suppliers,
  productCount,
  totalProducts
}: ProductFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof SearchFilters, value: string | number | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const resetFilters = () => {
    onFiltersChange({
      query: '',
      sortBy: 'name',
      sortOrder: 'asc'
    });
    setIsExpanded(false);
  };

  const getActiveFiltersCount = () => {
    return [
      filters.category,
      filters.supplier,
      filters.minPrice,
      filters.maxPrice
    ].filter(Boolean).length;
  };

  const hasActiveFilters = filters.query || filters.category || filters.supplier || 
    filters.minPrice !== undefined || filters.maxPrice !== undefined;

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Pretraži proizvode..."
              value={filters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Quick Stats & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Prikazuje <span className="font-medium text-foreground">{productCount}</span> od{' '}
              <span className="font-medium text-foreground">{totalProducts}</span> proizvoda
            </div>
            
            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={`${filters.sortBy || 'name'}-${filters.sortOrder || 'asc'}`}
                  onValueChange={(value) => {
                    const [sortBy, sortOrder] = value.split('-') as [typeof filters.sortBy, typeof filters.sortOrder];
                    onFiltersChange({ ...filters, sortBy, sortOrder });
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">Naziv (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Naziv (Z-A)</SelectItem>
                    <SelectItem value="price-asc">Cijena (najniža)</SelectItem>
                    <SelectItem value="price-desc">Cijena (najviša)</SelectItem>
                    <SelectItem value="supplier-asc">Dobavljač (A-Z)</SelectItem>
                    <SelectItem value="supplier-desc">Dobavljač (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Advanced Filters Toggle */}
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filtri
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                        {activeFiltersCount}
                      </Badge>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                    {/* Category Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Kategorija
                      </label>
                      <Select
                        value={filters.category || 'all'}
                        onValueChange={(value) => handleFilterChange('category', value === 'all' ? undefined : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sve kategorije" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Sve kategorije</SelectItem>
                          {categories.filter(category => category && category.trim()).map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Supplier Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Dobavljač
                      </label>
                      <Select
                        value={filters.supplier || 'all'}
                        onValueChange={(value) => handleFilterChange('supplier', value === 'all' ? undefined : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Svi dobavljači" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Svi dobavljači</SelectItem>
                          {suppliers.filter(supplier => supplier && supplier.trim()).map(supplier => (
                            <SelectItem key={supplier} value={supplier}>
                              {supplier}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Min Price */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Min. cijena (€)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={filters.minPrice || ''}
                        onChange={(e) => handleFilterChange('minPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </div>

                    {/* Max Price */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Max. cijena (€)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="999.99"
                        value={filters.maxPrice || ''}
                        onChange={(e) => handleFilterChange('maxPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={resetFilters} className="gap-2">
                  <X className="h-4 w-4" />
                  Očisti sve
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {filters.query && (
                <Badge variant="secondary" className="gap-1">
                  Pretraživanje: "{filters.query}"
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => handleFilterChange('query', '')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {filters.category && (
                <Badge variant="secondary" className="gap-1">
                  {filters.category}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => handleFilterChange('category', undefined)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {filters.supplier && (
                <Badge variant="secondary" className="gap-1">
                  {filters.supplier}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => handleFilterChange('supplier', undefined)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
                <Badge variant="secondary" className="gap-1">
                  €{filters.minPrice || '0'} - €{filters.maxPrice || '∞'}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      handleFilterChange('minPrice', undefined);
                      handleFilterChange('maxPrice', undefined);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}