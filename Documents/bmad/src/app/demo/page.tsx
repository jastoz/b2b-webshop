import Link from 'next/link'

export default function DemoPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔐 Customer-Users Demo</h1>
        
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold text-blue-800 mb-3">
            Nova Authentication Arhitektura
          </h2>
          <p className="text-blue-700 mb-4">
            Implementirao sam novu customer-users tablicu koja omogućuje:
          </p>
          <ul className="list-disc list-inside text-blue-700 space-y-2">
            <li><strong>Više email adresa po ugovoru</strong> - Jedan customer može imati više korisnika</li>
            <li><strong>Primary contact</strong> označavanje glavne osobe za ugovor</li>
            <li><strong>RLS security</strong> - Svaki korisnik vidi samo svoje proizvode</li>
            <li><strong>Admin panel</strong> za upravljanje email adresama</li>
          </ul>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">📧 Test Email Adrese</h3>
            <p className="text-gray-600 mb-4">
              Generirano je <strong>263 test email adresa</strong> za postojeće kupce:
            </p>
            <div className="bg-gray-50 p-3 rounded text-sm font-mono mb-4">
              <div>hotel-medena-seget-d@test.hr</div>
              <div>nabava-hotel-medena-seget-d@test.hr</div>
              <div>direktor-hotel-medena-seget-d@test.hr</div>
              <div className="text-gray-500">... i 260 više</div>
            </div>
            <Link 
              href="/data/sample-logins.json" 
              target="_blank"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Vidi sve test email adrese →
            </Link>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">🎯 Kako Funkcionira</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">1</span>
                <span>Admin dodaje email adrese za kupce</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">2</span>
                <span>Korisnici se ulogiraju sa svojim email-om</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">3</span>
                <span>RLS policy filtrira proizvode po customer-u</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">4</span>
                <span>Korisnik vidi samo proizvode svog ugovora</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">📊 Implementirani Dijelovi</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-green-700 mb-2">✅ Gotovo</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• customer_users tablica (migration)</li>
                <li>• Test email generator (263 email adresa)</li>
                <li>• Admin API endpoints</li>
                <li>• Login komponente</li>
                <li>• Auth middleware</li>
                <li>• SQL seed file</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-orange-700 mb-2">⏳ U tijeku</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Supabase lokalni Docker (sporo se pokreće)</li>
                <li>• Migracija customer_users tablice</li>
                <li>• Testiranje pravog auth sustava</li>
                <li>• Admin panel za customer-users</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">🚀 Sljedeći koraci</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</span>
              <span>Pokretanje Supabase-a i migriranje customer_users tablice</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</span>
              <span>Seed-anje test email adresa u bazu</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">3</span>
              <span>Testiranje login stranice (/login)</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">4</span>
              <span>Admin panel za upravljanje customer email adresama</span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            Trenutno se Supabase Docker pokreće u pozadini...
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              href="/katalog/21" 
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              Test katalog (Customer 21)
            </Link>
            <Link 
              href="/customer-select" 
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
            >
              Customer Select
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}