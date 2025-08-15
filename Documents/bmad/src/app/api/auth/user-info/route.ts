import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  console.log('🔍 GET /api/auth/user-info called');
  console.log('🔍 Headers:', Object.fromEntries(request.headers.entries()));
  try {
    // Create two clients: one for auth (with cookies) and one for database queries (service key)
    const cookieStore = cookies()
    const authSupabase = createServerClient(
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
              // Ignore
            }
          },
        },
      }
    )
    
    // Service client for database queries (bypasses RLS)
    const { createClient } = await import('@supabase/supabase-js')
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Get current user from Supabase auth
    console.log('🔍 Getting user from Supabase...');
    const { data: { user }, error: userError } = await authSupabase.auth.getUser()
    console.log('🔍 User result:', user ? `User ID: ${user.id}` : 'No user');
    console.log('🔍 User error:', userError);
    
    if (userError || !user) {
      console.log('🔍 Returning 401 - not authenticated');
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get customer info from customer_users table using service key to bypass RLS
    console.log('🔍 Querying customer_users for email:', user.email);
    const { data: customerUser, error: customerError } = await serviceSupabase
      .from('customer_users')
      .select(`
        *,
        customers (
          id,
          name
        )
      `)
      .eq('email', user.email)
      .eq('is_active', true)
      .single()
    
    console.log('🔍 Customer user result:', customerUser);
    console.log('🔍 Customer user error:', customerError);

    if (customerError || !customerUser) {
      console.log('🔍 Returning 404 - customer not found');
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Return user info with customer details and role
    const responseData = {
      user: {
        id: user.id,
        email: user.email,
        full_name: customerUser.full_name,
        role: customerUser.role || 'customer' // Default to customer if role is null
      },
      is_primary: customerUser.is_primary
    };

    // Add customer info only if user has a customer (admins might not have one)
    if (customerUser.customers) {
      responseData.customer = {
        id: customerUser.customers.id,
        name: customerUser.customers.name
      };
    }

    return NextResponse.json({
      success: true,
      data: responseData
    })

  } catch (error) {
    console.error('Error getting user info:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}