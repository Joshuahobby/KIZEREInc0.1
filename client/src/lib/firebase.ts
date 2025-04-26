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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Google provider for authentication
const googleProvider = new GoogleAuthProvider();

/**
 * Initiates Google sign-in with redirect
 */
export function signInWithGoogle() {
  signInWithRedirect(auth, googleProvider);
}

/**
 * Signs out the current user
 */
export function logOut() {
  return signOut(auth);
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
 * @returns Promise with the UserCredential or null if no redirect result
 */
export async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      // This gives you a Google Access Token.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      
      // The signed-in user info
      const user = result.user;
      console.log('[Firebase] Successfully handled redirect result', { user: user.email });
      
      return result;
    }
    return null;
  } catch (error: any) {
    // Enhanced error logging
    const errorData = {
      code: error.code || 'unknown',
      message: error.message || 'Unknown error',
      email: error.customData?.email || 'no-email',
      stack: error.stack || 'No stack trace'
    };
    
    console.error('[Firebase] Error handling redirect result:', errorData);
    
    // Get credential from error if possible
    try {
      const credential = GoogleAuthProvider.credentialFromError(error);
      console.info('[Firebase] Retrieved credential from error:', !!credential);
    } catch (credError) {
      console.warn('[Firebase] Could not retrieve credential from error');
    }
    
    // Instead of re-throwing the error which causes an unhandled promise rejection,
    // we'll return a rejection result object that the caller can handle
    return {
      success: false,
      error: errorData,
      handled: true
    };
  }
}

export { auth };