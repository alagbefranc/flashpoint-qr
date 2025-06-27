import { useState } from 'react';
import { format } from 'date-fns';
import { AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { ExpiringItem } from '@/app/dashboard/inventory/expiring-soon/page';
import { useAuth } from '@/lib/context/AuthContext';

interface ExpiringItemsTableProps {
  items: ExpiringItem[];
}

export default function ExpiringItemsTable({ items }: ExpiringItemsTableProps) {
  const { user } = useAuth();
  const [sortField, setSortField] = useState<keyof ExpiringItem>('daysUntilExpiry');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Handle sorting
  const handleSort = (field: keyof ExpiringItem) => {
    if (sortField === field) {
      // Toggle direction if the same field is clicked
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to ascending if a new field is selected
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort items based on current sort field and direction
  const sortedItems = [...items].sort((a, b) => {
    // Handle different data types
    if (sortField === 'expirationDate') {
      const dateA = a.expirationDate.toDate();
      const dateB = b.expirationDate.toDate();
      return sortDirection === 'asc' 
        ? dateA.getTime() - dateB.getTime() 
        : dateB.getTime() - dateA.getTime();
    } else if (sortField === 'daysUntilExpiry' || sortField === 'quantity') {
      // Numeric fields
      return sortDirection === 'asc'
        ? a[sortField] - b[sortField]
        : b[sortField] - a[sortField];
    } else {
      // String fields
      const valA = String(a[sortField] || '').toLowerCase();
      const valB = String(b[sortField] || '').toLowerCase();
      return sortDirection === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }
  });

  // Helper for urgency level based on days until expiry
  const getUrgencyLevel = (days: number): 'critical' | 'warning' | 'notice' => {
    if (days <= 1) return 'critical';
    if (days <= 3) return 'warning';
    return 'notice';
  };

  // Get style for urgency badge
  const getUrgencyBadgeStyle = (urgency: 'critical' | 'warning' | 'notice') => {
    switch (urgency) {
      case 'critical':
        return 'bg-destructive text-destructive-foreground hover:bg-destructive/80';
      case 'warning':
        return 'bg-orange-500 text-white hover:bg-orange-600';
      case 'notice':
        return 'bg-yellow-500 text-white hover:bg-yellow-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('name')}
            >
              Item Name
              {sortField === 'name' && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('category')}
            >
              Category
              {sortField === 'category' && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('quantity')}
            >
              Quantity
              {sortField === 'quantity' && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('expirationDate')}
            >
              Expires On
              {sortField === 'expirationDate' && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('daysUntilExpiry')}
            >
              Days Left
              {sortField === 'daysUntilExpiry' && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedItems.map((item) => {
            const urgency = getUrgencyLevel(item.daysUntilExpiry);
            
            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>
                  {item.quantity} {item.unit}
                </TableCell>
                <TableCell>
                  {item.expirationDate 
                    ? format(item.expirationDate.toDate(), 'MMM d, yyyy') 
                    : 'No date'}
                </TableCell>
                <TableCell>
                  <Badge 
                    className={getUrgencyBadgeStyle(urgency)}
                  >
                    {item.daysUntilExpiry <= 0 
                      ? 'Expired'
                      : item.daysUntilExpiry === 1
                      ? '1 day'
                      : `${item.daysUntilExpiry} days`}
                  </Badge>
                </TableCell>
                <TableCell>{item.location || 'Not specified'}</TableCell>
                <TableCell>
                  {item.daysUntilExpiry <= 0 ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            <span>Expired</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>This item should be removed from inventory</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : urgency === 'critical' ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            <span>Critical</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Use immediately or prepare to discard</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : urgency === 'warning' ? (
                    <span className="text-orange-500">Use soon</span>
                  ) : (
                    <span className="text-yellow-600">Plan usage</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">View</Button>
                    <Button variant="outline" size="sm">Use</Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
