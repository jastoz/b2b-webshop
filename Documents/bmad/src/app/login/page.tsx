import LoginForm from '@/components/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Prijava u BMAD webshop
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ulogite se pomoću email adrese povezane s vašim ugovorom
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}