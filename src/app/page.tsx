'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (loading) return;

      if (user) {
        try {
          // User is authenticated, check if they have a restaurant
          if (user.restaurantId) {
            // Check if onboarding is completed from restaurant document
            const restaurantRef = doc(db, 'restaurants', user.restaurantId);
            const restaurantDoc = await getDoc(restaurantRef);
            
            if (restaurantDoc.exists()) {
              const data = restaurantDoc.data();
              if (data.onboardingCompleted) {
                router.push('/dashboard');
              } else {
                router.push('/onboarding');
              }
            } else {
              router.push('/onboarding');
            }
          } else {
            // No restaurant ID, send to onboarding
            router.push('/onboarding');
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error);
          router.push('/onboarding');
        }
      } else {
        // User is not authenticated
        router.push('/login');
      }
    };
    
    checkOnboardingStatus();
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
