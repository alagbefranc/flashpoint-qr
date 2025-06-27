'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import SeedAllData from '@/scripts/seedAllData';
import { withRoleProtection } from '@/lib/auth/withRoleProtection';
import { Modal } from '@/components/ui/Modal';
import { SlidePanel } from '@/components/ui/SlidePanel';

// Card component to display each data type that can be seeded
interface DataTypeCardProps {
  title: string;
  description: string;
  count: number;
  onPreview: () => void;
}

function DataTypeCard({ title, description, count, onPreview }: DataTypeCardProps) {
  return (
    <div className="bg-background border rounded-lg shadow-sm hover:shadow transition-shadow p-5">
      <div className="flex justify-between items-start">
        <h3 className="font-medium text-lg">{title}</h3>
        <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm font-semibold">
          {count} items
        </span>
      </div>
      <p className="text-muted-foreground mt-2 text-sm">{description}</p>
      <div className="mt-4 flex justify-end">
        <button 
          onClick={onPreview}
          className="text-sm text-primary hover:underline font-medium"
        >
          Preview sample data
        </button>
      </div>
    </div>
  );
}

// Component to display sample data in the slide panel
function DataPreview({ type }: { type: string }) {
  // This would typically fetch or generate preview data
  const getPreviewData = () => {
    switch (type) {
      case 'orders':
        return [
          { id: 'ord-1', customer: 'John Smith', items: 3, status: 'Completed', total: '$42.80' },
          { id: 'ord-2', customer: 'Alice Johnson', items: 2, status: 'In Progress', total: '$27.50' },
          { id: 'ord-3', customer: 'Robert Brown', items: 5, status: 'Pending', total: '$64.25' }
        ];
      case 'tables':
        return [
          { id: 'tbl-1', number: 'Table 1', capacity: 4, status: 'Occupied', reservation: 'Smith, 7:00 PM' },
          { id: 'tbl-2', number: 'Table 2', capacity: 2, status: 'Available', reservation: 'None' },
          { id: 'tbl-3', number: 'Table 3', capacity: 6, status: 'Reserved', reservation: 'Johnson, 8:30 PM' }
        ];
      case 'shifts':
        return [
          { id: 'shft-1', staff: 'Michael Davis', role: 'Waiter', start: '3:00 PM', end: '11:00 PM' },
          { id: 'shft-2', staff: 'Sarah Wilson', role: 'Hostess', start: '4:00 PM', end: '12:00 AM' },
          { id: 'shft-3', staff: 'David Martinez', role: 'Chef', start: '2:00 PM', end: '10:00 PM' }
        ];
      case 'inventory':
        return [
          { id: 'inv-1', item: 'Chicken Breast', quantity: 15, unit: 'kg', status: 'Good' },
          { id: 'inv-2', item: 'Olive Oil', quantity: 2, unit: 'liter', status: 'Low' },
          { id: 'inv-3', item: 'Tomatoes', quantity: 8, unit: 'kg', status: 'Good' }
        ];
      case 'reservations':
        return [
          { id: 'res-1', name: 'Smith Family', guests: 4, date: 'June 21, 2025', time: '7:00 PM' },
          { id: 'res-2', name: 'Johnson Party', guests: 2, date: 'June 22, 2025', time: '8:30 PM' },
          { id: 'res-3', name: 'Corporate Event', guests: 12, date: 'June 23, 2025', time: '6:00 PM' }
        ];
      case 'reviews':
        return [
          { id: 'rev-1', customer: 'David L.', rating: 5, comment: 'Amazing food and service!', sentiment: 'Positive' },
          { id: 'rev-2', customer: 'Sarah K.', rating: 3, comment: 'Good food but slow service.', sentiment: 'Neutral' },
          { id: 'rev-3', customer: 'Mike R.', rating: 4, comment: 'Great atmosphere and tasty meals.', sentiment: 'Positive' }
        ];
      default:
        return [];
    }
  };

  const previewData = getPreviewData();
  
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm mb-4">
        This is a preview of the sample data that will be generated. The actual data may vary slightly.
      </p>
      
      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {previewData.length > 0 && 
                Object.keys(previewData[0]).map(key => (
                  <th key={key} className="text-left p-3 font-medium">
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </th>
                ))
              }
            </tr>
          </thead>
          <tbody>
            {previewData.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                {Object.values(item).map((value, valueIndex) => (
                  <td key={valueIndex} className="p-3">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SeedDataPage() {
  const { restaurant, user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [activePreview, setActivePreview] = useState<string>('');
  const [success, setSuccess] = useState(false);
  
  const handleSeedComplete = () => {
    setSuccess(true);
    setIsModalOpen(false);
  };

  const handleShowPreview = (dataType: string) => {
    setActivePreview(dataType);
    setIsSlideOpen(true);
  };

  if (!restaurant) {
    return <div className="p-4">Loading restaurant data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Seed Sample Data</h1>
          <p className="text-gray-500 mt-1">
            Create sample data for your dashboard to showcase features
          </p>
        </div>
        <div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Generate Sample Data
          </button>
        </div>
      </div>

      {success ? (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                Data successfully seeded! You can now return to your dashboard to see it populated with sample data.
              </p>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <a href="/dashboard" className="px-4 py-2 rounded-md text-sm font-medium bg-green-100 text-green-800 hover:bg-green-200">
                    Return to Dashboard
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DataTypeCard 
            title="Orders" 
            description="Sample orders in various statuses" 
            count={20} 
            onPreview={() => handleShowPreview('orders')} 
          />
          <DataTypeCard 
            title="Tables" 
            description="Tables with occupancy status" 
            count={10} 
            onPreview={() => handleShowPreview('tables')} 
          />
          <DataTypeCard 
            title="Staff Shifts" 
            description="Staff members on current shifts" 
            count={8} 
            onPreview={() => handleShowPreview('shifts')} 
          />
          <DataTypeCard 
            title="Inventory" 
            description="Inventory with stock levels" 
            count={30} 
            onPreview={() => handleShowPreview('inventory')} 
          />
          <DataTypeCard 
            title="Reservations" 
            description="Upcoming reservations" 
            count={15} 
            onPreview={() => handleShowPreview('reservations')} 
          />
          <DataTypeCard 
            title="Reviews" 
            description="Customer reviews with sentiment" 
            count={25} 
            onPreview={() => handleShowPreview('reviews')} 
          />
        </div>
      )}

      {/* Slide panel for data preview */}
      <SlidePanel
        isOpen={isSlideOpen}
        onClose={() => setIsSlideOpen(false)}
        title={`${activePreview.charAt(0).toUpperCase() + activePreview.slice(1)} Preview`}
        width="lg"
      >
        <DataPreview type={activePreview} />
      </SlidePanel>
      
      {/* Modal for confirming data seeding */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate Sample Data"
        size="md"
        footer={
          <div className="flex justify-end space-x-3">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <SeedAllData 
              restaurantId={restaurant.id} 
              onComplete={handleSeedComplete} 
            />
          </div>
        }
      >
        <div className="prose prose-sm max-w-none">
          <p>
            This tool will populate your restaurant's database with sample data to demonstrate how your dashboard works 
            with real information. This data is synthetic and for demonstration purposes only.
          </p>
          <h4>What Will Be Added?</h4>
          <ul>
            <li><strong>Orders</strong>: Both completed orders and orders in progress</li>
            <li><strong>Tables</strong>: Table information with some marked as occupied</li>
            <li><strong>Staff Shifts</strong>: Staff members currently on shift</li>
            <li><strong>Inventory</strong>: Inventory items with some low stock warnings</li>
            <li><strong>Reservations</strong>: Upcoming reservations for the next week</li>
            <li><strong>Reviews</strong>: Customer reviews with AI sentiment analysis</li>
          </ul>
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-700">
                  <strong>Warning:</strong> This will add sample data to your restaurant's database. If you already have real data, 
                  this will not overwrite it, but will add additional demo records alongside it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default withRoleProtection(SeedDataPage, ['owner', 'admin', 'manager']);
