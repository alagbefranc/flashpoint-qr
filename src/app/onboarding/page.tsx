'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import LoaderOne from '@/components/ui/loader-one';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

const ONBOARDING_STEPS = [
  { id: 'restaurant-info', label: 'Restaurant Info', path: '/onboarding/restaurant-info' },
  { id: 'branding', label: 'Branding', path: '/onboarding/branding' },
  { id: 'menu', label: 'Create Menu', path: '/onboarding/menu' },
  { id: 'staff', label: 'Invite Staff', path: '/onboarding/invite-staff' },
  { id: 'features', label: 'Enable Features', path: '/onboarding/features' },
];

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [restaurantData, setRestaurantData] = useState<any>(null);

  useEffect(() => {
    const fetchOnboardingStatus = async () => {
      console.log('Onboarding: fetchOnboardingStatus called, user:', user?.uid);
      if (!user?.uid) {
        console.log('Onboarding: No user ID available, returning');
        return;
      }

      try {
        setLoading(true);
        console.log('Onboarding: Loading set to true');
        
        // Get user details to find restaurant ID
        const userRef = doc(db, 'users', user.uid);
        console.log('Onboarding: Fetching user doc:', user.uid);
        const userDoc = await getDoc(userRef);
        console.log('Onboarding: User doc exists:', userDoc.exists());
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('Onboarding: User data:', userData);
          const restaurantId = userData.restaurantId;
          console.log('Onboarding: Restaurant ID:', restaurantId);
          
          if (restaurantId) {
            // Get restaurant data
            const restaurantRef = doc(db, 'restaurants', restaurantId);
            console.log('Onboarding: Fetching restaurant doc:', restaurantId);
            const restaurantDoc = await getDoc(restaurantRef);
            console.log('Onboarding: Restaurant doc exists:', restaurantDoc.exists());
            
            if (restaurantDoc.exists()) {
              const data = restaurantDoc.data();
              console.log('Onboarding: Restaurant data:', data);
              setRestaurantData(data);
              
              // Check which steps are completed
              const completed: { [key: string]: boolean } = {};
              
              // Restaurant Info
              if (data.address && data.phone) {
                completed['restaurant-info'] = true;
              }
              
              // Branding
              if (data.config?.logo && data.config?.theme !== 'default') {
                completed['branding'] = true;
              }
              
              // Menu
              if (data.menuCategories && data.menuCategories.length > 0) {
                completed['menu'] = true;
              }
              
              // Staff
              if (data.invitedStaff && data.invitedStaff.length > 0) {
                completed['staff'] = true;
              }
              
              // Features
              if (data.features) {
                completed['features'] = true;
              }
              
              setCompletedSteps(completed);
              
              // Find first uncompleted step
              const firstIncompleteIndex = ONBOARDING_STEPS.findIndex(
                step => !completed[step.id]
              );
              
              if (firstIncompleteIndex !== -1) {
                setCurrentStep(firstIncompleteIndex);
              }
            }
          }
        }
      } catch (error) {
        console.error('Onboarding: Error fetching onboarding status:', error);
      } finally {
        console.log('Onboarding: Setting loading to false');
        setLoading(false);
      }
    };

    fetchOnboardingStatus();
  }, [user?.uid]);

  const handleNextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      router.push(ONBOARDING_STEPS[currentStep + 1].path);
    } else {
      router.push('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoaderOne />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Welcome to FlashPoint QR!</h1>
      
      <p className="text-lg text-gray-600 mb-6">
        Let's set up your restaurant. Complete these steps to get your ordering system ready.
      </p>
      
      <div className="mb-10">
        <div className="relative">
          <div
            className="absolute left-0 top-4 h-0.5 bg-gray-200"
            style={{ width: '100%' }}
          ></div>
          <ul className="relative flex justify-between">
            {ONBOARDING_STEPS.map((step, index) => (
              <li key={step.id} className="text-center">
                <div
                  className={`w-8 h-8 flex items-center justify-center mx-auto rounded-full ${
                    completedSteps[step.id]
                      ? 'bg-green-500 text-white'
                      : index === currentStep
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {completedSteps[step.id] ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="text-xs font-medium text-gray-500 mt-2">
                  {step.label}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="space-y-4">
        {ONBOARDING_STEPS.map((step, index) => (
          <div
            key={step.id}
            className={`p-4 border rounded-md ${
              index === currentStep
                ? 'border-primary/20 bg-primary/5'
                : completedSteps[step.id]
                ? 'border-green-200 bg-green-50'
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-full mr-3 ${
                    completedSteps[step.id]
                      ? 'bg-green-500 text-white'
                      : index === currentStep
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {completedSteps[step.id] ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="font-medium">{step.label}</span>
              </div>
              
              <Link href={step.path}>
                <Button
                  variant={
                    completedSteps[step.id] 
                      ? 'outline'
                      : index === currentStep
                      ? 'primary'
                      : 'outline'
                  }
                  size="sm"
                >
                  {completedSteps[step.id] ? 'Edit' : index === currentStep ? 'Start' : 'Skip'}
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-10 flex justify-between">
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          Skip for now
        </Button>
        
        <Button onClick={handleNextStep}>
          {currentStep < ONBOARDING_STEPS.length - 1 ? 'Next Step' : 'Finish'}
        </Button>
      </div>
    </div>
  );
}
