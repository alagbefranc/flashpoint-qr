'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { RefreshCw, Search, PlusCircle } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import OrderCard, { Order } from '@/components/orders/OrderCard';
import OrderDetailsPanel from '@/components/orders/OrderDetailsPanel';
import CreateOrderPanel from '@/components/orders/CreateOrderPanel';



export default function OrdersPage() {
  const { user, restaurant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  
  // Fetch orders from Firestore
  useEffect(() => {
    if (!restaurant?.id) return;
    
    setLoading(true);
    
    const ordersRef = collection(db, 'restaurants', restaurant.id, 'orders');
    const q = query(
      ordersRef,
      where('status', 'in', ['new', 'preparing', 'ready']),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orderData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()?.getTime() || Date.now()
      }));
      
      setOrders(orderData);
      setFilteredOrders(orderData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching orders:', error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [restaurant?.id]);
  
  // Filter orders based on active tab and search term
  useEffect(() => {
    let filtered = orders;
    
    if (activeTab !== 'all') {
      filtered = filtered.filter(order => order.status === activeTab);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(term) ||
        (order.customerName && order.customerName.toLowerCase().includes(term)) ||
        (order.tableNumber && order.tableNumber.toString().includes(term))
      );
    }
    
    setFilteredOrders(filtered);
  }, [activeTab, searchTerm, orders]);
  
  // Handle order status changes
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (!restaurant?.id || !orderId) return;
    
    try {
      // Update the order status in Firestore
      const orderRef = doc(db, 'restaurants', restaurant.id, 'orders', orderId);
      
      await updateDoc(orderRef, { 
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid || 'unknown'
      });
      
      console.log(`Order ${orderId} status updated to ${newStatus}`);
      
      // We don't need to manually update local state as the onSnapshot listener will catch the changes
      // However, we'll update the selected order directly for immediate UI feedback
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
      
      // Close the panel if the order is completed or cancelled
      if (newStatus === 'completed' || newStatus === 'cancelled') {
        setTimeout(() => {
          setSelectedOrder(null);
        }, 1000);
      }
      
    } catch (error: any) {
      console.error('Error updating order status:', error);
      // Show error notification to user
      alert(`Failed to update order status: ${error.message || 'Unknown error'}`);
    }
  };
  
  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Current Orders</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowCreatePanel(true)}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700"
          >
            <PlusCircle className="h-4 w-4" /> Create Order
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="flex-1 max-w-md"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="preparing">Preparing</TabsTrigger>
            <TabsTrigger value="ready">Ready</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search orders..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <OrderCard 
              key={order.id} 
              order={order} 
              onClick={(order: Order) => setSelectedOrder(order)} 
            />
          ))}
        </div>
      ) : (
        <EmptyState 
          title="No orders found" 
          description={searchTerm ? "Try adjusting your search or filters" : "New orders will appear here"} 
        />
      )}
      
      {/* Order details side panel */}
      {selectedOrder && (
        <OrderDetailsPanel 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
          onStatusChange={handleStatusChange} 
        />
      )}

      {/* Create order panel */}
      <CreateOrderPanel
        restaurantId={restaurant?.id || ''}
        isVisible={showCreatePanel}
        onClose={() => setShowCreatePanel(false)}
        onOrderCreated={() => {
          // The real-time listener will automatically update the orders list
          // Show a success message if needed
        }}
      />
    </div>
  );
}
