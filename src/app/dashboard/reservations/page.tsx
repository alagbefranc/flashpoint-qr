'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { collection, getDocs, updateDoc, doc, deleteDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SlidePanel } from '@/components/ui/SlidePanel';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { withRoleProtection } from '@/lib/auth/withRoleProtection';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from '@/components/ui/use-toast';

interface Reservation {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  partySize: number;
  date: Date;
  time: string;
  tableId?: string;
  tableNumber?: string;
  status: 'confirmed' | 'pending' | 'seated' | 'completed' | 'cancelled' | 'no-show';
  specialRequests?: string;
  source: 'online' | 'phone' | 'walk-in' | 'app';
  createdAt: Date;
  updatedAt: Date;
  reminderSent?: boolean;
  notes?: string;
}

interface Table {
  id: string;
  number: string;
  seats: number;
  zone: string;
}

function ViewBookings() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState<string | null>(null);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('today');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user?.restaurantId) return;

    try {
      setLoading(true);
      
      // Fetch reservations
      const reservationsSnapshot = await getDocs(
        collection(db, 'restaurants', user.restaurantId, 'reservations')
      );
      const fetchedReservations = reservationsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
      }) as Reservation[];

      // Fetch tables for table assignment
      const tablesSnapshot = await getDocs(
        collection(db, 'restaurants', user.restaurantId, 'tables')
      );
      const fetchedTables = tablesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Table[];

      setReservations(fetchedReservations);
      setTables(fetchedTables);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reservations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reservationId: string, newStatus: Reservation['status']) => {
    if (!user?.restaurantId) return;

    try {
      const reservationRef = doc(db, 'restaurants', user.restaurantId, 'reservations', reservationId);
      await updateDoc(reservationRef, {
        status: newStatus,
        updatedAt: new Date()
      });

      setReservations(prev => prev.map(reservation => 
        reservation.id === reservationId 
          ? { ...reservation, status: newStatus, updatedAt: new Date() }
          : reservation
      ));

      toast({
        title: 'Success',
        description: 'Reservation status updated successfully'
      });
    } catch (error) {
      console.error('Error updating reservation status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update reservation status',
        variant: 'destructive'
      });
    }
  };

  const handleTableAssignment = async (reservationId: string, tableId: string) => {
    if (!user?.restaurantId) return;

    try {
      const table = tables.find(t => t.id === tableId);
      const reservationRef = doc(db, 'restaurants', user.restaurantId, 'reservations', reservationId);
      
      await updateDoc(reservationRef, {
        tableId: tableId,
        tableNumber: table?.number || '',
        updatedAt: new Date()
      });

      setReservations(prev => prev.map(reservation => 
        reservation.id === reservationId 
          ? { 
              ...reservation, 
              tableId, 
              tableNumber: table?.number || '',
              updatedAt: new Date() 
            }
          : reservation
      ));

      toast({
        title: 'Success',
        description: 'Table assigned successfully'
      });
    } catch (error) {
      console.error('Error assigning table:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign table',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteReservation = (reservationId: string) => {
    setReservationToDelete(reservationId);
    setShowDeleteModal(true);
  };

  const confirmDeleteReservation = async () => {
    if (!user?.restaurantId || !reservationToDelete) return;

    try {
      await deleteDoc(doc(db, 'restaurants', user.restaurantId, 'reservations', reservationToDelete));
      setReservations(prev => prev.filter(reservation => reservation.id !== reservationToDelete));
      setShowDeleteModal(false);
      setReservationToDelete(null);

      toast({
        title: 'Success',
        description: 'Reservation deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting reservation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete reservation',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: Reservation['status']) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'seated': return 'default';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      case 'no-show': return 'destructive';
      default: return 'secondary';
    }
  };

  const getFilteredReservations = () => {
    let filtered = reservations;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    // Filter by date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (filterDate === 'today') {
      filtered = filtered.filter(r => {
        const reservationDate = new Date(r.date);
        reservationDate.setHours(0, 0, 0, 0);
        return reservationDate.getTime() === today.getTime();
      });
    } else if (filterDate === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      filtered = filtered.filter(r => {
        const reservationDate = new Date(r.date);
        reservationDate.setHours(0, 0, 0, 0);
        return reservationDate.getTime() === tomorrow.getTime();
      });
    } else if (filterDate === 'week') {
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      filtered = filtered.filter(r => {
        const reservationDate = new Date(r.date);
        return reservationDate >= today && reservationDate <= weekFromNow;
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.customerPhone.includes(searchTerm)
      );
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.date + ' ' + a.time);
      const dateB = new Date(b.date + ' ' + b.time);
      return dateA.getTime() - dateB.getTime();
    });
  };

  const filteredReservations = getFilteredReservations();

  const stats = {
    total: reservations.length,
    today: reservations.filter(r => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const reservationDate = new Date(r.date);
      reservationDate.setHours(0, 0, 0, 0);
      return reservationDate.getTime() === today.getTime();
    }).length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    pending: reservations.filter(r => r.status === 'pending').length
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
          <h1 className="text-2xl font-semibold text-foreground">Reservations</h1>
          <p className="text-sm text-muted-foreground">
            Manage restaurant bookings and table reservations
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/dashboard/reservations/schedule'}
          >
            Manage Schedule
          </Button>
          <Button onClick={() => window.location.href = '/dashboard/reservations/add'}>
            Add Reservation
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total Reservations</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{stats.today}</div>
          <div className="text-sm text-muted-foreground">Today's Reservations</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-600">{stats.confirmed}</div>
          <div className="text-sm text-muted-foreground">Confirmed</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-muted-foreground">Pending</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-sm font-medium text-foreground mr-2">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-2 rounded-md border border-border bg-card text-card-foreground"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="seated">Seated</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no-show">No Show</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-foreground mr-2">Date:</label>
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="p-2 rounded-md border border-border bg-card text-card-foreground"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="week">This Week</option>
            </select>
          </div>

          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by customer name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 rounded-md border border-border bg-card text-card-foreground"
            />
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredReservations.length} of {reservations.length} reservations
          </div>
        </div>
      </Card>

      {/* Reservations List */}
      <div className="space-y-4">
        {filteredReservations.map((reservation) => (
          <Card key={reservation.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <h3 className="font-semibold text-foreground">{reservation.customerName}</h3>
                  <p className="text-sm text-muted-foreground">{reservation.customerEmail}</p>
                  <p className="text-sm text-muted-foreground">{reservation.customerPhone}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium text-foreground">
                    {reservation.date.toLocaleDateString()}
                  </p>
                  <p className="text-sm text-foreground">{reservation.time}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Party Size</p>
                  <p className="font-medium text-foreground">{reservation.partySize} guests</p>
                  {reservation.tableNumber && (
                    <p className="text-sm text-muted-foreground">Table {reservation.tableNumber}</p>
                  )}
                </div>
                
                <div>
                  <Badge variant={getStatusColor(reservation.status)}>
                    {reservation.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    via {reservation.source}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedReservation(reservation);
                    setIsPanelOpen(true);
                  }}
                >
                  Details
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteReservation(reservation.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
            
            {reservation.specialRequests && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-sm text-muted-foreground">Special Requests:</p>
                <p className="text-sm text-foreground">{reservation.specialRequests}</p>
              </div>
            )}
          </Card>
        ))}

        {filteredReservations.length === 0 && (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              <div className="text-lg font-medium">No reservations found</div>
              <div className="text-sm">Try adjusting your filters or add a new reservation</div>
            </div>
          </Card>
        )}
      </div>

      {/* Reservation Details Panel */}
      <SlidePanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        title={selectedReservation ? `Reservation - ${selectedReservation.customerName}` : 'Reservation Details'}
      >
        {selectedReservation && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Customer Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Name:</span>
                    <span className="text-sm text-foreground">{selectedReservation.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <span className="text-sm text-foreground">{selectedReservation.customerEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Phone:</span>
                    <span className="text-sm text-foreground">{selectedReservation.customerPhone}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">Reservation Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Date:</span>
                    <span className="text-sm text-foreground">{selectedReservation.date.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Time:</span>
                    <span className="text-sm text-foreground">{selectedReservation.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Party Size:</span>
                    <span className="text-sm text-foreground">{selectedReservation.partySize} guests</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Source:</span>
                    <span className="text-sm text-foreground">{selectedReservation.source}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  Status
                </label>
                <select
                  value={selectedReservation.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as Reservation['status'];
                    handleStatusChange(selectedReservation.id, newStatus);
                    setSelectedReservation({ ...selectedReservation, status: newStatus });
                  }}
                  className="w-full p-2 rounded-md border border-border bg-card text-card-foreground"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="seated">Seated</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no-show">No Show</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  Assign Table
                </label>
                <select
                  value={selectedReservation.tableId || ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleTableAssignment(selectedReservation.id, e.target.value);
                      const table = tables.find(t => t.id === e.target.value);
                      setSelectedReservation({ 
                        ...selectedReservation, 
                        tableId: e.target.value,
                        tableNumber: table?.number || ''
                      });
                    }
                  }}
                  className="w-full p-2 rounded-md border border-border bg-card text-card-foreground"
                >
                  <option value="">No table assigned</option>
                  {tables
                    .filter(table => table.seats >= selectedReservation.partySize)
                    .map(table => (
                      <option key={table.id} value={table.id}>
                        Table {table.number} ({table.seats} seats)
                      </option>
                    ))}
                </select>
              </div>

              {selectedReservation.specialRequests && (
                <div>
                  <h4 className="font-medium text-foreground mb-2">Special Requests</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    {selectedReservation.specialRequests}
                  </p>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                <p>Created: {selectedReservation.createdAt.toLocaleString()}</p>
                <p>Updated: {selectedReservation.updatedAt.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                className="flex-1"
                onClick={() => {
                  handleStatusChange(selectedReservation.id, 'confirmed');
                  setIsPanelOpen(false);
                }}
                disabled={selectedReservation.status === 'confirmed'}
              >
                Confirm Reservation
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  handleStatusChange(selectedReservation.id, 'seated');
                  setIsPanelOpen(false);
                }}
                disabled={selectedReservation.status === 'seated'}
              >
                Mark as Seated
              </Button>
            </div>
          </div>
        )}
      </SlidePanel>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Delete Reservation</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Are you sure you want to delete this reservation? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteReservation}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ViewBookings;
