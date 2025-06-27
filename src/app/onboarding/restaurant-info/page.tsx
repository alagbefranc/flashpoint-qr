'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Button } from '@/components/design-system/forms/Button';
import { Input } from '@/components/design-system/forms/Input';
import LoaderOne from '@/components/ui/loader-one';

export default function RestaurantInfoPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [restaurantName, setRestaurantName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('United States');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [error, setError] = useState('');
  const [restaurantId, setRestaurantId] = useState('');

  useEffect(() => {
    const fetchRestaurantInfo = async () => {
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
              
              // Set form data from restaurant document
              setRestaurantName(data.name || '');
              setAddress(data.address?.street || '');
              setCity(data.address?.city || '');
              setState(data.address?.state || '');
              setZipCode(data.address?.zipCode || '');
              setCountry(data.address?.country || 'United States');
              setPhone(data.phone || '');
              setEmail(data.email || user.email || '');
              setWebsite(data.website || '');
              setDescription(data.description || '');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching restaurant info:', error);
        setError('Failed to load restaurant information');
      } finally {
        setIsFetchingData(false);
      }
    };

    fetchRestaurantInfo();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Submit pressed, restaurantId:', restaurantId);
    
    if (!restaurantId) {
      setError('Restaurant ID not found');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Attempting to update restaurant with ID:', restaurantId);
      const restaurantRef = doc(db, 'restaurants', restaurantId);
      
      // Check if document exists before updating
      const docSnap = await getDoc(restaurantRef);
      console.log('Document exists?', docSnap.exists(), 'Data:', docSnap.data());
      
      const updateData = {
        name: restaurantName,
        address: {
          street: address,
          city,
          state,
          zipCode,
          country
        },
        phone,
        email,
        website,
        description,
        updatedAt: new Date()
      };
      
      console.log('Update data:', updateData);
      
      // If document doesn't exist, create it instead of updating
      if (!docSnap.exists()) {
        console.log('Document does not exist, creating instead of updating');
        await setDoc(restaurantRef, {
          ...updateData,
          ownerId: user?.uid,
          createdAt: new Date()
        });
      } else {
        await updateDoc(restaurantRef, updateData);
      }
      
      console.log('Restaurant data saved successfully!');
      
      // Navigate to next step
      router.push('/onboarding/branding');
    } catch (error) {
      console.error('Error updating restaurant info:', error);
      // Show more detailed error information
      if (error instanceof Error) {
        setError(`Failed to save restaurant information: ${error.message}`);
      } else {
        setError('Failed to save restaurant information');
      }
    } finally {
      setLoading(false);
    }    
  };

  if (isFetchingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoaderOne />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
      <h2 className="text-2xl font-bold mb-6">Restaurant Information</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Restaurant Name"
          value={restaurantName}
          onChange={(e) => setRestaurantName(e.target.value)}
          required
        />

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Address</label>
          
          <Input
            label="Street Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
            
            <Input
              label="State/Province"
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
            />
            
            <Input
              label="ZIP/Postal Code"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              required
            />
          </div>
          
          <Input
            label="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Phone Number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <Input
          label="Website (optional)"
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description (optional)
          </label>
          <textarea
            id="description"
            className="w-full rounded-md border border-gray-300 bg-white text-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none transition duration-200 ease-in-out min-h-[100px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}
        
        <div className="flex justify-between pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/onboarding')}
          >
            Back
          </Button>
          <Button type="submit" isLoading={loading}>
            Save & Continue
          </Button>
        </div>
      </form>
    </div>
  );
}
