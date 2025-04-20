/**
 * Firebase Configuration
 * 
 * This module initializes Firebase and provides authentication methods.
 */

import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithRedirect, 
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider, 
  signOut,
  type User,
  type UserCredential,
  type Auth
} from "firebase/auth";
import { createLogger } from "../lib/logger";

const logger = createLogger('Firebase');

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Get Firebase Auth instance
const auth = getAuth(app);

// Create Google auth provider
const googleProvider = new GoogleAuthProvider();

/**
 * Firebase Service class
 * 
 * Provides methods for Firebase authentication
 */
export class FirebaseService {
  private static auth: Auth = auth;
  
  /**
   * Sign in with Google redirect
   * 
   * @returns Promise<void>
   */
  static async signInWithGoogleRedirect(): Promise<void> {
    try {
      logger.info('Initiating Google sign-in with redirect');
      await signInWithRedirect(this.auth, googleProvider);
    } catch (error) {
      logger.error('Google sign-in with redirect failed', { error });
      throw error;
    }
  }
  
  /**
   * Sign in with Google popup
   * 
   * @returns Promise<UserCredential>
   */
  static async signInWithGooglePopup(): Promise<UserCredential> {
    try {
      logger.info('Initiating Google sign-in with popup');
      const result = await signInWithPopup(this.auth, googleProvider);
      logger.info('Google sign-in with popup successful', { uid: result.user.uid });
      return result;
    } catch (error) {
      logger.error('Google sign-in with popup failed', { error });
      throw error;
    }
  }
  
  /**
   * Sign in with email and password
   * 
   * @param email User email
   * @param password User password
   * @returns Promise<UserCredential>
   */
  static async signInWithEmail(email: string, password: string): Promise<UserCredential> {
    try {
      logger.info('Initiating email sign-in', { email });
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      logger.info('Email sign-in successful', { uid: result.user.uid });
      return result;
    } catch (error) {
      logger.error('Email sign-in failed', { email, error });
      throw error;
    }
  }
  
  /**
   * Create user with email and password
   * 
   * @param email User email
   * @param password User password
   * @returns Promise<UserCredential>
   */
  static async createUserWithEmail(email: string, password: string): Promise<UserCredential> {
    try {
      logger.info('Creating new user account', { email });
      const result = await createUserWithEmailAndPassword(this.auth, email, password);
      logger.info('User account created successfully', { uid: result.user.uid });
      return result;
    } catch (error) {
      logger.error('Failed to create user account', { email, error });
      throw error;
    }
  }
  
  /**
   * Sign out the current user
   * 
   * @returns Promise<void>
   */
  static async signOut(): Promise<void> {
    try {
      logger.info('Signing out user');
      await signOut(this.auth);
      logger.info('User signed out successfully');
    } catch (error) {
      logger.error('Sign out failed', { error });
      throw error;
    }
  }
  
  /**
   * Get the current user
   * 
   * @returns Current Firebase user or null if not signed in
   */
  static getCurrentUser(): User | null {
    return this.auth.currentUser;
  }
  
  /**
   * Check if user is authenticated
   * 
   * @returns Boolean indicating if user is authenticated
   */
  static isAuthenticated(): boolean {
    return !!this.auth.currentUser;
  }
  
  /**
   * Get user token
   * 
   * @returns Promise with the user's ID token
   */
  static async getUserToken(): Promise<string | null> {
    const user = this.auth.currentUser;
    if (!user) {
      logger.warn('Cannot get token - no user is signed in');
      return null;
    }
    
    try {
      const token = await user.getIdToken();
      return token;
    } catch (error) {
      logger.error('Failed to get user token', { error });
      return null;
    }
  }
}

// Export the auth instance for direct access if needed
export { auth };

// Export the app for other Firebase features if needed
export { app as firebaseApp };

// Export the Google provider for direct use if needed
export { googleProvider };