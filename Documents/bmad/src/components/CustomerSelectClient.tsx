'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Building2, 
  FileText, 
  Package, 
  Calendar,
  ArrowRight,
  HelpCircle,
  Check
} from 'lucide-react';
import type { Customer } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface CustomerSelectClientProps {
  customers: Customer[];
}

export default function CustomerSelectClient({ customers }: CustomerSelectClientProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Prepare customer options for the combobox
  const customerOptions = useMemo(() => 
    customers.map((customer) => ({
      value: customer.id,
      label: customer.name,
      productCount: customer.productCount || 0,
      contractsCount: customer.contracts.length,
      activeContractsCount: customer.contracts.filter(c => {
        const endDate = new Date(c.dateTo);
        return endDate >= new Date();
      }).length
    }))
  , [customers]);

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setOpen(false);
    
    // Auto-navigate after short delay for better UX
    if (customerId) {
      startTransition(() => {
        setTimeout(() => {
          localStorage.setItem('bmad_selected_customer', customerId);
          router.push(`/katalog/${customerId}`);
        }, 500);
      });
    }
  };

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">
            B2B Webshop
          </h1>
          <p className="text-lg text-muted-foreground">
            Odaberite vašu firmu za pristup katalogu proizvoda
          </p>
        </div>

        {/* Main Selection Card */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Search className="h-5 w-5" />
              Pretraži i odaberi firmu
            </CardTitle>
            <CardDescription>
              Pronađeno {customerOptions.length} firma u sustavu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Customer Combobox */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Odaberite vašu firmu
              </label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                      "w-full justify-between h-12 text-left font-normal",
                      !selectedCustomerId && "text-muted-foreground"
                    )}
                  >
                    {selectedCustomerId ? (
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Building2 className="h-4 w-4 shrink-0" />
                        <span className="truncate">
                          {customerOptions.find((customer) => customer.value === selectedCustomerId)?.label}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        <span>Unesite naziv firme ili ID...</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        {customerOptions.length}
                      </span>
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" side="bottom" align="start">
                  <Command className="w-full">
                    <CommandInput 
                      placeholder="Pretraži po nazivu ili ID..." 
                      className="h-12"
                    />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty className="py-8">
                        <div className="text-center">
                          <Search className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm font-medium mb-1">Nema pronađenih firma</p>
                          <p className="text-xs text-muted-foreground">
                            Pokušajte s drugim pojmom pretrage
                          </p>
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {customerOptions.map((customer) => (
                          <CommandItem
                            key={customer.value}
                            value={`${customer.label} ${customer.value}`}
                            onSelect={() => handleCustomerSelect(customer.value)}
                            className="p-4"
                          >
                            <div className="flex items-center gap-3 w-full">
                              <Check
                                className={cn(
                                  "h-4 w-4",
                                  selectedCustomerId === customer.value 
                                    ? "opacity-100" 
                                    : "opacity-0"
                                )}
                              />
                              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  {customer.label}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                  <span>ID: {customer.value}</span>
                                  <span className="flex items-center gap-1">
                                    <Package className="h-3 w-3" />
                                    {customer.productCount}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    {customer.activeContractsCount}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Selected Customer Details */}
        {selectedCustomer && (
          <Card className="mb-8 border-primary/20 bg-primary/5 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-primary flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Odabrana firma
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-foreground">
                  {selectedCustomer.name}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">ID kupca</p>
                      <p className="font-semibold">{selectedCustomer.id}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Package className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Dostupnih artikala</p>
                      <p className="font-semibold">{selectedCustomer.productCount || 0}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Ukupno ugovora</p>
                      <p className="font-semibold">{selectedCustomer.contracts.length}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                    <div className="p-2 bg-orange-100 rounded-full">
                      <Calendar className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Aktivni ugovori</p>
                      <p className="font-semibold">
                        {selectedCustomer.contracts.filter(c => {
                          const endDate = new Date(c.dateTo);
                          return endDate >= new Date();
                        }).length}
                      </p>
                    </div>
                  </div>
                </div>

                {isPending && (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center gap-2 text-primary">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-medium">Preusmjeravam na katalog...</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Button - Only show if customer is selected and not navigating */}
        {selectedCustomer && !isPending && (
          <div className="flex justify-center mb-8">
            <Button 
              size="lg" 
              className="px-8 py-6 text-lg font-semibold"
              onClick={() => handleCustomerSelect(selectedCustomerId)}
            >
              Nastavi u katalog
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Help Section */}
        <Card className="border-0 bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 text-center justify-center">
              <HelpCircle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Ne možete pronaći vašu firmu? Kontaktirajte podršku za pomoć.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Samo vaši ugovorni proizvodi će biti prikazani u katalogu
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}