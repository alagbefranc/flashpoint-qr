import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface ActivityLog {
  staffId: string;
  staffName: string;
  action: string;
  details: string;
  restaurantId: string;
  timestamp: any;
}

export const logActivity = async (
  restaurantId: string,
  staffId: string,
  staffName: string,
  action: string,
  details: string
) => {
  try {
    const activityData: ActivityLog = {
      staffId,
      staffName,
      action,
      details,
      restaurantId,
      timestamp: serverTimestamp()
    };

    await addDoc(
      collection(db, `restaurants/${restaurantId}/activityLogs`),
      activityData
    );
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// Common activity actions
export const ACTIVITY_ACTIONS = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  ORDER_CREATED: 'order_created',
  ORDER_UPDATED: 'order_updated',
  MENU_UPDATED: 'menu_updated',
  INVENTORY_UPDATED: 'inventory_updated',
  SHIFT_STARTED: 'shift_started',
  SHIFT_ENDED: 'shift_ended',
  TASK_COMPLETED: 'task_completed',
  CUSTOMER_SERVED: 'customer_served'
} as const;
