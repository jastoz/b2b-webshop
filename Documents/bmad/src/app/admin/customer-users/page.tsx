import CustomerUsersAdmin from '@/components/CustomerUsersAdmin'

export default function CustomerUsersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Customer Email Management</h1>
      <p className="text-gray-600 mb-6">
        Upravljanje email adresama za kupce. Svaki ugovor može imati više email adresa.
      </p>
      <CustomerUsersAdmin />
    </div>
  )
}