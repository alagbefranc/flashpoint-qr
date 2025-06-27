'use client';

import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase/config';

/**
 * Generates sample order data for the restaurant dashboard
 * @param restaurantId The restaurant ID to create orders for
 */
export async function seedOrders(restaurantId: string): Promise<void> {
  console.log('Seeding orders data...');
  
  // Generate today's orders
  await generateTodaysOrders(restaurantId);
  
  // Generate orders in progress
  await generateOrdersInProgress(restaurantId);
  
  console.log('Order data seeding complete.');
}

/**
 * Generate today's orders for sales metrics
 */
async function generateTodaysOrders(restaurantId: string): Promise<void> {
  try {
    const orderItems = [
      { name: 'Margherita Pizza', price: 12.99 },
      { name: 'Pepperoni Pizza', price: 14.99 },
      { name: 'Vegetarian Pizza', price: 13.99 },
      { name: 'Caesar Salad', price: 8.99 },
      { name: 'Greek Salad', price: 9.99 },
      { name: 'Garlic Bread', price: 5.99 },
      { name: 'Spaghetti Carbonara', price: 16.99 },
      { name: 'Fettuccine Alfredo', price: 15.99 },
      { name: 'Chicken Parmesan', price: 18.99 },
      { name: 'Tiramisu', price: 7.99 },
      { name: 'Chocolate Cake', price: 6.99 },
      { name: 'Soft Drink', price: 2.99 },
      { name: 'Coffee', price: 3.99 },
      { name: 'Wine (Glass)', price: 8.99 },
      { name: 'Beer', price: 5.99 },
    ];

    // Generate orders for today with different times
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const orderStatuses = ['completed', 'completed', 'completed', 'completed', 'cancelled'];
    
    // Generate 15 completed/cancelled orders for today to show in reports
    for (let i = 1; i <= 15; i++) {
      const orderTime = new Date(today);
      // Distribute orders throughout the day
      orderTime.setHours(10 + Math.floor(i / 2), (i % 2) * 30 + Math.floor(Math.random() * 30), 0, 0);
      
      // Generate 2-5 items per order
      const numItems = 2 + Math.floor(Math.random() * 4);
      const items = [];
      let subtotal = 0;
      
      for (let j = 0; j < numItems; j++) {
        const item = orderItems[Math.floor(Math.random() * orderItems.length)];
        const quantity = 1 + Math.floor(Math.random() * 3);
        const itemTotal = item.price * quantity;
        subtotal += itemTotal;
        
        items.push({
          name: item.name,
          price: item.price,
          quantity: quantity,
          total: itemTotal
        });
      }
      
      const tax = subtotal * 0.08; // 8% tax
      const total = subtotal + tax;
      
      // Randomly select a status for this order
      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      
      const orderId = `order-${i}-${Date.now()}`;
      const orderRef = doc(collection(db, 'restaurants', restaurantId, 'orders'), orderId);
      
      await setDoc(orderRef, {
        createdAt: Timestamp.fromDate(orderTime),
        updatedAt: Timestamp.fromDate(new Date(orderTime.getTime() + 30 * 60000)), // 30 mins later
        items: items,
        subtotal: subtotal,
        tax: tax,
        total: total,
        status: status,
        tableNumber: Math.floor(Math.random() * 20) + 1,
        paymentMethod: Math.random() > 0.5 ? 'credit' : 'cash',
        customerId: `customer-${Math.floor(Math.random() * 100)}`
      });
    }
    
    console.log(`Created ${15} historical orders for today.`);
  } catch (error) {
    console.error('Error generating today\'s orders:', error);
  }
}

/**
 * Generate orders in progress (active orders)
 */
async function generateOrdersInProgress(restaurantId: string): Promise<void> {
  try {
    const orderItems = [
      { name: 'Margherita Pizza', price: 12.99 },
      { name: 'Pepperoni Pizza', price: 14.99 },
      { name: 'Vegetarian Pizza', price: 13.99 },
      { name: 'Caesar Salad', price: 8.99 },
      { name: 'Greek Salad', price: 9.99 },
      { name: 'Garlic Bread', price: 5.99 },
    ];
    
    const orderStatuses = ['received', 'preparing', 'ready', 'served'];
    
    // Create orders with different active statuses
    for (let i = 1; i <= 8; i++) {
      const now = new Date();
      const orderTime = new Date(now.getTime() - Math.floor(Math.random() * 60) * 60000); // Within the last hour
      
      // Generate 1-3 items per order
      const numItems = 1 + Math.floor(Math.random() * 3);
      const items = [];
      let subtotal = 0;
      
      for (let j = 0; j < numItems; j++) {
        const item = orderItems[Math.floor(Math.random() * orderItems.length)];
        const quantity = 1 + Math.floor(Math.random() * 2);
        const itemTotal = item.price * quantity;
        subtotal += itemTotal;
        
        items.push({
          name: item.name,
          price: item.price,
          quantity: quantity,
          total: itemTotal
        });
      }
      
      const tax = subtotal * 0.08; // 8% tax
      const total = subtotal + tax;
      
      // Distribute statuses
      let status;
      if (i <= 2) status = 'received';
      else if (i <= 5) status = 'preparing';
      else if (i <= 7) status = 'ready';
      else status = 'served';
      
      const orderId = `active-order-${i}-${Date.now()}`;
      const orderRef = doc(collection(db, 'restaurants', restaurantId, 'orders'), orderId);
      
      await setDoc(orderRef, {
        createdAt: Timestamp.fromDate(orderTime),
        updatedAt: Timestamp.fromDate(new Date()),
        items: items,
        subtotal: subtotal,
        tax: tax,
        total: total,
        status: status,
        tableNumber: Math.floor(Math.random() * 20) + 1,
        paymentMethod: 'pending',
        customerId: `customer-${Math.floor(Math.random() * 100)}`
      });
    }
    
    console.log(`Created 8 orders in progress with various statuses.`);
  } catch (error) {
    console.error('Error generating orders in progress:', error);
  }
}
