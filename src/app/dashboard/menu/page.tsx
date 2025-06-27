'use client';

import { useState } from 'react';
import { MenuToolbar } from './components/MenuToolbar';
import { MenuList } from './components/MenuList';
import { MenuItemPanel } from './components/MenuItemPanel';
import { MenuItem } from './components/MenuItemCard';
import { Modal } from '@/components/ui/Modal';

// Sample data - in a real app, this would come from an API
const sampleCategories = [
  'Appetizers',
  'Main Course',
  'Pasta',
  'Pizza',
  'Burgers',
  'Desserts',
  'Beverages'
];

const sampleMenuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Margherita Pizza',
    description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil',
    price: 12.99,
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    category: 'Pizza',
    isAvailable: true,
    hasModifiers: true,
    popularityScore: 9.2
  },
  {
    id: '2',
    name: 'Caesar Salad',
    description: 'Fresh romaine lettuce with Caesar dressing, parmesan cheese, and croutons',
    price: 8.99,
    category: 'Appetizers',
    isAvailable: true,
    hasModifiers: false
  },
  {
    id: '3',
    name: 'Spaghetti Carbonara',
    description: 'Spaghetti with a creamy sauce made with eggs, cheese, pancetta, and black pepper',
    price: 14.99,
    imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    category: 'Pasta',
    isAvailable: true,
    hasModifiers: true,
    popularityScore: 8.7
  },
  {
    id: '4',
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with a molten chocolate center, served with vanilla ice cream',
    price: 7.99,
    imageUrl: 'https://images.unsplash.com/photo-1517427294546-5aa121f68e8a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    category: 'Desserts',
    isAvailable: false,
    hasModifiers: false,
    popularityScore: 9.5
  },
  {
    id: '5',
    name: 'Classic Cheeseburger',
    description: 'Beef patty with cheddar cheese, lettuce, tomato, and special sauce on a brioche bun',
    price: 11.99,
    category: 'Burgers',
    isAvailable: true,
    hasModifiers: true
  },
  {
    id: '6',
    name: 'Iced Coffee',
    description: 'Cold-brewed coffee served with ice and your choice of milk',
    price: 4.99,
    category: 'Beverages',
    isAvailable: true,
    hasModifiers: true
  }
];

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(sampleMenuItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editingItem, setEditingItem] = useState<MenuItem | undefined>();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [isGeneratingAiSuggestions, setIsGeneratingAiSuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryFilter = (category: string) => {
    setCategoryFilter(category);
  };

  const handleAddItem = () => {
    setEditingItem(undefined);
    setIsPanelOpen(true);
  };

  const handleEditItem = (id: string) => {
    const item = menuItems.find(item => item.id === id);
    if (item) {
      setEditingItem(item);
      setIsPanelOpen(true);
    }
  };

  const handleToggleAvailability = (id: string, available: boolean) => {
    setMenuItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          return { ...item, isAvailable: available };
        }
        return item;
      })
    );
  };

  const handleSaveItem = (item: MenuItem) => {
    if (menuItems.some(existingItem => existingItem.id === item.id)) {
      // Update existing item
      setMenuItems(prev =>
        prev.map(existingItem => {
          if (existingItem.id === item.id) {
            return item;
          }
          return existingItem;
        })
      );
    } else {
      // Add new item
      setMenuItems(prev => [...prev, item]);
    }
    setIsPanelOpen(false);
  };

  const handleGetAiSuggestions = () => {
    setShowAiSuggestions(true);
    setIsGeneratingAiSuggestions(true);
    
    // Simulate AI processing time
    setTimeout(() => {
      const suggestions = [
        "Consider adding a 'Healthy Options' category based on current food trends.",
        "Your dessert prices are slightly below market average. Consider raising them by 5-10%.",
        "Add more vegetarian options, as they tend to have higher profit margins.",
        "Based on your menu composition, adding a 'Build Your Own Bowl' option could attract younger customers.",
        "Create a seasonal menu section to increase repeat visits."
      ];
      
      setAiSuggestions(suggestions);
      setIsGeneratingAiSuggestions(false);
    }, 2000);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Menu Management</h1>
        <p className="text-muted-foreground">
          Add, edit, and organize your restaurant's menu items
        </p>
      </div>
      
      <MenuToolbar
        onSearch={handleSearch}
        onAddItem={handleAddItem}
        onAiSuggestions={handleGetAiSuggestions}
        onCategoryFilter={handleCategoryFilter}
        categories={sampleCategories}
      />
      
      <MenuList
        items={menuItems}
        filteredCategory={categoryFilter}
        searchQuery={searchQuery}
        onEdit={handleEditItem}
        onToggleAvailability={handleToggleAvailability}
      />
      
      <MenuItemPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onSave={handleSaveItem}
        item={editingItem}
        categories={sampleCategories}
      />
      
      <Modal 
        isOpen={showAiSuggestions} 
        onClose={() => setShowAiSuggestions(false)}
        title="AI Menu Insights & Recommendations"
      >
        <div className="space-y-4">
          {isGeneratingAiSuggestions ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
              <p className="mt-3 text-center text-muted-foreground">
                Our AI is analyzing your menu data and market trends...
              </p>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground mb-4">
                Based on your current menu, customer preferences, and market trends, here are some suggestions to optimize your menu:
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
      </Modal>
    </div>
  );
}
