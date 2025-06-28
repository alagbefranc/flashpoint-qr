// Firebase client-side configuration
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validate Firebase config to prevent initialization errors
const validateFirebaseConfig = () => {
  const requiredFields = [
    'apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'
  ] as const;
  
  requiredFields.forEach(field => {
    if (!firebaseConfig[field]) {
      console.error(`Firebase config is missing required field: ${field}`);
    }
  });
  
  return requiredFields.every(field => !!firebaseConfig[field]);
};

// Initialize Firebase with validation
const isValidConfig = validateFirebaseConfig();
if (!isValidConfig) {
  console.error('Invalid Firebase configuration. Check your .env.local file.');
  console.error('Please ensure all required Firebase environment variables are set:');
  console.error('- NEXT_PUBLIC_FIREBASE_API_KEY');
  console.error('- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  console.error('- NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  console.error('- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  console.error('- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  console.error('- NEXT_PUBLIC_FIREBASE_APP_ID');
}

// Only initialize Firebase if config is valid
let firebaseApp: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;

if (isValidConfig) {
  // Initialize Firebase
  firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

  // Firebase services - explicitly passing the app instance
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
  storage = getStorage(firebaseApp);

  // Connect to Firebase emulators in development
  if (process.env.NODE_ENV === 'development') {
    try {
      // Use Firebase emulators if available
      const useEmulator = false; // Set to true when you have emulators running
      
      if (useEmulator) {
        // Auth emulator typically runs on port 9099
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
        
        // Firestore emulator typically runs on port 8080
        connectFirestoreEmulator(db, 'localhost', 8080);
        
        // Storage emulator typically runs on port 9199
        connectStorageEmulator(storage, 'localhost', 9199);
        
        console.log('Connected to Firebase emulators');
      }
    } catch (error) {
      console.error('Error connecting to Firebase emulators:', error);
    }
  }

  // Enable Firestore persistence for offline support
  if (typeof window !== 'undefined' && db) {
    try {
      // Use multi-tab persistence instead to avoid the 'failed-precondition' error
      // when multiple tabs are open or during frequent development reloads
      enableMultiTabIndexedDbPersistence(db)
        .then(() => {
          console.log('Firestore multi-tab persistence enabled for offline support');
        })
        .catch((err) => {
          console.error('Error enabling Firestore multi-tab persistence:', err);
          if (err.code === 'failed-precondition') {
            console.warn('Multiple tabs issue even with multi-tab persistence. Check browser compatibility.');
          } else if (err.code === 'unimplemented') {
            console.warn('The current browser does not support all of the features required to enable persistence.');
          }
        });
    } catch (e) {
      console.error('Exception when initializing Firestore persistence:', e);
    }
  }

  // Log to verify configuration
  console.log('Firebase initialized with project:', firebaseConfig.projectId);
} else {
  console.warn('Firebase services not initialized due to invalid configuration');
}

export { firebaseApp, auth, db, storage };