'use client';

import { useState } from 'react';
import { CategoryList, Category } from './components/CategoryList';
import { CategoryPanel } from './components/CategoryPanel';
import { Modal } from '@/components/ui/Modal';
import { SlidePanel } from '@/components/ui/SlidePanel';

// Sample data - in a real app, this would come from an API
const sampleCategories: Category[] = [
  {
    id: '1',
    name: 'Appetizers',
    description: 'Start your meal with these delicious appetizers',
    displayOrder: 0,
    itemCount: 8
  },
  {
    id: '2',
    name: 'Main Course',
    description: 'Signature dishes that satisfy hunger and delight taste buds',
    displayOrder: 1,
    itemCount: 12
  },
  {
    id: '3',
    name: 'Pizza',
    description: 'Handcrafted pizzas with our signature sauce and fresh toppings',
    displayOrder: 2,
    itemCount: 6
  },
  {
    id: '4',
    name: 'Pasta',
    description: 'Classic and creative pasta dishes with homemade sauces',
    displayOrder: 3,
    itemCount: 5
  },
  {
    id: '5',
    name: 'Burgers',
    description: 'Juicy burgers made with premium beef and fresh ingredients',
    displayOrder: 4,
    itemCount: 4
  },
  {
    id: '6',
    name: 'Desserts',
    description: 'Sweet treats to end your meal on a high note',
    displayOrder: 5,
    itemCount: 7
  },
  {
    id: '7',
    name: 'Beverages',
    description: 'Refreshing drinks to complement your meal',
    displayOrder: 6,
    itemCount: 10
  }
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(sampleCategories);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [isGeneratingAiSuggestions, setIsGeneratingAiSuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const handleAddCategory = () => {
    setEditingCategory(undefined);
    setIsPanelOpen(true);
  };

  const handleEditCategory = (id: string) => {
    const category = categories.find(cat => cat.id === id);
    if (category) {
      setEditingCategory(category);
      setIsPanelOpen(true);
    }
  };

  const handleDeleteCategory = (id: string) => {
    setCategoryToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteCategory = () => {
    if (categoryToDelete) {
      setCategories(prev => prev.filter(cat => cat.id !== categoryToDelete));
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    }
  };

  const handleSaveCategory = (category: Category) => {
    if (categories.some(existingCat => existingCat.id === category.id)) {
      // Update existing category
      setCategories(prev =>
        prev.map(existingCat => {
          if (existingCat.id === category.id) {
            return category;
          }
          return existingCat;
        })
      );
    } else {
      // Add new category with the highest display order
      const maxOrder = Math.max(...categories.map(cat => cat.displayOrder), -1);
      setCategories(prev => [...prev, { ...category, displayOrder: maxOrder + 1 }]);
    }
    setIsPanelOpen(false);
  };

  const handleReorderCategories = (reorderedCategories: Category[]) => {
    setCategories(reorderedCategories);
  };

  const handleGetAiSuggestions = () => {
    setShowAiSuggestions(true);
    setIsGeneratingAiSuggestions(true);
    
    // Simulate AI processing time
    setTimeout(() => {
      const suggestions = [
        "Consider reorganizing menu items to make 'Main Course' more prominent as it's your highest-value category.",
        "Your 'Beverages' category has 10 items which may be excessive - consider splitting into 'Alcoholic' and 'Non-alcoholic' subcategories.",
        "Based on current trends, adding a 'Plant-Based' or 'Vegetarian' category could attract more health-conscious customers.",
        "Your menu lacks a 'Specials' or 'Chef's Recommendations' section, which could highlight your best items.",
        "Consider adding section dividers within large categories like 'Appetizers' to improve navigation."
      ];
      
      setAiSuggestions(suggestions);
      setIsGeneratingAiSuggestions(false);
    }, 2000);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Categories & Sections</h1>
        <p className="text-muted-foreground">
          Organize your menu into categories and manage their order
        </p>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-muted-foreground">
          Drag and drop categories to reorder them on your menu
        </p>
        
        <div className="flex gap-2">
          <button
            onClick={handleAddCategory}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Add Category
          </button>
          <button
            onClick={handleGetAiSuggestions}
            className="bg-card border border-border text-card-foreground px-4 py-2 rounded-md flex items-center gap-2 hover:bg-accent"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Suggestions
          </button>
        </div>
      </div>
      
      <CategoryList
        categories={categories}
        onEditCategory={handleEditCategory}
        onDeleteCategory={handleDeleteCategory}
        onReorderCategories={handleReorderCategories}
      />
      
      <CategoryPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onSave={handleSaveCategory}
        category={editingCategory}
      />
      
      <Modal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Category"
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to delete this category? This will not delete the menu items in this category, 
            but they will no longer be assigned to any category.
          </p>
          
          <div className="pt-4 flex justify-end space-x-3">
            <button 
              onClick={() => setShowDeleteModal(false)}
              className="bg-card border border-border text-card-foreground px-4 py-2 rounded-md hover:bg-accent"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDeleteCategory}
              className="bg-error text-error-foreground px-4 py-2 rounded-md hover:bg-error/90"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
      
      <SlidePanel 
        isOpen={showAiSuggestions}
        onClose={() => setShowAiSuggestions(false)}
        title="AI Category Organization Suggestions"
      >
        <div className="space-y-4">
          {isGeneratingAiSuggestions ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
              <p className="mt-3 text-center text-muted-foreground">
                Our AI is analyzing your menu categories and customer ordering patterns...
              </p>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground mb-4">
                Based on your current menu organization and industry best practices, here are some suggestions to optimize your category structure:
              </p>
              
              <ul className="space-y-3">
                {aiSuggestions.map((suggestion, index) => (
                  <li key={index} className="bg-card border border-border rounded-md p-3 flex">
                    <span className="text-primary mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
              
              <div className="pt-4 flex justify-end">
                <button 
                  onClick={() => setShowAiSuggestions(false)}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
                >
                  Got It
                </button>
              </div>
            </>
          )}
        </div>
      </SlidePanel>
    </div>
  );
}
