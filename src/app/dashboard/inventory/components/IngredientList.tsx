'use client';

import { Ingredient } from '@/types/inventory';
import { useState } from 'react';

// Ingredient Card component
interface IngredientCardProps {
  ingredient: Ingredient;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const IngredientCard = ({ ingredient, onEdit, onDelete }: IngredientCardProps) => {
  // Calculate stock status
  const stockStatus = () => {
    if (ingredient.currentStock <= 0) return 'out';
    if (ingredient.currentStock <= ingredient.minStockLevel) return 'low';
    return 'ok';
  };

  const status = stockStatus();
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-foreground">{ingredient.name}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${
            status === 'ok' ? 'bg-green-100 text-green-800' :
            status === 'low' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {status === 'ok' ? 'In Stock' : status === 'low' ? 'Low Stock' : 'Out of Stock'}
          </span>
        </div>
        
        <div className="text-sm text-muted-foreground mb-3">
          {ingredient.category}
        </div>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
          <div>
            <span className="text-muted-foreground">Stock: </span>
            <span className="font-medium">{ingredient.currentStock} {ingredient.unit}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Min: </span>
            <span className="font-medium">{ingredient.minStockLevel} {ingredient.unit}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Cost: </span>
            <span className="font-medium">{formatCurrency(ingredient.costPerUnit)}/{ingredient.unit}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Value: </span>
            <span className="font-medium">{formatCurrency(ingredient.costPerUnit * ingredient.currentStock)}</span>
          </div>
        </div>
        
        {ingredient.expiryDate && (
          <div className="text-sm mb-3">
            <span className="text-muted-foreground">Expires: </span>
            <span className={`font-medium ${
              new Date(ingredient.expiryDate) < new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) ? 'text-error' : ''
            }`}>
              {new Date(ingredient.expiryDate).toLocaleDateString()}
            </span>
          </div>
        )}
        
        <div className="text-sm mb-4">
          <span className="text-muted-foreground">Supplier: </span>
          <span>{ingredient.supplier || 'Not specified'}</span>
        </div>
        
        <div className="flex justify-end space-x-2">
          <button 
            onClick={() => onEdit(ingredient.id)}
            className="bg-card border border-border hover:bg-accent text-foreground px-3 py-1 rounded-md text-sm flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit
          </button>
          <button 
            onClick={() => onDelete(ingredient.id)}
            className="bg-card border border-error hover:bg-error hover:text-error-foreground text-error px-3 py-1 rounded-md text-sm flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m5-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Ingredient List component
interface IngredientListProps {
  ingredients: Ingredient[];
  onEditIngredient: (id: string) => void;
  onDeleteIngredient: (id: string) => void;
}

export const IngredientList = ({ ingredients, onEditIngredient, onDeleteIngredient }: IngredientListProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  return (
    <div>
      {/* View mode toggle */}
      <div className="flex justify-end mb-4">
        <div className="bg-card border border-border rounded-md overflow-hidden flex">
          <button 
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 text-sm flex items-center ${viewMode === 'grid' ? 'bg-accent text-accent-foreground' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Grid
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 text-sm flex items-center ${viewMode === 'list' ? 'bg-accent text-accent-foreground' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            List
          </button>
        </div>
      </div>
      
      {/* No ingredients */}
      {ingredients.length === 0 && (
        <div className="bg-card border border-dashed border-border rounded-lg p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-muted-foreground mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="text-lg font-medium text-foreground mb-1">No ingredients found</h3>
          <p className="text-muted-foreground mb-4">
            Add ingredients to start managing your inventory
          </p>
        </div>
      )}
      
      {/* Grid view */}
      {viewMode === 'grid' && ingredients.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {ingredients.map(ingredient => (
            <IngredientCard
              key={ingredient.id}
              ingredient={ingredient}
              onEdit={onEditIngredient}
              onDelete={onDeleteIngredient}
            />
          ))}
        </div>
      )}
      
      {/* List view */}
      {viewMode === 'list' && ingredients.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Name</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Category</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Stock</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Cost/Unit</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Supplier</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Expires</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ingredients.map(ingredient => (
                <tr key={ingredient.id} className="bg-card hover:bg-accent/10">
                  <td className="py-3 px-4 font-medium">{ingredient.name}</td>
                  <td className="py-3 px-4">{ingredient.category}</td>
                  <td className="py-3 px-4">
                    <span className={`${
                      ingredient.currentStock <= 0 ? 'text-error' :
                      ingredient.currentStock <= ingredient.minStockLevel ? 'text-warning' :
                      'text-foreground'
                    }`}>
                      {ingredient.currentStock} {ingredient.unit}
                    </span>
                  </td>
                  <td className="py-3 px-4">${ingredient.costPerUnit.toFixed(2)}/{ingredient.unit}</td>
                  <td className="py-3 px-4">{ingredient.supplier || '-'}</td>
                  <td className="py-3 px-4">
                    {ingredient.expiryDate ? (
                      <span className={`${
                        new Date(ingredient.expiryDate) < new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) ? 'text-error' : ''
                      }`}>
                        {new Date(ingredient.expiryDate).toLocaleDateString()}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => onEditIngredient(ingredient.id)}
                        className="bg-card border border-border hover:bg-accent text-foreground px-2 py-1 rounded-md text-xs flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edit
                      </button>
                      <button 
                        onClick={() => onDeleteIngredient(ingredient.id)}
                        className="bg-card border border-error hover:bg-error hover:text-error-foreground text-error px-2 py-1 rounded-md text-xs flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m5-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
