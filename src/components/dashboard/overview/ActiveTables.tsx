'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface ActiveTablesProps {
  restaurantId: string;
}

export default function ActiveTables({ restaurantId }: ActiveTablesProps) {
  const [activeTableCount, setActiveTableCount] = useState(0);
  const [totalTableCount, setTotalTableCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveTables = async () => {
      try {
        // Get tables that are currently occupied
        const tablesRef = collection(db, 'restaurants', restaurantId, 'tables');
        const activeTablesQuery = query(
          tablesRef,
          where('status', '==', 'occupied')
        );

        const allTablesSnapshot = await getDocs(tablesRef);
        const activeTablesSnapshot = await getDocs(activeTablesQuery);
        
        setTotalTableCount(allTablesSnapshot.size);
        setActiveTableCount(activeTablesSnapshot.size);
      } catch (error) {
        console.error('Error fetching active tables:', error);
      } finally {
        setLoading(false);
      }
    };

    if (restaurantId) {
      fetchActiveTables();
      
      // In a real app, you might want to set up a real-time listener here
      // to update table status in real-time
    }
  }, [restaurantId]);

  // Calculate occupancy rate
  const occupancyRate = totalTableCount > 0 
    ? Math.round((activeTableCount / totalTableCount) * 100)
    : 0;

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-green-500/10 rounded-md p-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">Active Tables</dt>
            <dd className="flex items-baseline">
              {loading ? (
                <div className="h-6 bg-gray-200 animate-pulse rounded w-24"></div>
              ) : (
                <div>
                  <div className="text-2xl font-semibold text-gray-900">{activeTableCount} / {totalTableCount}</div>
                  <div className="mt-1 flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          occupancyRate > 80 ? 'bg-red-500' : 
                          occupancyRate > 50 ? 'bg-amber-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${occupancyRate}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">{occupancyRate}% occupied</span>
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
