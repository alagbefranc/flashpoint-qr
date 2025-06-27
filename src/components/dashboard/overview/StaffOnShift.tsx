'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface StaffOnShiftProps {
  restaurantId: string;
}

interface StaffCounts {
  total: number;
  waiters: number;
  kitchen: number;
  managers: number;
}

export default function StaffOnShift({ restaurantId }: StaffOnShiftProps) {
  const [staffCounts, setStaffCounts] = useState<StaffCounts>({
    total: 0,
    waiters: 0,
    kitchen: 0,
    managers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaffOnShift = async () => {
      try {
        // Get staff members who are currently on shift
        const shiftsRef = collection(db, 'restaurants', restaurantId, 'shifts');
        const activeShiftsQuery = query(
          shiftsRef,
          where('active', '==', true),
          where('date', '==', new Date().toISOString().split('T')[0])
        );

        const querySnapshot = await getDocs(activeShiftsQuery);
        
        const counts = {
          total: 0,
          waiters: 0,
          kitchen: 0,
          managers: 0
        };
        
        querySnapshot.forEach((doc) => {
          const shift = doc.data();
          counts.total++;
          
          switch (shift.role) {
            case 'waiter':
              counts.waiters++;
              break;
            case 'kitchen':
              counts.kitchen++;
              break;
            case 'manager':
              counts.managers++;
              break;
          }
        });
        
        setStaffCounts(counts);
      } catch (error) {
        console.error('Error fetching staff on shift:', error);
      } finally {
        setLoading(false);
      }
    };

    if (restaurantId) {
      fetchStaffOnShift();
    }
  }, [restaurantId]);

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-purple-500/10 rounded-md p-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">Staff On Shift</dt>
            <dd className="flex items-baseline">
              {loading ? (
                <div className="h-6 bg-gray-200 animate-pulse rounded w-24"></div>
              ) : (
                <div>
                  <div className="text-2xl font-semibold text-gray-900">{staffCounts.total}</div>
                  <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                    <div className="flex items-center">
                      <div className="h-2 w-2 bg-blue-500 rounded-full mr-1"></div>
                      <span>Waiters: {staffCounts.waiters}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-2 w-2 bg-orange-500 rounded-full mr-1"></div>
                      <span>Kitchen: {staffCounts.kitchen}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-2 w-2 bg-purple-500 rounded-full mr-1"></div>
                      <span>Managers: {staffCounts.managers}</span>
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
