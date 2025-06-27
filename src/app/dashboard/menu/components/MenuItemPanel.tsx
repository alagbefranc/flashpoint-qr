'use client';

import { useState, useEffect } from 'react';
import { MenuItem } from './MenuItemCard';

interface MenuItemPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: MenuItem) => void;
  item?: MenuItem;
  categories: string[];
}

export const MenuItemPanel: React.FC<MenuItemPanelProps> = ({
  isOpen,
  onClose,
  onSave,
  item,
  categories,
}) => {
  const isNewItem = !item;
  
  // Default empty item for new items
  const defaultItem: MenuItem = {
    id: '',
    name: '',
    description: '',
    price: 0,
    category: categories[0] || '',
    isAvailable: true,
    hasModifiers: false,
  };
  
  const [formData, setFormData] = useState<MenuItem>(item || defaultItem);
  const [aiDescription, setAiDescription] = useState('');
  const [isPriceAnalysisOpen, setIsPriceAnalysisOpen] = useState(false);
  const [aiSuggestedPrice, setAiSuggestedPrice] = useState<number | null>(null);
  
  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData(defaultItem);
    }
  }, [item, categories]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: checked,
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate a random ID for new items
    const itemToSave = isNewItem 
      ? { ...formData, id: `item-${Date.now()}` } 
      : formData;
    
    onSave(itemToSave);
  };
  
  const handleGenerateAiDescription = () => {
    // For demo purposes, simulate an AI response with a timeout
    setTimeout(() => {
      const suggestions = [
        `A delicious ${formData.name.toLowerCase()} prepared with fresh ingredients. Perfect for any occasion and guaranteed to satisfy.`,
        `Our ${formData.name.toLowerCase()} is made with locally-sourced ingredients and has been a customer favorite for years. Must try!`,
        `Try our signature ${formData.name.toLowerCase()} - a blend of flavors that will tantalize your taste buds and leave you wanting more.`,
      ];
      
      setAiDescription(suggestions[Math.floor(Math.random() * suggestions.length)]);
    }, 1000);
  };
  
  const handleGetPriceAnalysis = () => {
    setIsPriceAnalysisOpen(true);
    
    // For demo purposes, simulate an AI price analysis with a timeout
    setTimeout(() => {
      const competitorAverage = formData.price * (0.9 + Math.random() * 0.3);
      const suggestedPrice = Math.round(competitorAverage * 100) / 100;
      setAiSuggestedPrice(suggestedPrice);
    }, 1500);
  };
  
  return (
    <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-background shadow-xl transform transition-transform duration-300 z-50 overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            {isNewItem ? 'Add Menu Item' : 'Edit Menu Item'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="name">
              Item Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full bg-card border border-border rounded-md px-4 py-2 text-card-foreground"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="description">
              Description
              <button
                type="button"
                onClick={handleGenerateAiDescription}
                className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20"
              >
                AI Generate
              </button>
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="w-full bg-card border border-border rounded-md px-4 py-2 text-card-foreground"
              value={formData.description}
              onChange={handleChange}
            />
            
            {aiDescription && (
              <div className="mt-2 bg-primary/5 border border-primary/20 rounded-md p-3 text-sm">
                <p className="font-medium text-primary mb-1">AI Suggestion:</p>
                <p>{aiDescription}</p>
                <button
                  type="button"
                  className="text-xs text-primary mt-2 hover:underline"
                  onClick={() => setFormData(prev => ({ ...prev, description: aiDescription }))}
                >
                  Use this description
                </button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="price">
                Price ($)
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  id="price"
                  name="price"
                  min="0"
                  step="0.01"
                  required
                  className="w-full bg-card border border-border rounded-md px-4 py-2 text-card-foreground"
                  value={formData.price}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={handleGetPriceAnalysis}
                  className="ml-2 text-primary"
                  title="Get AI price analysis"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="category">
                Category
              </label>
              <select
                id="category"
                name="category"
                required
                className="w-full bg-card border border-border rounded-md px-4 py-2 text-card-foreground"
                value={formData.category}
                onChange={handleChange}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {isPriceAnalysisOpen && (
            <div className="bg-primary/5 border border-primary/20 rounded-md p-3 text-sm">
              <div className="flex justify-between items-center mb-2">
                <p className="font-medium text-primary">AI Price Analysis</p>
                <button
                  type="button"
                  onClick={() => setIsPriceAnalysisOpen(false)}
                  className="text-primary"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {aiSuggestedPrice ? (
                <>
                  <p>Based on similar items in your area, we recommend:</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-bold text-lg">${aiSuggestedPrice.toFixed(2)}</span>
                    <button
                      type="button"
                      className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded"
                      onClick={() => setFormData(prev => ({ ...prev, price: aiSuggestedPrice }))}
                    >
                      Use this price
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  <span className="ml-2">Analyzing prices...</span>
                </div>
              )}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="imageUrl">
              Image URL
            </label>
            <input
              type="text"
              id="imageUrl"
              name="imageUrl"
              className="w-full bg-card border border-border rounded-md px-4 py-2 text-card-foreground"
              value={formData.imageUrl || ''}
              onChange={handleChange}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isAvailable"
              name="isAvailable"
              className="rounded border-border text-primary focus:ring-0"
              checked={formData.isAvailable}
              onChange={handleCheckboxChange}
            />
            <label htmlFor="isAvailable" className="text-sm">
              Available for ordering
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="hasModifiers"
              name="hasModifiers"
              className="rounded border-border text-primary focus:ring-0"
              checked={formData.hasModifiers}
              onChange={handleCheckboxChange}
            />
            <label htmlFor="hasModifiers" className="text-sm">
              Has modifiers (sizes, add-ons, etc.)
            </label>
          </div>
          
          <div className="pt-4 flex space-x-2">
            <button
              type="submit"
              className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
            >
              Save Item
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-card border border-border text-card-foreground px-4 py-2 rounded-md hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
