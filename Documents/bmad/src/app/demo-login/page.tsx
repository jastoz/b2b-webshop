import DemoLoginForm from '@/components/DemoLoginForm'

export default function DemoLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Demo Login - BMAD webshop
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Testirajte customer-users funkcionalnost
          </p>
        </div>
        <DemoLoginForm />
      </div>
    </div>
  )
}