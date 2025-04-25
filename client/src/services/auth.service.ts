/**
 * Centralized Authentication Service
 * 
 * Handles all authentication-related operations to ensure consistency
 * and avoid duplication across the application.
 */
import { 
  auth, 
  FirebaseService
} from "../lib/firebase";
import type { UserCredential, User as FirebaseUser } from "firebase/auth";
import { queryClient } from "../lib/queryClient";
import { apiRequest } from "../lib/queryClient";
import { User } from "@shared/schema";
import { createLogger } from "../lib/logger";

const logger = createLogger('AuthService');

export interface AuthUserInfo {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  token: string;
}

/**
 * Authentication Service
 * Provides centralized methods for all authentication operations
 */
export class AuthService {
  /**
   * Sign in with Google using Firebase
   * Also handles backend synchronization
   * 
   * @returns Promise with user data from backend
   */
  static async signInWithGoogle(): Promise<Omit<User, "password">> {
    try {
      logger.info("Starting Google sign-in flow");
      
      // Trigger Firebase Google auth popup
      const result = await FirebaseService.signInWithGooglePopup();
      
      // Extract user info from result
      const userInfo = await this.extractUserInfo(result);
      logger.info("Google sign-in successful", { email: userInfo.email });
      
      if (!userInfo.email) {
        throw new Error("Could not get email from Google. Please try again.");
      }
      
      // Synchronize with backend
      return await this.syncGoogleAuthWithBackend(userInfo);
    } catch (error: any) {
      logger.error("Google sign-in error", { error });
      throw error instanceof Error 
        ? error 
        : new Error("Sign-in failed. Please try again.");
    }
  }
  
  /**
   * Extract user info from Firebase user credential
   * 
   * @param result Firebase UserCredential
   * @returns AuthUserInfo object
   */
  private static async extractUserInfo(result: UserCredential): Promise<AuthUserInfo> {
    const { user } = result;
    const token = await user.getIdToken();
    
    return {
      uid: user.uid,
      displayName: user.displayName || '',
      email: user.email || '',
      photoURL: user.photoURL,
      token
    };
  }
  
  /**
   * Sign out the user from both Firebase and the backend
   */
  static async signOut(): Promise<void> {
    try {
      logger.info("Signing out user");
      
      // Sign out from backend session
      await apiRequest("POST", "/api/logout");
      
      // Sign out from Firebase
      await FirebaseService.signOut();
      
      // Clear user data from cache
      queryClient.setQueryData(["/api/user"], null);
      
      logger.info("User signed out successfully");
    } catch (error) {
      logger.error("Sign out error", { error });
      throw error instanceof Error 
        ? error 
        : new Error("Sign out failed. Please try again.");
    }
  }
  
  /**
   * Get the appropriate dashboard path based on user role
   * This is the central source of truth for dashboard redirection paths
   * 
   * @param role User role
   * @returns Dashboard path for the role
   */
  static getDashboardPathByRole(role: string): string {
    switch (role) {
      case "Admin":
        return "/admin";
      case "Agent":
        return "/dashboard"; // Using unified dashboard for all users
      case "Subscriber":
      default:
        return "/dashboard";
    }
  }
  
  /**
   * Synchronize Google authentication with the backend
   * 
   * @param userInfo User information from Google auth
   * @returns User data from backend
   */
  private static async syncGoogleAuthWithBackend(userInfo: AuthUserInfo): Promise<Omit<User, "password">> {
    try {
      logger.info("Syncing Google auth with backend", { email: userInfo.email });
      
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userInfo.email,
          name: userInfo.displayName || userInfo.email.split('@')[0],
          uid: userInfo.uid,
          token: userInfo.token,
          photoURL: userInfo.photoURL
        }),
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error("Failed to sync with backend", { status: response.status, errorData });
        throw new Error(errorData.message || `Failed to authenticate with Google (${response.status})`);
      }
      
      const userData = await response.json();
      logger.info("Backend sync successful", { userId: userData.id, role: userData.role });
      
      // Update auth context
      queryClient.setQueryData(["/api/user"], userData);
      
      return userData;
    } catch (error) {
      logger.error("Backend sync error", { error });
      throw error instanceof Error 
        ? error 
        : new Error("Failed to synchronize with backend. Please try again.");
    }
  }
  
  /**
   * Check if a user is currently authenticated
   * 
   * @returns User data or null if not authenticated
   */
  static getCurrentUser(): Omit<User, "password"> | null {
    return queryClient.getQueryData(["/api/user"]) || null;
  }
}

// Export auth instance for direct access when needed
export { auth };