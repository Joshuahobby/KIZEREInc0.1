import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, AuthProvider, signOut, UserCredential } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
try {
  initializeApp(firebaseConfig);
} catch (error) {
  console.error("Firebase initialization error:", error);
}

// Auth instance
const auth = getAuth();
const googleProvider = new GoogleAuthProvider();

/**
 * Sign in with Google using popup
 * @returns Promise with user credential
 */
export const signInWithGoogle = (): Promise<UserCredential> => {
  return signInWithPopup(auth, googleProvider);
};

/**
 * Sign out from Firebase
 * @returns Promise<void>
 */
export const firebaseSignOut = (): Promise<void> => {
  return signOut(auth);
};

/**
 * Extract user information from Firebase user credential
 * @param result Firebase UserCredential
 * @returns User information object
 */
export const extractUserInfo = (result: UserCredential) => {
  const user = result.user;
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential?.accessToken;
  
  return {
    uid: user.uid,
    displayName: user.displayName || "",
    email: user.email || "",
    photoURL: user.photoURL,
    token
  };
};

export { auth, googleProvider };