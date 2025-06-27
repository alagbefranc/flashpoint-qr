'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface OrdersInProgressProps {
  restaurantId: string;
}

interface OrderStatusCount {
  preparing: number;
  ready: number;
  served: number;
  total: number;
}

export default function OrdersInProgress({ restaurantId }: OrdersInProgressProps) {
  const [orderStatusCounts, setOrderStatusCounts] = useState<OrderStatusCount>({
    preparing: 0,
    ready: 0,
    served: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrdersInProgress = async () => {
      try {
        // Get orders that are not completed or cancelled
        const ordersRef = collection(db, 'restaurants', restaurantId, 'orders');
        const activeOrdersQuery = query(
          ordersRef,
          where('status', 'in', ['received', 'preparing', 'ready', 'served'])
        );

        const querySnapshot = await getDocs(activeOrdersQuery);
        
        const counts = {
          preparing: 0,
          ready: 0,
          served: 0,
          total: 0
        };
        
        querySnapshot.forEach((doc) => {
          const order = doc.data();
          counts.total++;
          
          switch (order.status) {
            case 'preparing':
              counts.preparing++;
              break;
            case 'ready':
              counts.ready++;
              break;
            case 'served':
              counts.served++;
              break;
          }
        });
        
        setOrderStatusCounts(counts);
      } catch (error) {
        console.error('Error fetching orders in progress:', error);
      } finally {
        setLoading(false);
      }
    };

    if (restaurantId) {
      fetchOrdersInProgress();
    }
  }, [restaurantId]);

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-amber-500/10 rounded-md p-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">Orders In Progress</dt>
            <dd className="flex items-baseline">
              {loading ? (
                <div className="h-6 bg-gray-200 animate-pulse rounded w-24"></div>
              ) : (
                <div>
                  <div className="text-2xl font-semibold text-gray-900">{orderStatusCounts.total}</div>
                  <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                    <div className="flex items-center">
                      <div className="h-2 w-2 bg-yellow-500 rounded-full mr-1"></div>
                      <span>Preparing: {orderStatusCounts.preparing}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-2 w-2 bg-green-500 rounded-full mr-1"></div>
                      <span>Ready: {orderStatusCounts.ready}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-2 w-2 bg-blue-500 rounded-full mr-1"></div>
                      <span>Served: {orderStatusCounts.served}</span>
                    </div>
                  </div>
                </div>
              )}
            </dd>
          </div>
        </div>
      </div>
    </div>
  );
}
