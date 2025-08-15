import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth-utils';

// Root page redirects based on user role
export default async function HomePage() {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    // Not authenticated - redirect to login
    redirect('/login');
  }
  
  if (user.role === 'admin') {
    // Admin users see customer selection
    redirect('/customer-select');
  }
  
  if (user.role === 'customer' && user.customer) {
    // Customer users go directly to their catalog
    redirect(`/katalog/${user.customer.id}`);
  }
  
  // Fallback - redirect to login if no proper role/customer
  redirect('/login');
}