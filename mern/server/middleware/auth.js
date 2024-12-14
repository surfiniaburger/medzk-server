
// backend/middleware/auth.js
import admin from 'firebase-admin';

// Initialize Firebase Admin with service account
admin.initializeApp({
  credential: admin.credential.applicationDefault(), // Uses GOOGLE_APPLICATION_CREDENTIALS
});

export const verifyFirebaseToken = async (req, res, next) => {
  try {
    console.log('Verifying token...')
    const authHeader = req.headers.authorization;
    console.log('Authorization header:', authHeader);

    const token = authHeader.split(' ')[1];
    console.log('Token:', token);
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Add user info to request object
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

 