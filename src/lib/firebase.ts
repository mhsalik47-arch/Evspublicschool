import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Default configuration from firebase-applet-config.json
const defaultConfig = {
  apiKey: "AIzaSyCAztjUoYh3HOr2vP-DxDGSjquLWpLYqQg",
  authDomain: "evs-i-s-managment.firebaseapp.com",
  projectId: "evs-i-s-managment",
  storageBucket: "evs-i-s-managment.firebasestorage.app",
  messagingSenderId: "849052345976",
  appId: "1:849052345976:web:d49d38fb696c8d29df2f8d",
  databaseId: "ai-studio-646bf7ae-d952-4a1d-b0f7-a22151c7fe69"
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaultConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultConfig.appId,
};

const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || defaultConfig.databaseId;

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID
export const db = getFirestore(app, databaseId);
export const auth = getAuth(app);
