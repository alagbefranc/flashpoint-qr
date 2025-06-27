'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Button } from '@/components/ui/Button';

interface Features {
  onlineOrdering: boolean;
  reservations: boolean;
  callWaiter: boolean;
  kitchenDisplay: boolean;
  analytics: boolean;
  smsNotifications: boolean;
}

interface FeatureOption {
  id: keyof Features;
  name: string;
  description: string;
  icon: React.ReactNode;
}

export default function FeaturesPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [features, setFeatures] = useState<Features>({
    onlineOrdering: true,
    reservations: false,
    callWaiter: false,
    kitchenDisplay: false,
    analytics: false,
    smsNotifications: false
  });
  
  const [loading, setLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [error, setError] = useState('');
  const [restaurantId, setRestaurantId] = useState('');

  const featureOptions: FeatureOption[] = [
    {
      id: 'onlineOrdering',
      name: 'Online Ordering',
      description: 'Allow customers to place orders directly through your branded site',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      id: 'reservations',
      name: 'Table Reservations',
      description: 'Allow customers to book tables in advance',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'callWaiter',
      name: 'Call Waiter Feature',
      description: 'Allow customers to call waitstaff via QR code',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      )
    },
    {
      id: 'kitchenDisplay',
      name: 'Kitchen Display System',
      description: 'Real-time order management for kitchen staff',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      id: 'analytics',
      name: 'AI Analytics',
      description: 'Advanced analytics and insights for your business',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'smsNotifications',
      name: 'SMS Notifications',
      description: 'Send order updates and notifications via SMS',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      )
    }
  ];

  useEffect(() => {
    const fetchFeatureInfo = async () => {
      if (!user?.uid) return;

      try {
        // Get user details to find restaurant ID
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const restaurantId = userData.restaurantId;
          
          if (restaurantId) {
            setRestaurantId(restaurantId);
            
            // Get restaurant data
            const restaurantRef = doc(db, 'restaurants', restaurantId);
            const restaurantDoc = await getDoc(restaurantRef);
            
            if (restaurantDoc.exists()) {
              const data = restaurantDoc.data();
              
              // Set features if they exist
              if (data.features) {
                setFeatures({
                  ...features,
                  ...data.features
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching feature info:', error);
        setError('Failed to load feature information');
      } finally {
        setIsFetchingData(false);
      }
    };

    fetchFeatureInfo();
  }, [user]);

  const toggleFeature = (featureId: keyof Features) => {
    setFeatures(prev => ({
      ...prev,
      [featureId]: !prev[featureId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!restaurantId) {
      setError('Restaurant ID not found');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Update restaurant features in Firestore
      const restaurantRef = doc(db, 'restaurants', restaurantId);
      
      await updateDoc(restaurantRef, {
        features,
        onboardingCompleted: true,
        updatedAt: new Date()
      });
      
      // Navigate to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error updating features:', error);
      setError('Failed to save feature selections');
    } finally {
      setLoading(false);
    }
  };

  if (isFetchingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
      <h2 className="text-2xl font-bold mb-6">Enable Features</h2>
      
      <p className="text-gray-700 mb-8">
        Choose which features you want to enable for your restaurant. You can always change these settings later.
      </p>
      
      <div className="space-y-4 mb-8">
        {featureOptions.map((feature) => (
          <div
            key={feature.id}
            className={`border rounded-md p-4 cursor-pointer transition-all ${
              features[feature.id]
                ? 'bg-primary/5 border-primary/30'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => toggleFeature(feature.id)}
          >
            <div className="flex items-center">
              <div className={`mr-4 text-${features[feature.id] ? 'primary' : 'gray-400'}`}>
                {feature.icon}
              </div>
              
              <div className="flex-1">
                <h3 className="font-medium">{feature.name}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
              
              <div className="ml-4">
                <button
                  type="button"
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                    features[feature.id] ? 'bg-primary' : 'bg-gray-200'
                  }`}
                  role="switch"
                  aria-checked={features[feature.id]}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      features[feature.id] ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <p className="text-sm text-gray-600 mb-8">
        Some features may require additional setup or configuration after enabling.
      </p>
      
      {error && (
        <div className="text-red-500 text-sm mb-4">{error}</div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="flex justify-between pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/onboarding/invite-staff')}
          >
            Previous
          </Button>
          <Button type="submit" isLoading={loading}>
            Complete Setup
          </Button>
        </div>
      </form>
    </div>
  );
}
