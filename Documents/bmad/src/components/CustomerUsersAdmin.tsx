'use client'

import { useState, useEffect } from 'react'

interface CustomerUser {
  id: number
  customer_id: string
  email: string
  full_name: string | null
  is_primary: boolean
  is_active: boolean
  created_at: string
  customers?: {
    customer_name: string
  }
}

interface Customer {
  id: string
  customer_name: string
}

export default function CustomerUsersAdmin() {
  const [customerUsers, setCustomerUsers] = useState<CustomerUser[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingUser, setEditingUser] = useState<CustomerUser | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    customer_id: '',
    email: '',
    full_name: '',
    is_primary: false
  })

  // Load customer users and customers
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load customer users
      const usersResponse = await fetch(`/api/admin/customer-users${selectedCustomer ? `?customer_id=${selectedCustomer}` : ''}`)
      const usersData = await usersResponse.json()
      
      if (usersData.success) {
        setCustomerUsers(usersData.data)
      } else {
        setError(usersData.error)
      }

      // Load customers for dropdown
      const customersResponse = await fetch('/api/customers')
      const customersData = await customersResponse.json()
      
      if (customersData.success) {
        setCustomers(customersData.data)
      }

    } catch (err) {
      setError('Error loading data: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // Reload when customer filter changes
  useEffect(() => {
    if (!loading) {
      loadData()
    }
  }, [selectedCustomer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingUser ? `/api/admin/customer-users/${editingUser.id}` : '/api/admin/customer-users'
      const method = editingUser ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        await loadData()
        resetForm()
        setError('')
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Error saving: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Da li ste sigurni da želite obrisati ovog korisnika?')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/customer-users/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        await loadData()
        setError('')
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Error deleting: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ customer_id: '', email: '', full_name: '', is_primary: false })
    setShowAddForm(false)
    setEditingUser(null)
  }

  const startEdit = (user: CustomerUser) => {
    setFormData({
      customer_id: user.customer_id,
      email: user.email,
      full_name: user.full_name || '',
      is_primary: user.is_primary
    })
    setEditingUser(user)
    setShowAddForm(true)
  }

  const toggleUserStatus = async (user: CustomerUser) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/customer-users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !user.is_active })
      })

      const data = await response.json()

      if (data.success) {
        await loadData()
        setError('')
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Error updating status: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (loading && customerUsers.length === 0) {
    return <div className="flex justify-center p-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Filter and Add Button */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Svi kupci</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.customer_name} ({customer.id})
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-600">
            {customerUsers.length} korisnika
          </span>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          disabled={loading}
        >
          Dodaj korisnika
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-gray-50 p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">
            {editingUser ? 'Uredi korisnika' : 'Dodaj novog korisnika'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Kupac</label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                >
                  <option value="">Odaberi kupca</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.customer_name} ({customer.id})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Puno ime</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_primary}
                  onChange={(e) => setFormData({...formData, is_primary: e.target.checked})}
                  className="mr-2"
                />
                <span className="text-sm">Glavni kontakt za ovog kupca</span>
              </label>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                disabled={loading}
              >
                {loading ? 'Spremanje...' : (editingUser ? 'Spremi' : 'Dodaj')}
              </button>
              
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Odustani
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customer Users Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kupac
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ime
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akcije
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customerUsers.map((user) => (
                <tr key={user.id} className={!user.is_active ? 'opacity-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.customers?.customer_name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {user.customer_id}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    {user.is_primary && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Glavni kontakt
                      </span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.full_name || '-'}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleUserStatus(user)}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.is_active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {user.is_active ? 'Aktivan' : 'Neaktivan'}
                    </button>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => startEdit(user)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Uredi
                    </button>
                    
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Obriši
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {customerUsers.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          Nema korisnika za prikaz.
        </div>
      )}
    </div>
  )
}