'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from '@/components/ui/use-toast';

interface Table {
  id: string;
  number: string;
  seats: number;
  zone: string;
}

function AddReservation() {
  const { user } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    partySize: 2,
    date: '',
    time: '',
    tableId: '',
    specialRequests: '',
    source: 'phone' as const
  });

  useEffect(() => {
    fetchTables();
  }, [user]);

  const fetchTables = async () => {
    if (!user?.restaurantId) return;

    try {
      setLoading(true);
      
      const tablesSnapshot = await getDocs(
        collection(db, 'restaurants', user.restaurantId, 'tables')
      );
      const fetchedTables = tablesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Table[];

      setTables(fetchedTables.sort((a, b) => a.number.localeCompare(b.number)));
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tables',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'partySize' ? parseInt(value) || 1 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.restaurantId) {
      toast({
        title: 'Error',
        description: 'Restaurant not found',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.customerName || !formData.customerEmail || !formData.date || !formData.time) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmitting(true);

      const reservationData = {
        ...formData,
        date: new Date(formData.date + 'T' + formData.time),
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date(),
        restaurantId: user.restaurantId
      };

      await addDoc(
        collection(db, 'restaurants', user.restaurantId, 'reservations'),
        reservationData
      );

      toast({
        title: 'Success',
        description: 'Reservation created successfully'
      });

      // Reset form
      setFormData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        partySize: 2,
        date: '',
        time: '',
        tableId: '',
        specialRequests: '',
        source: 'phone'
      });

      // Redirect to reservations list
      setTimeout(() => {
        window.location.href = '/dashboard/reservations';
      }, 1500);

    } catch (error) {
      console.error('Error creating reservation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create reservation',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getAvailableTables = () => {
    return tables.filter(table => table.seats >= formData.partySize);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Add Reservation</h1>
          <p className="text-sm text-muted-foreground">
            Create a new reservation for your restaurant
          </p>
        </div>
        <Button 
          variant="outline"
          onClick={() => window.location.href = '/dashboard/reservations'}
        >
          Back to Reservations
        </Button>
      </div>

      {/* Reservation Form */}
      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Customer Information</h3>
              
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  Customer Name *
                </label>
                <Input
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  placeholder="Enter customer name"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  Email Address *
                </label>
                <Input
                  type="email"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                  placeholder="customer@email.com"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            {/* Reservation Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Reservation Details</h3>
              
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  Party Size *
                </label>
                <Input
                  type="number"
                  name="partySize"
                  value={formData.partySize}
                  onChange={handleInputChange}
                  min="1"
                  max="20"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  Date *
                </label>
                <Input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  Time *
                </label>
                <Input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  Preferred Table (Optional)
                </label>
                <select
                  name="tableId"
                  value={formData.tableId}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded-md border border-border bg-card text-card-foreground"
                >
                  <option value="">No preference</option>
                  {getAvailableTables().map(table => (
                    <option key={table.id} value={table.id}>
                      Table {table.number} ({table.seats} seats)
                    </option>
                  ))}
                </select>
                {formData.partySize > 0 && getAvailableTables().length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No tables available for {formData.partySize} guests
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  Source
                </label>
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded-md border border-border bg-card text-card-foreground"
                >
                  <option value="phone">Phone Call</option>
                  <option value="online">Online Booking</option>
                  <option value="walk-in">Walk-in</option>
                  <option value="app">Mobile App</option>
                </select>
              </div>
            </div>
          </div>

          {/* Special Requests */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">
              Special Requests
            </label>
            <textarea
              name="specialRequests"
              value={formData.specialRequests}
              onChange={handleInputChange}
              rows={3}
              placeholder="Any special dietary requirements, seating preferences, or other requests..."
              className="w-full p-2 rounded-md border border-border bg-card text-card-foreground resize-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => window.location.href = '/dashboard/reservations'}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Reservation'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Helper Information */}
      <Card className="p-4 bg-muted/50">
        <h4 className="font-medium text-foreground mb-2">Tips for Creating Reservations</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Ensure all required fields are filled out correctly</li>
          <li>• Table assignment can be changed later if needed</li>
          <li>• Special requests help the kitchen and service staff prepare</li>
          <li>• Consider party size when selecting tables</li>
        </ul>
      </Card>
    </div>
  );
}

export default AddReservation;
