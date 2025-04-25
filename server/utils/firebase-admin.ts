import admin from 'firebase-admin';
import { env } from '../config';
import { createLogger } from './logger';

const logger = createLogger('FirebaseAdmin');

// Initialize the app if it hasn't been initialized already
if (!admin.apps.length) {
  try {
    // Check if Firebase project ID is available
    const projectId = env.VITE_FIREBASE_PROJECT_ID;
    
    if (!projectId) {
      logger.warn('Firebase Project ID not found in environment variables. Using fallback initialization.');
      // Fallback initialization - will work for basic token validation but with limited features
      admin.initializeApp();
    } else {
      // If using environment variables for Firebase service account
      admin.initializeApp({
        projectId: projectId,
        // We're using app default credentials since we're not providing a service account key
      });
    }
    
    logger.info('Firebase Admin SDK initialized successfully');
  } catch (error) {
    logger.error('Error initializing Firebase Admin SDK', { error });
  }
}

/**
 * Verify Firebase ID token and return the decoded token
 * 
 * @param idToken Firebase ID Token to verify
 * @returns The decoded token if verification succeeds, null otherwise
 */
export async function verifyFirebaseToken(idToken: string) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    logger.info('Token verification succeeded', { uid: decodedToken.uid });
    return decodedToken;
  } catch (error) {
    logger.error('Token verification failed', { error });
    return null;
  }
}

/**
 * Get Firebase user by UID
 * 
 * @param uid Firebase UID
 * @returns Firebase user record
 */
export async function getFirebaseUser(uid: string) {
  try {
    const userRecord = await admin.auth().getUser(uid);
    return userRecord;
  } catch (error) {
    logger.error('Error getting Firebase user', { error, uid });
    return null;
  }
}

export default admin;