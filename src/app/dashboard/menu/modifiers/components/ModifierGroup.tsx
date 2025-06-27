'use client';

import { useState } from 'react';

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
  isDefault?: boolean;
}

export interface ModifierGroup {
  id: string;
  name: string;
  description: string;
  required: boolean;
  multiSelect: boolean;
  options: ModifierOption[];
}

interface ModifierGroupProps {
  group: ModifierGroup;
  onEdit: () => void;
  onDelete: () => void;
}

export const ModifierGroup: React.FC<ModifierGroupProps> = ({
  group,
  onEdit,
  onDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-card-foreground">{group.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={onEdit}
              className="p-1 text-card-foreground hover:bg-accent rounded-md"
              title="Edit modifier group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="p-1 text-card-foreground hover:bg-error/10 hover:text-error rounded-md"
              title="Delete modifier group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-card-foreground hover:bg-accent rounded-md"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className={`text-xs px-2 py-1 rounded ${group.required ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
            {group.required ? 'Required' : 'Optional'}
          </span>
          <span className={`text-xs px-2 py-1 rounded bg-muted text-muted-foreground`}>
            {group.multiSelect ? 'Multiple Selection' : 'Single Selection'}
          </span>
          <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
            {group.options.length} {group.options.length === 1 ? 'option' : 'options'}
          </span>
        </div>
      </div>
      
      {isExpanded && (
        <div className="border-t border-border p-4">
          <h4 className="text-sm font-medium mb-2">Options</h4>
          <div className="space-y-2">
            {group.options.map(option => (
              <div key={option.id} className="flex justify-between items-center p-2 bg-card border border-border rounded-md">
                <div className="flex items-center gap-2">
                  {option.isDefault && (
                    <span className="text-xs bg-success/10 text-success px-1.5 py-0.5 rounded">
                      Default
                    </span>
                  )}
                  <span>{option.name}</span>
                </div>
                <span className="text-sm font-medium">
                  {option.price > 0 ? `+${formatPrice(option.price)}` : 'No extra charge'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
