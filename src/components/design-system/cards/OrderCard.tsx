'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

// Types
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

export interface OrderCardProps {
  id: string;
  tableNumber: string | number;
  items: OrderItem[];
  status: OrderStatus;
  timestamp: Date;
  className?: string;
  onStatusChange?: (id: string, status: OrderStatus) => void;
  onViewDetails?: (id: string) => void;
}

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  preparing: 'bg-blue-100 text-blue-800 border-blue-200',
  ready: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  delivered: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200'
};

const getNextStatus = (status: OrderStatus): OrderStatus | null => {
  switch (status) {
    case 'pending': return 'preparing';
    case 'preparing': return 'ready';
    case 'ready': return 'delivered';
    default: return null;
  }
};

export function OrderCard({
  id,
  tableNumber,
  items,
  status,
  timestamp,
  className,
  onStatusChange,
  onViewDetails
}: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(status);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setCurrentStatus(status);
  }, [status]);

  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(timestamp);

  const handleStatusChange = () => {
    const nextStatus = getNextStatus(currentStatus);
    if (nextStatus && onStatusChange) {
      setIsAnimating(true);
      setTimeout(() => {
        onStatusChange(id, nextStatus);
        setIsAnimating(false);
      }, 300);
    }
  };

  return (
    <div 
      className={cn(
        'bg-white border rounded-lg shadow-sm overflow-hidden transition-all duration-300',
        'hover:shadow-md',
        isAnimating && 'scale-[1.02]',
        className
      )}
    >
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-gray-800">
            Order #{id.slice(-4)}
          </h3>
          <span className="text-sm font-medium text-gray-500">
            {formattedTime}
          </span>
        </div>
        
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            Table {tableNumber}
          </span>
          <span 
            className={cn(
              'px-2 py-1 rounded-full text-xs font-medium border',
              statusColors[currentStatus]
            )}
          >
            {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
          </span>
        </div>
        
        <div className="mt-3 space-y-1">
          {items.slice(0, isExpanded ? items.length : 2).map((item, i) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.quantity}× {item.name}</span>
              <span className="font-medium">${(item.quantity * item.price).toFixed(2)}</span>
            </div>
          ))}
          
          {!isExpanded && items.length > 2 && (
            <button
              onClick={() => setIsExpanded(true)}
              className="text-sm text-primary hover:text-primary-dark transition-colors mt-1"
            >
              +{items.length - 2} more items
            </button>
          )}
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
          <div>
            <span className="text-xs text-gray-500">Total</span>
            <p className="text-lg font-semibold text-gray-900">${totalPrice.toFixed(2)}</p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => onViewDetails?.(id)}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Details
            </button>
            
            {getNextStatus(currentStatus) && (
              <button
                onClick={handleStatusChange}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-white hover:bg-primary-dark transition-colors"
              >
                {getNextStatus(currentStatus) === 'preparing' ? 'Start' : 
                 getNextStatus(currentStatus) === 'ready' ? 'Ready' : 'Complete'}
              </button>
            )}
            
            {currentStatus === 'pending' && (
              <button
                onClick={() => onStatusChange?.(id, 'cancelled')}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
