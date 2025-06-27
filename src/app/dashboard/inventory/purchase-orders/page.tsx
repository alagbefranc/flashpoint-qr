'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { collection, doc, getDocs, query, orderBy, serverTimestamp, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import PurchaseOrdersHeader from '@/components/inventory/PurchaseOrdersHeader';
import PurchaseOrdersTable from '@/components/inventory/PurchaseOrdersTable';
import PurchaseOrderPanel from '@/components/inventory/PurchaseOrderPanel';
import { toast } from '@/components/ui/use-toast';

export interface PurchaseOrder {
  id?: string;
  orderNumber: string;
  supplier: string;
  status: 'draft' | 'sent' | 'received' | 'cancelled';
  total: number;
  items: PurchaseOrderItem[];
  createdAt: any; // Firestore timestamp
  updatedAt: any; // Firestore timestamp
  createdBy: string; // User ID
  expectedDelivery?: any; // Firestore timestamp
  notes?: string;
}

export interface PurchaseOrderItem {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export default function PurchaseOrdersPage() {
  const { user, restaurant, loading: authLoading } = useAuth();
  
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPanelLoading, setIsPanelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | undefined>(undefined);
  const [ingredients, setIngredients] = useState<any[]>([]);

  // Fetch purchase orders and ingredients from Firebase when component mounts or restaurant changes
  useEffect(() => {
    // Don't try to fetch if auth is still loading or if restaurant ID is not available
    if (authLoading) return;
    
    const fetchData = async () => {
      // Check if we have a restaurant ID after auth has finished loading
      if (!restaurant?.id) {
        console.log('No restaurant ID available, cannot fetch data');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch purchase orders
        const ordersRef = collection(db, 'restaurants', restaurant.id, 'purchaseOrders');
        const q = query(ordersRef, orderBy('createdAt', 'desc'));
        
        const snapshot = await getDocs(q);
        const ordersData: PurchaseOrder[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<PurchaseOrder, 'id'>
        }));
        
        setPurchaseOrders(ordersData);
        
        // Fetch ingredients for the order creation form
        const ingredientsRef = collection(db, 'restaurants', restaurant.id, 'ingredients');
        const ingredientsQuery = query(ingredientsRef, orderBy('name'));
        
        const ingredientsSnapshot = await getDocs(ingredientsQuery);
        const ingredientsData = ingredientsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setIngredients(ingredientsData);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(`Failed to load data: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [restaurant?.id, authLoading]);

  // Function to handle purchase order submission (create or update)
  const handleSubmitPurchaseOrder = async (orderData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    if (!restaurant?.id || !user) {
      setError('User or restaurant data missing');
      return;
    }

    setIsPanelLoading(true);
    setError(null);

    try {
      // Add timestamps and creator info
      const dataWithMeta = {
        ...orderData,
        updatedAt: serverTimestamp(),
        createdBy: user.uid
      };
      
      if (!editingOrder) {
        // Create new order
        dataWithMeta.createdAt = serverTimestamp();
        
        // Add document to Firestore
        const ordersRef = collection(db, 'restaurants', restaurant.id, 'purchaseOrders');
        const docRef = await addDoc(ordersRef, dataWithMeta);
        
        // Add to local state with the new ID
        const newOrderWithId = {
          id: docRef.id,
          ...dataWithMeta,
          createdAt: new Date(), // Use JS Date for local state
          updatedAt: new Date()
        };
        
        setPurchaseOrders(prevOrders => [newOrderWithId, ...prevOrders]);
        toast({
          title: "Purchase order created",
          description: "Your purchase order has been created successfully."
        });
      } else {
        // Update existing order
        const orderRef = doc(db, 'restaurants', restaurant.id, 'purchaseOrders', editingOrder.id!);
        await updateDoc(orderRef, dataWithMeta);
        
        // Update local state
        setPurchaseOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === editingOrder.id 
              ? { ...order, ...dataWithMeta, updatedAt: new Date() }
              : order
          )
        );
        
        toast({
          title: "Purchase order updated",
          description: "Your purchase order has been updated successfully."
        });
      }
      
      // Close the panel and reset editing state
      setIsPanelOpen(false);
      setEditingOrder(undefined);
      
    } catch (err: any) {
      console.error('Error with purchase order:', err);
      setError(`Failed to ${editingOrder ? 'update' : 'create'} purchase order: ${err.message}`);
      toast({
        title: `Failed to ${editingOrder ? 'update' : 'create'} order`,
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsPanelLoading(false);
    }
  };
  
  // Function to handle viewing an order
  const handleViewOrder = (order: PurchaseOrder) => {
    // TODO: Implement view-only mode in panel or create a separate view component
    // For now, we'll just open the edit panel but disable editing
    setEditingOrder(order);
    setIsPanelOpen(true);
  };
  
  // Function to handle editing an order
  const handleEditOrder = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setIsPanelOpen(true);
  };
  
  // Function to handle deleting an order
  const handleDeleteOrder = async (orderId: string) => {
    if (!restaurant?.id) {
      setError('Restaurant data missing');
      return;
    }
    
    try {
      // Delete from Firestore
      const orderRef = doc(db, 'restaurants', restaurant.id, 'purchaseOrders', orderId);
      await deleteDoc(orderRef);
      
      // Remove from local state
      setPurchaseOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
      
      toast({
        title: "Purchase order deleted",
        description: "The purchase order has been deleted successfully."
      });
    } catch (err: any) {
      console.error('Error deleting purchase order:', err);
      setError(`Failed to delete purchase order: ${err.message}`);
      toast({
        title: "Failed to delete order",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="large" />
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-md p-4 mb-6">
          <p className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </p>
        </div>
      )}
      
      {/* Page content when data is loaded */}
      {!isLoading && !error && (
        <>
          {/* Header with actions */}
          <PurchaseOrdersHeader 
            onCreateClick={() => {
              setEditingOrder(undefined); // Clear any editing state
              setIsPanelOpen(true);  // Open panel for creation
            }}
          />
          
          {/* Main content */}
          <div className="space-y-6">
            {purchaseOrders.length === 0 ? (
              <EmptyState 
                title="No purchase orders"
                description="Create your first purchase order to get started."
                actionLabel="Create Purchase Order"
                onAction={() => {
                  setEditingOrder(undefined);
                  setIsPanelOpen(true);
                }}
              />
            ) : (
              <PurchaseOrdersTable 
                orders={purchaseOrders}
                onViewOrder={handleViewOrder}
                onEditOrder={handleEditOrder}
                onDeleteOrder={handleDeleteOrder}
              />
            )}
          </div>
        </>
      )}
      
      {/* Purchase Order Panel */}
      <PurchaseOrderPanel
        isOpen={isPanelOpen}
        onClose={() => {
          setIsPanelOpen(false);
          setEditingOrder(undefined);
        }}
        onSubmit={handleSubmitPurchaseOrder}
        ingredients={ingredients}
        existingOrder={editingOrder}
        isLoading={isPanelLoading}
      />
    </div>
  );
}
