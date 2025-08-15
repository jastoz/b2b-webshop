/**
 * Server-side authentication utilities for role-based access control
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { UserRole, AuthUser } from '@/types'

/**
 * Get the current authenticated user with role information
 */
export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies()
    
    // Service client for database queries (bypasses RLS) - direct database access
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
              // Ignore
            }
          },
        },
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return null
    }

    // Get customer info directly from database instead of API call to avoid fetch issues
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

    if (customerError || !customerUser) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      full_name: customerUser.full_name,
      role: customerUser.role || 'customer',
      customer: customerUser.customers ? {
        id: customerUser.customers.id,
        name: customerUser.customers.name
      } : undefined,
      is_primary: customerUser.is_primary
    }
  } catch (error) {
    console.error('Error getting authenticated user:', error)
    return null
  }
}

/**
 * Check if user has admin role
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getAuthenticatedUser()
  return user?.role === 'admin'
}

/**
 * Check if user has customer role  
 */
export async function isCustomer(): Promise<boolean> {
  const user = await getAuthenticatedUser()
  return user?.role === 'customer'
}

/**
 * Check if customer user can access specific customer data
 */
export async function canAccessCustomer(customerId: string): Promise<boolean> {
  const user = await getAuthenticatedUser()
  
  if (!user) return false
  
  // Admin can access any customer
  if (user.role === 'admin') return true
  
  // Customer can only access their own data
  if (user.role === 'customer') {
    return user.customer?.id === customerId
  }
  
  // TEMPORARY FIX: If role is undefined (database not updated yet), 
  // allow access if user has a customer relationship OR if no authentication required
  if (!user.role || user.role === undefined) {
    // If user has customer data, allow access to that customer
    if (user.customer?.id) {
      return user.customer.id === customerId
    }
    // If no customer relationship but user is authenticated, allow access (legacy behavior)
    return true
  }
  
  return false
}

/**
 * Require admin access or throw error
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await getAuthenticatedUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  if (user.role !== 'admin') {
    throw new Error('Admin access required')
  }
  
  return user
}

/**
 * Require customer access to specific customer or throw error
 */
export async function requireCustomerAccess(customerId: string): Promise<AuthUser> {
  const user = await getAuthenticatedUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  const hasAccess = await canAccessCustomer(customerId)
  if (!hasAccess) {
    throw new Error('Access denied to customer data')
  }
  
  return user
}