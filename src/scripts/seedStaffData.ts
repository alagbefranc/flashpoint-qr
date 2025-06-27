import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const seedData = async () => {
  const restaurantId = 'your-restaurant-id'; // Replace with your restaurant ID

  // Sample staff data
  const staffList = [
    { id: 'staff1', name: 'Alice', role: 'manager' },
    { id: 'staff2', name: 'Bob', role: 'waiter' },
    { id: 'staff3', name: 'Charlie', role: 'chef' }
  ];

  // Add staff members to Firestore
  for (const staff of staffList) {
    await addDoc(collection(db, 'staff'), {
      ...staff,
      restaurantId,
      status: 'active',
      joinDate: serverTimestamp()
    });
  }

  // Sample activity logs
  const activityLogs = [
    { staffId: 'staff1', action: 'shift_started', details: 'Started morning shift' },
    { staffId: 'staff2', action: 'order_created', details: 'Created order #123' },
    { staffId: 'staff3', action: 'menu_updated', details: 'Updated the menu for the day' }
  ];

  // Add activity logs to Firestore
  for (const log of activityLogs) {
    await addDoc(collection(db, `restaurants/${restaurantId}/activityLogs`), {
      ...log,
      restaurantId,
      timestamp: serverTimestamp()
    });
  }

  // Sample performance data
  const performanceData = [
    { staffId: 'staff1', tasksCompleted: 20, customerFeedback: 88, attendance: 90, efficiency: 85 },
    { staffId: 'staff2', tasksCompleted: 15, customerFeedback: 76, attendance: 85, efficiency: 80 },
    { staffId: 'staff3', tasksCompleted: 25, customerFeedback: 92, attendance: 95, efficiency: 90 }
  ];

  // Add performance data to Firestore
  for (const data of performanceData) {
    await addDoc(collection(db, `restaurants/${restaurantId}/staffPerformance`), {
      ...data,
      restaurantId,
      createdAt: serverTimestamp()
    });
  }
};

seedData().then(() => console.log('Data seeding complete')).catch(err => console.error('Error seeding data:', err));
