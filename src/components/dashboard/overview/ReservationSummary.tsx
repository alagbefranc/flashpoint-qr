'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface ReservationSummaryProps {
  restaurantId: string;
}

interface Reservation {
  id: string;
  name: string;
  guests: number;
  time: Timestamp;
  tableNumber?: string;
  status: 'confirmed' | 'pending' | 'seated' | 'cancelled' | 'completed';
  phone: string;
}

export default function ReservationSummary({ restaurantId }: ReservationSummaryProps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        // Get today's date boundaries
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = Timestamp.fromDate(today);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowTimestamp = Timestamp.fromDate(tomorrow);

        // Get upcoming reservations (next 12 hours)
        const now = new Date();
        const nowTimestamp = Timestamp.fromDate(now);
        
        const twelveHoursLater = new Date(now);
        twelveHoursLater.setHours(now.getHours() + 12);
        const twelveHoursLaterTimestamp = Timestamp.fromDate(twelveHoursLater);
        
        const reservationsRef = collection(db, 'restaurants', restaurantId, 'reservations');
        
        // Query for upcoming reservations
        const upcomingQuery = query(
          reservationsRef,
          where('time', '>=', nowTimestamp),
          where('time', '<=', twelveHoursLaterTimestamp),
          where('status', 'in', ['confirmed', 'pending']),
          orderBy('time'),
          limit(5)
        );

        // Query for today's total count
        const todayQuery = query(
          reservationsRef,
          where('time', '>=', todayTimestamp),
          where('time', '<', tomorrowTimestamp)
        );

        const [upcomingSnapshot, todaySnapshot] = await Promise.all([
          getDocs(upcomingQuery),
          getDocs(todayQuery)
        ]);
        
        const upcomingReservations: Reservation[] = [];
        
        upcomingSnapshot.forEach((doc) => {
          const reservation = { id: doc.id, ...doc.data() } as Reservation;
          upcomingReservations.push(reservation);
        });
        
        setReservations(upcomingReservations);
        setTodayCount(todaySnapshot.size);
      } catch (error) {
        console.error('Error fetching reservations:', error);
      } finally {
        setLoading(false);
      }
    };

    if (restaurantId) {
      fetchReservations();
    }
  }, [restaurantId]);

  // Format time from timestamp
  const formatTime = (timestamp: Timestamp): string => {
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-indigo-500/10 rounded-md p-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="ml-3 text-lg font-medium text-gray-900">Reservation Summary</h3>
          </div>
          <span className="text-sm font-medium bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
            {loading ? '...' : `${todayCount} today`}
          </span>
        </div>

        {loading ? (
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 animate-pulse rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 animate-pulse rounded w-2/3"></div>
            <div className="h-6 bg-gray-200 animate-pulse rounded w-full"></div>
          </div>
        ) : reservations.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No upcoming reservations</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {reservations.map((reservation) => (
              <li key={reservation.id} className="py-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{reservation.name}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <span>{reservation.guests} guests</span>
                      <span className="mx-1">•</span>
                      <span>Table {reservation.tableNumber || 'TBD'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {formatTime(reservation.time)}
                    </p>
                    <p className={`text-xs ${
                      reservation.status === 'confirmed' ? 'text-green-500' : 
                      reservation.status === 'pending' ? 'text-amber-500' : 'text-gray-500'
                    }`}>
                      {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
