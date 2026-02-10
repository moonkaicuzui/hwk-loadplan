/**
 * @fileoverview Firebase Initialization
 * Configures Firebase services for the Rachgia Dashboard.
 *
 * Services:
 * - Authentication (Firebase Auth)
 * - Database (Firestore)
 * - Storage (Firebase Storage)
 *
 * @module services/firebase
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// ========================================
// Firebase Configuration
// ========================================

/**
 * Firebase configuration from environment variables
 * Create a .env file with VITE_FIREBASE_* variables
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// ========================================
// Firebase Initialization
// ========================================

let app;
let auth;
let db;
let storage;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);

  // Initialize services
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  console.log('[Firebase] Initialized successfully');

} catch (error) {
  console.error('[Firebase] Initialization error:', error);

  // Provide dummy objects for development without Firebase
  app = null;

  auth = {
    onAuthStateChanged: (callback) => {
      callback(null);
      return () => {};
    },
    currentUser: null
  };

  db = {};
  storage = {};
}

// ========================================
// Exports
// ========================================

export { auth, db, storage };
export default app;
