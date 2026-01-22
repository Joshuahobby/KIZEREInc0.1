import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup,
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  getRedirectResult,
  setPersistence,
  browserSessionPersistence,
  User,
  Auth
} from "firebase/auth";

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAXjspxGQjoot80eXL8_61oZC-swpqG-9o",
  authDomain: "kizere-99ac2.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "kizere-99ac2",
  storageBucket: "kizere-99ac2.firebasestorage.app",
  messagingSenderId: "222601639458",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:222601639458:web:9fe0224b8ca6968064fc7b",
  measurementId: "G-WZX1SN8XWS"
};

// Validate Firebase config with detailed logging
const validateFirebaseConfig = () => {
  const requiredVars = [
    { key: 'VITE_FIREBASE_API_KEY', value: firebaseConfig.apiKey },
    { key: 'VITE_FIREBASE_PROJECT_ID', value: firebaseConfig.projectId },
    { key: 'VITE_FIREBASE_APP_ID', value: firebaseConfig.appId }
  ];
  
  console.log('[Firebase] Checking configuration variables:', {
    hasApiKey: !!firebaseConfig.apiKey,
    hasProjectId: !!firebaseConfig.projectId,
    hasAppId: !!firebaseConfig.appId,
    authDomain: firebaseConfig.authDomain
  });
  
  const missingVars = requiredVars.filter(v => !v.value);
  
  if (missingVars.length > 0) {
    const missingKeys = missingVars.map(v => v.key).join(', ');
    console.error(`[Firebase] Missing required configuration variables: ${missingKeys}`);
    throw new Error(`Firebase configuration incomplete: ${missingKeys}`);
  }
  
  console.log('[Firebase] Configuration validation passed');
};

// Validate before initializing
validateFirebaseConfig();

// Initialize Firebase app
const app = initializeApp(firebaseConfig);
console.log('[Firebase] Successfully initialized Firebase app');

// Initialize Auth
const auth = getAuth(app);

// Set persistence to session (logs out when browser/tab is closed)
// This addresses the issue where users were auto-logged in 48 hours later
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log('[Firebase] Persistence set to browserSessionPersistence');
  })
  .catch((error) => {
    console.error('[Firebase] Failed to set persistence:', error);
  });

// Google provider for authentication
const googleProvider = new GoogleAuthProvider();

/**
 * Initiates Google sign-in with popup method
 */
export async function signInWithGoogle(redirectUrl?: string) {
  try {
    console.log('[Firebase] Starting Google sign-in with popup');
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const user = result.user;
    
    if (user?.email) {
      localStorage.setItem('last_email', user.email);
    }
    
    return {
      success: true,
      user,
      credential,
      method: "popup"
    };
  } catch (error: any) {
    console.error('[Firebase] Sign-in error:', error);
    throw error;
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
    
    // Explicitly clear auth-related localStorage items
    localStorage.removeItem('last_email');
    localStorage.removeItem('firebase_auth_redirect');
    
    console.log('[Firebase] User signed out and storage cleared successfully');
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
    
    // Check if auth instance is valid
    if (!auth) {
      console.error('[Firebase] Auth instance is not available');
      return {
        success: false,
        error: { message: 'Firebase auth not initialized' },
        handled: true
      };
    }
    
    // Retrieve the authentication context from localStorage
    // This is used for debugging and to ensure the redirect flow works correctly
    // Retrieve the authentication context from localStorage if available
    const savedRedirect = localStorage.getItem('firebase_auth_redirect');
    
    console.log('[Firebase] Redirect context:', {
      hasRedirect: !!savedRedirect,
      currentUrl: window.location.href,
    });
    
    // Use Promise.race with a timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Redirect result timeout')), 15000);
    });
    
    console.log('[Firebase] Getting redirect result from auth instance');
    
    // Check if we're on a Replit domain - may need special handling
    const isReplitDomain = window.location.hostname.includes('replit') || 
                           window.location.hostname.includes('repl.co');
    
    console.log(`[Firebase] Running on ${isReplitDomain ? 'Replit' : 'standard'} domain`);
    
    // Get the redirect result
    const result = await Promise.race([
      getRedirectResult(auth),
      timeoutPromise
    ]) as any;
    
    if (result) {
      console.log('[Firebase] Received redirect result, processing...');
      
      // This gives you a Google Access Token
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      const idToken = await result.user?.getIdToken();
      
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
        hasToken: !!token,
        hasIdToken: !!idToken,
        displayName: user.displayName || 'No display name'
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
        token,
        idToken
      };
    }
    
    // No redirect result (normal case when not coming from a redirect)
    console.log('[Firebase] No redirect result found');
    
    // Check if user is already logged in
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log('[Firebase] User is already logged in:', {
        email: currentUser.email,
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'No display name'
      });
      
      const idToken = await currentUser.getIdToken(true);
      
      return {
        success: true,
        user: currentUser,
        token: null,
        idToken,
        alreadyLoggedIn: true
      };
    }
    
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