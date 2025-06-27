'use client';

import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/config';

/**
 * Generates sample table data for the restaurant dashboard
 * @param restaurantId The restaurant ID to create tables for
 */
export async function seedTables(restaurantId: string): Promise<void> {
  console.log('Seeding tables data...');
  
  try {
    // Define table areas/sections
    const tableAreas = ['Main Dining', 'Patio', 'Bar', 'Private Room'];
    
    // Create 20 tables with different statuses
    for (let i = 1; i <= 20; i++) {
      const tableId = `table-${i}`;
      const tableRef = doc(collection(db, 'restaurants', restaurantId, 'tables'), tableId);
      
      // Distribute tables across areas
      const area = tableAreas[Math.floor((i - 1) / 5)]; // 5 tables per area
      
      // Distribute capacities
      let capacity;
      if (i % 5 === 0) capacity = 8; // Every 5th table fits 8
      else if (i % 3 === 0) capacity = 6; // Every 3rd table fits 6
      else if (i % 2 === 0) capacity = 4; // Every 2nd table fits 4
      else capacity = 2; // All others fit 2
      
      // Status logic - make about 40% of tables occupied
      const status = i <= 8 ? 'occupied' : 'available';
      
      // For occupied tables, add customer info
      const occupiedData = status === 'occupied' ? {
        customerName: `Guest ${i}`,
        startTime: new Date().getTime() - (Math.random() * 120 * 60000), // Started up to 2 hours ago
        partySize: Math.min(capacity, 1 + Math.floor(Math.random() * capacity)),
      } : null;
      
      await setDoc(tableRef, {
        tableNumber: i,
        area: area,
        capacity: capacity,
        status: status,
        qrCodeUrl: `https://flashpointqr.com/table/${restaurantId}/${i}`,
        ...(occupiedData && { 
          customerName: occupiedData.customerName,
          startTime: occupiedData.startTime,
          partySize: occupiedData.partySize
        })
      });
    }
    
    console.log(`Created 20 tables with 8 marked as occupied.`);
  } catch (error) {
    console.error('Error generating tables data:', error);
  }
}
