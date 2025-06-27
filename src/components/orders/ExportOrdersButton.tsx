import React from 'react';
import { Button } from '@/components/ui/Button';
import { Download } from 'lucide-react';

// Define Order type
interface Order {
  id: string;
  customerName: string;
  tableNumber: string | number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
  }>;
  status: 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  totalAmount: number;
  createdAt: any; // Firestore timestamp
  completedAt?: any; // Firestore timestamp
  notes?: string;
  paymentMethod?: string;
  paymentStatus?: 'pending' | 'paid' | 'refunded';
}

interface ExportOrdersButtonProps {
  orders: Order[];
  filename?: string;
}

const ExportOrdersButton: React.FC<ExportOrdersButtonProps> = ({ 
  orders, 
  filename = 'order-history' 
}) => {
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate();
      return date.toISOString().split('T')[0] + ' ' + 
             date.toTimeString().split(' ')[0];
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const exportToCSV = () => {
    // Define CSV headers
    const headers = [
      'Order ID',
      'Customer',
      'Table',
      'Date Created',
      'Date Completed',
      'Status',
      'Total Amount',
      'Payment Status',
      'Payment Method',
      'Notes',
      'Items'
    ].join(',');

    // Process each order into CSV rows
    const csvRows = orders.map(order => {
      // Format items as a single string
      const itemsString = order.items
        .map(item => `${item.name}(x${item.quantity})`)
        .join('; ');

      // Format each row of data
      return [
        `"${order.id}"`,
        `"${order.customerName || 'Unknown'}"`,
        `"${order.tableNumber || 'N/A'}"`,
        `"${formatDate(order.createdAt)}"`, 
        `"${formatDate(order.completedAt)}"`,
        `"${order.status}"`,
        `"$${order.totalAmount.toFixed(2)}"`,
        `"${order.paymentStatus || 'unknown'}"`,
        `"${order.paymentMethod || 'N/A'}"`,
        `"${(order.notes || '').replace(/"/g, '""')}"`,  // Escape quotes in notes
        `"${itemsString}"`
      ].join(',');
    });

    // Combine headers and rows
    const csvContent = [headers, ...csvRows].join('\n');
    
    // Create a download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create a date string for the filename
    const date = new Date().toISOString().split('T')[0];
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button 
      onClick={exportToCSV}
      variant="outline"
      className="flex items-center gap-2"
      disabled={orders.length === 0}
    >
      <Download className="h-4 w-4" />
      Export to CSV
    </Button>
  );
};

export default ExportOrdersButton;
