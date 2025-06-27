'use client';

import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/config';

/**
 * Generates sample inventory data for the restaurant dashboard
 * @param restaurantId The restaurant ID to create inventory for
 */
export async function seedInventory(restaurantId: string): Promise<void> {
  console.log('Seeding inventory data...');
  
  try {
    // Define inventory items with categories
    const inventoryItems = [
      // Ingredients - Produce
      { id: 'inv-1', name: 'Tomatoes', category: 'Produce', unit: 'kg', minStockLevel: 10 },
      { id: 'inv-2', name: 'Lettuce', category: 'Produce', unit: 'head', minStockLevel: 15 },
      { id: 'inv-3', name: 'Onions', category: 'Produce', unit: 'kg', minStockLevel: 5 },
      { id: 'inv-4', name: 'Potatoes', category: 'Produce', unit: 'kg', minStockLevel: 15 },
      { id: 'inv-5', name: 'Bell Peppers', category: 'Produce', unit: 'kg', minStockLevel: 5 },
      { id: 'inv-6', name: 'Mushrooms', category: 'Produce', unit: 'kg', minStockLevel: 5 },
      { id: 'inv-7', name: 'Fresh Herbs', category: 'Produce', unit: 'bunch', minStockLevel: 5 },
      
      // Ingredients - Dairy
      { id: 'inv-8', name: 'Mozzarella Cheese', category: 'Dairy', unit: 'kg', minStockLevel: 8 },
      { id: 'inv-9', name: 'Parmesan Cheese', category: 'Dairy', unit: 'kg', minStockLevel: 3 },
      { id: 'inv-10', name: 'Butter', category: 'Dairy', unit: 'kg', minStockLevel: 5 },
      { id: 'inv-11', name: 'Cream', category: 'Dairy', unit: 'L', minStockLevel: 5 },
      { id: 'inv-12', name: 'Milk', category: 'Dairy', unit: 'L', minStockLevel: 10 },
      
      // Ingredients - Proteins
      { id: 'inv-13', name: 'Chicken Breast', category: 'Proteins', unit: 'kg', minStockLevel: 10 },
      { id: 'inv-14', name: 'Ground Beef', category: 'Proteins', unit: 'kg', minStockLevel: 8 },
      { id: 'inv-15', name: 'Bacon', category: 'Proteins', unit: 'kg', minStockLevel: 5 },
      { id: 'inv-16', name: 'Salmon Fillets', category: 'Proteins', unit: 'kg', minStockLevel: 5 },
      
      // Ingredients - Dry Goods
      { id: 'inv-17', name: 'Flour', category: 'Dry Goods', unit: 'kg', minStockLevel: 10 },
      { id: 'inv-18', name: 'Sugar', category: 'Dry Goods', unit: 'kg', minStockLevel: 5 },
      { id: 'inv-19', name: 'Rice', category: 'Dry Goods', unit: 'kg', minStockLevel: 10 },
      { id: 'inv-20', name: 'Pasta', category: 'Dry Goods', unit: 'kg', minStockLevel: 15 },
      
      // Beverages
      { id: 'inv-21', name: 'Coffee Beans', category: 'Beverages', unit: 'kg', minStockLevel: 5 },
      { id: 'inv-22', name: 'Wine - Red', category: 'Beverages', unit: 'bottle', minStockLevel: 12 },
      { id: 'inv-23', name: 'Wine - White', category: 'Beverages', unit: 'bottle', minStockLevel: 12 },
      { id: 'inv-24', name: 'Beer', category: 'Beverages', unit: 'bottle', minStockLevel: 24 },
      { id: 'inv-25', name: 'Soft Drinks', category: 'Beverages', unit: 'can', minStockLevel: 48 },
      
      // Disposables
      { id: 'inv-26', name: 'Napkins', category: 'Disposables', unit: 'pack', minStockLevel: 10 },
      { id: 'inv-27', name: 'To-Go Containers', category: 'Disposables', unit: 'pack', minStockLevel: 5 },
      { id: 'inv-28', name: 'Straws', category: 'Disposables', unit: 'pack', minStockLevel: 5 },
    ];
    
    // Get today's date
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Create inventory records with varying stock levels and expiry dates
    for (const item of inventoryItems) {
      const inventoryRef = doc(collection(db, 'restaurants', restaurantId, 'inventory'), item.id);
      
      // Create some low stock items and some expiring soon items
      let currentStock;
      let expiryDate;
      
      // Determine if this item should be low stock (for about 20% of items)
      const isLowStock = Math.random() < 0.2;
      if (isLowStock) {
        currentStock = Math.max(1, Math.floor(item.minStockLevel * 0.5)); // 50% of minimum or at least 1
      } else {
        currentStock = Math.floor(item.minStockLevel * (1 + Math.random() * 3)); // 100-400% of minimum
      }
      
      // Determine if this is perishable and needs expiry date (mainly produce, dairy, proteins)
      const isPerishable = ['Produce', 'Dairy', 'Proteins'].includes(item.category);
      if (isPerishable) {
        const daysToExpiry = Math.floor(Math.random() * 14) - 3; // -3 to +10 days
        const expiry = new Date(today);
        expiry.setDate(today.getDate() + daysToExpiry);
        expiryDate = expiry.toISOString().split('T')[0];
      }
      
      // Last ordered date - between 3 and 14 days ago
      const lastOrderedDays = 3 + Math.floor(Math.random() * 11);
      const lastOrdered = new Date(today);
      lastOrdered.setDate(today.getDate() - lastOrderedDays);
      const lastOrderedStr = lastOrdered.toISOString().split('T')[0];
      
      // Randomly assign a cost
      const costPerUnit = Math.round((2 + Math.random() * 18) * 100) / 100;
      
      await setDoc(inventoryRef, {
        name: item.name,
        category: item.category,
        unit: item.unit,
        currentStock: currentStock,
        minStockLevel: item.minStockLevel,
        lastOrdered: lastOrderedStr,
        costPerUnit: costPerUnit,
        ...(isPerishable && { expiryDate: expiryDate }),
        updatedAt: todayStr
      });
    }
    
    console.log(`Created ${inventoryItems.length} inventory items.`);
  } catch (error) {
    console.error('Error generating inventory data:', error);
  }
}
