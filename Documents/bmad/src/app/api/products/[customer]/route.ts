import { NextRequest, NextResponse } from 'next/server';
import { getCustomerById, searchCustomerProducts } from '@/lib/data';
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
    const category = searchParams.get('category') || undefined;
    const supplier = searchParams.get('supplier') || undefined;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const sortBy = (searchParams.get('sortBy') as 'name' | 'price' | 'supplier') || 'name';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';

    // Validate customer exists
    const customer = await getCustomerById(customerId);
    if (!customer) {
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

    // Get filtered products
    const products = await searchCustomerProducts(customerId, query, {
      category,
      supplier,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder
    });

    const response: CustomerProductsResponse = {
      success: true,
      data: products,
      count: products.length,
      customer: {
        id: customer.id,
        name: customer.name
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