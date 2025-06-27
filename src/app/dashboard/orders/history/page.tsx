'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Calendar } from '@/components/ui/Calendar';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { CalendarIcon } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ExportOrdersButton from '@/components/orders/ExportOrdersButton';

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

// Order History Table Component
const OrderHistoryTable = ({ orders }: { orders: Order[] }) => {
  return (
    <div className="w-full overflow-auto">
      <table className="w-full min-w-[800px] table-auto">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800">
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Order ID</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Customer</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Table</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Total</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Payment</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50">
              <td className="px-4 py-3 text-sm">{order.id.substring(0, 8)}</td>
              <td className="px-4 py-3 text-sm">{order.customerName}</td>
              <td className="px-4 py-3 text-sm">
                {order.createdAt ? format(order.createdAt.toDate(), 'MMM dd, yyyy h:mm a') : 'N/A'}
              </td>
              <td className="px-4 py-3 text-sm">{order.tableNumber}</td>
              <td className="px-4 py-3 text-sm">${order.totalAmount.toFixed(2)}</td>
              <td className="px-4 py-3">
                <StatusBadge status={order.status} />
              </td>
              <td className="px-4 py-3">
                <PaymentBadge status={order.paymentStatus || 'pending'} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }: { status: Order['status'] }) => {
  const statusColors = {
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    preparing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    ready: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  const statusLabel = {
    new: 'New',
    preparing: 'Preparing',
    ready: 'Ready',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
      {statusLabel[status]}
    </span>
  );
};

// Payment Badge Component
const PaymentBadge = ({ status }: { status: 'pending' | 'paid' | 'refunded' }) => {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    refunded: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  const statusLabel = {
    pending: 'Pending',
    paid: 'Paid',
    refunded: 'Refunded',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
      {statusLabel[status]}
    </span>
  );
};

// Date Range Selector Component
const DateRangePicker = ({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange 
}: {
  startDate: Date | null,
  endDate: Date | null,
  onStartDateChange: (date: Date | null) => void,
  onEndDateChange: (date: Date | null) => void
}) => {
  return (
    <div className="flex space-x-2">
      <div className="flex flex-col space-y-1">
        <span className="text-sm font-medium">From</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, 'PPP') : <span>Select date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={startDate || undefined}
              onSelect={onStartDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="flex flex-col space-y-1">
        <span className="text-sm font-medium">To</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, 'PPP') : <span>Select date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={endDate || undefined}
              onSelect={onEndDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

// Main Order History Page
export default function OrderHistoryPage() {
  const { user, restaurant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  const PAGE_SIZE = 10;
  
  // Initial load of orders
  useEffect(() => {
    if (!restaurant?.id) return;
    
    async function loadOrders() {
      setLoading(true);
      try {
        // Only fetch completed or cancelled orders for history
        let baseQuery = query(
          collection(db, `restaurants/${restaurant.id}/orders`),
          where('status', 'in', ['completed', 'cancelled']),
          orderBy('createdAt', 'desc'),
          limit(PAGE_SIZE)
        );
        
        // Apply date filters if set
        if (startDate) {
          baseQuery = query(
            baseQuery,
            where('createdAt', '>=', startDate)
          );
        }
        
        if (endDate) {
          // Add a day to include the full end date
          const endDateTime = new Date(endDate);
          endDateTime.setDate(endDateTime.getDate() + 1);
          
          baseQuery = query(
            baseQuery,
            where('createdAt', '<=', endDateTime)
          );
        }
        
        const snapshot = await getDocs(baseQuery);
        
        if (snapshot.empty) {
          setOrders([]);
          setHasMore(false);
        } else {
          const fetchedOrders = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          })) as Order[];
          
          setOrders(fetchedOrders);
          setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
          setHasMore(snapshot.docs.length === PAGE_SIZE);
        }
      } catch (error) {
        console.error('Error fetching order history:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadOrders();
  }, [restaurant?.id, startDate, endDate]);
  
  // Load more orders
  const loadMore = async () => {
    if (!restaurant?.id || !lastVisible) return;
    
    setLoading(true);
    try {
      let nextQuery = query(
        collection(db, `restaurants/${restaurant.id}/orders`),
        where('status', 'in', ['completed', 'cancelled']),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(PAGE_SIZE)
      );
      
      // Apply date filters if set
      if (startDate) {
        nextQuery = query(
          nextQuery,
          where('createdAt', '>=', startDate)
        );
      }
      
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setDate(endDateTime.getDate() + 1);
        
        nextQuery = query(
          nextQuery,
          where('createdAt', '<=', endDateTime)
        );
      }
      
      const snapshot = await getDocs(nextQuery);
      
      if (snapshot.empty) {
        setHasMore(false);
      } else {
        const newOrders = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as Order[];
        
        setOrders(prevOrders => [...prevOrders, ...newOrders]);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === PAGE_SIZE);
      }
    } catch (error) {
      console.error('Error loading more orders:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Filter orders based on search term and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.tableNumber && order.tableNumber.toString().includes(searchTerm));
      
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Apply filters and reset pagination
  const applyFilters = () => {
    // This will trigger the useEffect to reload data with the new filters
    setLastVisible(null);
    setHasMore(true);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setStartDate(null);
    setEndDate(null);
    setLastVisible(null);
    setHasMore(true);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Order History</h1>
        <ExportOrdersButton orders={filteredOrders} filename="order-history" />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Filter Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <Input
              placeholder="Search by customer name or order ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex space-x-2">
              <Button 
                onClick={applyFilters} 
                className="flex-1"
              >
                Apply Filters
              </Button>
              <Button 
                variant="outline" 
                onClick={resetFilters}
                className="flex-1"
              >
                Reset
              </Button>
            </div>
          </div>
          
          <div className="mt-4">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          {loading && orders.length === 0 ? (
            <div className="flex justify-center items-center h-60">
              <LoadingSpinner />
            </div>
          ) : filteredOrders.length > 0 ? (
            <>
              <OrderHistoryTable orders={filteredOrders} />
              
              {hasMore && (
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={loadMore}
                    disabled={loading}
                    variant="outline"
                  >
                    {loading ? <LoadingSpinner size="sm" /> : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-60 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-2">No order history found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {searchTerm || statusFilter !== 'all' || startDate || endDate ? 
                  'Try adjusting your filters' : 
                  'Completed and cancelled orders will appear here'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
