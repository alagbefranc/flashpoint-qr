'use client';

import { useState } from 'react';

interface Ingredient {
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

interface InventoryStatusTableProps {
  ingredients: Ingredient[];
  onAdjustStock: (ingredient: Ingredient) => void;
}

export default function InventoryStatusTable({ ingredients, onAdjustStock }: InventoryStatusTableProps) {
  const [sortField, setSortField] = useState<keyof Ingredient>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: keyof Ingredient) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedIngredients = [...ingredients].sort((a, b) => {
    if (a[sortField] < b[sortField]) return sortOrder === 'asc' ? -1 : 1;
    if (a[sortField] > b[sortField]) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const getStockStatus = (ingredient: Ingredient) => {
    if (ingredient.currentStock <= ingredient.minStockLevel * 0.5) {
      return {
        label: 'Critical Low',
        color: 'bg-destructive/20 text-destructive'
      };
    } else if (ingredient.currentStock <= ingredient.minStockLevel) {
      return {
        label: 'Low Stock',
        color: 'bg-warning/20 text-warning'
      };
    } else {
      return {
        label: 'In Stock',
        color: 'bg-success/20 text-success'
      };
    }
  };

  // Calculate overall inventory status
  const criticalCount = ingredients.filter(i => i.currentStock <= i.minStockLevel * 0.5).length;
  const lowCount = ingredients.filter(i => i.currentStock > i.minStockLevel * 0.5 && i.currentStock <= i.minStockLevel).length;
  const healthyCount = ingredients.filter(i => i.currentStock > i.minStockLevel).length;

  return (
    <div className="bg-card rounded-lg border shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Inventory Status</h2>
        <div className="flex space-x-2">
          <div className="flex items-center text-xs">
            <span className="inline-block w-3 h-3 rounded-full bg-success/20 mr-1"></span>
            <span>{healthyCount} In Stock</span>
          </div>
          <div className="flex items-center text-xs">
            <span className="inline-block w-3 h-3 rounded-full bg-warning/20 mr-1"></span>
            <span>{lowCount} Low</span>
          </div>
          <div className="flex items-center text-xs">
            <span className="inline-block w-3 h-3 rounded-full bg-destructive/20 mr-1"></span>
            <span>{criticalCount} Critical</span>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground text-sm">
              <th 
                className="text-left p-3 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => handleSort('name')}
              >
                Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="text-left p-3 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => handleSort('category')}
              >
                Category {sortField === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="text-left p-3 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => handleSort('currentStock')}
              >
                Current Stock {sortField === 'currentStock' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left p-3">Unit</th>
              <th 
                className="text-left p-3 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => handleSort('minStockLevel')}
              >
                Min Stock {sortField === 'minStockLevel' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedIngredients.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  No ingredients found. Add ingredients in the Inventory section.
                </td>
              </tr>
            ) : (
              sortedIngredients.map(ingredient => {
                const status = getStockStatus(ingredient);
                return (
                  <tr 
                    key={ingredient.id} 
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-3 font-medium">{ingredient.name}</td>
                    <td className="p-3">{ingredient.category}</td>
                    <td className="p-3">{ingredient.currentStock} {ingredient.unit}</td>
                    <td className="p-3">{ingredient.unit}</td>
                    <td className="p-3">{ingredient.minStockLevel} {ingredient.unit}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="p-3">
                      <button 
                        onClick={() => onAdjustStock(ingredient)}
                        className="btn btn-sm btn-secondary flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
