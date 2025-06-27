'use client';

import { useState } from 'react';

interface MenuToolbarProps {
  onSearch: (query: string) => void;
  onAddItem: () => void;
  onAiSuggestions: () => void;
  onCategoryFilter: (category: string) => void;
  categories: string[];
}

export const MenuToolbar: React.FC<MenuToolbarProps> = ({
  onSearch,
  onAddItem,
  onAiSuggestions,
  onCategoryFilter,
  categories,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div className="flex-1 flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search menu items..."
            className="w-full bg-card border border-border rounded-md px-4 py-2 pl-10 text-card-foreground"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
        </div>
        <select 
          className="bg-card border border-border rounded-md px-3 py-2 text-card-foreground" 
          onChange={(e) => onCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onAddItem}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
        >
          Add Item
        </button>
        <button
          onClick={onAiSuggestions}
          className="bg-card border border-border text-card-foreground px-4 py-2 rounded-md flex items-center gap-2 hover:bg-accent"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          AI Suggestions
        </button>
      </div>
    </div>
  );
};
