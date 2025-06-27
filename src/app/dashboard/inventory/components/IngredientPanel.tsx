'use client';

import { useState, useEffect } from 'react';
import { SlidePanel } from '@/components/ui/SlidePanel';
import { Ingredient } from '@/types/inventory';

interface IngredientPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ingredient: Ingredient) => void;
  ingredient?: Ingredient;
}

export const IngredientPanel = ({ isOpen, onClose, onSave, ingredient }: IngredientPanelProps) => {
  const [formData, setFormData] = useState<Omit<Ingredient, 'id'>>({
    name: '',
    category: '',
    unit: 'kg',
    costPerUnit: 0,
    currentStock: 0,
    minStockLevel: 0,
    supplier: '',
    expiryDate: '',
    lastOrderDate: ''
  });

  // Reset the form when a different ingredient is selected
  useEffect(() => {
    if (ingredient) {
      const { id, ...rest } = ingredient;
      setFormData(rest);
    } else {
      setFormData({
        name: '',
        category: '',
        unit: 'kg',
        costPerUnit: 0,
        currentStock: 0,
        minStockLevel: 0,
        supplier: '',
        expiryDate: '',
        lastOrderDate: ''
      });
    }
  }, [ingredient, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric fields
    if (name === 'costPerUnit' || name === 'currentStock' || name === 'minStockLevel') {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      alert('Ingredient name is required');
      return;
    }
    
    if (!formData.category.trim()) {
      alert('Category is required');
      return;
    }
    
    // Save the ingredient (either update existing or create new)
    onSave({
      id: ingredient?.id || '',
      ...formData
    });
  };

  return (
    <SlidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={ingredient ? 'Edit Ingredient' : 'Add Ingredient'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ingredient name"
              className="w-full p-2 rounded-md border border-border bg-card text-card-foreground"
              required
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">
              Category
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="e.g., Produce, Meat, Dairy"
              className="w-full p-2 rounded-md border border-border bg-card text-card-foreground"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Categories help organize ingredients by type
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Unit of Measure
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-border bg-card text-card-foreground"
              >
                <option value="kg">Kilogram (kg)</option>
                <option value="g">Gram (g)</option>
                <option value="lb">Pound (lb)</option>
                <option value="oz">Ounce (oz)</option>
                <option value="l">Liter (l)</option>
                <option value="ml">Milliliter (ml)</option>
                <option value="gal">Gallon (gal)</option>
                <option value="pcs">Piece (pcs)</option>
                <option value="each">Each</option>
                <option value="dozen">Dozen</option>
                <option value="box">Box</option>
                <option value="bag">Bag</option>
                <option value="case">Case</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Cost Per Unit
              </label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <input
                  type="number"
                  name="costPerUnit"
                  value={formData.costPerUnit}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full pl-7 p-2 rounded-md border border-border bg-card text-card-foreground"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Current Stock
              </label>
              <input
                type="number"
                name="currentStock"
                value={formData.currentStock}
                onChange={handleChange}
                min="0"
                step="0.1"
                placeholder="0"
                className="w-full p-2 rounded-md border border-border bg-card text-card-foreground"
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Minimum Stock Level
              </label>
              <input
                type="number"
                name="minStockLevel"
                value={formData.minStockLevel}
                onChange={handleChange}
                min="0"
                step="0.1"
                placeholder="0"
                className="w-full p-2 rounded-md border border-border bg-card text-card-foreground"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Alert when stock falls below this level
              </p>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">
              Supplier
            </label>
            <input
              type="text"
              name="supplier"
              value={formData.supplier || ''}
              onChange={handleChange}
              placeholder="Supplier name"
              className="w-full p-2 rounded-md border border-border bg-card text-card-foreground"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate || ''}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-border bg-card text-card-foreground"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Last Order Date
              </label>
              <input
                type="date"
                name="lastOrderDate"
                value={formData.lastOrderDate || ''}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-border bg-card text-card-foreground"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-card border border-border text-card-foreground rounded-md hover:bg-accent"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            {ingredient ? 'Update' : 'Add'} Ingredient
          </button>
        </div>
      </form>
    </SlidePanel>
  );
};
