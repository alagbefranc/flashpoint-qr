'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { SlidePanel } from '@/components/ui/SlidePanel';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string; // Changed to string to accommodate dynamic roles
  department: string;
  status: 'active' | 'inactive' | 'on-leave';
  joinDate: any;
  lastActive: any;
  avatar?: string;
  hourlyRate?: number;
  permissions: string[];
  restaurantId: string;
}

interface StaffRole {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  restaurantId: string;
}

// Default role colors for dynamic roles
const DEFAULT_ROLE_COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-purple-100 text-purple-800',
  'bg-orange-100 text-orange-800',
  'bg-red-100 text-red-800',
  'bg-yellow-100 text-yellow-800',
  'bg-pink-100 text-pink-800',
  'bg-indigo-100 text-indigo-800'
];

const DEPARTMENTS = [
  'Front of House',
  'Kitchen',
  'Management',
  'Administration',
  'Cleaning',
  'Security'
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
  { value: 'on-leave', label: 'On Leave', color: 'bg-yellow-100 text-yellow-800' }
];

export default function StaffListPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [staffRoles, setStaffRoles] = useState<StaffRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
  const [isAddStaffPanelOpen, setIsAddStaffPanelOpen] = useState(false);
  const [addStaffMode, setAddStaffMode] = useState<'add' | 'invite'>('add');
  
  // Add Staff Form State
  const [newStaffData, setNewStaffData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'waiter' as Staff['role'],
    department: 'Front of House',
    hourlyRate: '',
    permissions: [] as string[],
    sendWelcomeEmail: false,
    temporaryPassword: '',
    inviteMessage: ''
  });

  useEffect(() => {
    if (user?.restaurantId) {
      fetchStaff();
      fetchStaffRoles();
    }
  }, [user?.restaurantId]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const staffQuery = query(
        collection(db, 'staff'),
        where('restaurantId', '==', user?.restaurantId)
      );
      const snapshot = await getDocs(staffQuery);
      const staffData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Staff[];
      
      setStaff(staffData);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        title: "Error",
        description: "Failed to load staff data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffRoles = async () => {
    try {
      const rolesQuery = query(
        collection(db, 'staffRoles'),
        where('restaurantId', '==', user?.restaurantId)
      );
      const snapshot = await getDocs(rolesQuery);
      const rolesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StaffRole[];
      
      setStaffRoles(rolesData);
    } catch (error) {
      console.error('Error fetching staff roles:', error);
      toast({
        title: "Error",
        description: "Failed to load staff roles",
        variant: "destructive"
      });
    }
  };

  const handleUpdateStatus = async (staffId: string, newStatus: string) => {
    try {
      const staffRef = doc(db, 'staff', staffId);
      await updateDoc(staffRef, {
        status: newStatus,
        lastUpdated: serverTimestamp()
      });
      
      setStaff(prev => prev.map(s => 
        s.id === staffId ? { ...s, status: newStatus as Staff['status'] } : s
      ));
      
      toast({
        title: "Success",
        description: "Staff status updated successfully"
      });
    } catch (error) {
      console.error('Error updating staff status:', error);
      toast({
        title: "Error",
        description: "Failed to update staff status",
        variant: "destructive"
      });
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!window.confirm('Are you sure you want to remove this staff member?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'staff', staffId));
      setStaff(prev => prev.filter(s => s.id !== staffId));
      toast({
        title: "Success",
        description: "Staff member removed successfully"
      });
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast({
        title: "Error",
        description: "Failed to remove staff member",
        variant: "destructive"
      });
    }
  };

  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || s.department === departmentFilter;
    
    return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
  });

  const getRoleColor = (role: string, index?: number) => {
    // For dynamic roles, use a default color scheme
    const roleObj = staffRoles.find(r => r.name === role);
    if (roleObj) {
      // Use a consistent color based on role index
      const roleIndex = staffRoles.findIndex(r => r.name === role);
      return DEFAULT_ROLE_COLORS[roleIndex % DEFAULT_ROLE_COLORS.length];
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getRoleDisplayName = (roleName: string) => {
    const role = staffRoles.find(r => r.name === roleName);
    return role ? role.name : roleName;
  };

  const getStatusColor = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.restaurantId) {
      toast({
        title: "Error",
        description: "No restaurant associated with your account",
        variant: "destructive"
      });
      return;
    }

    // Validate required fields
    if (!newStaffData.name || !newStaffData.email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (addStaffMode === 'add' && !newStaffData.temporaryPassword) {
      toast({
        title: "Error",
        description: "Please provide a temporary password",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Check if email already exists
      const existingStaffQuery = query(
        collection(db, 'staff'),
        where('email', '==', newStaffData.email),
        where('restaurantId', '==', user.restaurantId)
      );
      const existingStaff = await getDocs(existingStaffQuery);
      
      if (!existingStaff.empty) {
        toast({
          title: "Error",
          description: "A staff member with this email already exists",
          variant: "destructive"
        });
        return;
      }

      const staffData = {
        name: newStaffData.name,
        email: newStaffData.email,
        phone: newStaffData.phone || '',
        role: newStaffData.role,
        department: newStaffData.department,
        status: addStaffMode === 'invite' ? 'inactive' : 'active',
        joinDate: serverTimestamp(),
        lastActive: serverTimestamp(),
        hourlyRate: newStaffData.hourlyRate ? parseFloat(newStaffData.hourlyRate) : null,
        permissions: [],
        restaurantId: user.restaurantId,
        inviteStatus: addStaffMode === 'invite' ? 'pending' : 'active',
        temporaryPassword: addStaffMode === 'add' ? newStaffData.temporaryPassword : null,
        inviteMessage: addStaffMode === 'invite' ? newStaffData.inviteMessage : null,
        sendWelcomeEmail: newStaffData.sendWelcomeEmail,
        createdAt: serverTimestamp(),
        createdBy: user.uid
      };

      // Add staff member to Firestore
      const docRef = await addDoc(collection(db, 'staff'), staffData);
      
      // Add to local state
      const newStaff = {
        id: docRef.id,
        ...staffData,
        joinDate: new Date(),
        lastActive: new Date(),
        createdAt: new Date()
      } as Staff;
      
      setStaff(prev => [...prev, newStaff]);
      
      // Reset form and close panel
      setNewStaffData({
        name: '',
        email: '',
        phone: '',
        role: 'waiter',
        department: 'Front of House',
        hourlyRate: '',
        permissions: [],
        sendWelcomeEmail: false,
        temporaryPassword: '',
        inviteMessage: ''
      });
      setIsAddStaffPanelOpen(false);
      
      toast({
        title: "Success",
        description: addStaffMode === 'add' 
          ? "Staff member added successfully" 
          : "Invitation sent successfully"
      });
      
      // If sending welcome email, you could integrate with email service here
      if (newStaffData.sendWelcomeEmail) {
        // TODO: Integrate with email service (e.g., SendGrid, AWS SES)
        console.log('Welcome email would be sent to:', newStaffData.email);
      }
      
    } catch (error) {
      console.error('Error adding staff:', error);
      toast({
        title: "Error",
        description: addStaffMode === 'add' 
          ? "Failed to add staff member" 
          : "Failed to send invitation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600">Manage your restaurant staff and their roles</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => {
            setAddStaffMode('add');
            setIsAddStaffPanelOpen(true);
          }}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Staff
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              setAddStaffMode('invite');
              setIsAddStaffPanelOpen(true);
            }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Invite Staff
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {staff.filter(s => s.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">On Leave</p>
                <p className="text-2xl font-bold text-gray-900">
                  {staff.filter(s => s.status === 'on-leave').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {[...new Set(staff.map(s => s.department))].length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {staffRoles.map(role => (
                    <SelectItem key={role.name} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {STATUS_OPTIONS.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {DEPARTMENTS.map(dept => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Members ({filteredStaff.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role & Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Join Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStaff.map((staffMember) => (
                  <tr key={staffMember.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={staffMember.avatar} />
                          <AvatarFallback>
                            {staffMember.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {staffMember.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {staffMember.email}
                          </div>
                          {staffMember.phone && (
                            <div className="text-xs text-gray-400">
                              {staffMember.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getRoleColor(staffMember.role)}>
                        {getRoleDisplayName(staffMember.role)}
                      </Badge>
                      <div className="text-xs text-gray-500 mt-1">
                        {staffMember.department}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Select
                        value={staffMember.status}
                        onValueChange={(value) => handleUpdateStatus(staffMember.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <Badge className={getStatusColor(staffMember.status)}>
                            {STATUS_OPTIONS.find(s => s.value === staffMember.status)?.label}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map(status => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(staffMember.joinDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedStaff(staffMember);
                            setIsDetailsPanelOpen(true);
                          }}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedStaff(staffMember);
                            setIsEditPanelOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteStaff(staffMember.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredStaff.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No staff members found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {staff.length === 0 
                  ? "Get started by adding your first staff member."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Invite Staff Panel */}
      <SlidePanel
        isOpen={isAddStaffPanelOpen}
        onClose={() => {
          setIsAddStaffPanelOpen(false);
          setNewStaffData({
            name: '',
            email: '',
            phone: '',
            role: 'waiter',
            department: 'Front of House',
            hourlyRate: '',
            permissions: [],
            sendWelcomeEmail: false,
            temporaryPassword: '',
            inviteMessage: ''
          });
        }}
        title={addStaffMode === 'add' ? 'Add New Staff Member' : 'Invite Staff Member'}
      >
        <form onSubmit={handleAddStaff} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={newStaffData.name}
                onChange={(e) => setNewStaffData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={newStaffData.email}
                onChange={(e) => setNewStaffData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={newStaffData.phone}
                onChange={(e) => setNewStaffData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                value={newStaffData.hourlyRate}
                onChange={(e) => setNewStaffData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Role *</Label>
              <Select
                value={newStaffData.role}
                onValueChange={(value) => setNewStaffData(prev => ({ ...prev, role: value as Staff['role'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {staffRoles.map(role => (
                    <SelectItem key={role.name} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="department">Department *</Label>
              <Select
                value={newStaffData.department}
                onValueChange={(value) => setNewStaffData(prev => ({ ...prev, department: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(dept => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {addStaffMode === 'add' && (
            <div>
              <Label htmlFor="temporaryPassword">Temporary Password *</Label>
              <Input
                id="temporaryPassword"
                type="password"
                value={newStaffData.temporaryPassword}
                onChange={(e) => setNewStaffData(prev => ({ ...prev, temporaryPassword: e.target.value }))}
                placeholder="Enter temporary password"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Staff member will be prompted to change this password on first login.
              </p>
            </div>
          )}

          {addStaffMode === 'invite' && (
            <div>
              <Label htmlFor="inviteMessage">Invitation Message</Label>
              <Textarea
                id="inviteMessage"
                value={newStaffData.inviteMessage}
                onChange={(e) => setNewStaffData(prev => ({ ...prev, inviteMessage: e.target.value }))}
                placeholder="Add a personal message to the invitation email (optional)"
                rows={3}
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="sendWelcomeEmail"
              checked={newStaffData.sendWelcomeEmail}
              onCheckedChange={(checked) => setNewStaffData(prev => ({ ...prev, sendWelcomeEmail: checked }))}
            />
            <Label htmlFor="sendWelcomeEmail">
              Send welcome email with login instructions
            </Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddStaffPanelOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  {addStaffMode === 'add' ? 'Adding...' : 'Sending Invite...'}
                </>
              ) : (
                addStaffMode === 'add' ? 'Add Staff Member' : 'Send Invitation'
              )}
            </Button>
          </div>
        </form>
      </SlidePanel>

      {/* Staff Details Panel */}
      <SlidePanel
        isOpen={isDetailsPanelOpen}
        onClose={() => setIsDetailsPanelOpen(false)}
        title="Staff Details"
      >
        {selectedStaff && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={selectedStaff.avatar} />
                <AvatarFallback className="text-lg">
                  {selectedStaff.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{selectedStaff.name}</h3>
                <p className="text-gray-600">{selectedStaff.email}</p>
                <Badge className={getRoleColor(selectedStaff.role)}>
                  {getRoleDisplayName(selectedStaff.role)}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-sm text-gray-900">{selectedStaff.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <p className="mt-1 text-sm text-gray-900">{selectedStaff.department}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <Badge className={getStatusColor(selectedStaff.status)}>
                  {STATUS_OPTIONS.find(s => s.value === selectedStaff.status)?.label}
                </Badge>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Join Date</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(selectedStaff.joinDate)}</p>
              </div>
              {selectedStaff.hourlyRate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hourly Rate</label>
                  <p className="mt-1 text-sm text-gray-900">${selectedStaff.hourlyRate}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Active</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(selectedStaff.lastActive)}</p>
              </div>
            </div>

            {selectedStaff.permissions && selectedStaff.permissions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="flex flex-wrap gap-2">
                  {selectedStaff.permissions.map((permission, index) => (
                    <Badge key={index} variant="outline">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </SlidePanel>
    </div>
  );
}
