'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/context/AuthContext';
import { Plus, Trash2, Edit, X, Check } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  restaurantId: string;
  createdAt?: any;
  updatedAt?: any;
}

const AVAILABLE_PERMISSIONS = [
  'view_menu',
  'edit_menu',
  'delete_menu',
  'view_orders',
  'create_orders',
  'edit_orders',
  'delete_orders',
  'view_inventory',
  'edit_inventory',
  'view_staff',
  'manage_staff',
  'view_reports',
  'manage_settings',
  'view_tables',
  'manage_tables',
  'view_reservations',
  'manage_reservations',
  'view_shifts',
  'manage_shifts'
];

const RolesPermissionsPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      
      // Debug user information
      console.log('Fetching roles with user:', {
        uid: user?.uid,
        email: user?.email,
        restaurantId: user?.restaurantId,
        roles: user?.roles
      });
      
      const querySnapshot = await getDocs(collection(db, 'staffRoles'));
      console.log('Raw roles query result:', querySnapshot.size, 'documents found');
      
      const rolesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Role[];
      console.log('Roles data:', rolesData);
      
      // Filter roles by restaurant if user has restaurantId
      const filteredRoles = user?.restaurantId 
        ? rolesData.filter(role => role.restaurantId === user.restaurantId)
        : rolesData;
      
      console.log('Filtered roles for restaurant', user?.restaurantId, ':', filteredRoles);
      setRoles(filteredRoles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      console.error('Error code:', (error as any)?.code);
      console.error('Error message:', (error as any)?.message);
      
      toast({
        title: "Error",
        description: `Unable to fetch roles data: ${(error as any)?.message || 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    if (!user?.restaurantId) {
      toast({
        title: "Error",
        description: "No restaurant associated with your account",
        variant: "destructive"
      });
      return;
    }

    if (!newRole.name.trim()) {
      toast({
        title: "Error",
        description: "Role name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const roleData = {
        name: newRole.name.trim(),
        description: newRole.description.trim(),
        permissions: newRole.permissions,
        restaurantId: user.restaurantId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'staffRoles'), roleData);
      
      const newRoleWithId = {
        id: docRef.id,
        ...roleData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setRoles(prev => [...prev, newRoleWithId]);
      setNewRole({ name: '', description: '', permissions: [] });
      setIsCreating(false);
      
      toast({
        title: "Success",
        description: "Role created successfully"
      });
    } catch (error) {
      console.error('Error creating role:', error);
      toast({
        title: "Error",
        description: "Failed to create role",
        variant: "destructive"
      });
    }
  };

  const handleUpdateRole = async (roleId: string, updatedData: Partial<Role>) => {
    try {
      const roleRef = doc(db, 'staffRoles', roleId);
      await updateDoc(roleRef, {
        ...updatedData,
        updatedAt: serverTimestamp()
      });
      
      setRoles(prev => prev.map(role => 
        role.id === roleId 
          ? { ...role, ...updatedData, updatedAt: new Date() }
          : role
      ));
      
      setEditingRole(null);
      
      toast({
        title: "Success",
        description: "Role updated successfully"
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!window.confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'staffRoles', roleId));
      setRoles(prev => prev.filter(role => role.id !== roleId));
      
      toast({
        title: "Success",
        description: "Role deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive"
      });
    }
  };

  const togglePermission = (permission: string, isForNewRole = false, roleId?: string) => {
    if (isForNewRole) {
      setNewRole(prev => ({
        ...prev,
        permissions: prev.permissions.includes(permission)
          ? prev.permissions.filter(p => p !== permission)
          : [...prev.permissions, permission]
      }));
    } else if (roleId) {
      const role = roles.find(r => r.id === roleId);
      if (role) {
        const updatedPermissions = role.permissions.includes(permission)
          ? role.permissions.filter(p => p !== permission)
          : [...role.permissions, permission];
        
        handleUpdateRole(roleId, { permissions: updatedPermissions });
      }
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
          <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-gray-600">Manage staff roles and their permissions</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Create New Role</span>
        </Button>
      </div>

      {/* Create New Role Form */}
      {isCreating && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Create New Role</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="roleName">Role Name *</Label>
                <Input
                  id="roleName"
                  value={newRole.name}
                  onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Manager, Waiter, Chef"
                />
              </div>
              
              <div>
                <Label htmlFor="roleDescription">Description</Label>
                <Textarea
                  id="roleDescription"
                  value={newRole.description}
                  onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this role's responsibilities"
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {AVAILABLE_PERMISSIONS.map(permission => (
                    <div key={permission} className="flex items-center space-x-2">
                      <Checkbox
                        id={`new-${permission}`}
                        checked={newRole.permissions.includes(permission)}
                        onCheckedChange={() => togglePermission(permission, true)}
                      />
                      <Label htmlFor={`new-${permission}`} className="text-sm">
                        {permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={handleCreateRole}>
                  <Check className="h-4 w-4 mr-2" />
                  Create Role
                </Button>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Roles */}
      <div className="space-y-4">
        {roles.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500 mb-4">No roles found. Create your first role to get started.</p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Role
              </Button>
            </CardContent>
          </Card>
        ) : (
          roles.map(role => (
            <Card key={role.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{role.name}</span>
                      <Badge variant="secondary">{role.permissions.length} permissions</Badge>
                    </CardTitle>
                    {role.description && (
                      <p className="text-gray-600 mt-1">{role.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingRole(editingRole === role.id ? null : role.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRole(role.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {editingRole === role.id && (
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Permissions for {role.name}</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                        {AVAILABLE_PERMISSIONS.map(permission => (
                          <div key={permission} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${role.id}-${permission}`}
                              checked={role.permissions.includes(permission)}
                              onCheckedChange={() => togglePermission(permission, false, role.id)}
                            />
                            <Label htmlFor={`${role.id}-${permission}`} className="text-sm">
                              {permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
              
              {editingRole !== role.id && role.permissions.length > 0 && (
                <CardContent>
                  <div>
                    <Label className="text-sm font-medium">Current Permissions:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {role.permissions.map(permission => (
                        <Badge key={permission} variant="outline">
                          {permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default RolesPermissionsPage;
