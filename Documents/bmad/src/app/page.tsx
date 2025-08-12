import { redirect } from 'next/navigation';

// Root page redirects to customer selection
export default function HomePage() {
  redirect('/customer-select');
}