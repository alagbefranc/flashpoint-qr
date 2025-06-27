'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/context/AuthContext';
import KOTCard from '@/components/orders/KOTCard';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';

interface Order {
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
}

export default function KOTPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.restaurantId) return;

    // Create a query to get orders with 'new' or 'preparing' status
    const ordersQuery = query(
      collection(db, 'restaurants', user.restaurantId, 'orders'),
      where('status', 'in', ['new', 'preparing']),
      orderBy('createdAt', 'asc')
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const orderData: Order[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Omit<Order, 'id'>;
        orderData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Date ? data.createdAt.getTime() : data.createdAt,
        });
      });
      setOrders(orderData);
    });

    return () => unsubscribe();
  }, [user]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (!user?.restaurantId) return;

    try {
      const orderRef = doc(db, 'restaurants', user.restaurantId, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const filteredOrders = activeFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === activeFilter);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Kitchen Order Tickets</h1>
      
      <div className="mb-6">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="all" onClick={() => setActiveFilter('all')}>
              All ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="new" onClick={() => setActiveFilter('new')}>
              New ({orders.filter(o => o.status === 'new').length})
            </TabsTrigger>
            <TabsTrigger value="preparing" onClick={() => setActiveFilter('preparing')}>
              Preparing ({orders.filter(o => o.status === 'preparing').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <KOTCard 
              key={order.id} 
              order={order}
              onUpdateStatus={handleUpdateStatus}
            />
          ))
        ) : (
          <div className="col-span-full text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-lg text-gray-500">No orders to display</p>
          </div>
        )}
      </div>
    </div>
  );
}
