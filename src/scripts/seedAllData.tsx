'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { seedOrders } from './seedOrders';
import { seedTables } from './seedTables';
import { seedShifts } from './seedShifts';
import { seedInventory } from './seedInventory';
import { seedReservations } from './seedReservations';
import { seedReviews } from './seedReviews';
import { useState } from 'react';

interface SeedDataProps {
  restaurantId: string;
  onComplete?: () => void;
}

/**
 * Component to seed all data for a restaurant
 */
export default function SeedAllData({ restaurantId, onComplete }: SeedDataProps) {
  const [isSeeding, setIsSeeding] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState('');
  const [progress, setProgress] = useState(0);
  
  const addLog = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, message]);
  };
  
  const handleSeed = async () => {
    if (!restaurantId) {
      addLog('⚠️ No restaurant ID provided.');
      return;
    }
    
    setIsSeeding(true);
    setLogs(['🚀 Starting data seeding process...', `📍 Target Restaurant ID: ${restaurantId}`]);
    
    try {
      // Seed orders data
      setCurrentStep('Orders');
      setProgress(10);
      addLog('📊 Seeding orders data...');
      await seedOrders(restaurantId);
      addLog('✅ Orders data seeded successfully.');
      
      // Seed tables data
      setCurrentStep('Tables');
      setProgress(25);
      addLog('📊 Seeding tables data...');
      await seedTables(restaurantId);
      addLog('✅ Tables data seeded successfully.');
      
      // Seed staff shifts data
      setCurrentStep('Staff Shifts');
      setProgress(40);
      addLog('📊 Seeding staff shifts data...');
      await seedShifts(restaurantId);
      addLog('✅ Staff shifts data seeded successfully.');
      
      // Seed inventory data
      setCurrentStep('Inventory');
      setProgress(55);
      addLog('📊 Seeding inventory data...');
      await seedInventory(restaurantId);
      addLog('✅ Inventory data seeded successfully.');
      
      // Seed reservations data
      setCurrentStep('Reservations');
      setProgress(70);
      addLog('📊 Seeding reservations data...');
      await seedReservations(restaurantId);
      addLog('✅ Reservations data seeded successfully.');
      
      // Seed reviews data
      setCurrentStep('Reviews');
      setProgress(85);
      addLog('📊 Seeding reviews data...');
      await seedReviews(restaurantId);
      addLog('✅ Reviews data seeded successfully.');
      
      // Complete
      setCurrentStep('Complete');
      setProgress(100);
      addLog('🎉 All data seeding complete! Your dashboard should now be populated with sample data.');
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      addLog(`❌ Error during seeding: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSeeding(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-lg font-medium">Seed Sample Data</h2>
        <p className="text-sm text-gray-500 mt-1 mb-4">
          This will populate your restaurant with sample data for the dashboard. This includes orders, tables,
          staff shifts, inventory, reservations, and reviews.
        </p>
        
        <button
          onClick={handleSeed}
          disabled={isSeeding}
          className={`px-4 py-2 rounded-md text-white ${
            isSeeding ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark'
          }`}
        >
          {isSeeding ? 'Seeding Data...' : 'Seed Sample Data'}
        </button>
      </div>
      
      {currentStep && (
        <div className="p-4 bg-white rounded-lg shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Progress: {currentStep}</h3>
            <span className="text-sm text-gray-500">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500 ease-in-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {logs.length > 0 && (
        <div className="p-4 bg-gray-50 rounded-lg shadow max-h-64 overflow-y-auto">
          <h3 className="font-medium mb-2">Seed Logs</h3>
          <div className="space-y-1 font-mono text-sm">
            {logs.map((log, index) => (
              <div key={index} className="p-1">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Function to seed all data for a restaurant programmatically
 * (can be used outside of React component if needed)
 */
export async function seedAllData(restaurantId: string): Promise<void> {
  console.log('Starting data seeding process...');
  
  try {
    await seedOrders(restaurantId);
    await seedTables(restaurantId);
    await seedShifts(restaurantId);
    await seedInventory(restaurantId);
    await seedReservations(restaurantId);
    await seedReviews(restaurantId);
    
    console.log('All data seeding complete!');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
}
