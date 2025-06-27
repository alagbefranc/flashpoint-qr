'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';

const THEMES = [
  { 
    id: 'default', 
    name: 'Default', 
    primary: '#4f46e5', 
    background: '#ffffff' 
  },
  { 
    id: 'dark', 
    name: 'Dark Mode', 
    primary: '#60a5fa', 
    background: '#1f2937' 
  },
  { 
    id: 'sunset', 
    name: 'Sunset', 
    primary: '#f59e0b', 
    background: '#fff7ed' 
  },
  { 
    id: 'forest', 
    name: 'Forest', 
    primary: '#10b981', 
    background: '#ecfdf5' 
  },
  { 
    id: 'berry', 
    name: 'Berry', 
    primary: '#ec4899', 
    background: '#fdf2f8' 
  }
];

export default function BrandingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [error, setError] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const fetchBrandingInfo = async () => {
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
              if (data.config) {
                setSelectedTheme(data.config.theme || 'default');
                setLogoUrl(data.config.logo || '');
                if (data.config.logo) {
                  setPreviewUrl(data.config.logo);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching branding info:', error);
        setError('Failed to load branding information');
      } finally {
        setIsFetchingData(false);
      }
    };

    fetchBrandingInfo();
  }, [user]);

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      setLogoFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile || !restaurantId) return null;
    
    const fileExt = logoFile.name.split('.').pop();
    const fileName = `restaurants/${restaurantId}/logo-${Date.now()}.${fileExt}`;
    const storageRef = ref(storage, fileName);
    
    try {
      setUploadProgress(1); // Start progress
      
      // Upload the file
      const uploadTask = uploadBytes(storageRef, logoFile);
      
      // Simulate progress since Firebase doesn't have easy progress tracking
      let progress = 10;
      const progressInterval = setInterval(() => {
        progress += 10;
        if (progress >= 90) {
          clearInterval(progressInterval);
        }
        setUploadProgress(progress);
      }, 200);
      
      await uploadTask;
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Get download URL
      const url = await getDownloadURL(storageRef);
      setLogoUrl(url);
      
      return url;
    } catch (error) {
      console.error('Error uploading logo:', error);
      setError('Failed to upload logo');
      setUploadProgress(0);
      return null;
    }
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
      // Upload logo if a new one was selected
      let finalLogoUrl = logoUrl;
      if (logoFile) {
        finalLogoUrl = await handleLogoUpload() || logoUrl;
      }
      
      // Update restaurant branding in Firestore
      const restaurantRef = doc(db, 'restaurants', restaurantId);
      
      await updateDoc(restaurantRef, {
        'config.theme': selectedTheme,
        'config.logo': finalLogoUrl,
        updatedAt: new Date()
      });
      
      // Navigate to next step
      router.push('/onboarding/menu');
    } catch (error) {
      console.error('Error updating branding:', error);
      setError('Failed to save branding information');
    } finally {
      setLoading(false);
      setUploadProgress(0);
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
      <h2 className="text-2xl font-bold mb-6">Restaurant Branding</h2>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Logo Upload Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Restaurant Logo
          </label>
          
          <div className="flex items-center space-x-6">
            <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-300">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Restaurant logo"
                  width={128}
                  height={128}
                  className="object-contain w-full h-full"
                />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-12 h-12 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            
            <div className="flex-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? 'Change Logo' : 'Upload Logo'}
              </Button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoChange}
                className="hidden"
                accept="image/*"
              />
              
              <p className="text-sm text-gray-700 mt-2">
                Recommended size: 512x512 pixels. Max file size: 2MB.
                <br />
                PNG or JPG format with transparent background preferred.
              </p>
              
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Theme Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Choose a Theme
          </label>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {THEMES.map((theme) => (
              <div
                key={theme.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedTheme === theme.id
                    ? 'ring-2 ring-primary border-primary'
                    : 'hover:border-gray-400'
                }`}
                onClick={() => handleThemeSelect(theme.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">{theme.name}</span>
                  {selectedTheme === theme.id && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: theme.primary }}
                  ></div>
                  <div
                    className="w-6 h-6 rounded-full border border-gray-300"
                    style={{ backgroundColor: theme.background }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-sm text-gray-700 mt-3">
            You can further customize colors and branding after onboarding.
          </p>
        </div>
        
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}
        
        <div className="flex justify-between pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/onboarding/restaurant-info')}
          >
            Previous
          </Button>
          <Button type="submit" isLoading={loading}>
            Save & Continue
          </Button>
        </div>
      </form>
    </div>
  );
}
