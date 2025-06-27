'use client';

import { useState, useEffect } from 'react';
import { ModifierGroup, ModifierOption } from './ModifierGroup';

interface ModifierPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (group: ModifierGroup) => void;
  group?: ModifierGroup;
}

export const ModifierPanel: React.FC<ModifierPanelProps> = ({
  isOpen,
  onClose,
  onSave,
  group,
}) => {
  const isNewGroup = !group;
  
  const defaultGroup: ModifierGroup = {
    id: '',
    name: '',
    description: '',
    required: false,
    multiSelect: false,
    options: [],
  };
  
  const [formData, setFormData] = useState<ModifierGroup>(group || defaultGroup);
  const [newOption, setNewOption] = useState<ModifierOption>({
    id: '',
    name: '',
    price: 0,
    isDefault: false,
  });
  
  useEffect(() => {
    if (group) {
      setFormData(group);
    } else {
      setFormData(defaultGroup);
    }
  }, [group]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: checked,
    }));
  };
  
  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setNewOption(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value,
    }));
  };
  
  const handleAddOption = () => {
    if (!newOption.name) return;
    
    const option = {
      ...newOption,
      id: `option-${Date.now()}`,
    };
    
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, option],
    }));
    
    setNewOption({
      id: '',
      name: '',
      price: 0,
      isDefault: false,
    });
  };
  
  const handleRemoveOption = (optionId: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter(option => option.id !== optionId),
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.options.length === 0) {
      alert('Please add at least one option to the modifier group.');
      return;
    }
    
    // Generate a random ID for new groups
    const groupToSave = isNewGroup 
      ? { ...formData, id: `group-${Date.now()}` } 
      : formData;
    
    onSave(groupToSave);
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };
  
  return (
    <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-background shadow-xl transform transition-transform duration-300 z-50 overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            {isNewGroup ? 'Add Modifier Group' : 'Edit Modifier Group'}
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
              Group Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full bg-card border border-border rounded-md px-4 py-2 text-card-foreground"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Size, Add-ons, Toppings"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              className="w-full bg-card border border-border rounded-md px-4 py-2 text-card-foreground"
              value={formData.description}
              onChange={handleChange}
              placeholder="A brief description of this modifier group"
            />
          </div>
          
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="required"
                name="required"
                className="rounded border-border text-primary focus:ring-0"
                checked={formData.required}
                onChange={handleCheckboxChange}
              />
              <label htmlFor="required" className="text-sm">
                Required
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="multiSelect"
                name="multiSelect"
                className="rounded border-border text-primary focus:ring-0"
                checked={formData.multiSelect}
                onChange={handleCheckboxChange}
              />
              <label htmlFor="multiSelect" className="text-sm">
                Multiple Selection
              </label>
            </div>
          </div>
          
          <div className="pt-2 border-t border-border">
            <h3 className="text-md font-medium mb-3">Options</h3>
            
            <div className="space-y-4">
              {formData.options.length > 0 ? (
                <div className="bg-card border border-border rounded-md overflow-hidden">
                  <div className="divide-y divide-border">
                    {formData.options.map(option => (
                      <div key={option.id} className="p-3 flex justify-between items-center">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{option.name}</span>
                            {option.isDefault && (
                              <span className="text-xs bg-success/10 text-success px-1.5 py-0.5 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {option.price > 0 ? `+${formatPrice(option.price)}` : 'No extra charge'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(option.id)}
                          className="p-1 text-card-foreground hover:bg-error/10 hover:text-error rounded-md"
                          title="Remove option"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-muted/20 border border-border rounded-md p-4 text-center">
                  <p className="text-muted-foreground">No options added yet.</p>
                </div>
              )}
              
              <div className="bg-card border border-border rounded-md p-3">
                <h4 className="text-sm font-medium mb-3">Add New Option</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" htmlFor="optionName">
                      Option Name
                    </label>
                    <input
                      type="text"
                      id="optionName"
                      name="name"
                      className="w-full bg-card border border-border rounded-md px-3 py-1.5 text-card-foreground text-sm"
                      value={newOption.name}
                      onChange={handleOptionChange}
                      placeholder="e.g., Small, Medium, Extra Cheese"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1" htmlFor="optionPrice">
                      Additional Price ($)
                    </label>
                    <input
                      type="number"
                      id="optionPrice"
                      name="price"
                      min="0"
                      step="0.01"
                      className="w-full bg-card border border-border rounded-md px-3 py-1.5 text-card-foreground text-sm"
                      value={newOption.price}
                      onChange={handleOptionChange}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="checkbox"
                      id="isDefault"
                      name="isDefault"
                      className="rounded border-border text-primary focus:ring-0"
                      checked={newOption.isDefault}
                      onChange={handleOptionChange}
                    />
                    <label htmlFor="isDefault" className="text-sm">
                      Default Option
                    </label>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleAddOption}
                    disabled={!newOption.name}
                    className={`w-full py-1.5 rounded-md ${
                      newOption.name
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    Add Option
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-4 flex space-x-2">
            <button
              type="submit"
              className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
              disabled={formData.options.length === 0}
            >
              Save Group
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
