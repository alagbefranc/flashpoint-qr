'use client';

import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/config';

/**
 * Generates sample staff shift data for the restaurant dashboard
 * @param restaurantId The restaurant ID to create shifts for
 */
export async function seedShifts(restaurantId: string): Promise<void> {
  console.log('Seeding staff shift data...');
  
  try {
    // Define staff members with their roles
    const staffMembers = [
      { id: 'staff-1', name: 'John Smith', role: 'manager', email: 'john@example.com' },
      { id: 'staff-2', name: 'Maria Garcia', role: 'manager', email: 'maria@example.com' },
      { id: 'staff-3', name: 'Alex Johnson', role: 'waiter', email: 'alex@example.com' },
      { id: 'staff-4', name: 'Sarah Williams', role: 'waiter', email: 'sarah@example.com' },
      { id: 'staff-5', name: 'James Lee', role: 'waiter', email: 'james@example.com' },
      { id: 'staff-6', name: 'Emma Miller', role: 'waiter', email: 'emma@example.com' },
      { id: 'staff-7', name: 'Michael Brown', role: 'waiter', email: 'michael@example.com' },
      { id: 'staff-8', name: 'Sophia Martinez', role: 'waiter', email: 'sophia@example.com' },
      { id: 'staff-9', name: 'Daniel Wilson', role: 'kitchen', email: 'daniel@example.com' },
      { id: 'staff-10', name: 'Olivia Taylor', role: 'kitchen', email: 'olivia@example.com' },
      { id: 'staff-11', name: 'Noah Anderson', role: 'kitchen', email: 'noah@example.com' },
      { id: 'staff-12', name: 'Ava Thomas', role: 'kitchen', email: 'ava@example.com' },
    ];
    
    // Create staff member records
    for (const staff of staffMembers) {
      const staffRef = doc(collection(db, 'restaurants', restaurantId, 'staff'), staff.id);
      await setDoc(staffRef, {
        name: staff.name,
        email: staff.email,
        role: staff.role,
        hireDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Random hire date within the last year
        phone: `555-${Math.floor(1000 + Math.random() * 9000)}`,
        active: true
      });
    }
    
    console.log(`Created ${staffMembers.length} staff members.`);
    
    // Generate today's shift schedule
    const today = new Date().toISOString().split('T')[0];
    
    // Morning shift (8 AM - 4 PM)
    const morningShift = [
      staffMembers[0], // One manager
      staffMembers[2], staffMembers[3], staffMembers[4], // Three waiters
      staffMembers[8], staffMembers[9], // Two kitchen staff
    ];
    
    // Evening shift (4 PM - midnight)
    const eveningShift = [
      staffMembers[1], // One manager
      staffMembers[5], staffMembers[6], staffMembers[7], // Three waiters
      staffMembers[10], staffMembers[11], // Two kitchen staff
    ];
    
    // Generate morning shift records
    for (const staff of morningShift) {
      const shiftId = `shift-${today}-morning-${staff.id}`;
      const shiftRef = doc(collection(db, 'restaurants', restaurantId, 'shifts'), shiftId);
      
      await setDoc(shiftRef, {
        staffId: staff.id,
        staffName: staff.name,
        role: staff.role,
        date: today,
        startTime: '08:00',
        endTime: '16:00',
        active: true, // Currently on shift
        status: 'checked-in',
        checkInTime: new Date(new Date().setHours(8, Math.floor(Math.random() * 15), 0, 0)).toISOString()
      });
    }
    
    // Generate evening shift records
    for (const staff of eveningShift) {
      const shiftId = `shift-${today}-evening-${staff.id}`;
      const shiftRef = doc(collection(db, 'restaurants', restaurantId, 'shifts'), shiftId);
      
      await setDoc(shiftRef, {
        staffId: staff.id,
        staffName: staff.name,
        role: staff.role,
        date: today,
        startTime: '16:00',
        endTime: '00:00',
        active: true, // Currently on shift
        status: 'checked-in',
        checkInTime: new Date(new Date().setHours(16, Math.floor(Math.random() * 15), 0, 0)).toISOString()
      });
    }
    
    console.log(`Created ${morningShift.length + eveningShift.length} shifts for today.`);
  } catch (error) {
    console.error('Error generating staff shift data:', error);
  }
}
