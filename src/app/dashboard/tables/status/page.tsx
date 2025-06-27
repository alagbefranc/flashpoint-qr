'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { collection, getDocs, updateDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SlidePanel } from '@/components/ui/SlidePanel';
import { Badge } from '@/components/ui/Badge';
import { withRoleProtection } from '@/lib/auth/withRoleProtection';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from '@/components/ui/use-toast';

interface Table {
  id: string;
  number: string;
  seats: number;
  zone: string;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  x: number;
  y: number;
  shape: 'square' | 'circle' | 'rectangle';
  size: 'small' | 'medium' | 'large';
  currentOrder?: {
    id: string;
    customerName?: string;
    orderTime: Date;
    items: number;
    total: number;
    waiter?: string;
  };
  lastStatusChange?: Date;
}

interface Zone {
  id: string;
  name: string;
  color: string;
}

interface Staff {
  id: string;
  name: string;
  role: string;
  isActive: boolean;
}

function LiveTableStatus() {
  const { user } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterZone, setFilterZone] = useState<string>('all');

  useEffect(() => {
    fetchInitialData();
    // Set up real-time listeners
    setupRealTimeListeners();
  }, [user]);

  const fetchInitialData = async () => {
    if (!user?.restaurantId) return;

    try {
      setLoading(true);
      
      // Fetch zones
      const zonesSnapshot = await getDocs(
        collection(db, 'restaurants', user.restaurantId, 'zones')
      );
      const fetchedZones = zonesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Zone[];

      // Fetch staff
      const staffSnapshot = await getDocs(
        collection(db, 'restaurants', user.restaurantId, 'staff')
      );
      const fetchedStaff = staffSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Staff[];

      setZones(fetchedZones);
      setStaff(fetchedStaff);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeListeners = () => {
    if (!user?.restaurantId) return;

    // Listen to table changes in real-time
    const tablesQuery = query(
      collection(db, 'restaurants', user.restaurantId, 'tables'),
      orderBy('number')
    );

    const unsubscribe = onSnapshot(tablesQuery, (snapshot) => {
      const fetchedTables = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          lastStatusChange: data.lastStatusChange?.toDate() || new Date(),
          currentOrder: data.currentOrder ? {
            ...data.currentOrder,
            orderTime: data.currentOrder.orderTime?.toDate() || new Date()
          } : undefined
        };
      }) as Table[];
      
      setTables(fetchedTables);
    });

    return unsubscribe;
  };

  const handleStatusChange = async (tableId: string, newStatus: Table['status']) => {
    if (!user?.restaurantId) return;

    try {
      const tableRef = doc(db, 'restaurants', user.restaurantId, 'tables', tableId);
      await updateDoc(tableRef, {
        status: newStatus,
        lastStatusChange: new Date(),
        ...(newStatus === 'available' && { currentOrder: null })
      });

      toast({
        title: 'Success',
        description: 'Table status updated successfully'
      });
    } catch (error) {
      console.error('Error updating table status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update table status',
        variant: 'destructive'
      });
    }
  };

  const handleTableSelect = (table: Table) => {
    setSelectedTable(table);
    setIsPanelOpen(true);
  };

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'occupied': return 'bg-red-500';
      case 'reserved': return 'bg-yellow-500';
      case 'cleaning': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusBadgeVariant = (status: Table['status']) => {
    switch (status) {
      case 'available': return 'default';
      case 'occupied': return 'destructive';
      case 'reserved': return 'secondary';
      case 'cleaning': return 'outline';
      default: return 'outline';
    }
  };

  const getTimeSinceStatusChange = (date?: Date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  };

  // Filter tables based on status and zone
  const filteredTables = tables.filter(table => {
    const statusMatch = filterStatus === 'all' || table.status === filterStatus;
    const zoneMatch = filterZone === 'all' || table.zone === filterZone;
    return statusMatch && zoneMatch;
  });

  const stats = {
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
    cleaning: tables.filter(t => t.status === 'cleaning').length,
    total: tables.length
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
          <h1 className="text-2xl font-semibold text-foreground">Live Table Status</h1>
          <p className="text-sm text-muted-foreground">
            Monitor real-time table status and manage occupancy
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/dashboard/tables'}
          >
            Table Layout
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/dashboard/tables/waiters'}
          >
            Assign Waiters
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{stats.available}</div>
          <div className="text-sm text-muted-foreground">Available</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">{stats.occupied}</div>
          <div className="text-sm text-muted-foreground">Occupied</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.reserved}</div>
          <div className="text-sm text-muted-foreground">Reserved</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-600">{stats.cleaning}</div>
          <div className="text-sm text-muted-foreground">Cleaning</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total Tables</div>
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
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
              <option value="cleaning">Cleaning</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mr-2">Zone:</label>
            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="p-2 rounded-md border border-border bg-card text-card-foreground"
            >
              <option value="all">All Zones</option>
              {zones.map(zone => (
                <option key={zone.id} value={zone.id}>{zone.name}</option>
              ))}
            </select>
          </div>
          <div className="text-sm text-muted-foreground">
            Showing {filteredTables.length} of {tables.length} tables
          </div>
        </div>
      </Card>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTables.map((table) => {
          const zone = zones.find(z => z.id === table.zone);
          return (
            <Card 
              key={table.id} 
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleTableSelect(table)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">Table {table.number}</h3>
                  <p className="text-sm text-muted-foreground">{table.seats} seats</p>
                </div>
                <Badge variant={getStatusBadgeVariant(table.status)}>
                  {table.status}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Zone:</span>
                  <span className="text-foreground">{zone?.name || 'Unknown'}</span>
                </div>
                
                {table.currentOrder && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Customer:</span>
                      <span className="text-foreground">{table.currentOrder.customerName || 'Walk-in'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Order Time:</span>
                      <span className="text-foreground">
                        {table.currentOrder.orderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="text-foreground font-medium">${table.currentOrder.total.toFixed(2)}</span>
                    </div>
                  </>
                )}
                
                {table.lastStatusChange && (
                  <div className="text-xs text-muted-foreground">
                    {getTimeSinceStatusChange(table.lastStatusChange)}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-4">
                {table.status !== 'available' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(table.id, 'available');
                    }}
                  >
                    Clear
                  </Button>
                )}
                {table.status !== 'cleaning' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(table.id, 'cleaning');
                    }}
                  >
                    Clean
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {filteredTables.length === 0 && (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <div className="text-lg font-medium">No tables found</div>
            <div className="text-sm">Try adjusting your filters or add some tables first</div>
          </div>
        </Card>
      )}

      {/* Table Details Panel */}
      <SlidePanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        title={selectedTable ? `Table ${selectedTable.number} Details` : 'Table Details'}
      >
        {selectedTable && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  Table Status
                </label>
                <select
                  value={selectedTable.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as Table['status'];
                    handleStatusChange(selectedTable.id, newStatus);
                    setSelectedTable({ ...selectedTable, status: newStatus });
                  }}
                  className="w-full p-2 rounded-md border border-border bg-card text-card-foreground"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="reserved">Reserved</option>
                  <option value="cleaning">Cleaning</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Seats</label>
                  <p className="text-sm text-muted-foreground">{selectedTable.seats}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Zone</label>
                  <p className="text-sm text-muted-foreground">
                    {zones.find(z => z.id === selectedTable.zone)?.name || 'Unknown'}
                  </p>
                </div>
              </div>

              {selectedTable.currentOrder && (
                <div className="border-t border-border pt-4">
                  <h4 className="font-medium text-foreground mb-3">Current Order</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Customer:</span>
                      <span className="text-sm text-foreground">{selectedTable.currentOrder.customerName || 'Walk-in'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Order Time:</span>
                      <span className="text-sm text-foreground">
                        {selectedTable.currentOrder.orderTime.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Items:</span>
                      <span className="text-sm text-foreground">{selectedTable.currentOrder.items}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total:</span>
                      <span className="text-sm font-medium text-foreground">${selectedTable.currentOrder.total.toFixed(2)}</span>
                    </div>
                    {selectedTable.currentOrder.waiter && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Waiter:</span>
                        <span className="text-sm text-foreground">{selectedTable.currentOrder.waiter}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedTable.lastStatusChange && (
                <div className="border-t border-border pt-4">
                  <h4 className="font-medium text-foreground mb-2">Last Status Change</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedTable.lastStatusChange.toLocaleString()}
                    <br />
                    ({getTimeSinceStatusChange(selectedTable.lastStatusChange)})
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                className="flex-1"
                onClick={() => {
                  handleStatusChange(selectedTable.id, 'available');
                  setIsPanelOpen(false);
                }}
                disabled={selectedTable.status === 'available'}
              >
                Mark Available
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  handleStatusChange(selectedTable.id, 'cleaning');
                  setIsPanelOpen(false);
                }}
                disabled={selectedTable.status === 'cleaning'}
              >
                Send to Cleaning
              </Button>
            </div>
          </div>
        )}
      </SlidePanel>
    </div>
  );
}

export default LiveTableStatus;
