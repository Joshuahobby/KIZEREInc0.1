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
    console.error('[Firebase] Error handling redirect result:', error);
    const errorCode = error.code;
    const errorMessage = error.message;
    // The email of the user's account used for sign-in
    const email = error.customData?.email;
    // The credential that was used for the attempt
    const credential = GoogleAuthProvider.credentialFromError(error);
    
    throw error;
  }
}

export { auth };