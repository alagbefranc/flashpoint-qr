'use client';

import { useState, useEffect } from 'react';

export interface Category {
  id: string;
  name: string;
  description: string;
  displayOrder: number;
  itemCount: number;
}

interface CategoryListProps {
  categories: Category[];
  onEditCategory: (id: string) => void;
  onDeleteCategory: (id: string) => void;
  onReorderCategories: (categories: Category[]) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  onEditCategory,
  onDeleteCategory,
  onReorderCategories,
}) => {
  const [draggedItem, setDraggedItem] = useState<Category | null>(null);
  const [orderedCategories, setOrderedCategories] = useState<Category[]>([]);
  
  useEffect(() => {
    // Sort categories by displayOrder
    setOrderedCategories([...categories].sort((a, b) => a.displayOrder - b.displayOrder));
  }, [categories]);
  
  const handleDragStart = (e: React.DragEvent, category: Category) => {
    setDraggedItem(category);
    e.dataTransfer.effectAllowed = 'move';
    // This is a trick to make the drag image invisible
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };
  
  const handleDragOver = (e: React.DragEvent, targetCategory: Category) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetCategory.id) return;
    
    const updatedCategories = [...orderedCategories];
    const draggedIndex = updatedCategories.findIndex(cat => cat.id === draggedItem.id);
    const targetIndex = updatedCategories.findIndex(cat => cat.id === targetCategory.id);
    
    // Remove the dragged item
    const [removed] = updatedCategories.splice(draggedIndex, 1);
    // Insert it at the target position
    updatedCategories.splice(targetIndex, 0, removed);
    
    // Update the display order
    const reordered = updatedCategories.map((cat, index) => ({
      ...cat,
      displayOrder: index,
    }));
    
    setOrderedCategories(reordered);
  };
  
  const handleDragEnd = () => {
    if (draggedItem) {
      onReorderCategories(orderedCategories);
      setDraggedItem(null);
    }
  };
  
  return (
    <div className="space-y-4">
      {orderedCategories.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
          <h3 className="text-lg font-medium">No categories found</h3>
          <p className="text-muted-foreground mt-2">
            Add your first menu category to get started
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <ul>
            {orderedCategories.map((category, index) => (
              <li
                key={category.id}
                className={`border-b border-border last:border-b-0 ${
                  draggedItem?.id === category.id ? 'opacity-50 bg-accent' : ''
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, category)}
                onDragOver={(e) => handleDragOver(e, category)}
                onDragEnd={handleDragEnd}
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-4">
                    <div className="text-muted-foreground cursor-move touch-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-card-foreground">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-muted-foreground">
                      {category.itemCount} {category.itemCount === 1 ? 'item' : 'items'}
                    </span>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => onEditCategory(category.id)}
                        className="p-1 text-card-foreground hover:bg-accent rounded-md"
                        title="Edit category"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDeleteCategory(category.id)}
                        className="p-1 text-card-foreground hover:bg-error/10 hover:text-error rounded-md"
                        title="Delete category"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
