'use client';

import { useState } from 'react';
import { ModifierGroup } from './components/ModifierGroup';
import { ModifierPanel } from './components/ModifierPanel';
import { Modal } from '@/components/ui/Modal';

// Sample data - in a real app, this would come from an API
const sampleModifierGroups: ModifierGroup[] = [
  {
    id: '1',
    name: 'Size',
    description: 'Choose your preferred size',
    required: true,
    multiSelect: false,
    options: [
      { id: '1-1', name: 'Small', price: 0, isDefault: true },
      { id: '1-2', name: 'Medium', price: 2.00 },
      { id: '1-3', name: 'Large', price: 4.00 },
    ]
  },
  {
    id: '2',
    name: 'Toppings',
    description: 'Add extra toppings to your pizza',
    required: false,
    multiSelect: true,
    options: [
      { id: '2-1', name: 'Pepperoni', price: 1.50 },
      { id: '2-2', name: 'Mushrooms', price: 1.00 },
      { id: '2-3', name: 'Onions', price: 0.75 },
      { id: '2-4', name: 'Bell Peppers', price: 0.75 },
      { id: '2-5', name: 'Extra Cheese', price: 1.25 },
    ]
  },
  {
    id: '3',
    name: 'Bread Type',
    description: 'Select your preferred bread type',
    required: true,
    multiSelect: false,
    options: [
      { id: '3-1', name: 'White', price: 0, isDefault: true },
      { id: '3-2', name: 'Whole Wheat', price: 0 },
      { id: '3-3', name: 'Gluten-Free', price: 2.00 },
    ]
  },
  {
    id: '4',
    name: 'Sides',
    description: 'Add sides to your meal',
    required: false,
    multiSelect: true,
    options: [
      { id: '4-1', name: 'French Fries', price: 3.99 },
      { id: '4-2', name: 'Onion Rings', price: 4.99 },
      { id: '4-3', name: 'Salad', price: 3.49 },
    ]
  },
  {
    id: '5',
    name: 'Temperature',
    description: 'Select your preferred temperature',
    required: true,
    multiSelect: false,
    options: [
      { id: '5-1', name: 'Hot', price: 0, isDefault: true },
      { id: '5-2', name: 'Iced', price: 0 },
    ]
  },
];

export default function ModifiersPage() {
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>(sampleModifierGroups);
  const [editingGroup, setEditingGroup] = useState<ModifierGroup | undefined>();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  const handleAddGroup = () => {
    setEditingGroup(undefined);
    setIsPanelOpen(true);
  };

  const handleEditGroup = (id: string) => {
    const group = modifierGroups.find(group => group.id === id);
    if (group) {
      setEditingGroup(group);
      setIsPanelOpen(true);
    }
  };

  const handleDeleteGroup = (id: string) => {
    setGroupToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteGroup = () => {
    if (groupToDelete) {
      setModifierGroups(prev => prev.filter(group => group.id !== groupToDelete));
      setShowDeleteModal(false);
      setGroupToDelete(null);
    }
  };

  const handleSaveGroup = (group: ModifierGroup) => {
    if (modifierGroups.some(existingGroup => existingGroup.id === group.id)) {
      // Update existing group
      setModifierGroups(prev =>
        prev.map(existingGroup => {
          if (existingGroup.id === group.id) {
            return group;
          }
          return existingGroup;
        })
      );
    } else {
      // Add new group
      setModifierGroups(prev => [...prev, group]);
    }
    setIsPanelOpen(false);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Item Modifiers</h1>
        <p className="text-muted-foreground">
          Create and manage modifier groups like sizes, add-ons, and options for your menu items
        </p>
      </div>
      
      <div className="flex justify-end mb-6">
        <button
          onClick={handleAddGroup}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
        >
          Add Modifier Group
        </button>
      </div>
      
      <div className="space-y-4">
        {modifierGroups.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg font-medium">No modifier groups found</h3>
            <p className="text-muted-foreground mt-2">
              Add your first modifier group to get started
            </p>
          </div>
        ) : (
          modifierGroups.map(group => (
            <ModifierGroup
              key={group.id}
              group={group}
              onEdit={() => handleEditGroup(group.id)}
              onDelete={() => handleDeleteGroup(group.id)}
            />
          ))
        )}
      </div>
      
      <ModifierPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onSave={handleSaveGroup}
        group={editingGroup}
      />
      
      <Modal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Modifier Group"
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to delete this modifier group? This action cannot be undone.
          </p>
          
          <div className="pt-4 flex justify-end space-x-3">
            <button 
              onClick={() => setShowDeleteModal(false)}
              className="bg-card border border-border text-card-foreground px-4 py-2 rounded-md hover:bg-accent"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDeleteGroup}
              className="bg-error text-error-foreground px-4 py-2 rounded-md hover:bg-error/90"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
