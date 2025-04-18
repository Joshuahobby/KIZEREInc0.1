// Firebase implementation for KIZERE platform using Firebase SDK
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  type UserCredential
} from "firebase/auth";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Add scopes to request email and profile info
googleProvider.addScope('email');
googleProvider.addScope('profile');

/**
 * Sign in with Google using popup
 * @returns Promise with user credential
 */
export const signInWithGoogle = async (): Promise<UserCredential> => {
  console.log("Starting Google sign-in flow with Firebase SDK...");
  
  try {
    // Sign in with popup
    const result = await signInWithPopup(auth, googleProvider);
    
    // This gives you a Google Access Token that can be used to access the Google API
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    console.log("Google sign-in successful", result.user);
    
    return result;
  } catch (error: any) {
    console.error("Google sign-in error:", error);
    // Handle errors
    const errorCode = error.code;
    const errorMessage = error.message;
    
    // The email of the user's account used
    const email = error.customData?.email;
    
    // The credential that was used
    const credential = GoogleAuthProvider.credentialFromError(error);
    
    throw new Error(`Sign-in failed: ${errorMessage} (${errorCode})`);
  }
};

/**
 * Sign out from Firebase auth
 * @returns Promise<void>
 */
export const firebaseSignOut = async (): Promise<void> => {
  console.log("Signing out from Firebase auth");
  return signOut(auth);
};

/**
 * Extract user information from Firebase user credential
 * @param result Firebase UserCredential
 * @returns User information object with OAuth token
 */
export const extractUserInfo = (result: UserCredential) => {
  const user = result.user;
  
  // Get the Google OAuth credential
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential?.accessToken || "";
  
  return {
    uid: user.uid,
    displayName: user.displayName || "",
    email: user.email || "",
    photoURL: user.photoURL,
    token
  };
};