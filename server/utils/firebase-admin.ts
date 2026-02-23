import admin from 'firebase-admin';
import { env } from '../config';
import { createLogger } from './logger';

const logger = createLogger('FirebaseAdmin');

// Flag to track if Firebase Admin is properly initialized for token verification
let isInitializedForTokenVerification = false;

// Initialize the app if it hasn't been initialized already
if (!admin.apps.length) {
  try {
    // Check if Firebase project ID is available
    const projectId = env.FIREBASE_PROJECT_ID;
    logger.info('Firebase initialization started', { projectId });

    // Check for service account credentials (required for production token verification)
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (serviceAccountJson) {
      try {
        // Parse and use service account credentials
        const serviceAccount = JSON.parse(serviceAccountJson);
        logger.info('FIREBASE_SERVICE_ACCOUNT parsed successfully', {
          project_id: serviceAccount.project_id,
          client_email: serviceAccount.client_email
        });
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id || projectId,
        });
        isInitializedForTokenVerification = true;
        logger.info('Firebase Admin SDK initialized with service account credentials');
      } catch (parseError) {
        logger.error('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON', { parseError });
        // Fall back to minimal initialization
        if (projectId) {
          admin.initializeApp({ projectId });
        } else {
          admin.initializeApp();
        }
      }
    } else if (!projectId) {
      logger.warn('Firebase Project ID not found in environment variables. Using fallback initialization.');
      logger.warn('Token verification will NOT work without FIREBASE_SERVICE_ACCOUNT credentials');
      // Fallback initialization - will NOT work for token validation
      admin.initializeApp();
    } else {
      // Initialize with minimal configuration - token verification may not work
      admin.initializeApp({
        projectId: projectId,
      });
      logger.info('Firebase Admin SDK initialized with projectId only');
      logger.warn('Token verification may fail without FIREBASE_SERVICE_ACCOUNT credentials in production');
    }

    logger.info('Firebase Admin SDK initialization complete', {
      projectId,
      hasServiceAccount: !!serviceAccountJson,
      canVerifyTokens: isInitializedForTokenVerification,
      nodeEnv: process.env.NODE_ENV
    });
  } catch (error) {
    logger.error('Error initializing Firebase Admin SDK', { error });
  }
}

/**
 * Check if Firebase Admin can verify tokens
 * This requires service account credentials to be present
 */
export function canVerifyTokens(): boolean {
  return isInitializedForTokenVerification;
}

/**
 * Determine if running in Replit environment
 * This is used to relax certain security requirements during development
 */
function isReplitEnvironment(): boolean {
  const isReplit = process.env.REPL_ID !== undefined ||
    process.env.REPL_OWNER !== undefined ||
    process.env.REPL_SLUG !== undefined ||
    process.env.NODE_ENV === 'development';

  if (isReplit) {
    logger.info('Detected Replit/development environment');
  }

  return isReplit;
}

/**
 * Verify Firebase ID token and return the decoded token
 * 
 * @param idToken Firebase ID Token to verify
 * @returns The decoded token if verification succeeds, null otherwise
 */
export async function verifyFirebaseToken(idToken: string) {
  // Check if running in Replit dev environment
  const isReplit = isReplitEnvironment();

  // If we don't have service account credentials, skip verification
  if (!isInitializedForTokenVerification && process.env.NODE_ENV === 'production') {
    logger.warn('Skipping token verification - no service account credentials available');
    logger.warn('For secure production use, set FIREBASE_SERVICE_ACCOUNT environment variable');
    return null;
  }

  try {
    // Validate input
    if (!idToken || typeof idToken !== 'string' || idToken.trim() === '') {
      logger.error('Invalid token provided for verification', {
        tokenProvided: !!idToken,
        tokenType: typeof idToken,
        isReplit
      });

      // In Replit environment, we might need to be more permissive
      if (isReplit) {
        logger.warn('Replit environment detected: Would normally reject empty token');
      }

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
      error,
      isReplit
    });

    // For certain known errors, we can provide more specific logging
    if (errorMessage.includes('expired')) {
      logger.warn('Firebase token expired - user needs to reauthenticate');
    } else if (errorMessage.includes('Invalid')) {
      logger.warn('Invalid token format or signature');
    } else if (errorMessage.includes('project')) {
      logger.warn('Token from different Firebase project');
    }

    // In development or Replit, provide more detailed error info
    if (isReplit) {
      logger.warn('Replit environment: Token verification failed but continuing', {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorCode: error instanceof Error && 'code' in error ? (error as any).code : 'unknown',
        idTokenLength: idToken ? idToken.length : 0
      });
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