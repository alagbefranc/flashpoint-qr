import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Clock, Filter } from 'lucide-react';

interface ExpiringItemsHeaderProps {
  daysThreshold: number;
  onThresholdChange: (days: number) => void;
}

export default function ExpiringItemsHeader({ daysThreshold, onThresholdChange }: ExpiringItemsHeaderProps) {
  const [selectedThreshold, setSelectedThreshold] = useState(daysThreshold.toString());

  const handleThresholdChange = (value: string) => {
    setSelectedThreshold(value);
    onThresholdChange(parseInt(value, 10));
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Items Expiring Soon</h1>
        <p className="text-muted-foreground">
          Monitor and manage inventory items approaching their expiration date
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1 py-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>Showing next:</span>
          </Badge>
          
          <Select value={selectedThreshold} onValueChange={handleThresholdChange}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 days</SelectItem>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
