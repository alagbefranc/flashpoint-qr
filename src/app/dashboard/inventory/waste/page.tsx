'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { collection, doc, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import WasteLogForm from './components/WasteLogForm';
import WastePageHeader from '@/components/inventory/WastePageHeader';
import WasteStats from '@/components/inventory/WasteStats';
import WasteLogTable from '@/components/inventory/WasteLogTable';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Define the Ingredient interface
export interface Ingredient {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  minStockLevel: number;
  costPerUnit: number;
  supplier?: string;
  notes?: string;
}

// Define waste log entry interface
export interface WasteLogEntry {
  id?: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  reason: string; // e.g., Expired, Spoiled, Damaged, etc.
  cost: number; // Calculated cost of waste
  date: any; // Firestore timestamp
  createdBy: string; // User ID
  createdByName: string; // User display name
}

export default function WastePage() {
  const { user, restaurant, loading: authLoading } = useAuth();
  
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [wasteEntries, setWasteEntries] = useState<WasteLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  // Stats
  const [totalWasteCost, setTotalWasteCost] = useState(0);
  const [topWastedIngredients, setTopWastedIngredients] = useState<{id: string, name: string, count: number, cost: number}[]>([]);
  const [commonReasons, setCommonReasons] = useState<{reason: string, count: number}[]>([]);

  // Fetch ingredients and waste entries from Firebase when component mounts or restaurant changes
  useEffect(() => {
    // Don't try to fetch if auth is still loading or if restaurant ID is not available
    if (authLoading) return;
    
    const fetchData = async () => {
      // Check if we have a restaurant ID after auth has finished loading
      if (!restaurant?.id) {
        console.log('No restaurant ID available, cannot fetch data');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch ingredients
        const ingredientsRef = collection(db, 'restaurants', restaurant.id, 'ingredients');
        const ingredientsQuery = query(ingredientsRef, orderBy('name'));
        
        const ingredientsSnapshot = await getDocs(ingredientsQuery);
        const ingredientsData: Ingredient[] = ingredientsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<Ingredient, 'id'>
        }));
        
        setIngredients(ingredientsData);
        
        // Fetch waste entries
        const wasteRef = collection(db, 'restaurants', restaurant.id, 'wasteLog');
        const wasteQuery = query(wasteRef, orderBy('date', 'desc'));
        
        const wasteSnapshot = await getDocs(wasteQuery);
        const wasteData: WasteLogEntry[] = wasteSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<WasteLogEntry, 'id'>
        }));
        
        setWasteEntries(wasteData);
        
        // Calculate stats
        calculateWasteStats(wasteData);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(`Failed to load data: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [restaurant?.id, authLoading]);

  // Calculate waste statistics
  const calculateWasteStats = (entries: WasteLogEntry[]) => {
    // Calculate total waste cost
    const total = entries.reduce((sum, entry) => sum + (entry.cost || 0), 0);
    setTotalWasteCost(total);
    
    // Calculate top wasted ingredients
    const ingredientMap: {[key: string]: {name: string, count: number, cost: number}} = {};
    entries.forEach(entry => {
      if (!ingredientMap[entry.ingredientId]) {
        ingredientMap[entry.ingredientId] = {
          name: entry.ingredientName,
          count: 0,
          cost: 0
        };
      }
      ingredientMap[entry.ingredientId].count += 1;
      ingredientMap[entry.ingredientId].cost += entry.cost || 0;
    });
    
    const topIngredients = Object.entries(ingredientMap)
      .map(([id, data]) => ({id, name: data.name, count: data.count, cost: data.cost}))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);
    
    setTopWastedIngredients(topIngredients);
    
    // Calculate common waste reasons
    const reasonMap: {[key: string]: number} = {};
    entries.forEach(entry => {
      reasonMap[entry.reason] = (reasonMap[entry.reason] || 0) + 1;
    });
    
    const reasons = Object.entries(reasonMap)
      .map(([reason, count]) => ({reason, count}))
      .sort((a, b) => b.count - a.count);
    
    setCommonReasons(reasons);
  };

  // Function to add a waste entry
  const handleAddWasteEntry = async (entry: Omit<WasteLogEntry, 'id' | 'date' | 'createdBy' | 'createdByName' | 'cost'>) => {
    if (!restaurant?.id || !user) {
      setError('User or restaurant data missing');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Find the ingredient to get its cost per unit
      const ingredient = ingredients.find(i => i.id === entry.ingredientId);
      if (!ingredient) {
        throw new Error('Ingredient not found');
      }

      // Calculate the cost of wasted items
      const wasteCost = ingredient.costPerUnit * entry.quantity;
      
      // Add waste log entry
      const wasteRef = collection(db, 'restaurants', restaurant.id, 'wasteLog');
      const newEntry = {
        ...entry,
        ingredientName: ingredient.name,
        cost: wasteCost,
        date: serverTimestamp(),
        createdBy: user.uid,
        createdByName: user.email || 'Unknown User'
      };
      
      await addDoc(wasteRef, newEntry);
      
      // Close the panel after successful submission
      setIsPanelOpen(false);
      
      // Refetch waste entries to get the latest
      const updatedWasteRef = collection(db, 'restaurants', restaurant.id, 'wasteLog');
      const updatedWasteQuery = query(updatedWasteRef, orderBy('date', 'desc'));
      
      const updatedWasteSnapshot = await getDocs(updatedWasteQuery);
      const updatedWasteData: WasteLogEntry[] = updatedWasteSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<WasteLogEntry, 'id'>
      }));
      
      setWasteEntries(updatedWasteData);
      calculateWasteStats(updatedWasteData);

    } catch (err: any) {
      console.error('Error adding waste entry:', err);
      setError(`Failed to add waste entry: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="large" />
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-md p-4 mb-6">
          <p className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </p>
        </div>
      )}
      
      {/* Waste Dashboard */}
      {!isLoading && !error && (
        <>
          {/* Header with stats */}
          <WastePageHeader 
            onAddWasteClick={() => setIsPanelOpen(true)}
            totalWasteItems={wasteEntries.length}
            totalWasteCost={totalWasteCost}
          />
          
          {/* Statistics Charts */}
          <WasteStats 
            topWastedIngredients={topWastedIngredients}
            commonReasons={commonReasons}
          />
          
          {/* Waste Log Table */}
          <WasteLogTable wasteEntries={wasteEntries} />
        </>
      )}
      
      {/* Waste Log Form */}
      <WasteLogForm
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        ingredients={ingredients}
        onSubmit={handleAddWasteEntry}
        isLoading={isSubmitting}
      />
    </div>
  );
}
