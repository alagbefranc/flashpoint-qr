'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

export default function FirebaseTest() {
  const [status, setStatus] = useState<string>('Checking Firebase connection...');
  const [error, setError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  useEffect(() => {
    async function testFirebaseConnection() {
      try {
        setStatus(`Connection attempt #${connectionAttempts + 1}...`);
        
        // Try to write a test document
        const testDocRef = doc(db, 'connection-test', 'test-doc');
        await setDoc(testDocRef, {
          timestamp: new Date().toISOString(),
          message: 'Connection test',
        });
        
        // If write succeeds, try to read it back
        const querySnapshot = await getDocs(collection(db, 'connection-test'));
        const docsCount = querySnapshot.size;
        
        setStatus(`✅ Firebase connection successful! Found ${docsCount} test documents.`);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
        setStatus(`❌ Firebase connection failed`);
        
        // Increment connection attempts for retry
        setConnectionAttempts(prev => prev + 1);
        
        // Retry after a delay, but only up to 3 times
        if (connectionAttempts < 3) {
          setTimeout(() => {
            testFirebaseConnection();
          }, 3000);
        }
      }
    }
    
    testFirebaseConnection();
  }, [connectionAttempts]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Firebase Connection Test</h1>
      
      <div className="p-4 bg-gray-100 rounded-lg mb-4">
        <h2 className="font-semibold mb-2">Status:</h2>
        <p className={`text-lg ${status.includes('✅') ? 'text-green-600' : status.includes('❌') ? 'text-red-600' : 'text-blue-600'}`}>
          {status}
        </p>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
          <h2 className="font-semibold text-red-800 mb-2">Error Details:</h2>
          <pre className="whitespace-pre-wrap text-sm bg-red-100 p-3 rounded">
            {error}
          </pre>
        </div>
      )}
      
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h2 className="font-semibold mb-2">Troubleshooting Tips:</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Check your Firebase API keys in .env.local</li>
          <li>Ensure you have Internet connectivity</li>
          <li>Verify Firebase project exists and is active</li>
          <li>Check Firestore security rules allow read/write</li>
          <li>Make sure your browser allows third-party cookies</li>
        </ul>
      </div>
    </div>
  );
}
