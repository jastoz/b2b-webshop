'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface SampleLogin {
  email: string
  customer: string
  name: string
  is_primary: boolean
  password: string
}

interface SampleLoginsData {
  info: string
  default_password: string
  accounts: SampleLogin[]
}

export default function DemoLoginForm() {
  const [sampleLogins, setSampleLogins] = useState<SampleLogin[]>([])
  const [selectedLogin, setSelectedLogin] = useState<SampleLogin | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()

  // Load sample logins
  useEffect(() => {
    const loadSampleLogins = async () => {
      try {
        const response = await fetch('/data/sample-logins.json')
        const data: SampleLoginsData = await response.json()
        setSampleLogins(data.accounts || [])
      } catch (err) {
        console.error('Failed to load sample logins:', err)
        setError('Failed to load demo accounts')
      }
    }
    
    loadSampleLogins()
  }, [])

  const handleLogin = async (login: SampleLogin) => {
    setLoading(true)
    setError('')
    setSelectedLogin(login)

    try {
      // Simulate login delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Redirect to customer catalog
      router.push(`/katalog/${login.customer}`)
      
    } catch (err) {
      setError('Demo login failed: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-800">Demo Customer-User arhitektura</h3>
        <p className="text-sm text-blue-700 mt-1">
          Ova demo stranica pokazuje kako jedan ugovor može imati više email adresa.
          Kliknite na bilo koju email adresu da testirate funkcionalnost.
        </p>
      </div>

      <div className="grid gap-4">
        {sampleLogins.map((login, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 transition-colors cursor-pointer ${
              selectedLogin?.email === login.email
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => handleLogin(login)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-medium text-gray-900">
                    {login.email}
                  </div>
                  {login.is_primary && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Glavni kontakt
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {login.name}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Customer ID: {login.customer}
                </div>
              </div>
              
              <div className="ml-4">
                {loading && selectedLogin?.email === login.email ? (
                  <div className="w-6 h-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  </div>
                ) : (
                  <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Testiraj
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {sampleLogins.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Loading demo accounts...
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2">Testiranje arhitekture:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Jedan ugovor (customer) = više email adresa</li>
          <li>• Svaki email vidi iste proizvode za taj ugovor</li>
          <li>• "Glavni kontakt" označava primarnu osobu</li>
          <li>• RLS policy osigurava da svaki user vidi samo svoje proizvode</li>
        </ul>
        
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Kada Supabase bude spreman, koristiće se prava autentifikacija preko{' '}
            <a href="/login" className="text-indigo-600 hover:text-indigo-500">
              /login
            </a>{' '}
            stranice.
          </p>
        </div>
      </div>
    </div>
  )
}