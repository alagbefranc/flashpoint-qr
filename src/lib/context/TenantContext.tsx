import { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface TenantConfig {
  theme: string;
  logo: string | null;
  currency: string;
  language: string;
  timeZone: string;
  menuCategories?: string[];
}

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  config: TenantConfig;
  features: {
    onlineOrdering: boolean;
    reservations: boolean;
    callWaiter: boolean;
    kitchenDisplay: boolean;
    analytics: boolean;
    smsNotifications: boolean;
  };
}

interface TenantContextType {
  tenant: Tenant | null;
  isLoading: boolean;
  error: string | null;
  updateTenant: (updatedTenant: Partial<Tenant>) => Promise<void>;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  isLoading: true,
  error: null,
  updateTenant: async () => {},
});

export const useTenant = () => useContext(TenantContext);

export function TenantProvider({ 
  children,
  subdomain 
}: { 
  children: React.ReactNode;
  subdomain: string;
}) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenant = async () => {
      if (!subdomain) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const tenantRef = doc(db, 'restaurants', subdomain);
        const tenantDoc = await getDoc(tenantRef);
        
        if (tenantDoc.exists()) {
          const tenantData = tenantDoc.data();
          setTenant({
            id: tenantDoc.id,
            name: tenantData.name,
            subdomain: tenantData.subdomain,
            config: tenantData.config || {
              theme: 'default',
              logo: null,
              currency: 'USD',
              language: 'en',
              timeZone: 'UTC'
            },
            features: tenantData.features || {
              onlineOrdering: true,
              reservations: false,
              callWaiter: false,
              kitchenDisplay: false,
              analytics: false,
              smsNotifications: false
            }
          });
        } else {
          setError('Restaurant not found');
        }
      } catch (err) {
        console.error('Error fetching tenant:', err);
        setError('Failed to load restaurant information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenant();
  }, [subdomain]);

  const updateTenant = async (updatedTenant: Partial<Tenant>) => {
    if (!tenant) return;
    
    try {
      const tenantRef = doc(db, 'restaurants', tenant.id);
      
      // Convert from our frontend model to the Firestore model
      const updateData: any = {};
      
      if (updatedTenant.name) updateData.name = updatedTenant.name;
      if (updatedTenant.config) updateData.config = updatedTenant.config;
      if (updatedTenant.features) updateData.features = updatedTenant.features;
      
      // Update in Firestore
      await tenantRef.update(updateData);
      
      // Update local state
      setTenant(prevTenant => {
        if (!prevTenant) return null;
        return { ...prevTenant, ...updatedTenant };
      });
    } catch (error) {
      console.error('Error updating tenant:', error);
      throw error;
    }
  };

  return (
    <TenantContext.Provider value={{ tenant, isLoading, error, updateTenant }}>
      {children}
    </TenantContext.Provider>
  );
}
