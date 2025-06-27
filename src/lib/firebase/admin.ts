import { initializeApp, cert, getApps, AppOptions } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin
let adminConfig: AppOptions = {};

// Check if we have service account credentials
if (
  process.env.FIREBASE_ADMIN_PROJECT_ID && 
  process.env.FIREBASE_ADMIN_CLIENT_EMAIL && 
  process.env.FIREBASE_ADMIN_PRIVATE_KEY
) {
  try {
    // Try to use provided service account
    adminConfig = {
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        // Handle potential JSON string format
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.includes('{')
          ? JSON.parse(process.env.FIREBASE_ADMIN_PRIVATE_KEY).key
          : process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    };
    console.log('Using service account credentials for Firebase Admin');
  } catch (error) {
    console.error('Error parsing Firebase Admin credentials:', error);
    // Fall back to application default credentials
    adminConfig = { projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID };
    console.log('Falling back to application default credentials');
  }
} else {
  // Use application default credentials with project ID from client config
  adminConfig = { projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID };
  console.log('Using application default credentials with client project ID');
}

const apps = getApps();

const adminApp = !apps.length ? initializeApp(adminConfig) : apps[0];

const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);
const adminStorage = getStorage(adminApp);

export { adminAuth, adminDb, adminStorage };
