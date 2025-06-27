'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { doc, collection, addDoc, getDocs, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
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
  x: number;
  y: number;
  shape: 'square' | 'circle' | 'rectangle';
  size: 'small' | 'medium' | 'large';
}

interface Zone {
  id: string;
  name: string;
  color: string;
}

function TableLayoutEditor() {
  const { user } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [draggedTable, setDraggedTable] = useState<Table | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<string | null>(null);

  const [newTable, setNewTable] = useState({
    number: '',
    seats: 4,
    zone: '',
    shape: 'circle' as const,
    size: 'medium' as const
  });

  useEffect(() => {
    fetchTableData();
  }, [user]);

  const fetchTableData = async () => {
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

      setTables(fetchedTables);
      setZones(fetchedZones);
    } catch (error) {
      console.error('Error fetching table data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load table data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTable = () => {
    setEditingTable(null);
    setNewTable({
      number: '',
      seats: 4,
      zone: '',
      shape: 'circle',
      size: 'medium'
    });
    setIsPanelOpen(true);
  };

  const handleEditTable = (table: Table) => {
    setEditingTable(table);
    setNewTable({
      number: table.number,
      seats: table.seats,
      zone: table.zone,
      shape: table.shape,
      size: table.size
    });
    setIsPanelOpen(true);
  };

  const handleSaveTable = async () => {
    if (!user?.restaurantId || !newTable.number || !newTable.zone) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (editingTable) {
        // Update existing table
        const tableRef = doc(db, 'restaurants', user.restaurantId, 'tables', editingTable.id);
        const updateData = {
          ...newTable,
          updatedAt: new Date()
        };
        await updateDoc(tableRef, updateData);
        
        setTables(prev => prev.map(table => 
          table.id === editingTable.id 
            ? { ...table, ...updateData }
            : table
        ));
      } else {
        // Add new table
        const tableData = {
          ...newTable,
          status: 'available' as const,
          x: Math.random() * 400 + 50,
          y: Math.random() * 300 + 50,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const docRef = await addDoc(
          collection(db, 'restaurants', user.restaurantId, 'tables'),
          tableData
        );

        const newTableWithId = { id: docRef.id, ...tableData };
        setTables(prev => [...prev, newTableWithId]);
      }
      
      setIsPanelOpen(false);
      setEditingTable(null);

      toast({
        title: 'Success',
        description: editingTable ? 'Table updated successfully' : 'Table added successfully'
      });
    } catch (error) {
      console.error('Error saving table:', error);
      toast({
        title: 'Error',
        description: 'Failed to save table',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateTable = async (updatedTable: Table) => {
    if (!user?.restaurantId) return;

    try {
      const tableRef = doc(db, 'restaurants', user.restaurantId, 'tables', updatedTable.id);
      await updateDoc(tableRef, {
        ...updatedTable,
        updatedAt: new Date()
      });

      setTables(prev => prev.map(table => 
        table.id === updatedTable.id ? updatedTable : table
      ));

      toast({
        title: 'Success',
        description: 'Table updated successfully'
      });
    } catch (error) {
      console.error('Error updating table:', error);
      toast({
        title: 'Error',
        description: 'Failed to update table',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteTable = (tableId: string) => {
    setTableToDelete(tableId);
    setShowDeleteModal(true);
  };

  const confirmDeleteTable = async () => {
    if (!user?.restaurantId || !tableToDelete) return;

    try {
      await deleteDoc(doc(db, 'restaurants', user.restaurantId, 'tables', tableToDelete));
      setTables(prev => prev.filter(table => table.id !== tableToDelete));
      setShowDeleteModal(false);
      setTableToDelete(null);

      toast({
        title: 'Success',
        description: 'Table deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting table:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete table',
        variant: 'destructive'
      });
    }
  };

  const handleTableDrop = (e: React.DragEvent, table: Table) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const updatedTable = { ...table, x, y };
    handleUpdateTable(updatedTable);
    setDraggedTable(null);
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

  const getZoneColor = (zoneId: string) => {
    const zone = zones.find(z => z.id === zoneId);
    return zone?.color || '#3B82F6';
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
          <h1 className="text-2xl font-semibold text-gray-900">Table Layout Editor</h1>
          <p className="text-sm text-gray-500">
            Design your restaurant layout and manage table configurations
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/dashboard/tables/zones'}
          >
            Manage Zones
          </Button>
          <Button onClick={handleAddTable}>
            Add Table
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{tables.filter(t => t.status === 'available').length}</div>
          <div className="text-sm text-gray-500">Available</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">{tables.filter(t => t.status === 'occupied').length}</div>
          <div className="text-sm text-gray-500">Occupied</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-600">{tables.filter(t => t.status === 'reserved').length}</div>
          <div className="text-sm text-gray-500">Reserved</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-600">{tables.length}</div>
          <div className="text-sm text-gray-500">Total Tables</div>
        </Card>
      </div>

      {/* Layout Canvas */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium">Restaurant Layout</h3>
          <p className="text-sm text-gray-500">Drag tables to reposition them</p>
        </div>
        
        <div 
          className="relative border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 min-h-[500px] overflow-hidden"
          onDrop={(e) => draggedTable && handleTableDrop(e, draggedTable)}
          onDragOver={(e) => e.preventDefault()}
        >
          {tables.map((table) => {
            const zone = zones.find(z => z.id === table.zone);
            return (
              <div
                key={table.id}
                draggable
                onDragStart={() => setDraggedTable(table)}
                onClick={() => setSelectedTable(table)}
                className={`absolute cursor-move hover:shadow-lg transition-shadow
                  ${table.shape === 'circle' ? 'rounded-full' : table.shape === 'rectangle' ? 'rounded-lg' : 'rounded'}
                  ${table.size === 'small' ? 'w-12 h-12' : table.size === 'large' ? 'w-20 h-20' : 'w-16 h-16'}
                  ${getStatusColor(table.status)} text-white font-semibold
                  flex items-center justify-center text-sm
                  ${selectedTable?.id === table.id ? 'ring-4 ring-blue-400' : ''}
                `}
                style={{
                  left: table.x,
                  top: table.y,
                  backgroundColor: zone?.color || getZoneColor(table.zone)
                }}
                title={`Table ${table.number} - ${table.seats} seats - ${table.status}`}
              >
                {table.number}
              </div>
            );
          })}
          
          {tables.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-lg font-medium">No tables added yet</div>
                <div className="text-sm">Click "Add Table" to get started</div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Table Details Panel */}
      {selectedTable && (
        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-medium">Table {selectedTable.number}</h3>
              <p className="text-sm text-gray-500">
                {selectedTable.seats} seats • Zone: {zones.find(z => z.id === selectedTable.zone)?.name}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditTable(selectedTable)}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteTable(selectedTable.id)}
              >
                Delete
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select 
                value={selectedTable.status}
                onChange={(e) => {
                  const updatedTable = { ...selectedTable, status: e.target.value as Table['status'] };
                  handleUpdateTable(updatedTable);
                  setSelectedTable(updatedTable);
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
                <option value="cleaning">Cleaning</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Table Form Panel */}
      <SlidePanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        title={editingTable ? 'Edit Table' : 'Add Table'}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSaveTable(); }} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Table Number
              </label>
              <Input
                value={newTable.number}
                onChange={(e) => setNewTable(prev => ({ ...prev, number: e.target.value }))}
                placeholder="e.g., T1, A-5"
                className="w-full"
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Number of Seats
              </label>
              <Input
                type="number"
                value={newTable.seats}
                onChange={(e) => setNewTable(prev => ({ ...prev, seats: parseInt(e.target.value) || 4 }))}
                min="1"
                max="20"
                className="w-full"
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Zone
              </label>
              <select
                value={newTable.zone}
                onChange={(e) => setNewTable(prev => ({ ...prev, zone: e.target.value }))}
                className="w-full p-2 rounded-md border border-border bg-card text-card-foreground"
                required
              >
                <option value="">Select a zone</option>
                {zones.map(zone => (
                  <option key={zone.id} value={zone.id}>{zone.name}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  Shape
                </label>
                <select
                  value={newTable.shape}
                  onChange={(e) => setNewTable(prev => ({ ...prev, shape: e.target.value as any }))}
                  className="w-full p-2 rounded-md border border-border bg-card text-card-foreground"
                >
                  <option value="circle">Circle</option>
                  <option value="square">Square</option>
                  <option value="rectangle">Rectangle</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  Size
                </label>
                <select
                  value={newTable.size}
                  onChange={(e) => setNewTable(prev => ({ ...prev, size: e.target.value as any }))}
                  className="w-full p-2 rounded-md border border-border bg-card text-card-foreground"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsPanelOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingTable ? 'Update Table' : 'Add Table'}
            </Button>
          </div>
        </form>
      </SlidePanel>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Delete Table</h2>
          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to delete this table? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteTable}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default TableLayoutEditor;
