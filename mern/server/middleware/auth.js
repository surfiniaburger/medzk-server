
// backend/middleware/auth.js
import admin from 'firebase-admin';

// Initialize Firebase Admin with service account
admin.initializeApp({
  credential: admin.credential.applicationDefault(), // Uses GOOGLE_APPLICATION_CREDENTIALS
});

export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Add user info to request object
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

 