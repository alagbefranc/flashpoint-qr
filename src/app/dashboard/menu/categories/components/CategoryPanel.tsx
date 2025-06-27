'use client';

import { useState, useEffect } from 'react';
import { Category } from './CategoryList';

interface CategoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Category) => void;
  category?: Category;
  aiEnabled?: boolean;
}

export const CategoryPanel: React.FC<CategoryPanelProps> = ({
  isOpen,
  onClose,
  onSave,
  category,
  aiEnabled = true,
}) => {
  const isNewCategory = !category;
  
  const defaultCategory: Category = {
    id: '',
    name: '',
    description: '',
    displayOrder: 0,
    itemCount: 0,
  };
  
  const [formData, setFormData] = useState<Category>(category || defaultCategory);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  useEffect(() => {
    if (category) {
      setFormData(category);
    } else {
      setFormData(defaultCategory);
    }
  }, [category]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate a random ID for new categories
    const categoryToSave = isNewCategory 
      ? { ...formData, id: `category-${Date.now()}` } 
      : formData;
    
    onSave(categoryToSave);
  };
  
  const handleGenerateAiDescription = () => {
    if (!formData.name) return;
    
    setIsGenerating(true);
    
    // For demo purposes, simulate an AI response with a timeout
    setTimeout(() => {
      const suggestions = [
        `A collection of ${formData.name.toLowerCase()} options designed to satisfy your taste buds with unique flavors and textures.`,
        `Explore our carefully selected ${formData.name.toLowerCase()} offerings prepared with premium ingredients for a memorable dining experience.`,
        `Our ${formData.name.toLowerCase()} selection features both classic favorites and innovative new creations to cater to all preferences.`,
      ];
      
      setAiSuggestion(suggestions[Math.floor(Math.random() * suggestions.length)]);
      setIsGenerating(false);
    }, 1000);
  };
  
  return (
    <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-background shadow-xl transform transition-transform duration-300 z-50 overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            {isNewCategory ? 'Add Category' : 'Edit Category'}
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
              Category Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full bg-card border border-border rounded-md px-4 py-2 text-card-foreground"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Appetizers, Desserts, Beverages"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="description">
              Description
              {aiEnabled && (
                <button
                  type="button"
                  onClick={handleGenerateAiDescription}
                  disabled={!formData.name || isGenerating}
                  className={`ml-2 text-xs px-2 py-1 rounded ${
                    !formData.name || isGenerating
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                  }`}
                >
                  {isGenerating ? 'Generating...' : 'AI Generate'}
                </button>
              )}
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="w-full bg-card border border-border rounded-md px-4 py-2 text-card-foreground"
              value={formData.description}
              onChange={handleChange}
              placeholder="A brief description of this menu category"
            />
            
            {aiSuggestion && (
              <div className="mt-2 bg-primary/5 border border-primary/20 rounded-md p-3 text-sm">
                <p className="font-medium text-primary mb-1">AI Suggestion:</p>
                <p>{aiSuggestion}</p>
                <button
                  type="button"
                  className="text-xs text-primary mt-2 hover:underline"
                  onClick={() => setFormData(prev => ({ ...prev, description: aiSuggestion }))}
                >
                  Use this description
                </button>
              </div>
            )}
          </div>
          
          {!isNewCategory && (
            <div className="text-sm text-muted-foreground bg-muted/20 rounded-md p-3">
              <p>This category contains <span className="font-semibold">{category?.itemCount}</span> menu items.</p>
            </div>
          )}
          
          <div className="pt-4 flex space-x-2">
            <button
              type="submit"
              className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
            >
              Save Category
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
}
