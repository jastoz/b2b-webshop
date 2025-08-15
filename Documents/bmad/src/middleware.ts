import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let supabaseResponse = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request: req,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/demo', '/demo-login']
  const isApiRoute = req.nextUrl.pathname.startsWith('/api/')
  const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith('/data/')) || isApiRoute

  // Admin-only routes
  const adminOnlyRoutes = ['/customer-select', '/admin']
  const isAdminRoute = adminOnlyRoutes.some(route => req.nextUrl.pathname.startsWith(route))
  
  // Customer catalog routes
  const isCatalogRoute = req.nextUrl.pathname.startsWith('/katalog/')
  
  // If not authenticated and trying to access protected route
  if (!session && !isPublicRoute) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If authenticated user tries to access login page, redirect based on role
  if (session && req.nextUrl.pathname === '/login') {
    try {
      // Get user info with role
      const userInfoResponse = await fetch(`${req.nextUrl.origin}/api/auth/user-info`, {
        headers: {
          Cookie: req.headers.get('cookie') ?? '',
        },
      })
      
      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json()
        if (userInfo.success && userInfo.data.user) {
          const { user, customer } = userInfo.data
          
          // Admin users go to customer selection
          if (user.role === 'admin') {
            return NextResponse.redirect(new URL('/customer-select', req.url))
          }
          
          // Customer users go directly to their catalog
          if (user.role === 'customer' && customer) {
            return NextResponse.redirect(new URL(`/katalog/${customer.id}`, req.url))
          }
        }
      }
    } catch (error) {
      console.error('Error getting user info in middleware:', error)
    }
    
    // Fallback to customer selection
    return NextResponse.redirect(new URL('/customer-select', req.url))
  }

  // Role-based route protection
  if (session && (isAdminRoute || isCatalogRoute)) {
    try {
      const userInfoResponse = await fetch(`${req.nextUrl.origin}/api/auth/user-info`, {
        headers: {
          Cookie: req.headers.get('cookie') ?? '',
        },
      })
      
      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json()
        if (userInfo.success && userInfo.data.user) {
          const { user, customer } = userInfo.data
          
          // Admin-only routes
          if (isAdminRoute && user.role !== 'admin') {
            // Customer trying to access admin routes - redirect to their catalog
            if (user.role === 'customer' && customer) {
              return NextResponse.redirect(new URL(`/katalog/${customer.id}`, req.url))
            }
            // No customer info - redirect to login
            return NextResponse.redirect(new URL('/login', req.url))
          }
          
          // Catalog routes - check if customer can access this specific catalog
          if (isCatalogRoute && user.role === 'customer') {
            const requestedCustomerId = req.nextUrl.pathname.split('/katalog/')[1]?.split('/')[0]
            if (customer && requestedCustomerId !== customer.id) {
              // Customer trying to access another customer's catalog
              return NextResponse.redirect(new URL(`/katalog/${customer.id}`, req.url))
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking role in middleware:', error)
    }
  }


  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}