'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/lib/context/AuthContext';
import LoaderOne from '@/components/ui/loader-one';

type RoleRequirement = keyof UserRole | 'any' | 'none';

export function withRoleProtection<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole: RoleRequirement = 'any',
  redirectPath: string = '/login'
) {
  return function ProtectedRoute(props: P) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    useEffect(() => {
      if (!loading && mounted) {
        if (!user) {
          // Not logged in, redirect to login
          router.push(redirectPath);
        } else if (requiredRole !== 'any' && requiredRole !== 'none') {
          // Check if user has the required role
          if (!user.roles || !user.roles[requiredRole as keyof UserRole]) {
            // User doesn't have the required role, redirect to unauthorized page
            router.push('/unauthorized');
          }
        }
      }
    }, [user, loading, mounted, router, requiredRole, redirectPath]);

    if (loading || !mounted) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <LoaderOne />
        </div>
      );
    }

    if (!user) {
      return null; // Will redirect in useEffect
    }

    if (requiredRole !== 'any' && requiredRole !== 'none' && (!user.roles || !user.roles[requiredRole as keyof UserRole])) {
      return null; // Will redirect in useEffect
    }

    return <Component {...props} />;
  };
}
