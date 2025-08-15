import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Using service role for admin operations
)

// GET - List all customer users or filter by customer_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customer_id')

    let query = supabase
      .from('customer_users')
      .select(`
        *,
        customers (
          customer_name
        )
      `)
      .order('customer_id')
      .order('is_primary', { ascending: false })
      .order('created_at')

    if (customerId) {
      query = query.eq('customer_id', customerId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching customer users:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Add new customer user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customer_id, email, full_name, is_primary = false } = body

    if (!customer_id || !email) {
      return NextResponse.json(
        { success: false, error: 'customer_id and email are required' },
        { status: 400 }
      )
    }

    // Check if customer exists
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('id', customer_id)
      .single()

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }

    // If setting as primary, unset other primary users for this customer
    if (is_primary) {
      await supabase
        .from('customer_users')
        .update({ is_primary: false })
        .eq('customer_id', customer_id)
    }

    const { data, error } = await supabase
      .from('customer_users')
      .insert({
        customer_id,
        email: email.toLowerCase(),
        full_name,
        is_primary
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating customer user:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}