'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (data.user) {
        // Check if user has customer access
        const userInfoResponse = await fetch('/api/auth/user-info', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (!userInfoResponse.ok) {
          setError('Greška pri dohvaćanju korisničkih podataka.')
          await supabase.auth.signOut()
          return
        }
        
        const userInfo = await userInfoResponse.json()
        
        if (!userInfo.success || !userInfo.data?.customer) {
          setError('Nemate pristup sustavu. Kontaktirajte administratora.')
          await supabase.auth.signOut()
          return
        }

        // Redirect to customer catalog
        router.push(`/katalog/${userInfo.data.customer.id}`)
        router.refresh()
      }

    } catch (err) {
      setError('Greška pri prijavi: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleLogin}>
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}
      
      <div className="rounded-md shadow-sm -space-y-px">
        <div>
          <label htmlFor="email" className="sr-only">
            Email adresa
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Email adresa"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            Lozinka
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Lozinka"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading || !email || !password}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Prijavljivanje...' : 'Prijavite se'}
        </button>
      </div>

      <div className="text-sm text-center text-gray-600">
        <p>Test accounts: password je <code className="bg-gray-100 px-1 rounded">test123</code></p>
        <p className="mt-1">
          <a href="/data/sample-logins.json" target="_blank" className="text-indigo-600 hover:text-indigo-500">
            Pogledajte test email adrese →
          </a>
        </p>
      </div>
    </form>
  )
}