/**
 * Centralized Authentication Service
 * 
 * Handles all authentication-related operations to ensure consistency
 * and avoid duplication across the application.
 */
import { 
  auth, 
  signInWithGoogle as firebaseSignInWithGoogle, 
  firebaseSignOut,
  extractUserInfo
} from "@/lib/firebase";
import type { UserCredential } from "firebase/auth";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";

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
      console.log("AuthService: Starting Google sign-in flow");
      
      // Trigger Firebase Google auth popup
      const result = await firebaseSignInWithGoogle();
      
      // Extract user info from result
      const userInfo = extractUserInfo(result);
      console.log("AuthService: Google sign-in successful", userInfo);
      
      if (!userInfo.email) {
        throw new Error("Could not get email from Google. Please try again.");
      }
      
      // Synchronize with backend
      return await this.syncGoogleAuthWithBackend(userInfo);
    } catch (error: any) {
      console.error("AuthService: Google sign-in error:", error);
      throw error instanceof Error 
        ? error 
        : new Error("Sign-in failed. Please try again.");
    }
  }
  
  /**
   * Sign out the user from both Firebase and the backend
   */
  static async signOut(): Promise<void> {
    try {
      console.log("AuthService: Signing out user");
      
      // Sign out from backend session
      await apiRequest("POST", "/api/logout");
      
      // Sign out from Firebase
      await firebaseSignOut();
      
      // Clear user data from cache
      queryClient.setQueryData(["/api/user"], null);
      
      console.log("AuthService: User signed out successfully");
    } catch (error) {
      console.error("AuthService: Sign out error:", error);
      throw error instanceof Error 
        ? error 
        : new Error("Sign out failed. Please try again.");
    }
  }
  
  /**
   * Get the appropriate dashboard path based on user role
   * 
   * @param role User role
   * @returns Dashboard path for the role
   */
  static getDashboardPathByRole(role: string): string {
    switch (role) {
      case "Admin":
        return "/admin";
      case "Agent":
        return "/lost-found";
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
      throw new Error(errorData.message || "Failed to authenticate with Google");
    }
    
    const userData = await response.json();
    
    // Update auth context
    queryClient.setQueryData(["/api/user"], userData);
    
    return userData;
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