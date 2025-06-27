'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Clock, ChevronRight } from 'lucide-react';

interface KOTProps {
  order: {
    id: string;
    items: {
      name: string;
      quantity: number;
      notes?: string;
      modifiers?: Array<{ name: string; options: string[] }>;
    }[];
    status: string;
    tableNumber?: string;
    customerName?: string;
    orderType: string;
    createdAt: number;
  };
  onUpdateStatus: (orderId: string, status: string) => void;
}

const KOTCard: React.FC<KOTProps> = ({ order, onUpdateStatus }) => {
  const formattedTime = new Date(order.createdAt).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const timeSinceOrder = () => {
    const now = Date.now();
    const diff = Math.floor((now - order.createdAt) / 60000); // minutes
    return diff;
  };

  const minutes = timeSinceOrder();

  const getStatusColor = () => {
    if (order.status === 'new') return 'bg-red-500';
    if (order.status === 'preparing') return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getStatusAction = () => {
    if (order.status === 'new') return { 
      label: 'Start Preparing', 
      action: () => onUpdateStatus(order.id, 'preparing'),
      color: 'bg-yellow-500 hover:bg-yellow-600'
    };
    
    if (order.status === 'preparing') return { 
      label: 'Mark as Ready', 
      action: () => onUpdateStatus(order.id, 'ready'),
      color: 'bg-green-500 hover:bg-green-600'
    };
    
    return null;
  };

  const statusAction = getStatusAction();

  return (
    <Card className={`border-l-8 ${getStatusColor()} overflow-hidden`}>
      <CardContent className="p-0">
        {/* Header */}
        <div className="bg-gray-100 p-4 flex justify-between items-center">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold">#{order.id.slice(-6)}</h3>
              <Badge className={`${getStatusColor()} text-white`}>
                {order.status.toUpperCase()}
              </Badge>
            </div>
            <div className="text-sm text-gray-600">
              {order.orderType === 'dine-in' ? `Table ${order.tableNumber}` : order.orderType}
              {order.customerName && ` • ${order.customerName}`}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center text-gray-600">
              <Clock className="h-4 w-4 mr-1" />
              <span>{formattedTime}</span>
            </div>
            <div className="text-sm font-medium">
              {minutes < 1 ? 'Just now' : `${minutes} min ago`}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="p-4">
          <ul className="space-y-3">
            {order.items.map((item, index) => (
              <li key={index} className="flex justify-between">
                <div>
                  <div className="font-medium text-lg">
                    {item.quantity}x {item.name}
                  </div>
                  {item.modifiers && item.modifiers.length > 0 && (
                    <ul className="text-sm text-gray-500 ml-5 list-disc">
                      {item.modifiers.map((mod, idx) => (
                        <li key={idx}>
                          {mod.name}: {mod.options.join(', ')}
                        </li>
                      ))}
                    </ul>
                  )}
                  {item.notes && (
                    <p className="ml-5 text-sm text-red-600 italic">
                      Note: {item.notes}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Footer */}
        {statusAction && (
          <div className="border-t p-3 bg-gray-50">
            <Button 
              onClick={statusAction.action}
              className={`w-full text-white font-medium ${statusAction.color} flex items-center justify-center space-x-1`}
            >
              <span>{statusAction.label}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KOTCard;
