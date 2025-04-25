import { User } from 'firebase/auth';
import { 
  signInWithGoogle,
  logOut,
  getCurrentUser,
  onAuthChange
} from '@/lib/firebase';

/**
 * AuthService provides centralized authentication functions
 */
export const AuthService = {
  /**
   * Initiates Google sign-in with redirect
   */
  signInWithGoogle,

  /**
   * Signs out the current user
   */
  logOut,

  /**
   * Gets the current authenticated user
   * @returns The current user or null if not authenticated
   */
  getCurrentUser,

  /**
   * Listens for authentication state changes
   * @param callback Function to call when auth state changes
   * @returns Unsubscribe function
   */
  onAuthChange,

  /**
   * Determine if a user is logged in
   * @returns boolean indicating if user is logged in
   */
  isAuthenticated(): boolean {
    return getCurrentUser() !== null;
  },

  /**
   * Get user display name or email
   * @returns User display name, email, or null if not logged in
   */
  getUserDisplayName(): string | null {
    const user = getCurrentUser();
    if (!user) return null;
    return user.displayName || user.email || null;
  },

  /**
   * Get user email
   * @returns User email or null if not available
   */
  getUserEmail(): string | null {
    const user = getCurrentUser();
    if (!user) return null;
    return user.email;
  },

  /**
   * Get user photo URL
   * @returns User photo URL or null if not available
   */
  getUserPhotoUrl(): string | null {
    const user = getCurrentUser();
    if (!user) return null;
    return user.photoURL;
  },

  /**
   * Get Firebase user ID
   * @returns User ID or null if not logged in
   */
  getUserId(): string | null {
    const user = getCurrentUser();
    if (!user) return null;
    return user.uid;
  },

  /**
   * Get user role from database
   * @returns Promise that resolves to user role
   */
  async getUserRole(): Promise<string> {
    const user = getCurrentUser();
    if (!user) return 'guest';
    
    try {
      const response = await fetch(`/api/users/role?uid=${user.uid}`);
      if (!response.ok) return 'user'; // Default to regular user on error
      
      const data = await response.json();
      return data.role || 'user';
    } catch (error) {
      console.error("Error fetching user role:", error);
      return 'user'; // Default to regular user on error
    }
  },

  /**
   * Determine redirect path based on user role
   * @returns Dashboard path for redirecting after login
   */
  async getDashboardPathForUser(): Promise<string> {
    try {
      const role = await this.getUserRole();
      
      switch (role) {
        case 'admin':
          return '/admin-dashboard';
        case 'staff':
          return '/staff-dashboard';
        case 'user':
        default:
          return '/dashboard';
      }
    } catch (error) {
      console.error("Error determining dashboard path:", error);
      return '/dashboard'; // Default path on error
    }
  }
};

// Also export as default for backward compatibility
export default AuthService;