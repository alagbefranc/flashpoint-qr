'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import Link from 'next/link';
import LoaderOne from '@/components/ui/loader-one';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.log('Onboarding Layout: Component mounted');
    setMounted(true);
  }, []);

  useEffect(() => {
    console.log('Onboarding Layout: Auth state check', { mounted, loading, userExists: !!user });
    if (mounted && !loading && !user) {
      console.log('Onboarding Layout: No authenticated user, redirecting to login');
      router.push('/login');
    }
  }, [user, loading, mounted, router]);

  if (loading || !mounted) {
    console.log('Onboarding Layout: Showing loading spinner', { loading, mounted });
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoaderOne />
      </div>
    );
  }
  
  console.log('Onboarding Layout: Rendering children');

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            FlashPoint QR Onboarding
          </h1>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            Skip for now
          </Link>
        </div>
      </header>

      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
