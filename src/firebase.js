import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, indexedDBLocalPersistence, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
// Get these from: https://console.firebase.google.com/
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

let app, auth, db, storage;
let isFirebaseConfigured = false;

// Check if Firebase is properly configured
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    // Set persistence to INDEXED_DB for better multi-browser support
    setPersistence(auth, indexedDBLocalPersistence).catch(error => {
      console.warn('Could not set persistence:', error);
      // Fallback will use default persistence
    });
    
    isFirebaseConfigured = true;
    console.log('Firebase initialized successfully with IndexedDB persistence');
  } catch (error) {
    console.error('Firebase initialization error:', error);
    isFirebaseConfigured = false;
  }
} else {
  console.warn('Firebase not configured - using local storage fallback. Please add Firebase credentials to .env.local');
  isFirebaseConfigured = false;
}

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

export { auth, db, storage, isFirebaseConfigured, googleProvider, signInWithPopup };
export default app;

