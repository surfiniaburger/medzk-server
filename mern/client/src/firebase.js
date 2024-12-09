// frontend/src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Custom fetch function that adds Firebase token to requests
export const authenticatedFetch = async (url, options = {}) => {
  const user = auth.currentUser;
  
  if (!user) {
    window.location.href = '/login';
    throw new Error('User not authenticated');
  }

  try {
  const token = await user.getIdToken();
  
  const API_BASE = process.env.NODE_ENV === 'production' 
    ? 'https://zero-kare5-837262597425.us-central1.run.app'
    : 'http://localhost:5050';

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  return fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });
}  catch (error) {
  console.error('Error getting auth token:', error);
  throw error;
}
};
