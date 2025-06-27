'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface InventoryWarningsProps {
  restaurantId: string;
}

interface InventoryItem {
  id: string;
  name: string;
  currentStock: number;
  minStockLevel: number;
  expiryDate?: string;
  category: string;
}

export default function InventoryWarnings({ restaurantId }: InventoryWarningsProps) {
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [expiringItems, setExpiringItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventoryWarnings = async () => {
      try {
        // Get inventory items with stock below minimum level
        const inventoryRef = collection(db, 'restaurants', restaurantId, 'inventory');
        
        const lowStockQuery = query(
          inventoryRef,
          where('currentStock', '<', 10),  // Example threshold
          orderBy('currentStock'),
          limit(5)
        );

        const today = new Date();
        const threeDay = new Date();
        threeDay.setDate(today.getDate() + 3);
        
        const expiringQuery = query(
          inventoryRef,
          where('expiryDate', '<=', threeDay.toISOString().split('T')[0]),
          orderBy('expiryDate'),
          limit(5)
        );

        const lowStockSnapshot = await getDocs(lowStockQuery);
        const expiringSnapshot = await getDocs(expiringQuery);
        
        const lowStock: InventoryItem[] = [];
        const expiring: InventoryItem[] = [];
        
        lowStockSnapshot.forEach((doc) => {
          const item = { id: doc.id, ...doc.data() } as InventoryItem;
          lowStock.push(item);
        });
        
        expiringSnapshot.forEach((doc) => {
          const item = { id: doc.id, ...doc.data() } as InventoryItem;
          expiring.push(item);
        });
        
        setLowStockItems(lowStock);
        setExpiringItems(expiring);
      } catch (error) {
        console.error('Error fetching inventory warnings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (restaurantId) {
      fetchInventoryWarnings();
    }
  }, [restaurantId]);

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 bg-red-500/10 rounded-md p-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="ml-3 text-lg font-medium text-gray-900">Inventory Warnings</h3>
        </div>

        {loading ? (
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 animate-pulse rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Low Stock Items</h4>
              {lowStockItems.length === 0 ? (
                <p className="text-sm text-gray-500 mt-1">No low stock items</p>
              ) : (
                <ul className="mt-2 divide-y divide-gray-200">
                  {lowStockItems.map((item) => (
                    <li key={item.id} className="py-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className={`text-sm ${item.currentStock <= item.minStockLevel ? 'text-red-500 font-bold' : 'text-amber-500'}`}>
                          {item.currentStock} left
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{item.category}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Expiring Soon</h4>
              {expiringItems.length === 0 ? (
                <p className="text-sm text-gray-500 mt-1">No items expiring soon</p>
              ) : (
                <ul className="mt-2 divide-y divide-gray-200">
                  {expiringItems.map((item) => (
                    <li key={item.id} className="py-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="text-sm text-red-500">
                          Expires: {item.expiryDate}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{item.category}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
