import { notFound } from 'next/navigation';
import ProductCatalogClient from '@/components/ProductCatalogClient';
import { getCustomerById, getCustomerProductsWithPrices, getCustomerCategories, getCustomerSuppliers } from '@/lib/data';

interface CustomerCatalogPageProps {
  params: {
    customer: string;
  };
}

export default async function CustomerCatalogPage({ params }: CustomerCatalogPageProps) {
  const customerId = params.customer;
  
  // Get customer data
  const customer = await getCustomerById(customerId);
  if (!customer) {
    notFound();
  }

  // Get products for customer
  const [products, categories, suppliers] = await Promise.all([
    getCustomerProductsWithPrices(customerId),
    getCustomerCategories(customerId),
    getCustomerSuppliers(customerId)
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {customer.name}
            </h1>
            <p className="text-gray-600 mt-1">
              {products.length} ugovornih artikala dostupno
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">ID kupca</div>
            <div className="font-mono text-lg font-semibold text-gray-900">{customer.id}</div>
          </div>
        </div>
      </div>

      {/* Product Catalog */}
      <ProductCatalogClient
        customer={customer}
        products={products}
        categories={categories}
        suppliers={suppliers}
      />
    </div>
  );
}

export async function generateMetadata({ params }: CustomerCatalogPageProps) {
  const customer = await getCustomerById(params.customer);
  
  return {
    title: `Katalog - ${customer?.name || 'Nepoznat kupac'} | B2B Webshop`,
    description: `Katalog ugovornih artikala za ${customer?.name || 'kupca'}`,
  };
}