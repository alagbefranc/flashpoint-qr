'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { collection, doc, getDocs, query, orderBy, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import StockAdjustmentPanel from '@/components/inventory/StockAdjustmentPanel';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import StockPageHeader from '@/components/inventory/StockPageHeader';
import InventoryStatusTable from '@/components/inventory/InventoryStatusTable';
import RecentTransactionsTable from '@/components/inventory/RecentTransactionsTable';

export interface StockTransaction {
  id?: string;
  ingredientId: string;
  ingredientName: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  date: any; // Firestore timestamp
  createdBy: string; // User ID
  createdByName: string; // User display name
}

// Import the Ingredient type used by InventoryStatusTable
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

export default function StockPage() {
  const { user, restaurant, loading: authLoading } = useAuth();
  
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<StockTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransactionLoading, setIsTransactionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

  // Fetch ingredients from Firebase when component mounts or restaurant changes
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
        const q = query(ingredientsRef, orderBy('name'));
        
        const snapshot = await getDocs(q);
        const ingredientsData: Ingredient[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<Ingredient, 'id'>
        }));
        
        setIngredients(ingredientsData);
        
        // Fetch recent transactions
        const transactionsRef = collection(db, 'restaurants', restaurant.id, 'stockTransactions');
        const transactionsQuery = query(transactionsRef, orderBy('date', 'desc'));
        
        const transactionsSnapshot = await getDocs(transactionsQuery);
        const transactionsData: StockTransaction[] = transactionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<StockTransaction, 'id'>
        }));
        
        setRecentTransactions(transactionsData);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(`Failed to load data: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [restaurant?.id, authLoading]);

  // Function to handle stock adjustment
  const handleStockAdjustment = async (transaction: Omit<StockTransaction, 'id' | 'date' | 'createdBy' | 'createdByName'>) => {
    if (!restaurant?.id || !user) {
      setError('User or restaurant data missing');
      return;
    }

    setIsTransactionLoading(true);
    setError(null);

    try {
      // Find the ingredient
      const ingredient = ingredients.find(i => i.id === transaction.ingredientId);
      if (!ingredient) {
        throw new Error('Ingredient not found');
      }

      // Calculate new stock level
      const changeAmount = transaction.type === 'in' ? transaction.quantity : -transaction.quantity;
      const newStockLevel = ingredient.currentStock + changeAmount;
      
      if (newStockLevel < 0) {
        throw new Error('Cannot reduce stock below zero');
      }

      // Use a transaction to update both the ingredient and add to transaction log
      await runTransaction(db, async (firestoreTransaction) => {
        // 1. Update ingredient stock level
        const ingredientRef = doc(db, 'restaurants', restaurant.id, 'ingredients', ingredient.id);
        firestoreTransaction.update(ingredientRef, { 
          currentStock: newStockLevel,
          updatedAt: serverTimestamp()
        });

        // 2. Add transaction record
        const transactionsRef = collection(db, 'restaurants', restaurant.id, 'stockTransactions');
        const stockTransactionData = {
          ingredientId: transaction.ingredientId,
          type: transaction.type,
          quantity: transaction.quantity,
          reason: transaction.reason,
          ingredientName: ingredient.name,
          date: serverTimestamp(),
          createdBy: user.uid,
          createdByName: user.email || 'Unknown User'
        };
        
        const newTransactionRef = doc(transactionsRef);
        firestoreTransaction.set(newTransactionRef, stockTransactionData);
      });

      // Update local state
      setIngredients(prevIngredients => 
        prevIngredients.map(i => 
          i.id === ingredient.id 
            ? { ...i, currentStock: newStockLevel } 
            : i
        )
      );

      // Close the panel after successful adjustment
      setIsPanelOpen(false);
      setSelectedIngredient(null);

      // Refetch the transactions to get the latest
      if (restaurant?.id) {
        const transactionsRef = collection(db, 'restaurants', restaurant.id, 'stockTransactions');
        const transactionsQuery = query(transactionsRef, orderBy('date', 'desc'));
        
        const transactionsSnapshot = await getDocs(transactionsQuery);
        const transactionsData: StockTransaction[] = transactionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<StockTransaction, 'id'>
        }));
        
        setRecentTransactions(transactionsData);
      }

    } catch (err: any) {
      console.error('Error adjusting stock:', err);
      setError(`Failed to adjust stock: ${err.message}`);
    } finally {
      setIsTransactionLoading(false);
    }
  };

  // Calculate stats for header
  const totalItems = ingredients.length;
  const lowStockItems = ingredients.filter(i => i.currentStock <= i.minStockLevel).length;
  
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
      
      {/* Page content when data is loaded */}
      {!isLoading && !error && (
        <>
          {/* Header with stats */}
          <StockPageHeader 
            onAddStockClick={() => {
              setSelectedIngredient(null); // Reset selected ingredient
              setIsPanelOpen(true);
            }}
            totalItems={totalItems}
            lowStockCount={lowStockItems}
          />
          
          {/* Main content */}
          <div className="space-y-6">
            {/* Inventory Status Table */}
            <InventoryStatusTable 
              ingredients={ingredients}
              onAdjustStock={(ingredient) => {
                setSelectedIngredient(ingredient);
                setIsPanelOpen(true);
              }}
            />
            
            {/* Recent Transactions Table */}
            <RecentTransactionsTable 
              transactions={recentTransactions}
            />
          </div>
        </>
      )}
      
      {/* Stock adjustment panel */}
      {/* Map form data to the expected transaction format */}
      <StockAdjustmentPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        ingredients={ingredients}
        selectedIngredient={selectedIngredient}
        onSubmit={(formData) => {
          // Map adjustmentType to the expected type format
          const mappedData = {
            ingredientId: formData.ingredientId,
            type: formData.adjustmentType === 'stock-in' ? 'in' : 'out',
            quantity: formData.quantity,
            reason: formData.reason
          };
          return handleStockAdjustment(mappedData);
        }}
        isLoading={isTransactionLoading}
      />
    </div>
  );
}
