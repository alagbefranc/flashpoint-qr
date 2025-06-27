'use client';

import { useState } from 'react';
import { SlidePanel } from '@/components/ui/SlidePanel';

export default function LiveOrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);

  const handleViewOrderDetails = (orderId: string) => {
    setSelectedOrder(orderId);
    setIsDetailsPanelOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Live Orders</h1>
          <p className="text-gray-500 mt-1">
            Track and manage orders in real-time
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* New Orders Column */}
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
          <h2 className="font-semibold text-lg mb-4 text-card-foreground">New Orders</h2>
          <div className="space-y-3">
            {/* Placeholder for order cards */}
            <div 
              className="bg-card border border-border rounded-md p-3 cursor-pointer hover:bg-accent"
              onClick={() => handleViewOrderDetails('new-1')}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">#1234</p>
                  <p className="text-sm text-muted-foreground">Table 5 • 3 items</p>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">New</span>
              </div>
            </div>
          </div>
        </div>

        {/* In Progress Column */}
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
          <h2 className="font-semibold text-lg mb-4 text-card-foreground">In Progress</h2>
          <div className="space-y-3">
            {/* Placeholder for order cards */}
            <div 
              className="bg-card border border-border rounded-md p-3 cursor-pointer hover:bg-accent"
              onClick={() => handleViewOrderDetails('in-progress-1')}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">#1233</p>
                  <p className="text-sm text-muted-foreground">Table 3 • 5 items</p>
                </div>
                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded">In Progress</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Started 10 minutes ago
              </div>
            </div>
          </div>
        </div>

        {/* Ready Column */}
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
          <h2 className="font-semibold text-lg mb-4 text-card-foreground">Ready</h2>
          <div className="space-y-3">
            {/* Placeholder for order cards */}
            <div 
              className="bg-card border border-border rounded-md p-3 cursor-pointer hover:bg-accent"
              onClick={() => handleViewOrderDetails('ready-1')}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">#1232</p>
                  <p className="text-sm text-muted-foreground">Table 2 • 2 items</p>
                </div>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Ready</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Ready for 2 minutes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Details Slide Panel */}
      <SlidePanel
        isOpen={isDetailsPanelOpen}
        onClose={() => setIsDetailsPanelOpen(false)}
        title="Order Details"
        width="md"
      >
        <div className="space-y-4">
          <p>Order ID: {selectedOrder}</p>
          <p className="text-muted-foreground">
            This is a placeholder for order details. In a real implementation, this would fetch 
            and display detailed information about the selected order.
          </p>
        </div>
      </SlidePanel>
    </div>
  );
}
