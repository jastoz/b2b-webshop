import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import AuthProvider from '@/components/AuthProvider';
import LogoutButton from '@/components/LogoutButton';

export const metadata: Metadata = {
  title: 'B2B Webshop - Ugovorni Artikli',
  description: 'Web aplikacija za naručivanje artikala prema ugovornim uvjetima',
  viewport: 'width=device-width, initial-scale=1',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="hr" className="h-full">
      <body className="h-full">
        <AuthProvider>
          <div id="root" className="min-h-full">
            <header className="bg-white shadow-sm border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center">
                    <h1 className="text-2xl font-bold text-gray-900">
                      🏢 B2B Webshop
                    </h1>
                  </div>
                  <LogoutButton />
                </div>
              </div>
            </header>
            
            <main className="flex-1">
              {children}
            </main>
            
            <footer className="bg-gray-50 border-t border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="text-center text-sm text-gray-500">
                  © 2024 B2B Webshop - Razvijen za ugovorne kupce
                </div>
              </div>
            </footer>
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}