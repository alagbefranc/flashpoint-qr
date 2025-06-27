'use client';

import { useState, useEffect } from 'react';
import { SlidePanel } from '@/components/ui/SlidePanel';
import { Ingredient } from '@/types/inventory';
import { StockTransaction } from '../page';

interface StockAdjustmentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  ingredients: Ingredient[];
  selectedIngredient: Ingredient | null;
  onSubmit: (transaction: Omit<StockTransaction, 'id' | 'date' | 'createdBy' | 'createdByName'>) => Promise<void>;
  isLoading: boolean;
}

const STOCK_REASONS_IN = [
  'New Purchase',
  'Return to Inventory',
  'Inventory Count Adjustment',
  'Transfer In',
  'Other'
];

const STOCK_REASONS_OUT = [
  'Used in Production',
  'Waste/Spoilage',
  'Transfer Out',
  'Sold Directly',
  'Inventory Count Adjustment',
  'Other'
];

export default function StockAdjustmentPanel({
  isOpen,
  onClose,
  ingredients,
  selectedIngredient,
  onSubmit,
  isLoading
}: StockAdjustmentPanelProps) {
  const [type, setType] = useState<'in' | 'out'>('in');
  const [ingredientId, setIngredientId] = useState<string>(selectedIngredient?.id || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>(STOCK_REASONS_IN[0]);
  const [otherReason, setOtherReason] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Update form when selectedIngredient changes
  useEffect(() => {
    if (selectedIngredient) {
      setIngredientId(selectedIngredient.id);
    }
  }, [selectedIngredient]);
  
  // Update reason options when type changes
  useEffect(() => {
    if (type === 'in') {
      setReason(STOCK_REASONS_IN[0]);
    } else {
      setReason(STOCK_REASONS_OUT[0]);
    }
    setOtherReason('');
  }, [type]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!ingredientId) {
      setValidationError('Please select an ingredient');
      return;
    }
    
    if (quantity <= 0) {
      setValidationError('Quantity must be greater than zero');
      return;
    }
    
    const finalReason = reason === 'Other' ? otherReason : reason;
    
    if (reason === 'Other' && !otherReason.trim()) {
      setValidationError('Please provide a reason');
      return;
    }
    
    setValidationError(null);
    
    // Submit the transaction
    onSubmit({
      ingredientId,
      ingredientName: '',  // Will be set in parent component
      type,
      quantity,
      reason: finalReason
    });
  };
  
  return (
    <SlidePanel
      title="Stock Adjustment"
      isOpen={isOpen}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Selection */}
        <div>
          <label className="block text-sm font-medium mb-1">Adjustment Type</label>
          <div className="flex rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => setType('in')}
              className={`flex-1 py-2 text-center ${
                type === 'in' ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Stock In
            </button>
            <button
              type="button"
              onClick={() => setType('out')}
              className={`flex-1 py-2 text-center ${
                type === 'out' ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Stock Out
            </button>
          </div>
        </div>
        
        {/* Ingredient Selection */}
        <div>
          <label htmlFor="ingredient" className="block text-sm font-medium mb-1">
            Ingredient
          </label>
          <select
            id="ingredient"
            value={ingredientId}
            onChange={(e) => setIngredientId(e.target.value)}
            className="w-full rounded-md border border-input p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={!!selectedIngredient}
          >
            <option value="">Select an ingredient</option>
            {ingredients.map(ingredient => (
              <option key={ingredient.id} value={ingredient.id}>
                {ingredient.name} ({ingredient.currentStock} {ingredient.unit} in stock)
              </option>
            ))}
          </select>
        </div>
        
        {/* Quantity */}
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium mb-1">
            Quantity {
              ingredientId && 
              ingredients.find(i => i.id === ingredientId)?.unit && 
              `(${ingredients.find(i => i.id === ingredientId)?.unit})`
            }
          </label>
          <input
            id="quantity"
            type="number"
            min="0.01"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
            className="w-full rounded-md border border-input p-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        {/* Reason */}
        <div>
          <label htmlFor="reason" className="block text-sm font-medium mb-1">
            Reason
          </label>
          <select
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-md border border-input p-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {(type === 'in' ? STOCK_REASONS_IN : STOCK_REASONS_OUT).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        
        {/* Other Reason */}
        {reason === 'Other' && (
          <div>
            <label htmlFor="otherReason" className="block text-sm font-medium mb-1">
              Specify Reason
            </label>
            <input
              id="otherReason"
              type="text"
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
              className="w-full rounded-md border border-input p-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Please specify the reason"
            />
          </div>
        )}
        
        {/* Validation Error */}
        {validationError && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
            {validationError}
          </div>
        )}
        
        {/* Current Stock Info */}
        {ingredientId && (
          <div className="p-3 bg-muted/50 rounded-md">
            <p className="text-sm">
              Current Stock: <strong>
                {ingredients.find(i => i.id === ingredientId)?.currentStock || 0} 
                {' '}
                {ingredients.find(i => i.id === ingredientId)?.unit}
              </strong>
            </p>
            <p className="text-sm mt-1">
              After Adjustment: <strong>
                {(ingredients.find(i => i.id === ingredientId)?.currentStock || 0) + 
                  (type === 'in' ? quantity : -quantity)} 
                {' '}
                {ingredients.find(i => i.id === ingredientId)?.unit}
              </strong>
            </p>
          </div>
        )}
        
        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline mr-2"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⌛</span>
                Processing...
              </>
            ) : (
              'Save Adjustment'
            )}
          </button>
        </div>
      </form>
    </SlidePanel>
  );
}
