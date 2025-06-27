'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { withRoleProtection } from '@/lib/auth/withRoleProtection';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from '@/components/ui/use-toast';

interface Zone {
  id: string;
  name: string;
  color: string;
  description?: string;
  tableCount?: number;
}

const predefinedColors = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#84CC16', // Lime
  '#06B6D4', // Cyan
];

function ZoneManagement() {
  const { user } = useAuth();
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingZone, setIsAddingZone] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  
  const [newZone, setNewZone] = useState({
    name: '',
    color: predefinedColors[0],
    description: ''
  });

  useEffect(() => {
    fetchZones();
  }, [user]);

  const fetchZones = async () => {
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

      // Fetch table counts for each zone
      const tablesSnapshot = await getDocs(
        collection(db, 'restaurants', user.restaurantId, 'tables')
      );
      const tables = tablesSnapshot.docs.map(doc => doc.data());
      
      // Count tables per zone
      const zonesWithCounts = fetchedZones.map(zone => ({
        ...zone,
        tableCount: tables.filter(table => table.zone === zone.id).length
      }));

      setZones(zonesWithCounts);
    } catch (error) {
      console.error('Error fetching zones:', error);
      toast({
        title: 'Error',
        description: 'Failed to load zones',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddZone = async () => {
    if (!user?.restaurantId || !newZone.name.trim()) {
      toast({
        title: 'Error',
        description: 'Zone name is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      const zoneData = {
        ...newZone,
        name: newZone.name.trim(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(
        collection(db, 'restaurants', user.restaurantId, 'zones'),
        zoneData
      );

      const newZoneWithId = { 
        id: docRef.id, 
        ...zoneData,
        tableCount: 0
      };
      setZones(prev => [...prev, newZoneWithId]);
      
      setNewZone({
        name: '',
        color: predefinedColors[0],
        description: ''
      });
      setIsAddingZone(false);

      toast({
        title: 'Success',
        description: 'Zone added successfully'
      });
    } catch (error) {
      console.error('Error adding zone:', error);
      toast({
        title: 'Error',
        description: 'Failed to add zone',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateZone = async () => {
    if (!user?.restaurantId || !editingZone || !editingZone.name.trim()) {
      toast({
        title: 'Error',
        description: 'Zone name is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      const zoneRef = doc(db, 'restaurants', user.restaurantId, 'zones', editingZone.id);
      const updateData = {
        name: editingZone.name.trim(),
        color: editingZone.color,
        description: editingZone.description || '',
        updatedAt: new Date()
      };

      await updateDoc(zoneRef, updateData);

      setZones(prev => prev.map(zone => 
        zone.id === editingZone.id 
          ? { ...zone, ...updateData }
          : zone
      ));

      setEditingZone(null);

      toast({
        title: 'Success',
        description: 'Zone updated successfully'
      });
    } catch (error) {
      console.error('Error updating zone:', error);
      toast({
        title: 'Error',
        description: 'Failed to update zone',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (!user?.restaurantId) return;

    const zone = zones.find(z => z.id === zoneId);
    if (zone && zone.tableCount && zone.tableCount > 0) {
      toast({
        title: 'Cannot Delete Zone',
        description: 'This zone has tables assigned. Please reassign or delete the tables first.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await deleteDoc(doc(db, 'restaurants', user.restaurantId, 'zones', zoneId));
      setZones(prev => prev.filter(zone => zone.id !== zoneId));

      toast({
        title: 'Success',
        description: 'Zone deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting zone:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete zone',
        variant: 'destructive'
      });
    }
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
          <h1 className="text-2xl font-semibold text-gray-900">Zones & Areas</h1>
          <p className="text-sm text-gray-500">
            Organize your restaurant into different zones for better table management
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/dashboard/tables'}
          >
            Back to Tables
          </Button>
          <Button onClick={() => setIsAddingZone(true)}>
            Add Zone
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{zones.length}</div>
          <div className="text-sm text-gray-500">Total Zones</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {zones.reduce((sum, zone) => sum + (zone.tableCount || 0), 0)}
          </div>
          <div className="text-sm text-gray-500">Tables Assigned</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-600">
            {zones.filter(zone => (zone.tableCount || 0) === 0).length}
          </div>
          <div className="text-sm text-gray-500">Empty Zones</div>
        </Card>
      </div>

      {/* Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {zones.map((zone) => (
          <Card key={zone.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: zone.color }}
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{zone.name}</h3>
                  {zone.description && (
                    <p className="text-sm text-gray-500">{zone.description}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingZone(zone)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteZone(zone.id)}
                  disabled={zone.tableCount && zone.tableCount > 0}
                >
                  Delete
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Tables</span>
                <Badge variant={zone.tableCount && zone.tableCount > 0 ? 'default' : 'secondary'}>
                  {zone.tableCount || 0}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Color</span>
                <div 
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: zone.color }}
                />
              </div>
            </div>
          </Card>
        ))}

        {zones.length === 0 && (
          <Card className="p-6 col-span-full">
            <div className="text-center text-gray-500">
              <div className="text-lg font-medium">No zones created yet</div>
              <div className="text-sm">Create zones to organize your restaurant layout</div>
            </div>
          </Card>
        )}
      </div>

      {/* Add Zone Modal */}
      <Modal isOpen={isAddingZone} onClose={() => setIsAddingZone(false)}>
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Add New Zone</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Zone Name</label>
              <Input
                value={newZone.name}
                onChange={(e) => setNewZone(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Main Dining, Patio, VIP Section"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
              <Input
                value={newZone.description}
                onChange={(e) => setNewZone(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this zone"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zone Color</label>
              <div className="grid grid-cols-5 gap-2">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewZone(prev => ({ ...prev, color }))}
                    className={`w-10 h-10 rounded border-2 transition-all
                      ${newZone.color === color 
                        ? 'border-gray-900 scale-110' 
                        : 'border-gray-300 hover:border-gray-500'
                      }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsAddingZone(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddZone}>
              Add Zone
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Zone Modal */}
      <Modal isOpen={!!editingZone} onClose={() => setEditingZone(null)}>
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Edit Zone</h2>
          
          {editingZone && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Zone Name</label>
                <Input
                  value={editingZone.name}
                  onChange={(e) => setEditingZone(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="e.g., Main Dining, Patio, VIP Section"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                <Input
                  value={editingZone.description || ''}
                  onChange={(e) => setEditingZone(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="Brief description of this zone"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zone Color</label>
                <div className="grid grid-cols-5 gap-2">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setEditingZone(prev => prev ? { ...prev, color } : null)}
                      className={`w-10 h-10 rounded border-2 transition-all
                        ${editingZone.color === color 
                          ? 'border-gray-900 scale-110' 
                          : 'border-gray-300 hover:border-gray-500'
                        }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setEditingZone(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateZone}>
              Update Zone
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ZoneManagement;
