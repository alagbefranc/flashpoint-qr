'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/use-toast';

interface Performance {
  staffId: string;
  staffName: string;
  tasksCompleted: number;
  customerFeedback: number;
  attendance: number;
  efficiency: number;
}

interface Staff {
  id: string;
  name: string;
}

const PerformancePage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.restaurantId) {
      fetchPerformanceData();
    }
  }, [user?.restaurantId]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const performanceQuery = query(
        collection(db, `restaurants/${user?.restaurantId}/staffPerformance`),
        orderBy('tasksCompleted', 'desc')
      );
      const snapshot = await getDocs(performanceQuery);
      const performanceData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Performance[];
      setPerformances(performanceData);
    } catch (error) {
      console.error('Error fetching performance data:', error);
      toast({
        title: "Error",
        description: "Failed to load performance analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getBadgeColor = (value: number) => {
    if (value >= 80) return 'bg-green-100 text-green-800';
    if (value >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Staff Performance Analytics</h1>
          <p className="text-gray-600">Analyze staff productivity and effectiveness</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {performances.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No performance data available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks Completed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Feedback</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Efficiency</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {performances.map((performance) => (
                    <tr key={performance.staffId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {performance.staffName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getBadgeColor(performance.tasksCompleted)}>
                          {performance.tasksCompleted}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getBadgeColor(performance.customerFeedback)}>
                          {performance.customerFeedback}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getBadgeColor(performance.attendance)}>
                          {performance.attendance}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getBadgeColor(performance.efficiency)}>
                          {performance.efficiency}
                        </Badge>
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

export default PerformancePage;
