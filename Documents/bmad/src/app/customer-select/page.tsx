import CustomerSelectClient from '@/components/CustomerSelectClient';
import { getCustomersForUser } from '@/lib/data';

export default async function CustomerSelectPage() {
  const customers = await getCustomersForUser();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Odaberite vašu firmu
        </h1>
        <p className="text-lg text-gray-600">
          Za pristup katalogu ugovornih artikala, molimo odaberite svoju firmu iz liste.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="card">
          <CustomerSelectClient customers={customers} />
        </div>
      </div>

      {/* Statistics */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="text-center">
          <div className="text-3xl font-bold text-primary-600">{customers.length}</div>
          <div className="text-sm text-gray-500">Registriranih kupaca</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-primary-600">
            {customers.reduce((sum, c) => sum + (c.productCount || 0), 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Ugovornih artikala</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-primary-600">
            {Math.round(customers.reduce((sum, c) => sum + (c.productCount || 0), 0) / customers.length)}
          </div>
          <div className="text-sm text-gray-500">Prosjek artikala po kupcu</div>
        </div>
      </div>
    </div>
  );
}