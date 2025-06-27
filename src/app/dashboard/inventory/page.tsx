'use client';

import { useState, useEffect } from 'react';
import { SlidePanel } from '@/components/ui/SlidePanel';
import { Modal } from '@/components/ui/Modal';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '@/lib/context/AuthContext';

// Component imports
import { IngredientList } from '@/app/dashboard/inventory/components/IngredientList';
import { IngredientPanel } from '@/app/dashboard/inventory/components/IngredientPanel';

// Import types
import { Ingredient } from '@/types/inventory';

export default function IngredientsPage() {
  const { user, restaurant, loading: authLoading } = useAuth();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | undefined>();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Don't start as loading
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ingredientToDelete, setIngredientToDelete] = useState<string | null>(null);
  
  // Get unique categories for filtering
  const categories = Array.from(new Set(ingredients.map(ing => ing.category)));
  
  // Debug logging for auth state
  useEffect(() => {
    console.log('=== AUTH DEBUG INFO ===');
    console.log('Auth loading state:', authLoading);
    console.log('User authenticated:', !!user);
    if (user) {
      console.log('User ID:', user.uid);
      console.log('User email:', user.email);
      console.log('User restaurantId from data:', user.restaurantId);
      console.log('User roles:', JSON.stringify(user.roles));
    }
    console.log('Restaurant object:', restaurant ? 'exists' : 'null');
    if (restaurant) {
      console.log('Restaurant ID:', restaurant.id);
      console.log('Restaurant name:', restaurant.name);
    }
    console.log('=== END AUTH DEBUG INFO ===');
  }, [user, restaurant, authLoading]);

  // Fetch ingredients from Firebase when component mounts or restaurant changes
  useEffect(() => {
    // Don't try to fetch if auth is still loading or if restaurant ID is not available
    if (authLoading) {
      console.log('Auth still loading, skipping ingredient fetch');
      return;
    }
    
    const fetchIngredients = async () => {
      // Check if we have a restaurant ID after auth has finished loading
      if (!restaurant?.id) {
        console.log('No restaurant ID available, cannot fetch ingredients');
        setError('No restaurant selected. Please select a restaurant first.');
        setIsLoading(false);
        return;
      }
      
      console.log('QUERY DEBUG: Fetching ingredients for restaurant:', restaurant.id);
      setIsLoading(true);
      setError(null);
      
      try {
        // Log the exact path we're querying
        const collectionPath = `restaurants/${restaurant.id}/ingredients`;
        console.log('QUERY DEBUG: Collection path:', collectionPath);
        
        const ingredientsRef = collection(db, 'restaurants', restaurant.id, 'ingredients');
        console.log('QUERY DEBUG: Collection reference created');
        
        const q = query(ingredientsRef, orderBy('name'));
        console.log('QUERY DEBUG: Query with orderBy created');
        
        console.log('QUERY DEBUG: Executing Firestore query...');
        const snapshot = await getDocs(q);
        console.log('QUERY DEBUG: Query complete, documents found:', snapshot.docs.length);
        
        const ingredientsData: Ingredient[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<Ingredient, 'id'>
        }));
        
        console.log('QUERY DEBUG: Processed ingredient data');
        setIngredients(ingredientsData);
      } catch (err: any) {
        console.error('QUERY ERROR:', err);
        console.error('Error code:', err.code);
        console.error('Error message:', err.message);
        if (err.stack) console.error('Stack trace:', err.stack);
        
        // More helpful error message
        let errorMessage = `Failed to load ingredients: ${err.message}`;
        if (err.code === 'permission-denied') {
          errorMessage += " - You don't have permission to access this data. This could be due to:";
          errorMessage += "\n1. You're not properly authenticated";
          errorMessage += "\n2. Your account doesn't have the right permissions";
          errorMessage += "\n3. The restaurant ID in your profile might be incorrect";
        }
        
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchIngredients();
  }, [restaurant?.id, authLoading]);

  const handleAddIngredient = () => {
    setEditingIngredient(undefined);
    setIsPanelOpen(true);
  };

  const handleEditIngredient = (id: string) => {
    const ingredient = ingredients.find(ing => ing.id === id);
    if (ingredient) {
      setEditingIngredient(ingredient);
      setIsPanelOpen(true);
    }
  };

  const handleDeleteIngredient = (id: string) => {
    setIngredientToDelete(id);
    setShowDeleteModal(true);
  };
  
  const confirmDeleteIngredient = async () => {
    if (!ingredientToDelete || !restaurant?.id) return;
    
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'restaurants', restaurant.id, 'ingredients', ingredientToDelete));
      
      // Update local state
      setIngredients(prev => prev.filter(ing => ing.id !== ingredientToDelete));
      
      setShowDeleteModal(false);
      setIngredientToDelete(null);
    } catch (err) {
      console.error('Error deleting ingredient:', err);
      alert('Failed to delete ingredient. Please try again.');
    }
  };

  const handleSaveIngredient = async (ingredient: Ingredient) => {
    if (!restaurant?.id) return;
    
    try {
      if (ingredient.id) {
        // Update existing ingredient
        const { id, ...ingredientData } = ingredient;
        await updateDoc(doc(db, 'restaurants', restaurant.id, 'ingredients', id), ingredientData);
        
        // Update local state
        setIngredients(prev =>
          prev.map(existing => {
            if (existing.id === ingredient.id) {
              return ingredient;
            }
            return existing;
          })
        );
      } else {
        // Add new ingredient
        const ingredientRef = doc(collection(db, 'restaurants', restaurant.id, 'ingredients'));
        const newIngredient = { ...ingredient, id: ingredientRef.id };
        
        await setDoc(ingredientRef, {
          name: newIngredient.name,
          category: newIngredient.category,
          unit: newIngredient.unit,
          costPerUnit: newIngredient.costPerUnit,
          currentStock: newIngredient.currentStock,
          minStockLevel: newIngredient.minStockLevel,
          supplier: newIngredient.supplier || '',
          expiryDate: newIngredient.expiryDate || '',
          lastOrderDate: newIngredient.lastOrderDate || '',
          createdAt: new Date().toISOString(),
        });
        
        // Update local state
        setIngredients(prev => [...prev, newIngredient]);
      }
      
      setIsPanelOpen(false);
    } catch (err) {
      console.error('Error saving ingredient:', err);
      alert('Failed to save ingredient. Please try again.');
    }
  };

  // Filter ingredients based on search and category filter
  const filteredIngredients = ingredients.filter(ing => {
    const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         ing.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ing.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !filterCategory || ing.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Ingredients</h1>
        <p className="text-muted-foreground">
          Manage your ingredients inventory, costs, and stock levels
        </p>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-error/10 border border-error text-error rounded-md p-4 mb-6">
          <p className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        </div>
      )}
      
      {/* Auth loading state */}
      {authLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading account information...</p>
        </div>
      ) : !restaurant?.id ? (
        <div className="bg-warning/10 border border-warning text-warning rounded-md p-4 mb-6">
          <p className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            No restaurant selected. Please select a restaurant first.
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading ingredients...</p>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search ingredients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-md border border-border bg-card text-card-foreground"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <select
                className="py-2 px-3 rounded-md border border-border bg-card text-card-foreground"
                value={filterCategory || ''}
                onChange={(e) => setFilterCategory(e.target.value || null)}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleAddIngredient}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 flex items-center gap-2 w-full sm:w-auto justify-center"
                disabled={!restaurant?.id}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Ingredient
              </button>
            </div>
          </div>
          
          {/* Main content */}
          <IngredientList
            ingredients={filteredIngredients}
            onEditIngredient={handleEditIngredient}
            onDeleteIngredient={handleDeleteIngredient}
          />
        </>
      )}
      
      {/* Slide panel for adding/editing */}
      <IngredientPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onSave={handleSaveIngredient}
        ingredient={editingIngredient}
      />
      
      {/* Delete confirmation modal */}
      <Modal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Ingredient"
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to delete this ingredient? This action cannot be undone.
          </p>
          
          <div className="pt-4 flex justify-end space-x-3">
            <button 
              onClick={() => setShowDeleteModal(false)}
              className="bg-card border border-border text-card-foreground px-4 py-2 rounded-md hover:bg-accent"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDeleteIngredient}
              className="bg-error text-error-foreground px-4 py-2 rounded-md hover:bg-error/90"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
