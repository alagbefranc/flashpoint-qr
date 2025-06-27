'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface TodaySalesProps {
  restaurantId: string;
}

export default function TodaySales({ restaurantId }: TodaySalesProps) {
  const [sales, setSales] = useState({ total: 0, orderCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodaySales = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStart = Timestamp.fromDate(today);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStart = Timestamp.fromDate(tomorrow);

        const ordersRef = collection(db, 'restaurants', restaurantId, 'orders');
        const todayQuery = query(
          ordersRef, 
          where('createdAt', '>=', todayStart),
          where('createdAt', '<', tomorrowStart)
        );

        const querySnapshot = await getDocs(todayQuery);
        
        let totalSales = 0;
        querySnapshot.forEach((doc) => {
          const order = doc.data();
          totalSales += order.total || 0;
        });

        setSales({
          total: totalSales,
          orderCount: querySnapshot.size
        });
      } catch (error) {
        console.error('Error fetching today\'s sales:', error);
      } finally {
        setLoading(false);
      }
    };

    if (restaurantId) {
      fetchTodaySales();
    }
  }, [restaurantId]);

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-blue-500/10 rounded-md p-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">Today's Sales</dt>
            <dd className="flex items-baseline">
              {loading ? (
                <div className="h-6 bg-gray-200 animate-pulse rounded w-24"></div>
              ) : (
                <div>
                  <div className="text-2xl font-semibold text-gray-900">${sales.total.toFixed(2)}</div>
                  <div className="text-sm text-gray-500">{sales.orderCount} orders</div>
                </div>
              )}
            </dd>
          </div>
        </div>
      </div>
    </div>
  );
}
