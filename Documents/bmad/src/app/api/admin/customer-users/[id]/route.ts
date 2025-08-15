import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Using service role for admin operations
)

// PUT - Update customer user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const body = await request.json()
    const { email, full_name, is_primary, is_active } = body

    // Get current record
    const { data: currentRecord } = await supabase
      .from('customer_users')
      .select('customer_id')
      .eq('id', id)
      .single()

    if (!currentRecord) {
      return NextResponse.json(
        { success: false, error: 'Customer user not found' },
        { status: 404 }
      )
    }

    // If setting as primary, unset other primary users for this customer
    if (is_primary) {
      await supabase
        .from('customer_users')
        .update({ is_primary: false })
        .eq('customer_id', currentRecord.customer_id)
        .neq('id', id)
    }

    const updateData: any = {}
    if (email !== undefined) updateData.email = email.toLowerCase()
    if (full_name !== undefined) updateData.full_name = full_name
    if (is_primary !== undefined) updateData.is_primary = is_primary
    if (is_active !== undefined) updateData.is_active = is_active

    const { data, error } = await supabase
      .from('customer_users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating customer user:', error)
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

// DELETE - Delete customer user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    const { error } = await supabase
      .from('customer_users')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting customer user:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Customer user deleted successfully'
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}