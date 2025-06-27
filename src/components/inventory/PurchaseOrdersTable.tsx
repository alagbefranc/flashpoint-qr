import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { PurchaseOrder } from '@/app/dashboard/inventory/purchase-orders/page';
import { formatDate } from '@/lib/utils';
import { Edit, Eye, FileDown, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface PurchaseOrdersTableProps {
  orders: PurchaseOrder[];
  onViewOrder?: (order: PurchaseOrder) => void;
  onEditOrder?: (order: PurchaseOrder) => void;
  onDeleteOrder?: (orderId: string) => void;
}

export default function PurchaseOrdersTable({ 
  orders,
  onViewOrder,
  onEditOrder,
  onDeleteOrder
}: PurchaseOrdersTableProps) {
  
  // Function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  // Function to get status badge color
  const getStatusBadge = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'sent':
        return <Badge variant="secondary">Sent</Badge>;
      case 'received':
        return <Badge variant="default" className="bg-green-600">Received</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.orderNumber}</TableCell>
              <TableCell>{order.supplier}</TableCell>
              <TableCell>{order.createdAt ? formatDate(order.createdAt) : 'N/A'}</TableCell>
              <TableCell>{getStatusBadge(order.status)}</TableCell>
              <TableCell>{formatCurrency(order.total)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {onViewOrder && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewOrder(order)}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Button>
                  )}
                  
                  {onEditOrder && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditOrder(order)}
                      disabled={order.status === 'received' || order.status === 'cancelled'}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                  >
                    <FileDown className="h-4 w-4" />
                    <span className="sr-only">Download</span>
                  </Button>
                  
                  {onDeleteOrder && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this order?')) {
                          onDeleteOrder(order.id!);
                        }
                      }}
                      disabled={order.status !== 'draft'}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          
          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No purchase orders found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
