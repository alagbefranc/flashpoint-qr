import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Trash2, Search, ShoppingBag, Home, Car } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
}

interface Item {
  id: string;
  menuItemId?: string; // Reference to original menu item
  name: string;
  quantity: number;
  price: number;
  notes: string;
}

type OrderType = 'dine-in' | 'pickup' | 'delivery';

interface CreateOrderPanelProps {
  restaurantId: string;
  onClose: () => void;
  onOrderCreated: () => void;
  isVisible: boolean;
}

const CreateOrderPanel: React.FC<CreateOrderPanelProps> = ({
  restaurantId,
  onClose,
  onOrderCreated,
  isVisible
}) => {
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [items, setItems] = useState<Item[]>([
    { id: `item-${Date.now()}`, name: '', quantity: 1, price: 0, notes: '' }
  ]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Menu items
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuSearchTerm, setMenuSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [menuCategories, setMenuCategories] = useState<string[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);

  // Fetch menu items from Firestore
  useEffect(() => {
    const fetchMenuItems = async () => {
      if (!restaurantId) return;
      
      try {
        setIsLoadingMenu(true);
        const menuItemsRef = collection(db, `restaurants/${restaurantId}/menuItems`);
        const menuSnapshot = await getDocs(menuItemsRef);
        
        const fetchedItems: MenuItem[] = [];
        const categories = new Set<string>();
        
        menuSnapshot.forEach((doc) => {
          const item = { id: doc.id, ...doc.data() } as MenuItem;
          fetchedItems.push(item);
          if (item.category) categories.add(item.category);
        });
        
        setMenuItems(fetchedItems);
        setMenuCategories(Array.from(categories));
        
        // Set initial active category if there are any
        if (categories.size > 0) {
          setActiveCategory(Array.from(categories)[0]);
        }
      } catch (error) {
        console.error('Error fetching menu items:', error);
      } finally {
        setIsLoadingMenu(false);
      }
    };
    
    fetchMenuItems();
  }, [restaurantId]);
  
  // Calculate total amount
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Filter menu items based on search and category
  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = menuSearchTerm.trim() === '' || 
      item.name.toLowerCase().includes(menuSearchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(menuSearchTerm.toLowerCase());
      
    const matchesCategory = !activeCategory || item.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Add menu item to order
  const handleAddMenuItemToOrder = (menuItem: MenuItem) => {
    // Check if item already exists in the order
    const existingItemIndex = items.findIndex(item => item.menuItemId === menuItem.id);
    
    if (existingItemIndex !== -1) {
      // Increment quantity if item already exists
      handleQuantityChange(items[existingItemIndex].id, true);
    } else {
      // Add new item
      setItems([
        ...items,
        { 
          id: `item-${Date.now()}`, 
          menuItemId: menuItem.id,
          name: menuItem.name, 
          quantity: 1, 
          price: menuItem.price, 
          notes: '' 
        }
      ]);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: `item-${Date.now()}`, name: '', quantity: 1, price: 0, notes: '' }
    ]);
  };

  const handleRemoveItem = (itemId: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== itemId));
    }
  };

  const handleItemChange = (itemId: string, field: keyof Item, value: string | number) => {
    setItems(items.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const handleQuantityChange = (itemId: string, increment: boolean) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const newQuantity = increment ? item.quantity + 1 : Math.max(1, item.quantity - 1);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const validateForm = (): boolean => {
    if (!customerName.trim()) {
      setError('Customer name is required');
      return false;
    }
    
    if (orderType === 'dine-in' && !tableNumber.trim()) {
      setError('Table number is required for dine-in orders');
      return false;
    }
    
    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      setError('Delivery address is required for delivery orders');
      return false;
    }
    
    if (items.length === 0) {
      setError('At least one item is required');
      return false;
    }
    
    for (const item of items) {
      if (!item.name.trim()) {
        setError('All items must have a name');
        return false;
      }
      if (item.price <= 0) {
        setError('All items must have a valid price');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      
      // Create order object with type-specific fields
      const orderData: any = {
        customerName,
        orderType,
        items: items.map(({ id, menuItemId, ...rest }) => ({ 
          ...rest, 
          menuItemId: menuItemId || null // Include reference to original menu item
        })),
        status: 'new',
        totalAmount,
        notes: notes || '',
        createdAt: serverTimestamp(),
        paymentStatus: 'pending',
        source: 'staff' // Indicates manual creation by staff
      };
      
      // Add type-specific fields
      if (orderType === 'dine-in') {
        orderData.tableNumber = tableNumber;
      } else if (orderType === 'delivery') {
        orderData.deliveryAddress = deliveryAddress;
        orderData.deliveryStatus = 'pending';
      }
      
      // Add to Firestore
      await addDoc(collection(db, `restaurants/${restaurantId}/orders`), orderData);
      
      // Reset form
      setCustomerName('');
      setTableNumber('');
      setDeliveryAddress('');
      setItems([]);
      setNotes('');
      
      // Notify parent
      onOrderCreated();
      onClose();
      
    } catch (error: any) {
      setError(`Failed to create order: ${error.message || 'Unknown error'}`);
      console.error('Error creating order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className={`fixed inset-y-0 right-0 bg-white dark:bg-gray-900 w-full md:w-[65rem] xl:w-[75rem] shadow-xl transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto ${
        isVisible ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="p-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Create New Order</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex gap-4 h-full">
            {/* Left side - Menu items */}
            <div className="w-3/5 border rounded-lg dark:border-gray-700 flex flex-col overflow-hidden">
              {/* Order Type Selector */}
              <div className="p-4 border-b dark:border-gray-700">
                <RadioGroup value={orderType} onValueChange={(value) => setOrderType(value as OrderType)} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dine-in" id="dine-in" />
                    <Label htmlFor="dine-in" className="flex items-center gap-1 cursor-pointer">
                      <Home className="h-4 w-4" /> Dine-in
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup" className="flex items-center gap-1 cursor-pointer">
                      <ShoppingBag className="h-4 w-4" /> Pickup
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="delivery" id="delivery" />
                    <Label htmlFor="delivery" className="flex items-center gap-1 cursor-pointer">
                      <Car className="h-4 w-4" /> Delivery
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Search and Categories */}
              <div className="p-4 border-b dark:border-gray-700">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search menu items..."
                    value={menuSearchTerm}
                    onChange={(e) => setMenuSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* Category tabs */}
                <div className="border rounded-lg dark:border-gray-700">
                  <Tabs defaultValue="all">
                    <TabsList className="w-full justify-start overflow-x-auto">
                      <TabsTrigger 
                        value="all" 
                        onClick={() => setActiveCategory(null)}
                        className={!activeCategory ? 'border-b-2 border-teal-500' : ''}
                      >
                        All Categories
                      </TabsTrigger>
                      {menuCategories.map(category => (
                        <TabsTrigger
                          key={category}
                          value={category}
                          onClick={() => setActiveCategory(category)}
                          className={activeCategory === category ? 'border-b-2 border-teal-500' : ''}
                        >
                          {category}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              {/* Menu Items Grid */}
              <div className="p-4 overflow-y-auto flex-1">
                {isLoadingMenu ? (
                  <div className="flex justify-center items-center h-full">
                    <span className="text-gray-500">Loading menu items...</span>
                  </div>
                ) : filteredMenuItems.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {filteredMenuItems.map(menuItem => (
                      <div 
                        key={menuItem.id} 
                        className="border rounded-lg dark:border-gray-700 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => handleAddMenuItemToOrder(menuItem)}
                      >
                        <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-md mb-2">
                          {/* Image placeholder */}
                          {menuItem.image ? (
                            <img 
                              src={menuItem.image} 
                              alt={menuItem.name} 
                              className="h-full w-full object-cover rounded-md" 
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-medium">{menuItem.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{menuItem.description}</div>
                        <div className="text-sm font-bold mt-1">${menuItem.price.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <div className="mb-2">No menu items found</div>
                    <Button 
                      type="button" 
                      onClick={handleAddItem} 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" /> Add Custom Item
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Custom Item Button */}
              <div className="p-4 border-t dark:border-gray-700">
                <Button 
                  type="button" 
                  onClick={handleAddItem}
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Add Custom Item
                </Button>
              </div>
            </div>

            {/* Right side - Order details */}
            <div className="w-2/5 flex flex-col">
              {/* Customer Information */}
              <div className="mb-4 p-4 border rounded-lg dark:border-gray-700">
                <h3 className="text-lg font-medium mb-3">Customer Information</h3>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Customer Name"
                      required
                    />
                  </div>
                  
                  {orderType === 'dine-in' && (
                    <div className="space-y-2">
                      <Label htmlFor="tableNumber">Table Number</Label>
                      <Input
                        id="tableNumber"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        placeholder="Table #"
                        required
                      />
                    </div>
                  )}
                  
                  {orderType === 'delivery' && (
                    <div className="space-y-2">
                      <Label htmlFor="deliveryAddress">Delivery Address</Label>
                      <Input
                        id="deliveryAddress"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Delivery Address"
                        required
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Order Items */}
              <div className="flex-1 overflow-y-auto mb-4 p-4 border rounded-lg dark:border-gray-700">
                <h3 className="text-lg font-medium mb-3">Order Items</h3>
                
                {items.length > 0 ? (
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div 
                        key={item.id} 
                        className="p-3 border rounded-lg dark:border-gray-700 flex justify-between items-center"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ${item.price.toFixed(2)} × {item.quantity}
                          </div>
                          {item.notes && (
                            <div className="text-xs italic mt-1">{item.notes}</div>
                          )}
                        </div>
                        
                        <div className="flex items-center">
                          <span className="font-medium mr-3">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                          
                          <div className="flex items-center space-x-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="w-6 h-6 p-0"
                              onClick={() => handleQuantityChange(item.id, false)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm w-5 text-center">{item.quantity}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="w-6 h-6 p-0"
                              onClick={() => handleQuantityChange(item.id, true)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <Button 
                            type="button" 
                            variant="ghost"
                            size="sm"
                            className="ml-1 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                    <div>No items added</div>
                    <div className="text-sm">Select items from the menu or add custom items</div>
                  </div>
                )}
              </div>
              
              {/* Order Notes */}
              <div className="mb-4 p-4 border rounded-lg dark:border-gray-700">
                <Label htmlFor="orderNotes" className="block mb-2">Order Notes</Label>
                <Input
                  id="orderNotes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes for the order (optional)"
                />
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
                  {error}
                </div>
              )}
              
              {/* Total and Submit */}
              <div className="border rounded-lg dark:border-gray-700 p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Amount:</span>
                  <span className="font-bold text-xl">${totalAmount.toFixed(2)}</span>
                </div>
                
                <div className="flex gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1" 
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-teal-600 hover:bg-teal-700"
                    disabled={isSubmitting || items.length === 0}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Order'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrderPanel;
