'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface MenuCategory {
  id: string;
  name: string;
  description: string;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
}

export default function MenuPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [currentCategoryName, setCurrentCategoryName] = useState('');
  const [currentCategoryDescription, setCurrentCategoryDescription] = useState('');
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [error, setError] = useState('');
  const [restaurantId, setRestaurantId] = useState('');

  useEffect(() => {
    const fetchMenuInfo = async () => {
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
              
              // Set menu categories if they exist
              if (data.menuCategories && Array.isArray(data.menuCategories)) {
                setCategories(data.menuCategories);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching menu info:', error);
        setError('Failed to load menu information');
      } finally {
        setIsFetchingData(false);
      }
    };

    fetchMenuInfo();
  }, [user]);

  const addCategory = () => {
    if (!currentCategoryName.trim()) return;
    
    const newCategory: MenuCategory = {
      id: `category-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: currentCategoryName.trim(),
      description: currentCategoryDescription.trim(),
      items: []
    };
    
    setCategories([...categories, newCategory]);
    setCurrentCategoryName('');
    setCurrentCategoryDescription('');
  };

  const updateCategory = () => {
    if (editingCategoryIndex === null || !currentCategoryName.trim()) return;
    
    const updatedCategories = [...categories];
    updatedCategories[editingCategoryIndex] = {
      ...updatedCategories[editingCategoryIndex],
      name: currentCategoryName.trim(),
      description: currentCategoryDescription.trim()
    };
    
    setCategories(updatedCategories);
    setCurrentCategoryName('');
    setCurrentCategoryDescription('');
    setEditingCategoryIndex(null);
  };

  const editCategory = (index: number) => {
    const category = categories[index];
    setCurrentCategoryName(category.name);
    setCurrentCategoryDescription(category.description);
    setEditingCategoryIndex(index);
  };

  const deleteCategory = (index: number) => {
    const updatedCategories = [...categories];
    updatedCategories.splice(index, 1);
    setCategories(updatedCategories);
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === categories.length - 1)
    ) {
      return;
    }
    
    const updatedCategories = [...categories];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    [updatedCategories[index], updatedCategories[newIndex]] = 
      [updatedCategories[newIndex], updatedCategories[index]];
    
    setCategories(updatedCategories);
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
      // Update restaurant menu categories in Firestore
      const restaurantRef = doc(db, 'restaurants', restaurantId);
      
      await updateDoc(restaurantRef, {
        menuCategories: categories,
        updatedAt: new Date()
      });
      
      // Navigate to next step
      router.push('/onboarding/invite-staff');
    } catch (error) {
      console.error('Error updating menu:', error);
      setError('Failed to save menu information');
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
      <h2 className="text-2xl font-bold mb-6">Create Your Menu</h2>
      
      <p className="text-gray-700 mb-8">
        Start by creating menu categories (e.g., Appetizers, Main Course, Desserts).
        You can add specific menu items to each category later in the dashboard.
      </p>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">
          {editingCategoryIndex !== null ? 'Edit Category' : 'Add Menu Category'}
        </h3>
        
        <div className="space-y-4">
          <Input
            label="Category Name"
            value={currentCategoryName}
            onChange={(e) => setCurrentCategoryName(e.target.value)}
            placeholder="e.g. Appetizers, Main Course, Desserts"
            required
          />
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              id="description"
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 min-h-[80px]"
              value={currentCategoryDescription}
              onChange={(e) => setCurrentCategoryDescription(e.target.value)}
              placeholder="Brief description of this menu category"
            />
          </div>
          
          <div>
            {editingCategoryIndex !== null ? (
              <div className="flex space-x-2">
                <Button type="button" onClick={updateCategory}>
                  Update Category
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setCurrentCategoryName('');
                    setCurrentCategoryDescription('');
                    setEditingCategoryIndex(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button type="button" onClick={addCategory} disabled={!currentCategoryName.trim()}>
                Add Category
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">Your Menu Categories</h3>
        
        {categories.length === 0 ? (
          <p className="text-gray-600 italic">No categories added yet.</p>
        ) : (
          <ul className="space-y-3">
            {categories.map((category, index) => (
              <li 
                key={category.id} 
                className="border rounded-md p-4 bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{category.name}</h4>
                    {category.description && (
                      <p className="text-sm text-gray-700 mt-1">
                        {category.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      className="text-gray-600 hover:text-primary"
                      onClick={() => moveCategory(index, 'up')}
                      disabled={index === 0}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="text-gray-600 hover:text-primary"
                      onClick={() => moveCategory(index, 'down')}
                      disabled={index === categories.length - 1}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="text-gray-600 hover:text-blue-500"
                      onClick={() => editCategory(index)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="text-gray-600 hover:text-red-500"
                      onClick={() => deleteCategory(index)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <p className="text-sm text-gray-600 mb-6">
        You can add specific menu items with prices, descriptions, and images later in the dashboard.
      </p>
      
      {error && (
        <div className="text-red-500 text-sm mb-4">{error}</div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="flex justify-between pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/onboarding/branding')}
          >
            Previous
          </Button>
          <Button 
            type="submit" 
            isLoading={loading}
            disabled={categories.length === 0}
          >
            Save & Continue
          </Button>
        </div>
      </form>
    </div>
  );
}
