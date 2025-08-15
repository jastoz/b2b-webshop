import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { searchCustomerProducts, getCustomerProducts } from '@/lib/supabase-data'
import type { CustomerProductsResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore Server Component cookie setting
            }
          },
        },
      }
    )
    
    // Get current user from auth
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get customer info from customer_users table
    const { data: customerUser, error: customerError } = await supabase
      .from('customer_users')
      .select(`
        customer_id,
        customers (
          id,
          customer_name
        )
      `)
      .eq('email', user.email)
      .eq('is_active', true)
      .single()

    if (customerError || !customerUser) {
      return NextResponse.json(
        { success: false, error: 'Customer access not found' },
        { status: 403 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category') || ''
    const sortBy = (searchParams.get('sortBy') as 'name' | 'price' | 'supplier') || 'name'

    // Get filtered products using existing Supabase functions
    let productsResponse
    if (query || category) {
      productsResponse = await searchCustomerProducts(customerUser.customer_id, query, category, 1000)
    } else {
      productsResponse = await getCustomerProducts(customerUser.customer_id)
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
      )
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
    }))

    // Apply client-side sorting
    if (sortBy === 'price') {
      transformedProducts.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'supplier') {
      transformedProducts.sort((a, b) => a.supplier.localeCompare(b.supplier))
    }

    const response: CustomerProductsResponse = {
      success: true,
      data: transformedProducts,
      count: transformedProducts.length,
      customer: {
        id: customerUser.customers.id,
        name: customerUser.customers.customer_name
      }
    }

    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Error fetching my products:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch your products',
        data: [],
        count: 0
      },
      { status: 500 }
    )
  }
}