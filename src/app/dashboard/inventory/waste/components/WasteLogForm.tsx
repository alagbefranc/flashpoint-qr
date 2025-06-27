'use client';

import { useState, useEffect } from 'react';
import { SlidePanel } from '@/components/ui/SlidePanel';
import { Ingredient } from '@/types/inventory';
import { WasteLogEntry } from '../page';

interface WasteLogFormProps {
  isOpen: boolean;
  onClose: () => void;
  ingredients: Ingredient[];
  onSubmit: (entry: Omit<WasteLogEntry, 'id' | 'date' | 'createdBy' | 'createdByName' | 'cost'>) => Promise<void>;
  isLoading: boolean;
}

// Common reasons for waste
const WASTE_REASONS = [
  'Expired',
  'Spoiled',
  'Damaged',
  'Overproduction',
  'Quality Issues',
  'Preparation Error',
  'Cross-contamination',
  'Storage Error',
  'Other'
];

export default function WasteLogForm({
  isOpen,
  onClose,
  ingredients,
  onSubmit,
  isLoading
}: WasteLogFormProps) {
  const [ingredientId, setIngredientId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>(WASTE_REASONS[0]);
  const [otherReason, setOtherReason] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Reset form when modal is opened
  useEffect(() => {
    if (isOpen) {
      setIngredientId('');
      setQuantity(1);
      setReason(WASTE_REASONS[0]);
      setOtherReason('');
      setValidationError(null);
    }
  }, [isOpen]);
  
  // Get selected ingredient details
  const selectedIngredient = ingredientId ? ingredients.find(i => i.id === ingredientId) : null;
  
  // Calculate waste cost preview
  const wasteCostPreview = selectedIngredient ? (selectedIngredient.costPerUnit * quantity).toFixed(2) : '0.00';
  
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
      setValidationError('Please provide a waste reason');
      return;
    }
    
    // Clear validation error
    setValidationError(null);
    
    // Submit the waste entry
    onSubmit({
      ingredientId,
      ingredientName: selectedIngredient?.name || '',
      quantity,
      reason: finalReason
    });
  };
  
  return (
    <SlidePanel
      title="Log Waste or Spoilage"
      isOpen={isOpen}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
              selectedIngredient && 
              `(${selectedIngredient.unit})`
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
            Reason for Waste
          </label>
          <select
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-md border border-input p-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {WASTE_REASONS.map((r) => (
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
        
        {/* Cost Preview */}
        {selectedIngredient && (
          <div className="p-3 bg-muted/50 rounded-md">
            <div className="flex justify-between">
              <span className="text-sm">Unit Cost:</span>
              <span className="text-sm">${selectedIngredient.costPerUnit.toFixed(2)} / {selectedIngredient.unit}</span>
            </div>
            <div className="flex justify-between font-bold mt-2">
              <span>Total Waste Cost:</span>
              <span>${wasteCostPreview}</span>
            </div>
          </div>
        )}
        
        {/* Validation Error */}
        {validationError && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
            {validationError}
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
              'Log Waste'
            )}
          </button>
        </div>
      </form>
    </SlidePanel>
  );
}
