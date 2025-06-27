import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/Sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { toast } from '@/components/ui/use-toast';
import { Ingredient } from '@/app/dashboard/inventory/stock/page';
import { XCircle } from 'lucide-react';

interface StockAdjustmentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  ingredients: Ingredient[];
  onSubmit: (data: StockAdjustmentFormData) => Promise<void>;
  isLoading: boolean;
}

export interface StockAdjustmentFormData {
  ingredientId: string;
  adjustmentType: 'stock-in' | 'stock-out';
  quantity: number;
  reason: string;
  notes?: string;
  supplier?: string;
  cost?: number;
}

export default function StockAdjustmentPanel({
  isOpen,
  onClose,
  ingredients,
  onSubmit,
  isLoading
}: StockAdjustmentPanelProps) {
  const [activeTab, setActiveTab] = useState<'stock-in' | 'stock-out'>('stock-in');
  const [selectedIngredient, setSelectedIngredient] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [supplier, setSupplier] = useState<string>('');
  const [cost, setCost] = useState<string>('');

  const stockInReasons = [
    'Regular Order',
    'Emergency Restock',
    'Special Order',
    'Inventory Correction',
    'Other'
  ];

  const stockOutReasons = [
    'Production',
    'Expired',
    'Damaged',
    'Inventory Correction',
    'Transfer to Another Location',
    'Other'
  ];

  // Reset form when tab changes
  useEffect(() => {
    setSelectedIngredient('');
    setQuantity(0);
    setReason('');
    setNotes('');
    setSupplier('');
    setCost('');
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedIngredient) {
      toast({
        title: "Missing ingredient",
        description: "Please select an ingredient",
        variant: "destructive"
      });
      return;
    }

    if (!quantity || quantity <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a quantity greater than zero",
        variant: "destructive"
      });
      return;
    }

    if (!reason) {
      toast({
        title: "Missing reason",
        description: "Please select a reason for the adjustment",
        variant: "destructive"
      });
      return;
    }

    const formData: StockAdjustmentFormData = {
      ingredientId: selectedIngredient,
      adjustmentType: activeTab,
      quantity,
      reason,
      notes: notes || undefined,
      supplier: activeTab === 'stock-in' ? supplier || undefined : undefined,
      cost: activeTab === 'stock-in' && cost ? parseFloat(cost) : undefined
    };

    try {
      await onSubmit(formData);
      // Reset form fields on successful submission
      setSelectedIngredient('');
      setQuantity(0);
      setReason('');
      setNotes('');
      setSupplier('');
      setCost('');
      
      // Close the panel
      onClose();
    } catch (error) {
      console.error('Error submitting stock adjustment:', error);
      toast({
        title: "Failed to submit",
        description: "There was a problem submitting your stock adjustment",
        variant: "destructive"
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={isOpen => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto" side="right">
        <SheetHeader className="pb-4">
          <div className="flex justify-between items-center">
            <SheetTitle>Stock Adjustment</SheetTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="p-1">
              <XCircle className="h-5 w-5" />
            </Button>
          </div>
          <SheetDescription>
            Record stock adjustments for inventory management
          </SheetDescription>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'stock-in' | 'stock-out')}
          className="mt-4"
        >
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="stock-in">Stock In</TabsTrigger>
            <TabsTrigger value="stock-out">Stock Out</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div className="space-y-4">
              {/* Ingredient Selection */}
              <div>
                <Label htmlFor="ingredient">Ingredient</Label>
                <Select 
                  value={selectedIngredient} 
                  onValueChange={setSelectedIngredient}
                >
                  <SelectTrigger id="ingredient">
                    <SelectValue placeholder="Select ingredient" />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredients.map(ing => (
                      <SelectItem key={ing.id} value={ing.id}>
                        {ing.name} ({ing.currentStock} {ing.unit} in stock)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input 
                  id="quantity"
                  type="number"
                  min={0}
                  step={0.01}
                  value={quantity || ''}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                />
              </div>

              {/* Reason Selection */}
              <div>
                <Label>Reason</Label>
                <RadioGroup value={reason} onValueChange={setReason} className="mt-2">
                  {(activeTab === 'stock-in' ? stockInReasons : stockOutReasons).map(r => (
                    <div key={r} className="flex items-center space-x-2">
                      <RadioGroupItem value={r} id={`reason-${r}`} />
                      <Label htmlFor={`reason-${r}`} className="cursor-pointer">{r}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Additional Fields for Stock In */}
              {activeTab === 'stock-in' && (
                <>
                  <div>
                    <Label htmlFor="supplier">Supplier (Optional)</Label>
                    <Input 
                      id="supplier"
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="cost">Cost (Optional)</Label>
                    <Input 
                      id="cost"
                      type="number"
                      min={0}
                      step={0.01}
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </>
              )}

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea 
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Submitting...' : 'Submit Stock Adjustment'}
            </Button>
          </form>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
