import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Calendar } from '@/components/ui/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/Sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { PurchaseOrder, PurchaseOrderItem } from '@/app/dashboard/inventory/purchase-orders/page';
import { Ingredient } from '@/app/dashboard/inventory/stock/page';
import { XCircle, Plus, Trash } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface PurchaseOrderPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => Promise<void>;
  ingredients: Ingredient[];
  existingOrder?: PurchaseOrder;
  isLoading: boolean;
}

export default function PurchaseOrderPanel({
  isOpen,
  onClose,
  onSubmit,
  ingredients,
  existingOrder,
  isLoading
}: PurchaseOrderPanelProps) {
  const [orderNumber, setOrderNumber] = useState('');
  const [supplier, setSupplier] = useState('');
  const [status, setStatus] = useState<PurchaseOrder['status']>('draft');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [total, setTotal] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [expectedDelivery, setExpectedDelivery] = useState<Date | undefined>(undefined);
  
  // Form for adding new items
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);

  // Reset form when panel opens/closes or when editing a different order
  useEffect(() => {
    if (isOpen) {
      if (existingOrder) {
        // Editing existing order
        setOrderNumber(existingOrder.orderNumber);
        setSupplier(existingOrder.supplier);
        setStatus(existingOrder.status);
        setNotes(existingOrder.notes || '');
        setItems(existingOrder.items);
        setTotal(existingOrder.total);
        setExpectedDelivery(existingOrder.expectedDelivery?.toDate?.() || undefined);
      } else {
        // New order - generate a new order number
        const timestamp = new Date().getTime();
        const randomNum = Math.floor(Math.random() * 1000);
        setOrderNumber(`PO-${timestamp.toString().slice(-6)}${randomNum}`);
        setSupplier('');
        setStatus('draft');
        setNotes('');
        setItems([]);
        setTotal(0);
        setExpectedDelivery(undefined);
      }
    }
  }, [isOpen, existingOrder]);

  // Calculate total whenever items change
  useEffect(() => {
    const newTotal = items.reduce((sum, item) => sum + item.total, 0);
    setTotal(newTotal);
  }, [items]);

  // Handle adding an item to the order
  const handleAddItem = () => {
    const ingredientObj = ingredients.find(i => i.id === selectedIngredient);
    
    if (!ingredientObj) {
      toast({
        title: "Error",
        description: "Please select an ingredient",
        variant: "destructive"
      });
      return;
    }
    
    if (quantity <= 0) {
      toast({
        title: "Error",
        description: "Quantity must be greater than zero",
        variant: "destructive"
      });
      return;
    }
    
    if (unitPrice < 0) {
      toast({
        title: "Error",
        description: "Unit price cannot be negative",
        variant: "destructive"
      });
      return;
    }
    
    const newItem: PurchaseOrderItem = {
      ingredientId: ingredientObj.id,
      ingredientName: ingredientObj.name,
      quantity,
      unit: ingredientObj.unit,
      unitPrice,
      total: quantity * unitPrice
    };
    
    setItems(prev => [...prev, newItem]);
    
    // Reset form fields
    setSelectedIngredient('');
    setQuantity(1);
    setUnitPrice(0);
  };
  
  // Handle removing an item
  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: Record<string, string> = {};
    
    if (!supplier.trim()) {
      newErrors.supplier = 'Supplier is required';
    }
    
    if (items.length === 0) {
      newErrors.items = 'At least one item is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      // Create the base order object
      const orderData: any = {
        orderNumber,
        supplier,
        status,
        total,
        items,
        expectedDelivery: expectedDelivery
      };
      
      // Only add notes if it's not empty
      const trimmedNotes = notes.trim();
      if (trimmedNotes) {
        orderData.notes = trimmedNotes;
      }
      
      await onSubmit(orderData);
      
      toast({
        title: existingOrder ? "Order updated" : "Order created",
        description: existingOrder 
          ? "Purchase order has been updated successfully" 
          : "New purchase order has been created",
      });
    } catch (error) {
      console.error("Error submitting purchase order:", error);
    }
  };
  
  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Sheet open={isOpen} onOpenChange={isOpen => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-lg lg:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex justify-between items-center">
            <SheetTitle>
              {existingOrder ? 'Edit Purchase Order' : 'Create Purchase Order'}
            </SheetTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="p-1">
              <XCircle className="h-5 w-5" />
            </Button>
          </div>
          <SheetDescription>
            {existingOrder
              ? 'Update details for this purchase order'
              : 'Fill in the details to create a new purchase order'}
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Order Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderNumber">Order Number</Label>
              <Input
                id="orderNumber"
                value={orderNumber}
                onChange={e => setOrderNumber(e.target.value)}
                disabled
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                placeholder="Enter supplier name"
                className={errors.supplier ? "border-destructive" : ""}
              />
              {errors.supplier && (
                <p className="text-destructive text-xs mt-1">{errors.supplier}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expectedDelivery">Expected Delivery</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    {expectedDelivery ? (
                      format(expectedDelivery, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={expectedDelivery}
                    onSelect={(date: Date | undefined) => {
                      setExpectedDelivery(date);
                      setDatePickerOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Order Items Section */}
          <div className="space-y-4">
            <h3 className="font-medium">Order Items</h3>
            
            {items.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.ingredientName}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell>{formatCurrency(item.total)}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center p-4 border rounded-md">
                <p className="text-muted-foreground">No items added yet</p>
              </div>
            )}

            {errors.items && (
              <p className="text-destructive text-xs">{errors.items}</p>
            )}
            
            {/* Add Item Form */}
            <div className="border rounded-md p-4 space-y-4">
              <h4 className="font-medium">Add Item</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ingredient">Ingredient</Label>
                  <Select value={selectedIngredient} onValueChange={setSelectedIngredient}>
                    <SelectTrigger id="ingredient">
                      <SelectValue placeholder="Select ingredient" />
                    </SelectTrigger>
                    <SelectContent>
                      {ingredients.map(ingredient => (
                        <SelectItem key={ingredient.id} value={ingredient.id}>
                          {ingredient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={e => setQuantity(parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Unit Price ($)</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={unitPrice}
                    onChange={e => setUnitPrice(parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Order Total */}
            <div className="flex justify-end">
              <div className="bg-muted p-2 px-4 rounded-md">
                <span className="font-medium">Total:</span> {formatCurrency(total)}
              </div>
            </div>
          </div>
          
          {/* Notes Section */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add any additional notes or instructions here"
              rows={3}
            />
          </div>
          
          {/* Submit Button */}
          <SheetFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Saving...' : existingOrder ? 'Update Order' : 'Create Order'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
