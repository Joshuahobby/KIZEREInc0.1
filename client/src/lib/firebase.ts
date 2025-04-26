import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithRedirect, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  getRedirectResult,
  User 
} from "firebase/auth";

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate Firebase config
const validateFirebaseConfig = () => {
  const requiredVars = [
    { key: 'VITE_FIREBASE_API_KEY', value: firebaseConfig.apiKey },
    { key: 'VITE_FIREBASE_PROJECT_ID', value: firebaseConfig.projectId },
    { key: 'VITE_FIREBASE_APP_ID', value: firebaseConfig.appId }
  ];
  
  const missingVars = requiredVars.filter(v => !v.value);
  
  if (missingVars.length > 0) {
    const missingKeys = missingVars.map(v => v.key).join(', ');
    console.error(`Missing required Firebase configuration variables: ${missingKeys}`);
    throw new Error(`Firebase configuration incomplete: ${missingKeys}`);
  }
};

// Validate before initializing
validateFirebaseConfig();

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('[Firebase] Successfully initialized Firebase app');
} catch (error) {
  console.error('[Firebase] Error initializing Firebase app:', error);
  throw error;
}

// Initialize Auth
const auth = getAuth(app);

// Google provider for authentication
const googleProvider = new GoogleAuthProvider();

/**
 * Initiates Google sign-in with redirect
 * @returns A promise that resolves when the redirect is complete
 */
export function signInWithGoogle() {
  try {
    // Configure additional scopes and parameters
    googleProvider.addScope('profile');
    googleProvider.addScope('email');
    googleProvider.setCustomParameters({
      prompt: 'select_account' // Forces account selection even if already logged in
    });
    
    console.log('[Firebase] Starting Google sign-in redirect flow');
    return signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error('[Firebase] Error starting Google sign-in redirect:', error);
    throw error; // Re-throw for proper error handling upstream
  }
}

/**
 * Signs out the current user from Firebase
 * @returns A promise that resolves when sign-out is complete
 */
export async function logOut() {
  try {
    console.log('[Firebase] Signing out user');
    await signOut(auth);
    console.log('[Firebase] User signed out successfully');
    return true;
  } catch (error) {
    console.error('[Firebase] Error signing out:', error);
    throw error; // Re-throw for proper error handling upstream
  }
}

/**
 * Gets the current authenticated user
 * @returns The current user or null if not authenticated
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Listens for authentication state changes
 * @param callback Function to call when auth state changes
 * @returns Unsubscribe function
 */
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Handles the redirect result from Firebase authentication
 * Call this when the app loads to handle the redirect result
 * @returns Promise with the UserCredential, a structured error object, or null if no redirect result
 */
export async function handleRedirectResult() {
  try {
    console.log('[Firebase] Checking for redirect result...');
    
    // Use Promise.race with a timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Redirect result timeout')), 10000);
    });
    
    const result = await Promise.race([
      getRedirectResult(auth),
      timeoutPromise
    ]) as any;
    
    if (result) {
      // This gives you a Google Access Token
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      
      // Get the user info
      const user = result.user;
      if (!user) {
        console.warn('[Firebase] Redirect result missing user data');
        return {
          success: false,
          error: { message: 'Redirect result missing user data' },
          handled: true
        };
      }
      
      // Log successful authentication
      console.log('[Firebase] Successfully handled redirect result', { 
        email: user.email,
        uid: user.uid,
        hasToken: !!token
      });
      
      // Verify we have the minimum required user data
      if (!user.email) {
        console.warn('[Firebase] User email missing from authentication result');
        return {
          success: false, 
          error: { message: 'User email missing from authentication result' },
          handled: true
        };
      }
      
      return {
        success: true,
        user,
        credential,
        token
      };
    }
    
    // No redirect result (normal case when not coming from a redirect)
    console.log('[Firebase] No redirect result found');
    return null;
    
  } catch (error: any) {
    // Enhanced structured error logging with proper type
    const errorData: {
      code: string;
      message: string;
      email: string | null;
      stack: string;
      timestamp: string;
      hasCredential?: boolean;
    } = {
      code: error.code || 'unknown',
      message: error.message || 'Unknown error',
      email: error.customData?.email || null,
      stack: error.stack || 'No stack trace',
      timestamp: new Date().toISOString()
    };
    
    console.error('[Firebase] Error handling redirect result:', errorData);
    
    // Handle specific Firebase error codes
    if (error.code === 'auth/internal-error') {
      console.warn('[Firebase] Internal auth error - possible Firebase configuration issue');
    } else if (error.code === 'auth/network-request-failed') {
      console.warn('[Firebase] Network request failed - check internet connection');
    } else if (error.code === 'auth/invalid-api-key') {
      console.error('[Firebase] Invalid API key - verify VITE_FIREBASE_API_KEY');
    } else if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      console.info('[Firebase] Authentication popup closed or cancelled by user');
    }
    
    // Get credential from error if possible
    try {
      const credential = GoogleAuthProvider.credentialFromError(error);
      if (credential) {
        console.info('[Firebase] Retrieved credential from error');
        errorData.hasCredential = true;
      }
    } catch (credError) {
      console.warn('[Firebase] Could not retrieve credential from error');
    }
    
    // Return a structured error object instead of throwing
    return {
      success: false,
      error: errorData,
      handled: true
    };
  }
}

export { auth };