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
      // Initialize with minimal configuration for token verification
      // For production, use a service account key file
      admin.initializeApp({
        projectId: projectId,
      });
    }
    
    logger.info('Firebase Admin SDK initialized successfully');
    logger.info('Current Firebase Admin configuration:', { 
      projectId,
      hasApiKey: !!env.VITE_FIREBASE_API_KEY,
      authDomain: projectId ? `${projectId}.firebaseapp.com` : undefined
    });
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
    // Validate input
    if (!idToken || typeof idToken !== 'string' || idToken.trim() === '') {
      logger.error('Invalid token provided for verification', { 
        tokenProvided: !!idToken,
        tokenType: typeof idToken
      });
      return null;
    }
    
    // Attempt to verify token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Successful verification
    logger.info('Token verification succeeded', { 
      uid: decodedToken.uid,
      email: decodedToken.email || 'no-email'
    });
    return decodedToken;
  } catch (error) {
    // Enhanced error logging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    
    logger.error('Token verification failed', { 
      errorMessage,
      errorStack,
      tokenLength: idToken ? idToken.length : 0,
      error
    });
    
    // For certain known errors, we can provide more specific logging
    if (errorMessage.includes('expired')) {
      logger.warn('Firebase token expired - user needs to reauthenticate');
    } else if (errorMessage.includes('Invalid')) {
      logger.warn('Invalid token format or signature');
    } else if (errorMessage.includes('project')) {
      logger.warn('Token from different Firebase project');
    }
    
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