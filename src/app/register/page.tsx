'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/design-system/forms/Button';
import { Input } from '@/components/design-system/forms/Input';
import { useAuth } from '@/lib/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function RegisterPage() {
  const [restaurantName, setRestaurantName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubdomainAvailable, setIsSubdomainAvailable] = useState<boolean | null>(null);
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signUp } = useAuth();
  const router = useRouter();

  // Format subdomain (lowercase, no spaces, only alphanumeric)
  useEffect(() => {
    if (restaurantName) {
      const formattedSubdomain = restaurantName
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9]/g, '');
      
      setSubdomain(formattedSubdomain);
    }
  }, [restaurantName]);

  // Check subdomain availability with debounce
  useEffect(() => {
    if (!subdomain) {
      setIsSubdomainAvailable(null);
      return;
    }
    
    const timer = setTimeout(async () => {
      try {
        setIsCheckingSubdomain(true);
        const restaurantRef = doc(db, 'restaurants', subdomain);
        const restaurantDoc = await getDoc(restaurantRef);
        setIsSubdomainAvailable(!restaurantDoc.exists());
      } catch (error) {
        console.error('Error checking subdomain:', error);
      } finally {
        setIsCheckingSubdomain(false);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [subdomain]);

  const handleSubdomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
    
    setSubdomain(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (!isSubdomainAvailable) {
      setError('Subdomain is not available');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const restaurantData = {
        name: restaurantName,
        subdomain,
        theme: 'default',
        currency: 'USD',
        language: 'en',
        timeZone: 'UTC'
      };
      
      await signUp(email, password, restaurantData);
      router.push('/onboarding'); // Redirect to onboarding wizard
    } catch (error: any) {
      setError(error.message || 'Failed to register');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Register your restaurant
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Create your branded ordering platform in minutes
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              label="Restaurant Name"
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              required
              autoComplete="organization"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subdomain
              </label>
              <div className="flex rounded-md shadow-sm">
                <input
                  type="text"
                  className={`flex-1 rounded-l-md border ${   
                    isSubdomainAvailable === false
                      ? 'border-red-300'
                      : isSubdomainAvailable === true
                      ? 'border-green-300'
                      : 'border-gray-300'
                  } bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ease-in-out`}
                  value={subdomain}
                  onChange={handleSubdomainChange}
                  required
                  placeholder="yourrestaurant"
                />
                <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  .flashpointqr.com
                </span>
              </div>
              {isCheckingSubdomain ? (
                <p className="mt-1 text-xs text-gray-500">Checking availability...</p>
              ) : isSubdomainAvailable === false ? (
                <p className="mt-1 text-xs text-red-600">This subdomain is already taken</p>
              ) : isSubdomainAvailable === true ? (
                <p className="mt-1 text-xs text-green-600">Subdomain is available!</p>
              ) : null}
            </div>

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              error={
                confirmPassword &&
                password !== confirmPassword
                  ? 'Passwords do not match'
                  : undefined
              }
            />

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              variant="primary"
              size="md"
              isLoading={isLoading}
              disabled={!isSubdomainAvailable || isCheckingSubdomain}
            >
              Register
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-primary hover:text-primary/80">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
