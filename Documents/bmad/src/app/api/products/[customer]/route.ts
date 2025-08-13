import { NextRequest, NextResponse } from 'next/server';
import { getCustomer, getCustomerProducts, searchCustomerProducts } from '@/lib/supabase-data';
import type { CustomerProductsResponse } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { customer: string } }
) {
  try {
    const customerId = params.customer;
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const sortBy = (searchParams.get('sortBy') as 'name' | 'price' | 'supplier') || 'name';

    // Validate customer exists
    const customerResponse = await getCustomer(customerId);
    if (!customerResponse.success || !customerResponse.data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Customer not found',
          data: [],
          count: 0
        },
        { status: 404 }
      );
    }

    // Get filtered products using Supabase function
    let productsResponse;
    if (query || category) {
      productsResponse = await searchCustomerProducts(customerId, query, category, 1000);
    } else {
      productsResponse = await getCustomerProducts(customerId);
    }

    if (!productsResponse.success) {
      return NextResponse.json(
        {
          success: false,
          error: productsResponse.error,
          data: [],
          count: 0
        },
        { status: 500 }
      );
    }

    // Transform data to match expected frontend format
    const transformedProducts = productsResponse.data.map(product => ({
      code: product.product_code,
      name: product.product_name,
      altName: product.alt_name,
      unit: product.unit,
      price: product.price,
      category: product.category_name || '',
      subcategory: product.subcategory_name || '',
      supplier: product.supplier_name || '',
      weight: product.weight,
      packSize: product.pack_size,
      contractId: product.contract_id,
      discount: product.discount,
      isActive: product.is_active
    }));

    // Apply client-side sorting (since Supabase function returns ordered by name)
    if (sortBy === 'price') {
      transformedProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'supplier') {
      transformedProducts.sort((a, b) => a.supplier.localeCompare(b.supplier));
    }

    const response: CustomerProductsResponse = {
      success: true,
      data: transformedProducts,
      count: transformedProducts.length,
      customer: {
        id: customerResponse.data.id,
        name: customerResponse.data.name
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching customer products:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch customer products',
        data: [],
        count: 0
      },
      { status: 500 }
    );
  }
}