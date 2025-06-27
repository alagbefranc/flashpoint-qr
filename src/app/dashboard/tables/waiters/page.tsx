'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { collection, getDocs, updateDoc, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { SlidePanel } from '@/components/ui/SlidePanel';
import { Modal } from '@/components/ui/Modal';
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
  assignedWaiter?: string;
}

interface Zone {
  id: string;
  name: string;
  color: string;
  assignedWaiter?: string;
}

interface Waiter {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  assignedTables: string[];
  assignedZones: string[];
  workShift: 'morning' | 'afternoon' | 'evening' | 'night';
  joinedDate: Date;
}

function AssignWaiters() {
  const { user } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingWaiter, setEditingWaiter] = useState<Waiter | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [waiterToDelete, setWaiterToDelete] = useState<string | null>(null);
  const [assignmentMode, setAssignmentMode] = useState<'table' | 'zone'>('table');

  const [newWaiter, setNewWaiter] = useState({
    name: '',
    email: '',
    phone: '',
    workShift: 'morning' as const,
    assignedTables: [] as string[],
    assignedZones: [] as string[]
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user?.restaurantId) return;

    try {
      setLoading(true);
      
      // Fetch tables
      const tablesSnapshot = await getDocs(
        collection(db, 'restaurants', user.restaurantId, 'tables')
      );
      const fetchedTables = tablesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Table[];

      // Fetch zones
      const zonesSnapshot = await getDocs(
        collection(db, 'restaurants', user.restaurantId, 'zones')
      );
      const fetchedZones = zonesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Zone[];

      // Fetch waiters
      const waitersSnapshot = await getDocs(
        collection(db, 'restaurants', user.restaurantId, 'waiters')
      );
      const fetchedWaiters = waitersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          joinedDate: data.joinedDate?.toDate() || new Date(),
          assignedTables: data.assignedTables || [],
          assignedZones: data.assignedZones || []
        };
      }) as Waiter[];

      setTables(fetchedTables);
      setZones(fetchedZones);
      setWaiters(fetchedWaiters);
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

  const handleAddWaiter = () => {
    setEditingWaiter(null);
    setNewWaiter({
      name: '',
      email: '',
      phone: '',
      workShift: 'morning',
      assignedTables: [],
      assignedZones: []
    });
    setIsPanelOpen(true);
  };

  const handleEditWaiter = (waiter: Waiter) => {
    setEditingWaiter(waiter);
    setNewWaiter({
      name: waiter.name,
      email: waiter.email,
      phone: waiter.phone || '',
      workShift: waiter.workShift,
      assignedTables: waiter.assignedTables,
      assignedZones: waiter.assignedZones
    });
    setIsPanelOpen(true);
  };

  const handleSaveWaiter = async () => {
    if (!user?.restaurantId || !newWaiter.name || !newWaiter.email) {
      toast({
        title: 'Error',
        description: 'Name and email are required',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (editingWaiter) {
        // Update existing waiter
        const waiterRef = doc(db, 'restaurants', user.restaurantId, 'waiters', editingWaiter.id);
        const updateData = {
          ...newWaiter,
          updatedAt: new Date()
        };
        await updateDoc(waiterRef, updateData);
        
        setWaiters(prev => prev.map(waiter => 
          waiter.id === editingWaiter.id 
            ? { ...waiter, ...updateData }
            : waiter
        ));
      } else {
        // Add new waiter
        const waiterData = {
          ...newWaiter,
          isActive: true,
          joinedDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const docRef = await addDoc(
          collection(db, 'restaurants', user.restaurantId, 'waiters'),
          waiterData
        );

        const newWaiterWithId = { 
          id: docRef.id, 
          ...waiterData,
          joinedDate: new Date()
        };
        setWaiters(prev => [...prev, newWaiterWithId]);
      }
      
      setIsPanelOpen(false);
      setEditingWaiter(null);

      toast({
        title: 'Success',
        description: editingWaiter ? 'Waiter updated successfully' : 'Waiter added successfully'
      });
    } catch (error) {
      console.error('Error saving waiter:', error);
      toast({
        title: 'Error',
        description: 'Failed to save waiter',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteWaiter = (waiterId: string) => {
    setWaiterToDelete(waiterId);
    setShowDeleteModal(true);
  };

  const confirmDeleteWaiter = async () => {
    if (!user?.restaurantId || !waiterToDelete) return;

    try {
      await deleteDoc(doc(db, 'restaurants', user.restaurantId, 'waiters', waiterToDelete));
      setWaiters(prev => prev.filter(waiter => waiter.id !== waiterToDelete));
      setShowDeleteModal(false);
      setWaiterToDelete(null);

      toast({
        title: 'Success',
        description: 'Waiter deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting waiter:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete waiter',
        variant: 'destructive'
      });
    }
  };

  const handleAssignmentToggle = (waiterId: string, itemId: string, type: 'table' | 'zone') => {
    if (!user?.restaurantId) return;

    const waiter = waiters.find(w => w.id === waiterId);
    if (!waiter) return;

    const currentAssignments = type === 'table' ? waiter.assignedTables : waiter.assignedZones;
    const newAssignments = currentAssignments.includes(itemId)
      ? currentAssignments.filter(id => id !== itemId)
      : [...currentAssignments, itemId];

    const updateData = {
      [type === 'table' ? 'assignedTables' : 'assignedZones']: newAssignments,
      updatedAt: new Date()
    };

    // Update in Firestore
    const waiterRef = doc(db, 'restaurants', user.restaurantId, 'waiters', waiterId);
    updateDoc(waiterRef, updateData);

    // Update local state
    setWaiters(prev => prev.map(w => 
      w.id === waiterId 
        ? { 
            ...w, 
            [type === 'table' ? 'assignedTables' : 'assignedZones']: newAssignments 
          }
        : w
    ));
  };

  const getShiftColor = (shift: string) => {
    switch (shift) {
      case 'morning': return 'bg-yellow-100 text-yellow-800';
      case 'afternoon': return 'bg-blue-100 text-blue-800';
      case 'evening': return 'bg-purple-100 text-purple-800';
      case 'night': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getWaiterForTable = (tableId: string) => {
    return waiters.find(waiter => waiter.assignedTables.includes(tableId));
  };

  const getWaiterForZone = (zoneId: string) => {
    return waiters.find(waiter => waiter.assignedZones.includes(zoneId));
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
          <h1 className="text-2xl font-semibold text-foreground">Assign Waiters</h1>
          <p className="text-sm text-muted-foreground">
            Manage waiter assignments to tables and zones
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/dashboard/tables'}
          >
            Table Layout
          </Button>
          <Button onClick={handleAddWaiter}>
            Add Waiter
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{waiters.length}</div>
          <div className="text-sm text-muted-foreground">Total Waiters</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {waiters.filter(w => w.isActive).length}
          </div>
          <div className="text-sm text-muted-foreground">Active Waiters</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-600">
            {tables.filter(t => getWaiterForTable(t.id)).length}
          </div>
          <div className="text-sm text-muted-foreground">Assigned Tables</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">
            {zones.filter(z => getWaiterForZone(z.id)).length}
          </div>
          <div className="text-sm text-muted-foreground">Assigned Zones</div>
        </Card>
      </div>

      {/* Assignment Mode Toggle */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-foreground">Assignment Mode:</span>
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setAssignmentMode('table')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                assignmentMode === 'table'
                  ? 'bg-background text-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              By Table
            </button>
            <button
              onClick={() => setAssignmentMode('zone')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                assignmentMode === 'zone'
                  ? 'bg-background text-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              By Zone
            </button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waiters List */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-foreground">Waiters</h3>
            <Badge variant="secondary">{waiters.length} total</Badge>
          </div>
          
          <div className="space-y-3">
            {waiters.map((waiter) => (
              <div 
                key={waiter.id} 
                className="flex items-center justify-between p-3 border border-border rounded-lg bg-card"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground">{waiter.name}</h4>
                    <Badge 
                      variant="secondary"
                      className={getShiftColor(waiter.workShift)}
                    >
                      {waiter.workShift}
                    </Badge>
                    {!waiter.isActive && (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{waiter.email}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                    <span>
                      Tables: {assignmentMode === 'table' ? waiter.assignedTables.length : 
                        tables.filter(t => waiter.assignedZones.includes(t.zone)).length}
                    </span>
                    <span>Zones: {waiter.assignedZones.length}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditWaiter(waiter)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteWaiter(waiter.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
            
            {waiters.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-lg font-medium">No waiters added yet</div>
                <div className="text-sm">Add waiters to start assigning tables and zones</div>
              </div>
            )}
          </div>
        </Card>

        {/* Assignment Grid */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-foreground">
              {assignmentMode === 'table' ? 'Table Assignments' : 'Zone Assignments'}
            </h3>
            <Badge variant="secondary">
              {assignmentMode === 'table' ? tables.length : zones.length} items
            </Badge>
          </div>
          
          <div className="space-y-3">
            {assignmentMode === 'table' ? (
              // Table assignments
              tables.map((table) => {
                const assignedWaiter = getWaiterForTable(table.id);
                const zone = zones.find(z => z.id === table.zone);
                
                return (
                  <div 
                    key={table.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg bg-card"
                  >
                    <div>
                      <h4 className="font-medium text-foreground">Table {table.number}</h4>
                      <p className="text-sm text-muted-foreground">
                        {table.seats} seats • {zone?.name || 'Unknown Zone'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {assignedWaiter ? (
                        <Badge variant="default">{assignedWaiter.name}</Badge>
                      ) : (
                        <Badge variant="outline">Unassigned</Badge>
                      )}
                      
                      <select
                        value={assignedWaiter?.id || ''}
                        onChange={(e) => {
                          if (assignedWaiter) {
                            handleAssignmentToggle(assignedWaiter.id, table.id, 'table');
                          }
                          if (e.target.value) {
                            handleAssignmentToggle(e.target.value, table.id, 'table');
                          }
                        }}
                        className="text-xs p-1 rounded border border-border bg-background"
                      >
                        <option value="">Assign...</option>
                        {waiters.filter(w => w.isActive).map(waiter => (
                          <option key={waiter.id} value={waiter.id}>
                            {waiter.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })
            ) : (
              // Zone assignments
              zones.map((zone) => {
                const assignedWaiter = getWaiterForZone(zone.id);
                const tablesInZone = tables.filter(t => t.zone === zone.id);
                
                return (
                  <div 
                    key={zone.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: zone.color }}
                      />
                      <div>
                        <h4 className="font-medium text-foreground">{zone.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {tablesInZone.length} tables
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {assignedWaiter ? (
                        <Badge variant="default">{assignedWaiter.name}</Badge>
                      ) : (
                        <Badge variant="outline">Unassigned</Badge>
                      )}
                      
                      <select
                        value={assignedWaiter?.id || ''}
                        onChange={(e) => {
                          if (assignedWaiter) {
                            handleAssignmentToggle(assignedWaiter.id, zone.id, 'zone');
                          }
                          if (e.target.value) {
                            handleAssignmentToggle(e.target.value, zone.id, 'zone');
                          }
                        }}
                        className="text-xs p-1 rounded border border-border bg-background"
                      >
                        <option value="">Assign...</option>
                        {waiters.filter(w => w.isActive).map(waiter => (
                          <option key={waiter.id} value={waiter.id}>
                            {waiter.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Waiter Form Panel */}
      <SlidePanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        title={editingWaiter ? 'Edit Waiter' : 'Add Waiter'}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSaveWaiter(); }} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Full Name
              </label>
              <Input
                value={newWaiter.name}
                onChange={(e) => setNewWaiter(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter waiter's full name"
                className="w-full"
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Email Address
              </label>
              <Input
                type="email"
                value={newWaiter.email}
                onChange={(e) => setNewWaiter(prev => ({ ...prev, email: e.target.value }))}
                placeholder="waiter@restaurant.com"
                className="w-full"
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Phone Number (Optional)
              </label>
              <Input
                type="tel"
                value={newWaiter.phone}
                onChange={(e) => setNewWaiter(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 (555) 123-4567"
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Work Shift
              </label>
              <select
                value={newWaiter.workShift}
                onChange={(e) => setNewWaiter(prev => ({ ...prev, workShift: e.target.value as any }))}
                className="w-full p-2 rounded-md border border-border bg-card text-card-foreground"
                required
              >
                <option value="morning">Morning (6 AM - 2 PM)</option>
                <option value="afternoon">Afternoon (2 PM - 10 PM)</option>
                <option value="evening">Evening (6 PM - 2 AM)</option>
                <option value="night">Night (10 PM - 6 AM)</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsPanelOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingWaiter ? 'Update Waiter' : 'Add Waiter'}
            </Button>
          </div>
        </form>
      </SlidePanel>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Delete Waiter</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Are you sure you want to delete this waiter? All table and zone assignments will be removed.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteWaiter}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AssignWaiters;
