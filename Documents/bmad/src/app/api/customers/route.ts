import { NextResponse } from 'next/server';
import { getCustomers } from '@/lib/data';
import type { CustomerListResponse } from '@/types';

export async function GET() {
  try {
    const customers = await getCustomers();
    
    // Transform for API response
    const responseData = customers.map(customer => ({
      id: customer.id,
      name: customer.name,
      contractCount: customer.contracts.length,
      productCount: customer.productCount || 0
    }));

    const response: CustomerListResponse = {
      success: true,
      data: responseData,
      count: responseData.length
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching customers:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch customers',
        data: [],
        count: 0
      },
      { status: 500 }
    );
  }
}