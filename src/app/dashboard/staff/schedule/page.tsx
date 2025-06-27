'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { SlidePanel } from '@/components/ui/SlidePanel';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/Badge';

interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  startTime: string;
  endTime: string;
  date: any;
  department: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  restaurantId: string;
  createdAt: any;
}

interface Staff {
  id: string;
  name: string;
  department: string;
  role: string;
}

const SchedulePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddShiftPanelOpen, setIsAddShiftPanelOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // New shift form state
  const [newShift, setNewShift] = useState({
    staffId: '',
    date: '',
    startTime: '',
    endTime: '',
    department: 'Front of House'
  });

  useEffect(() => {
    if (user?.restaurantId) {
      fetchShifts();
      fetchStaff();
    }
  }, [user?.restaurantId, selectedDate]);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const shiftsQuery = query(
        collection(db, `restaurants/${user?.restaurantId}/shifts`),
        where('date', '>=', new Date(selectedDate + 'T00:00:00')),
        where('date', '<', new Date(selectedDate + 'T23:59:59'))
      );
      const snapshot = await getDocs(shiftsQuery);
      const shiftsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Shift[];
      setShifts(shiftsData);
    } catch (error) {
      console.error('Error fetching shifts:', error);
      toast({
        title: "Error",
        description: "Failed to load shifts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const staffQuery = query(
        collection(db, 'staff'),
        where('restaurantId', '==', user?.restaurantId),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(staffQuery);
      const staffData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Staff[];
      setStaff(staffData);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newShift.staffId || !newShift.date || !newShift.startTime || !newShift.endTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const selectedStaff = staff.find(s => s.id === newShift.staffId);
      const shiftData = {
        staffId: newShift.staffId,
        staffName: selectedStaff?.name || '',
        startTime: newShift.startTime,
        endTime: newShift.endTime,
        date: new Date(newShift.date + 'T' + newShift.startTime),
        department: newShift.department,
        status: 'scheduled' as const,
        restaurantId: user?.restaurantId,
        createdAt: serverTimestamp(),
        createdBy: user?.uid
      };

      const docRef = await addDoc(collection(db, `restaurants/${user?.restaurantId}/shifts`), shiftData);
      
      const newShiftWithId = {
        id: docRef.id,
        ...shiftData,
        date: new Date(newShift.date + 'T' + newShift.startTime),
        createdAt: new Date()
      } as Shift;
      
      setShifts(prev => [...prev, newShiftWithId]);
      
      // Reset form
      setNewShift({
        staffId: '',
        date: '',
        startTime: '',
        endTime: '',
        department: 'Front of House'
      });
      setIsAddShiftPanelOpen(false);
      
      toast({
        title: "Success",
        description: "Shift scheduled successfully"
      });
    } catch (error) {
      console.error('Error adding shift:', error);
      toast({
        title: "Error",
        description: "Failed to schedule shift",
        variant: "destructive"
      });
    }
  };

  const handleUpdateShiftStatus = async (shiftId: string, newStatus: string) => {
    try {
      const shiftRef = doc(db, `restaurants/${user?.restaurantId}/shifts`, shiftId);
      await updateDoc(shiftRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      setShifts(prev => prev.map(s => 
        s.id === shiftId ? { ...s, status: newStatus as Shift['status'] } : s
      ));
      
      toast({
        title: "Success",
        description: "Shift status updated successfully"
      });
    } catch (error) {
      console.error('Error updating shift status:', error);
      toast({
        title: "Error",
        description: "Failed to update shift status",
        variant: "destructive"
      });
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    if (!window.confirm('Are you sure you want to delete this shift?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, `restaurants/${user?.restaurantId}/shifts`, shiftId));
      setShifts(prev => prev.filter(s => s.id !== shiftId));
      toast({
        title: "Success",
        description: "Shift deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting shift:', error);
      toast({
        title: "Error",
        description: "Failed to delete shift",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shift Scheduling</h1>
          <p className="text-gray-600">Manage staff schedules and shifts</p>
        </div>
        <Button onClick={() => setIsAddShiftPanelOpen(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Schedule Shift
        </Button>
      </div>

      {/* Date Filter */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Label>View Date:</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
            <div className="flex space-x-2">
              <Badge variant="secondary">Total Shifts: {shifts.length}</Badge>
              <Badge className="bg-green-100 text-green-800">
                Active: {shifts.filter(s => s.status === 'active').length}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shifts List */}
      <Card>
        <CardHeader>
          <CardTitle>Shifts for {new Date(selectedDate).toLocaleDateString()}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {shifts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No shifts scheduled for this date
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shifts.map((shift) => (
                    <tr key={shift.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {shift.staffName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {shift.department}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {shift.startTime} - {shift.endTime}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Select
                          value={shift.status}
                          onValueChange={(value) => handleUpdateShiftStatus(shift.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <Badge className={getStatusColor(shift.status)}>
                              {shift.status}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteShift(shift.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Shift Panel */}
      <SlidePanel
        isOpen={isAddShiftPanelOpen}
        onClose={() => setIsAddShiftPanelOpen(false)}
        title="Schedule New Shift"
        width="md"
      >
        <form onSubmit={handleAddShift} className="space-y-4">
          <div>
            <Label htmlFor="staff">Staff Member *</Label>
            <Select value={newShift.staffId} onValueChange={(value) => setNewShift(prev => ({ ...prev, staffId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {staff.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} - {s.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={newShift.date}
              onChange={(e) => setNewShift(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="time"
                value={newShift.startTime}
                onChange={(e) => setNewShift(prev => ({ ...prev, startTime: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="time"
                value={newShift.endTime}
                onChange={(e) => setNewShift(prev => ({ ...prev, endTime: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="department">Department</Label>
            <Select value={newShift.department} onValueChange={(value) => setNewShift(prev => ({ ...prev, department: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Front of House">Front of House</SelectItem>
                <SelectItem value="Kitchen">Kitchen</SelectItem>
                <SelectItem value="Management">Management</SelectItem>
                <SelectItem value="Administration">Administration</SelectItem>
                <SelectItem value="Cleaning">Cleaning</SelectItem>
                <SelectItem value="Security">Security</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="submit" className="flex-1">
              Schedule Shift
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsAddShiftPanelOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </SlidePanel>
    </div>
  );
};

export default SchedulePage;
