'use client';

import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase/config';

/**
 * Generates sample reservation data for the restaurant dashboard
 * @param restaurantId The restaurant ID to create reservations for
 */
export async function seedReservations(restaurantId: string): Promise<void> {
  console.log('Seeding reservations data...');
  
  try {
    // Customer names for reservations
    const customerNames = [
      'Robert Johnson', 'Linda Davis', 'William Garcia', 'Patricia Martinez',
      'David Rodriguez', 'Barbara Wilson', 'Richard Anderson', 'Elizabeth Taylor',
      'Joseph Thomas', 'Jennifer Moore', 'Charles Jackson', 'Margaret White',
      'Christopher Harris', 'Susan Martin', 'Daniel Thompson', 'Jessica Robinson',
      'Matthew Clark', 'Nancy Lewis', 'Anthony Walker', 'Dorothy Young'
    ];
    
    // Get today's date and next days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Create reservations for today and the next 7 days
    for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
      const date = new Date(today);
      date.setDate(today.getDate() + dayOffset);
      const dateStr = date.toISOString().split('T')[0];
      
      // Create 4-8 reservations per day
      const numReservations = 4 + Math.floor(Math.random() * 5);
      
      for (let i = 0; i < numReservations; i++) {
        // Time between 12:00 PM and 9:00 PM
        const hour = 12 + Math.floor(Math.random() * 10);
        const minute = Math.floor(Math.random() / 2) * 30; // Either 0 or 30 minutes
        date.setHours(hour, minute, 0, 0);
        
        const reservationId = `res-${dateStr}-${i + 1}`;
        const reservationRef = doc(collection(db, 'restaurants', restaurantId, 'reservations'), reservationId);
        
        const customerIndex = Math.floor(Math.random() * customerNames.length);
        const customerName = customerNames[customerIndex];
        
        // Number of guests between 2 and 8
        const numGuests = 2 + Math.floor(Math.random() * 7);
        
        // Special requests (20% chance)
        const hasSpecialRequest = Math.random() < 0.2;
        const specialRequests = hasSpecialRequest ? [
          'Window seat please',
          'Celebrating anniversary',
          'Highchair needed',
          'Wheelchair accessible table',
          'Birthday celebration - bringing cake'
        ][Math.floor(Math.random() * 5)] : '';
        
        // Assign tables for today's reservations
        let tableNumber = null;
        if (dayOffset === 0) {
          tableNumber = (i + 1) * 2; // Simple assignment for demo purposes
        }
        
        // Determine status
        let status: 'confirmed' | 'pending' | 'seated' | 'cancelled' | 'completed' = 'confirmed';
        
        if (dayOffset === 0) {
          // For today's reservations
          if (hour < new Date().getHours()) {
            // Reservations in the past
            status = Math.random() < 0.8 ? 'completed' : 'cancelled';
          } else if (hour === new Date().getHours() && minute <= new Date().getMinutes()) {
            // Current hour reservations
            status = Math.random() < 0.7 ? 'seated' : 'confirmed';
          }
        } else if (Math.random() < 0.1) {
          // 10% chance of any future reservation being cancelled
          status = 'cancelled';
        } else if (Math.random() < 0.2) {
          // 20% chance of any future reservation being pending
          status = 'pending';
        }
        
        await setDoc(reservationRef, {
          name: customerName,
          phone: `555-${Math.floor(1000 + Math.random() * 9000)}`,
          email: customerName.toLowerCase().replace(' ', '.') + '@example.com',
          guests: numGuests,
          time: Timestamp.fromDate(date),
          date: dateStr,
          status: status,
          specialRequests: specialRequests,
          ...(tableNumber && { tableNumber: tableNumber.toString() }),
          createdAt: Timestamp.fromDate(new Date(date.getTime() - 24 * 60 * 60 * 1000 * (1 + Math.random() * 6))), // 1-7 days before reservation
          updatedAt: Timestamp.fromDate(new Date())
        });
      }
      
      console.log(`Created ${numReservations} reservations for ${dateStr}`);
    }
  } catch (error) {
    console.error('Error generating reservations data:', error);
  }
}
