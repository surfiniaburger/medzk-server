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
    // Instead of directly redirecting, throw an error that can be handled by the component
    throw new Error('UNAUTHORIZED');
  }

  try {
    console.log("I went for token")
    const token = await user.getIdToken();
    console.log(token)
    
    const API_BASE = process.env.NODE_ENV === 'production' 
      ? 'https://zero-kare5-837262597425.us-central1.run.app'
      : 'http://localhost:5050';

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
    });

    // Handle unauthorized responses
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    return response;
  } catch (error) {
    console.error('Error in authenticatedFetch:', error);
    throw error;
  }
};