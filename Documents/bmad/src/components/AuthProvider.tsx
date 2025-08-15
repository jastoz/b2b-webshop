'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'
import type { UserRole, AuthUser } from '@/types'

interface Customer {
  id: string
  name: string
}

interface AuthContextType {
  user: AuthUser | null
  customer: Customer | null
  loading: boolean
  isAdmin: boolean
  isCustomer: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  customer: null,
  loading: true,
  isAdmin: false,
  isCustomer: false,
  signOut: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchUserInfo = async (currentUser: User) => {
    try {
      const response = await fetch('/api/auth/user-info', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        console.error('Failed to fetch user info:', response.status, response.statusText)
        setUser(null)
        setCustomer(null)
        return
      }
      
      const data = await response.json()
      
      if (data.success && data.data.user) {
        // Set user with role information
        const authUser: AuthUser = {
          id: data.data.user.id,
          email: data.data.user.email,
          full_name: data.data.user.full_name,
          role: data.data.user.role,
          customer: data.data.customer,
          is_primary: data.data.is_primary
        }
        
        setUser(authUser)
        
        // Set customer (might be null for admin users)
        if (data.data.customer) {
          setCustomer(data.data.customer)
        } else {
          setCustomer(null)
        }
      } else {
        console.error('User info error:', data.error)
        setUser(null)
        setCustomer(null)
      }
    } catch (error) {
      console.error('Error fetching user info:', error)
      setUser(null)
      setCustomer(null)
    }
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
      
      if (currentUser) {
        await fetchUserInfo(currentUser)
      }
      
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchUserInfo(session.user)
        } else {
          setCustomer(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setCustomer(null)
  }

  // Computed values for role-based access
  const isAdmin = user?.role === 'admin'
  const isCustomer = user?.role === 'customer'

  return (
    <AuthContext.Provider value={{ 
      user, 
      customer, 
      loading, 
      isAdmin, 
      isCustomer, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  )
}