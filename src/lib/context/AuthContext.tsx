'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';

export interface UserRole {
  admin: boolean;
  staff: boolean;
  kitchen: boolean;
  customer: boolean;
}

export interface RestaurantUser extends User {
  restaurantId?: string;
  roles?: UserRole;
}

export interface RestaurantData {
  id: string;
  name: string;
  subdomain: string;
  ownerId: string;
  [key: string]: any; // Allow additional properties
}

export interface AuthContextType {
  user: RestaurantUser | null;
  restaurant: RestaurantData | null;
  loading: boolean;
  signUp: (email: string, password: string, restaurantData: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  restaurant: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<RestaurantUser | null>(null);
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext: Setting up auth state change listener');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('AuthContext: Auth state changed', { userExists: !!firebaseUser });
      
      try {
        if (firebaseUser) {
          // Get additional user data from Firestore
          console.log('AuthContext: Fetching user data from Firestore', firebaseUser.uid);
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          
          try {
            const userDoc = await getDoc(userDocRef);
            console.log('AuthContext: User doc exists:', userDoc.exists());
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              console.log('AuthContext: User data retrieved', { 
                restaurantId: userData.restaurantId,
                roles: userData.roles
              });
              
              const enhancedUser = {
                ...firebaseUser,
                restaurantId: userData.restaurantId || null,
                roles: userData.roles || {
                  admin: false,
                  staff: false,
                  kitchen: false,
                  customer: true
                }
              } as RestaurantUser;
              
              setUser(enhancedUser);
              
              // If user has a restaurantId, fetch the restaurant data
              if (userData.restaurantId) {
                try {
                  const restaurantDocRef = doc(db, 'restaurants', userData.restaurantId);
                  const restaurantDoc = await getDoc(restaurantDocRef);
                  
                  if (restaurantDoc.exists()) {
                    const restaurantData = restaurantDoc.data();
                    setRestaurant({
                      id: restaurantDoc.id,
                      name: restaurantData.name || '',
                      subdomain: restaurantData.subdomain || '',
                      ownerId: restaurantData.ownerId || '',
                      ...restaurantData
                    });
                  } else {
                    console.log('AuthContext: Restaurant not found', userData.restaurantId);
                    setRestaurant(null);
                  }
                } catch (restaurantError) {
                  console.error('AuthContext: Error fetching restaurant data:', restaurantError);
                  setRestaurant(null);
                }
              } else {
                setRestaurant(null);
              }
            } else {
              console.log('AuthContext: User exists in Auth but not in Firestore');
              // User exists in Auth but not in Firestore
              setUser(firebaseUser as RestaurantUser);
            }
          } catch (firestoreError) {
            // Handle Firestore errors but still update user state
            console.error('AuthContext: Error fetching user Firestore data:', firestoreError);
            // Set basic user without Firestore data
            setUser(firebaseUser as RestaurantUser);
          }
        } else {
          console.log('AuthContext: No firebase user, setting user to null');
          setUser(null);
          setRestaurant(null);
        }
      } catch (error) {
        console.error('AuthContext: Error in auth state change handler:', error);
        // Reset user state on error
        setUser(null);
      } finally {
        // Always update loading state regardless of success or failure
        console.log('AuthContext: Setting loading to false');
        setLoading(false);
      }
    });

    return () => {
      console.log('AuthContext: Unsubscribing from auth state change listener');
      unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, restaurantData: any) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create a restaurant document
      const restaurantRef = doc(db, 'restaurants', restaurantData.subdomain);
      await setDoc(restaurantRef, {
        name: restaurantData.name,
        subdomain: restaurantData.subdomain,
        createdAt: new Date(),
        ownerId: user.uid,
        config: {
          theme: restaurantData.theme || 'default',
          logo: null,
          currency: restaurantData.currency || 'USD',
          language: restaurantData.language || 'en',
          timeZone: restaurantData.timeZone || 'UTC',
        }
      });

      // Create a user document with role
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        email: user.email,
        restaurantId: restaurantData.subdomain,
        roles: {
          admin: true,  // First user is always admin
          staff: false,
          kitchen: false,
          customer: true
        },
        createdAt: new Date(),
      });

    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user,
      restaurant,
      loading,
      signUp,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};
