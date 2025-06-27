'use client';

import { useState, useEffect } from 'react';
import { MenuItem, MenuItemCard } from './MenuItemCard';

interface MenuListProps {
  items: MenuItem[];
  filteredCategory: string;
  searchQuery: string;
  onEdit: (id: string) => void;
  onToggleAvailability: (id: string, available: boolean) => void;
}

export const MenuList: React.FC<MenuListProps> = ({
  items,
  filteredCategory,
  searchQuery,
  onEdit,
  onToggleAvailability,
}) => {
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>(items);
  
  useEffect(() => {
    let result = [...items];
    
    // Apply category filter if selected
    if (filteredCategory) {
      result = result.filter(item => item.category === filteredCategory);
    }
    
    // Apply search query filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        item =>
          item.name.toLowerCase().includes(lowerQuery) ||
          item.description.toLowerCase().includes(lowerQuery)
      );
    }
    
    setFilteredItems(result);
  }, [items, filteredCategory, searchQuery]);
  
  // Group items by category
  const itemsByCategory = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);
  
  return (
    <div className="space-y-8">
      {Object.entries(itemsByCategory).map(([category, categoryItems]) => (
        <div key={category}>
          <h2 className="text-lg font-medium mb-4 text-card-foreground">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categoryItems.map(item => (
              <MenuItemCard
                key={item.id}
                item={item}
                onEdit={onEdit}
                onToggleAvailability={onToggleAvailability}
              />
            ))}
          </div>
        </div>
      ))}
      
      {filteredItems.length === 0 && (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium">No menu items found</h3>
          <p className="text-muted-foreground mt-2">
            {searchQuery ? 
              `No items match "${searchQuery}"` : 
              filteredCategory ? 
                `No items in the "${filteredCategory}" category` : 
                'Add your first menu item to get started'}
          </p>
        </div>
      )}
    </div>
  );
};
