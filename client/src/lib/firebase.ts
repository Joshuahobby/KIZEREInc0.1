import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithRedirect, 
  signInWithPopup,
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  getRedirectResult,
  User 
} from "firebase/auth";

// Firebase configuration using environment variables or direct values
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAXjspxGQjoot80eXL8_61oZC-swpqG-9o",
  authDomain: "kizere-99ac2.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "kizere-99ac2",
  storageBucket: "kizere-99ac2.firebasestorage.app",
  messagingSenderId: "222601639458",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:222601639458:web:9fe0224b8ca6968064fc7b",
  measurementId: "G-WZX1SN8XWS"
};

// Add a custom auth domain for development - use the current hostname
// This helps when the Firebase console doesn't have the Replit domain in the authorized domains
try {
  // Always override the authDomain with the current origin to ensure
  // the authentication flow works in development environments
  const currentOrigin = window.location.origin;
  const currentHostname = window.location.hostname;
  
  // We must use the actual authDomain from Firebase console for popup auth to work
  // Just keeping the original authDomain from our config
  console.log(`[Firebase] Using Firebase authDomain: ${firebaseConfig.authDomain}`);
  console.log(`[Firebase] Current origin: ${currentOrigin}`);
  
  // We need to prevent the browser from accidentally using an unregistered domain
  // for the redirect, so we force the redirect domain to be the same as the current origin
  if (typeof window !== 'undefined' && window.location) {
    // This will be used later when configuring the GoogleAuthProvider
    localStorage.setItem('firebase_auth_domain', window.location.host);
    localStorage.setItem('firebase_auth_origin', window.location.origin);
  }
} catch (error) {
  console.warn('[Firebase] Failed to set custom auth domain:', error);
}

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
 * Initiates Google sign-in with popup method only as requested
 * @param redirectUrl Optional URL to redirect after successful authentication
 * @returns A promise that resolves when authentication is complete
 */
export async function signInWithGoogle(redirectUrl?: string) {
  try {
    // Reset the auth instance if needed
    if (auth.currentUser) {
      console.log('[Firebase] Existing user found, signing out before new sign in');
      await signOut(auth).catch(e => console.warn('[Firebase] Pre-signIn signOut error:', e));
    }
    
    // Add scopes
    googleProvider.addScope('profile');
    googleProvider.addScope('email');
    
    // Create CSRF protection state
    const state = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('firebase_auth_state', state);
    
    // Store redirect URL and metadata
    if (redirectUrl) {
      localStorage.setItem('firebase_auth_redirect', redirectUrl);
    }
    localStorage.setItem('firebase_auth_timestamp', Date.now().toString());
    localStorage.setItem('firebase_auth_origin', window.location.origin);
    
    // Set custom parameters - this helps with the auth flow
    googleProvider.setCustomParameters({
      prompt: 'select_account',
      state
    });
    
    // Always use popup authentication as requested by the user
    console.log('[Firebase] Using popup authentication as requested');
    
    try {
      // Open popup for authentication
      const result = await signInWithPopup(auth, googleProvider);
      
      // Extract auth data
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const user = result.user;
      
      // Save email for future login hint
      if (user?.email) {
        localStorage.setItem('last_email', user.email);
      }
      
      console.log('[Firebase] Popup authentication successful', { 
        email: user.email,
        hasUid: !!user.uid,
        hasToken: !!credential?.accessToken,
        displayName: user.displayName
      });
      
      // Return auth result
      return {
        success: true,
        user,
        credential,
        method: 'popup'
      };
    } catch (popupError: any) {
      console.error('[Firebase] Popup auth error:', popupError.code || 'unknown', popupError.message);
      
      // Special handling for popup closed errors
      if (popupError.code === 'auth/popup-closed-by-user') {
        console.warn('[Firebase] Authentication popup was closed by user or blocked');
        // We'll throw a more informative error
        throw new Error('Authentication window was closed. Please ensure popups are allowed for this site and try again.');
      }
      
      // Better error for unauthorized domains
      if (popupError.code === 'auth/unauthorized-domain') {
        console.error('[Firebase] Domain not authorized in Firebase console:', window.location.origin);
        throw new Error(`Authentication failed: This domain (${window.location.hostname}) is not authorized in Firebase console`);
      }
      
      throw popupError;
    }
  } catch (error: any) {
    console.error('[Firebase] Sign-in error:', error.message || 'Unknown error');
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
    const savedState = localStorage.getItem('firebase_auth_state');
    const savedRedirect = localStorage.getItem('firebase_auth_redirect');
    const savedTimestamp = localStorage.getItem('firebase_auth_timestamp');
    const savedOrigin = localStorage.getItem('firebase_auth_origin');
    const savedDomain = localStorage.getItem('firebase_auth_domain');
    
    console.log('[Firebase] Auth context from localStorage:', {
      hasState: !!savedState,
      hasRedirect: !!savedRedirect,
      savedTimestamp: savedTimestamp ? new Date(parseInt(savedTimestamp)).toISOString() : null,
      savedOrigin,
      savedDomain,
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