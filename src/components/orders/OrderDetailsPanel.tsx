'use client';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { XCircle, CheckCircle } from 'lucide-react';
import { Order } from './OrderCard';

interface OrderDetailsPanelProps {
  order: Order | null;
  onClose: () => void;
  onStatusChange: (orderId: string, newStatus: string) => void;
}

const OrderDetailsPanel = ({ order, onClose, onStatusChange }: OrderDetailsPanelProps) => {
  if (!order) return null;
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return null;
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-xl">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold">Order #{order.id.slice(-6)}</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <XCircle className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <Badge className={`mb-4 ${
                order.status === 'new' ? 'bg-blue-500' : 
                order.status === 'preparing' ? 'bg-yellow-500' : 
                order.status === 'ready' ? 'bg-green-500' : 
                order.status === 'completed' ? 'bg-gray-500' : 
                'bg-red-500'
              } text-white`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
              {getStatusIcon(order.status)}
            </div>
            
            <p className="text-sm mb-1">
              <span className="font-semibold">Customer:</span> {order.customerName || 'Guest'}
            </p>
            <p className="text-sm mb-1">
              <span className="font-semibold">Table:</span> {order.tableNumber || 'N/A'}
            </p>
            <p className="text-sm mb-1">
              <span className="font-semibold">Time:</span> {new Date(order.createdAt).toLocaleString()}
            </p>
            {order.notes && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-semibold">Notes:</p>
                <p className="text-sm">{order.notes}</p>
              </div>
            )}
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Items</h3>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{item.quantity}x {item.name}</p>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <ul className="text-sm text-gray-500 ml-6 list-disc">
                        {item.modifiers.map((mod, idx) => (
                          <li key={idx}>{mod.name}: {mod.options.join(', ')}</li>
                        ))}
                      </ul>
                    )}
                    {item.notes && <p className="text-xs text-gray-500 ml-6 italic">Note: {item.notes}</p>}
                  </div>
                  <p className="font-medium">${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mb-8">
            <div className="flex justify-between text-sm mb-1">
              <span>Subtotal:</span>
              <span>${(order.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span>Tax:</span>
              <span>${(order.tax || 0).toFixed(2)}</span>
            </div>
            {order.tip !== undefined && order.tip > 0 && (
              <div className="flex justify-between text-sm mb-1">
                <span>Tip:</span>
                <span>${order.tip.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg mt-2 border-t pt-2">
              <span>Total:</span>
              <span>${(order.totalAmount || 0).toFixed(2)}</span>
            </div>
          </div>
          
          {/* Status update buttons */}
          <div className="flex flex-col space-y-3 w-full">
            {order.status === 'new' && (
              <Button 
                onClick={() => onStatusChange(order.id, 'preparing')} 
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2"
              >
                Start Preparing
              </Button>
            )}
            {order.status === 'preparing' && (
              <Button 
                onClick={() => onStatusChange(order.id, 'ready')} 
                className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2"
              >
                Mark as Ready
              </Button>
            )}
            {order.status === 'ready' && (
              <Button 
                onClick={() => onStatusChange(order.id, 'completed')} 
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2"
              >
                Complete Order
              </Button>
            )}
            {(order.status === 'new' || order.status === 'preparing' || order.status === 'ready') && (
              <Button 
                onClick={() => onStatusChange(order.id, 'cancelled')} 
                className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2"
              >
                Cancel Order
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPanel;
