'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Button } from '@/components/ui/Button';
import { withRoleProtection } from '@/lib/auth/withRoleProtection';

interface DashboardStats {
  activeOrders: number;
  completedOrders: number;
  menuItems: number;
  revenue: number;
}

interface RestaurantData {
  name: string;
  subdomain: string;
  features?: {
    onlineOrdering: boolean;
    reservations: boolean;
    callWaiter: boolean;
    kitchenDisplay: boolean;
    analytics: boolean;
    smsNotifications: boolean;
  };
}

function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    activeOrders: 0,
    completedOrders: 0,
    menuItems: 0,
    revenue: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.uid) return;

      try {
        // Get user details to find restaurant ID
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const restaurantId = userData.restaurantId;
          
          if (restaurantId) {
            // Get restaurant data
            const restaurantRef = doc(db, 'restaurants', restaurantId);
            const restaurantDoc = await getDoc(restaurantRef);
            
            if (restaurantDoc.exists()) {
              const data = restaurantDoc.data() as RestaurantData;
              setRestaurant(data);
              
              // For demo purposes, set some mock statistics
              // In a real app, these would be calculated from orders and menu collections
              setStats({
                activeOrders: Math.floor(Math.random() * 5),
                completedOrders: Math.floor(Math.random() * 50) + 10,
                menuItems: Math.floor(Math.random() * 30) + 5,
                revenue: Math.floor(Math.random() * 5000) + 1000,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const quickActions = [
    {
      name: 'Manage Menu',
      description: 'Edit menu items, categories, and pricing',
      href: '/dashboard/menu',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      roles: ['admin']
    },
    {
      name: 'View Orders',
      description: 'Manage active and completed orders',
      href: '/dashboard/orders',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      roles: ['admin', 'staff']
    },
    {
      name: 'Kitchen Display',
      description: 'View and manage the kitchen order queue',
      href: '/dashboard/kitchen',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      roles: ['admin', 'kitchen']
    },
    {
      name: 'QR Codes',
      description: 'Generate and manage table QR codes',
      href: '/dashboard/qr-codes',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      ),
      roles: ['admin', 'staff']
    }
  ];

  // Filter actions based on user roles
  const filteredActions = quickActions.filter(action => {
    if (!user?.roles) return false;
    return action.roles.some(role => user.roles?.[role as keyof typeof user.roles]);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="py-4">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back to {restaurant?.name || 'your restaurant'}
        </p>
      </div>
      
      {/* Stats Grid */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary/10 rounded-md p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">Active Orders</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">{stats.activeOrders}</div>
                </dd>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary/10 rounded-md p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">Completed Orders</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">{stats.completedOrders}</div>
                </dd>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary/10 rounded-md p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">Menu Items</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">{stats.menuItems}</div>
                </dd>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary/10 rounded-md p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">${stats.revenue.toFixed(2)}</div>
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
      </div>

      {/* Features Status */}
      {user?.roles?.admin && restaurant?.features && (
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900">Enabled Features</h2>
          <div className="mt-2 bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-center">
                  <div className={`h-4 w-4 rounded-full mr-2 ${restaurant.features.onlineOrdering ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>Online Ordering</span>
                </div>
                <div className="flex items-center">
                  <div className={`h-4 w-4 rounded-full mr-2 ${restaurant.features.reservations ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>Table Reservations</span>
                </div>
                <div className="flex items-center">
                  <div className={`h-4 w-4 rounded-full mr-2 ${restaurant.features.callWaiter ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>Call Waiter Feature</span>
                </div>
                <div className="flex items-center">
                  <div className={`h-4 w-4 rounded-full mr-2 ${restaurant.features.kitchenDisplay ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>Kitchen Display System</span>
                </div>
                <div className="flex items-center">
                  <div className={`h-4 w-4 rounded-full mr-2 ${restaurant.features.analytics ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>AI Analytics</span>
                </div>
                <div className="flex items-center">
                  <div className={`h-4 w-4 rounded-full mr-2 ${restaurant.features.smsNotifications ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>SMS Notifications</span>
                </div>
              </div>
              <div className="mt-5">
                <Link href="/dashboard/settings">
                  <Button variant="outline" className="w-full sm:w-auto">
                    Manage Settings
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export the dashboard page with role protection
export default withRoleProtection(DashboardPage, 'any');
