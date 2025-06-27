import { Button } from '@/components/ui/Button';
import { PlusCircle } from 'lucide-react';

interface PurchaseOrdersHeaderProps {
  onCreateClick: () => void;
}

export default function PurchaseOrdersHeader({ onCreateClick }: PurchaseOrdersHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">
            Manage your supplier orders and deliveries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onCreateClick} className="whitespace-nowrap">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Order
          </Button>
        </div>
      </div>
    </div>
  );
}
