'use client';

import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Clock } from 'lucide-react';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  modifiers?: Array<{
    name: string;
    options: string[];
  }>;
  notes?: string;
}

export interface Order {
  id: string;
  customerName?: string;
  tableNumber?: string | number;
  status: 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  items: OrderItem[];
  totalAmount: number;
  subtotal: number;
  tax: number;
  tip?: number;
  createdAt: number; // timestamp
  notes?: string;
}

interface OrderCardProps {
  order: Order;
  onClick: (order: Order) => void;
}

const OrderCard = ({ order, onClick }: OrderCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'preparing': return 'bg-yellow-500';
      case 'ready': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <Card 
      className="mb-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500"
      onClick={() => onClick(order)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-lg">Order #{order.id.slice(-6)}</h3>
            <p className="text-sm text-gray-500">
              {order.customerName || 'Guest'} • Table {order.tableNumber || 'N/A'}
            </p>
          </div>
          <Badge className={`${getStatusColor(order.status)} text-white`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </div>
        
        <div className="mt-3">
          <p className="text-sm text-gray-700">
            {order.items.length} items • ${order.totalAmount.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 flex items-center mt-1">
            <Clock className="h-3 w-3 mr-1" />
            {new Date(order.createdAt).toLocaleTimeString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCard;
