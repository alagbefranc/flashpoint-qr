'use client';

import { useState } from 'react';
import { RecipeEditor, Recipe, Ingredient } from './components/RecipeEditor';

// Sample data - in a real app, this would come from an API
const sampleIngredients: Ingredient[] = [
  { id: 'ing1', name: 'Flour', costPerUnit: 0.05, unit: 'oz', inStock: 240 },
  { id: 'ing2', name: 'Sugar', costPerUnit: 0.08, unit: 'oz', inStock: 180 },
  { id: 'ing3', name: 'Butter', costPerUnit: 0.20, unit: 'oz', inStock: 96 },
  { id: 'ing4', name: 'Eggs', costPerUnit: 0.25, unit: 'each', inStock: 48 },
  { id: 'ing5', name: 'Milk', costPerUnit: 0.06, unit: 'oz', inStock: 128 },
  { id: 'ing6', name: 'Chicken Breast', costPerUnit: 0.50, unit: 'oz', inStock: 160 },
  { id: 'ing7', name: 'Ground Beef', costPerUnit: 0.45, unit: 'oz', inStock: 120 },
  { id: 'ing8', name: 'Lettuce', costPerUnit: 0.10, unit: 'oz', inStock: 80 },
  { id: 'ing9', name: 'Tomato', costPerUnit: 0.15, unit: 'oz', inStock: 96 },
  { id: 'ing10', name: 'Cheese', costPerUnit: 0.30, unit: 'oz', inStock: 64 },
  { id: 'ing11', name: 'Rice', costPerUnit: 0.08, unit: 'oz', inStock: 320 },
  { id: 'ing12', name: 'Pasta', costPerUnit: 0.10, unit: 'oz', inStock: 200 },
  { id: 'ing13', name: 'Onions', costPerUnit: 0.08, unit: 'oz', inStock: 160 },
  { id: 'ing14', name: 'Bell Peppers', costPerUnit: 0.12, unit: 'oz', inStock: 120 },
  { id: 'ing15', name: 'Garlic', costPerUnit: 0.15, unit: 'oz', inStock: 48 },
];

const sampleMenuItems = [
  { id: 'item1', name: 'Margherita Pizza', category: 'Pizza', price: 12.99 },
  { id: 'item2', name: 'Caesar Salad', category: 'Salads', price: 8.99 },
  { id: 'item3', name: 'Spaghetti Bolognese', category: 'Pasta', price: 14.99 },
  { id: 'item4', name: 'Chicken Alfredo', category: 'Pasta', price: 15.99 },
  { id: 'item5', name: 'Cheeseburger', category: 'Burgers', price: 10.99 },
  { id: 'item6', name: 'Chocolate Cake', category: 'Desserts', price: 6.99 },
  { id: 'item7', name: 'Tiramisu', category: 'Desserts', price: 7.99 },
  { id: 'item8', name: 'Garlic Bread', category: 'Appetizers', price: 4.99 },
  { id: 'item9', name: 'Fish and Chips', category: 'Main Course', price: 16.99 },
  { id: 'item10', name: 'Chicken Wings', category: 'Appetizers', price: 9.99 },
];

// Sample recipes with predefined ingredients
const sampleRecipes: Recipe[] = [
  {
    itemId: 'item1',
    itemName: 'Margherita Pizza',
    ingredients: [
      { ingredientId: 'ing1', quantity: 8 },
      { ingredientId: 'ing10', quantity: 6 },
      { ingredientId: 'ing9', quantity: 4 },
    ],
    totalCost: 2.50,
    suggestedPrice: 7.50
  },
  {
    itemId: 'item2',
    itemName: 'Caesar Salad',
    ingredients: [
      { ingredientId: 'ing8', quantity: 6 },
      { ingredientId: 'ing10', quantity: 2 },
    ],
    totalCost: 1.20,
    suggestedPrice: 3.60
  }
  // Other items have no recipes defined yet
];

export default function RecipeBuilderPage() {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>(sampleRecipes);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  
  // Get unique categories from menu items
  const categories = Array.from(new Set(sampleMenuItems.map(item => item.category)));
  
  const handleSaveRecipe = (updatedRecipe: Recipe) => {
    setRecipes(prev => {
      const existingIndex = prev.findIndex(r => r.itemId === updatedRecipe.itemId);
      
      if (existingIndex >= 0) {
        // Update existing recipe
        return prev.map((recipe, index) => 
          index === existingIndex ? updatedRecipe : recipe
        );
      } else {
        // Add new recipe
        return [...prev, updatedRecipe];
      }
    });
    
    // Show success message or notification here
    alert(`Recipe for ${updatedRecipe.itemName} has been saved.`);
  };
  
  const getExistingRecipe = (itemId: string): Recipe | undefined => {
    return recipes.find(recipe => recipe.itemId === itemId);
  };
  
  const createNewRecipe = (itemId: string): Recipe => {
    const menuItem = sampleMenuItems.find(item => item.id === itemId);
    if (!menuItem) throw new Error(`Menu item with ID ${itemId} not found.`);
    
    return {
      itemId: menuItem.id,
      itemName: menuItem.name,
      ingredients: [],
      totalCost: 0,
      suggestedPrice: 0
    };
  };
  
  // Filter menu items based on search term and category
  const filteredMenuItems = sampleMenuItems.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === null || item.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Recipe Builder</h1>
        <p className="text-muted-foreground">
          Create recipes by linking menu items to inventory ingredients
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar - Menu Item Selection */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg shadow-sm p-4 mb-4">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search menu items..."
                className="w-full px-4 py-2 bg-muted border border-border rounded-md"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Filter by Category
              </label>
              <select
                className="w-full px-4 py-2 bg-muted border border-border rounded-md"
                value={categoryFilter || ''}
                onChange={e => setCategoryFilter(e.target.value || null)}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto">
              <h3 className="font-medium mb-2">Menu Items</h3>
              
              {filteredMenuItems.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No menu items found matching your criteria.
                </div>
              ) : (
                filteredMenuItems.map(item => {
                  const hasRecipe = recipes.some(r => r.itemId === item.id);
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      className={`w-full text-left px-3 py-2 rounded-md ${
                        selectedItemId === item.id
                          ? 'bg-primary/10 border-l-2 border-primary'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-muted-foreground">{item.category}</div>
                        </div>
                        {hasRecipe && (
                          <span className="bg-success/10 text-success text-xs px-2 py-0.5 rounded">
                            Recipe
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
        
        {/* Right side - Recipe Editor */}
        <div className="lg:col-span-2">
          {selectedItemId ? (
            <RecipeEditor
              recipe={getExistingRecipe(selectedItemId) || createNewRecipe(selectedItemId)}
              availableIngredients={sampleIngredients}
              onSave={handleSaveRecipe}
            />
          ) : (
            <div className="bg-card border border-border rounded-lg shadow-sm p-8 text-center">
              <div className="mx-auto h-16 w-16 text-muted-foreground mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-xl font-medium mb-2">Select a Menu Item</h2>
              <p className="text-muted-foreground">
                Choose a menu item from the list to create or edit its recipe.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
