'use client';

import { useState } from 'react';
import { AvailabilityScheduler, MenuItemAvailability } from './components/AvailabilityScheduler';

// Sample data - in a real app, this would come from an API
const sampleMenuItems = [
  { id: 'item1', name: 'Margherita Pizza', category: 'Pizza', price: 12.99 },
  { id: 'item2', name: 'Caesar Salad', category: 'Salads', price: 8.99 },
  { id: 'item3', name: 'Spaghetti Bolognese', category: 'Pasta', price: 14.99 },
  { id: 'item4', name: 'Chicken Alfredo', category: 'Pasta', price: 15.99 },
  { id: 'item5', name: 'Cheeseburger', category: 'Burgers', price: 10.99 },
  { id: 'item6', name: 'Chocolate Cake', category: 'Desserts', price: 6.99 },
  { id: 'item7', name: 'Tiramisu', category: 'Desserts', price: 7.99 },
  { id: 'item8', name: 'Garlic Bread', category: 'Appetizers', price: 4.99 },
  { id: 'item9', name: 'Fish and Chips', category: 'Main Course', price: 16.99 },
  { id: 'item10', name: 'Chicken Wings', category: 'Appetizers', price: 9.99 },
];

// Sample availability settings
const sampleAvailabilitySettings: Record<string, MenuItemAvailability> = {
  'item1': {
    itemId: 'item1',
    alwaysAvailable: true,
    timeSlots: []
  },
  'item2': {
    itemId: 'item2',
    alwaysAvailable: true,
    timeSlots: []
  },
  'item3': {
    itemId: 'item3',
    alwaysAvailable: false,
    timeSlots: [
      { day: 'monday', startTime: '11:00', endTime: '21:00' },
      { day: 'tuesday', startTime: '11:00', endTime: '21:00' },
      { day: 'wednesday', startTime: '11:00', endTime: '21:00' },
      { day: 'thursday', startTime: '11:00', endTime: '21:00' },
      { day: 'friday', startTime: '11:00', endTime: '23:00' },
      { day: 'saturday', startTime: '11:00', endTime: '23:00' },
      { day: 'sunday', startTime: '12:00', endTime: '20:00' }
    ]
  },
  'item4': {
    itemId: 'item4',
    alwaysAvailable: false,
    timeSlots: [
      { day: 'monday', startTime: '11:00', endTime: '21:00' },
      { day: 'tuesday', startTime: '11:00', endTime: '21:00' },
      { day: 'wednesday', startTime: '11:00', endTime: '21:00' },
      { day: 'thursday', startTime: '11:00', endTime: '21:00' },
      { day: 'friday', startTime: '11:00', endTime: '23:00' },
      { day: 'saturday', startTime: '11:00', endTime: '23:00' }
    ]
  },
  'item5': {
    itemId: 'item5',
    alwaysAvailable: false,
    timeSlots: [
      { day: 'monday', startTime: '11:00', endTime: '21:00' },
      { day: 'tuesday', startTime: '11:00', endTime: '21:00' },
      { day: 'wednesday', startTime: '11:00', endTime: '21:00' },
      { day: 'thursday', startTime: '11:00', endTime: '21:00' },
      { day: 'friday', startTime: '11:00', endTime: '23:00' },
      { day: 'saturday', startTime: '11:00', endTime: '23:00' },
      { day: 'sunday', startTime: '12:00', endTime: '20:00' }
    ],
    seasonalAvailability: {
      startDate: '2023-05-01',
      endDate: '2023-09-30'
    }
  }
  // Other items don't have availability settings yet
};

export default function AvailabilityPage() {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [availabilitySettings, setAvailabilitySettings] = useState<Record<string, MenuItemAvailability>>(sampleAvailabilitySettings);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  
  // Get unique categories from menu items
  const categories = Array.from(new Set(sampleMenuItems.map(item => item.category)));
  
  const handleSaveAvailability = (updatedAvailability: MenuItemAvailability) => {
    setAvailabilitySettings(prev => ({
      ...prev,
      [updatedAvailability.itemId]: updatedAvailability
    }));
    
    // Show success message or notification here
    alert(`Availability settings for ${selectedItemName} have been saved.`);
  };
  
  // Get default availability for a menu item if it doesn't exist
  const getDefaultAvailability = (itemId: string): MenuItemAvailability => {
    return {
      itemId,
      alwaysAvailable: true,
      timeSlots: []
    };
  };
  
  // Filter menu items based on search term and category
  const filteredMenuItems = sampleMenuItems.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === null || item.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });
  
  const selectedItemName = selectedItemId 
    ? sampleMenuItems.find(item => item.id === selectedItemId)?.name || ''
    : '';
  
  // Helper function to determine availability status
  const getAvailabilityStatus = (itemId: string): { status: string; className: string } => {
    const availability = availabilitySettings[itemId];
    
    if (!availability) {
      return { status: 'Not configured', className: 'bg-muted/40 text-muted-foreground' };
    }
    
    if (availability.alwaysAvailable) {
      return { status: 'Always available', className: 'bg-success/10 text-success' };
    }
    
    const hasTimeSlots = availability.timeSlots.length > 0;
    const isSeasonal = !!availability.seasonalAvailability;
    
    if (hasTimeSlots && isSeasonal) {
      return { status: 'Time & season restricted', className: 'bg-warning/10 text-warning' };
    } else if (hasTimeSlots) {
      return { status: 'Time restricted', className: 'bg-info/10 text-info' };
    } else if (isSeasonal) {
      return { status: 'Seasonal', className: 'bg-warning/10 text-warning' };
    } else {
      return { status: 'Not available', className: 'bg-error/10 text-error' };
    }
  };
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Menu Availability</h1>
        <p className="text-muted-foreground">
          Manage when menu items are available to customers
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar - Menu Item Selection */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg shadow-sm p-4 mb-4">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search menu items..."
                className="w-full px-4 py-2 bg-muted border border-border rounded-md"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Filter by Category
              </label>
              <select
                className="w-full px-4 py-2 bg-muted border border-border rounded-md"
                value={categoryFilter || ''}
                onChange={e => setCategoryFilter(e.target.value || null)}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto">
              <h3 className="font-medium mb-2">Menu Items</h3>
              
              {filteredMenuItems.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No menu items found matching your criteria.
                </div>
              ) : (
                filteredMenuItems.map(item => {
                  const status = getAvailabilityStatus(item.id);
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      className={`w-full text-left px-3 py-2 rounded-md ${
                        selectedItemId === item.id
                          ? 'bg-primary/10 border-l-2 border-primary'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-muted-foreground">{item.category}</div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${status.className}`}>
                          {status.status}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
          
          <div className="bg-muted/10 border border-border rounded-lg p-4">
            <h3 className="font-medium mb-2">Quick Tips</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Set items as "Always Available" to make them visible at all times</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Use time slots to restrict items to specific hours (e.g., breakfast menu)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Seasonal availability is perfect for holiday specials or limited-time offerings</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Right side - Availability Scheduler */}
        <div className="lg:col-span-2">
          {selectedItemId ? (
            <AvailabilityScheduler
              itemId={selectedItemId}
              itemName={selectedItemName}
              availability={availabilitySettings[selectedItemId] || getDefaultAvailability(selectedItemId)}
              onSave={handleSaveAvailability}
            />
          ) : (
            <div className="bg-card border border-border rounded-lg shadow-sm p-8 text-center">
              <div className="mx-auto h-16 w-16 text-muted-foreground mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-medium mb-2">Select a Menu Item</h2>
              <p className="text-muted-foreground">
                Choose a menu item from the list to configure its availability.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
