import { NextResponse } from 'next/server';
import { getCustomers } from '@/lib/supabase-data';
import type { CustomerListResponse } from '@/types';

export async function GET() {
  try {
    const customersResponse = await getCustomers();
    
    if (!customersResponse.success) {
      return NextResponse.json(
        {
          success: false,
          error: customersResponse.error,
          data: [],
          count: 0
        },
        { status: 500 }
      );
    }
    
    // Transform for API response
    const responseData = customersResponse.data.map(customer => ({
      id: customer.id,
      name: customer.name,
      contractCount: 0, // TODO: Add contracts count from database
      productCount: customer.product_count || 0
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