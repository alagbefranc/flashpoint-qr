'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface StaffInvite {
  id: string;
  email: string;
  role: 'staff' | 'kitchen' | 'admin';
  status: 'pending' | 'accepted';
  invitedAt: Date;
}

const roleOptions = [
  { value: 'staff', label: 'Waitstaff (POS)' },
  { value: 'kitchen', label: 'Kitchen Staff (KDS)' },
  { value: 'admin', label: 'Restaurant Admin' }
];

export default function InviteStaffPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [invites, setInvites] = useState<StaffInvite[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'staff' | 'kitchen' | 'admin'>('staff');
  
  const [loading, setLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [error, setError] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [restaurantName, setRestaurantName] = useState('');

  useEffect(() => {
    const fetchStaffInfo = async () => {
      if (!user?.uid) return;

      try {
        // Get user details to find restaurant ID
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const restaurantId = userData.restaurantId;
          
          if (restaurantId) {
            setRestaurantId(restaurantId);
            
            // Get restaurant data
            const restaurantRef = doc(db, 'restaurants', restaurantId);
            const restaurantDoc = await getDoc(restaurantRef);
            
            if (restaurantDoc.exists()) {
              const data = restaurantDoc.data();
              setRestaurantName(data.name);
              
              // Set staff invites if they exist
              if (data.invitedStaff && Array.isArray(data.invitedStaff)) {
                setInvites(data.invitedStaff);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching staff info:', error);
        setError('Failed to load staff information');
      } finally {
        setIsFetchingData(false);
      }
    };

    fetchStaffInfo();
  }, [user]);

  const handleAddInvite = async () => {
    if (!email.trim() || !restaurantId) return;
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Check for duplicates
    if (invites.some(invite => invite.email === email.toLowerCase().trim())) {
      setError('This email has already been invited');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Create new invite
      const newInvite: StaffInvite = {
        id: `invite-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        email: email.toLowerCase().trim(),
        role,
        status: 'pending',
        invitedAt: new Date()
      };
      
      // Add to local state
      const updatedInvites = [...invites, newInvite];
      setInvites(updatedInvites);
      
      // Update in Firestore
      const restaurantRef = doc(db, 'restaurants', restaurantId);
      await updateDoc(restaurantRef, {
        invitedStaff: updatedInvites
      });
      
      // Create invitation in invites collection
      await addDoc(collection(db, 'invitations'), {
        email: email.toLowerCase().trim(),
        role,
        restaurantId,
        restaurantName,
        status: 'pending',
        createdAt: new Date()
      });
      
      // Reset form
      setEmail('');
      setRole('staff');
    } catch (error) {
      console.error('Error adding invite:', error);
      setError('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const removeInvite = async (id: string) => {
    try {
      const updatedInvites = invites.filter(invite => invite.id !== id);
      setInvites(updatedInvites);
      
      // Update in Firestore
      const restaurantRef = doc(db, 'restaurants', restaurantId);
      await updateDoc(restaurantRef, {
        invitedStaff: updatedInvites
      });
    } catch (error) {
      console.error('Error removing invite:', error);
      setError('Failed to remove invitation');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!restaurantId) {
      setError('Restaurant ID not found');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Just update timestamp to indicate this step was completed
      const restaurantRef = doc(db, 'restaurants', restaurantId);
      await updateDoc(restaurantRef, {
        updatedAt: new Date()
      });
      
      // Navigate to next step
      router.push('/onboarding/features');
    } catch (error) {
      console.error('Error saving staff invites:', error);
      setError('Failed to save staff information');
    } finally {
      setLoading(false);
    }
  };

  if (isFetchingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
      <h2 className="text-2xl font-bold mb-6">Invite Your Staff</h2>
      
      <p className="text-gray-700 mb-8">
        Invite your restaurant staff to join your FlashPoint QR platform. Each person will receive an email invitation with instructions to set up their account.
      </p>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">Add Team Member</h3>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@example.com"
            />
          </div>
          
          <div className="md:w-1/3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'staff' | 'kitchen' | 'admin')}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 h-10"
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <Button 
              type="button" 
              onClick={handleAddInvite}
              disabled={!email.trim()}
              isLoading={loading}
            >
              Send Invite
            </Button>
          </div>
        </div>
        
        {error && (
          <div className="mt-2 text-red-500 text-sm">{error}</div>
        )}
      </div>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">Team Invitations</h3>
        
        {invites.length === 0 ? (
          <p className="text-gray-600 italic">No invitations sent yet.</p>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invites.map((invite) => (
                  <tr key={invite.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invite.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {roleOptions.find(o => o.value === invite.role)?.label || invite.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        invite.status === 'accepted' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {invite.status === 'accepted' ? 'Accepted' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        type="button"
                        onClick={() => removeInvite(invite.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <p className="mt-4 text-sm text-gray-600">
          You can invite more staff members after completing the onboarding process.
        </p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="flex justify-between pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/onboarding/menu')}
          >
            Previous
          </Button>
          <Button type="submit">
            Save & Continue
          </Button>
        </div>
      </form>
    </div>
  );
}
