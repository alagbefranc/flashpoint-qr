'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { collection, query, getDocs, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { format, addDays } from 'date-fns';
import ExpiringItemsHeader from '@/components/inventory/ExpiringItemsHeader';
import ExpiringItemsTable from '@/components/inventory/ExpiringItemsTable';

export interface ExpiringItem {
  id: string;
  name: string;
  expirationDate: Timestamp;
  daysUntilExpiry: number;
  quantity: number;
  unit: string;
  category: string;
  location?: string;
}

export default function ExpiringItemsPage() {
  const { user, restaurant, loading: authLoading } = useAuth();
  const [expiringItems, setExpiringItems] = useState<ExpiringItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysThreshold, setDaysThreshold] = useState(7); // Default to show items expiring in 7 days

  // Fetch ingredients that are expiring soon from Firebase
  useEffect(() => {
    if (authLoading) return;
    
    const fetchExpiringItems = async () => {
      if (!restaurant?.id) {
        console.log('No restaurant ID available, cannot fetch data');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Calculate the date threshold (today + daysThreshold)
        const today = new Date();
        const thresholdDate = addDays(today, daysThreshold);
        const thresholdTimestamp = Timestamp.fromDate(thresholdDate);
        
        // Get all ingredients with expiration dates before the threshold
        const ingredientsRef = collection(db, 'restaurants', restaurant.id, 'ingredients');
        const q = query(
          ingredientsRef,
          where('expirationDate', '<=', thresholdTimestamp),
          where('expirationDate', '>=', Timestamp.fromDate(today)),
          orderBy('expirationDate', 'asc')
        );
        
        const snapshot = await getDocs(q);
        const items: ExpiringItem[] = snapshot.docs.map(doc => {
          const data = doc.data();
          const expiryDate = data.expirationDate?.toDate();
          const today = new Date();
          
          // Calculate days until expiry
          const diffTime = expiryDate ? expiryDate.getTime() - today.getTime() : 0;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          return {
            id: doc.id,
            name: data.name || 'Unknown Item',
            expirationDate: data.expirationDate,
            daysUntilExpiry: diffDays,
            quantity: data.quantity || 0,
            unit: data.unit || '',
            category: data.category || 'Uncategorized',
            location: data.storageLocation
          };
        });
        
        setExpiringItems(items);
      } catch (err: any) {
        console.error('Error fetching expiring items:', err);
        setError(`Failed to load data: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExpiringItems();
  }, [restaurant?.id, authLoading, daysThreshold]);

  // Handle changing the days threshold
  const handleThresholdChange = (days: number) => {
    setDaysThreshold(days);
  };

  // If auth is still loading, show a loading spinner
  if (authLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <ExpiringItemsHeader 
        daysThreshold={daysThreshold}
        onThresholdChange={handleThresholdChange}
      />
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md">
          {error}
        </div>
      ) : expiringItems.length === 0 ? (
        <EmptyState
          title="No Items Expiring Soon"
          description={`You don't have any items expiring within the next ${daysThreshold} days.`}
          icon="calendar"
        />
      ) : (
        <ExpiringItemsTable items={expiringItems} />
      )}
    </div>
  );
}
