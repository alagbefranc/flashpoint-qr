'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Label } from '@/components/ui/Label';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/use-toast';

interface Activity {
  id: string;
  staffId: string;
  staffName: string;
  action: string;
  timestamp: any;
  details: string;
  restaurantId: string;
}

interface Staff {
  id: string;
  name: string;
  role: string;
}

const ActivityLogsPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>('');

  useEffect(() => {
    if (user?.restaurantId) {
      fetchActivities();
      fetchStaff();
    }
  }, [user?.restaurantId, selectedStaff]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      let activitiesQuery = query(
        collection(db, `restaurants/${user?.restaurantId}/activityLogs`),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      if (selectedStaff !== 'all') {
        activitiesQuery = query(
          collection(db, `restaurants/${user?.restaurantId}/activityLogs`),
          where('staffId', '==', selectedStaff),
          orderBy('timestamp', 'desc'),
          limit(100)
        );
      }

      const snapshot = await getDocs(activitiesQuery);
      const activitiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Activity[];
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: "Error",
        description: "Failed to load activity logs",
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
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = searchTerm === '' || 
      activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.staffName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = dateFilter === '' || 
      (activity.timestamp && 
       activity.timestamp.toDate && 
       activity.timestamp.toDate().toISOString().split('T')[0] === dateFilter);
    
    return matchesSearch && matchesDate;
  });

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getActionBadgeColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login': return 'bg-green-100 text-green-800';
      case 'logout': return 'bg-red-100 text-red-800';
      case 'order_created': return 'bg-blue-100 text-blue-800';
      case 'order_updated': return 'bg-yellow-100 text-yellow-800';
      case 'menu_updated': return 'bg-purple-100 text-purple-800';
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
          <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
          <p className="text-gray-600">Track staff activities and system actions</p>
        </div>
        <div className="flex space-x-2">
          <Badge variant="secondary">Total Logs: {activities.length}</Badge>
          <Badge className="bg-blue-100 text-blue-800">
            Filtered: {filteredActivities.length}
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Search Actions</Label>
              <Input
                placeholder="Search actions, details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label>Staff Member</Label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {staff.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} - {s.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date Filter</Label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStaff('all');
                  setDateFilter('');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity ({filteredActivities.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredActivities.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {activities.length === 0 ? 'No activity logs found' : 'No activities match your filters'}
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
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredActivities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {activity.staffName || 'Unknown Staff'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getActionBadgeColor(activity.action)}>
                          {activity.action.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(activity.timestamp)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        <div title={activity.details} className="truncate">
                          {activity.details || 'No details available'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityLogsPage;
