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
   * Determine redirect path based on user role and preferences
   * @returns Dashboard path for redirecting after login
   */
  async getDashboardPathForUser(): Promise<string> {
    try {
      // Fetch role and basic user info from the server
      const response = await fetch('/api/user');
      if (!response.ok) return '/dashboard';
      
      const user = await response.json();
      const style = user.preferences?.dashboardStyle;
      
      return this.getDashboardPathByRole(user.role, style);
    } catch (error) {
      console.error("Error determining dashboard path:", error);
      return '/dashboard'; // Default path on error
    }
  },

  /**
   * Determines dashboard path by user role and optional preferred style
   * @param role User role string
   * @param preferredStyle Optional preferred dashboard style
   * @returns Dashboard path for the specified role and style
   */
  getDashboardPathByRole(role: string, preferredStyle?: string): string {
    // For Admin role, respect the preferred style
    if (role === 'Admin') {
      switch (preferredStyle) {
        case 'classic':
          return '/admin/classic';
        case 'command_center':
          return '/admin/command-center';
        case 'standard':
        default:
          return '/admin';
      }
    }
    
    switch(role) {
      case 'Retailer':
        return '/retailer/dashboard';
      case 'Business':
        // Business users go to the unified dashboard which has business-specific views
        return '/dashboard'; 
      case 'Agent':
      case 'Moderator':
      case 'Subscriber':
      default:
        return '/dashboard';
    }
  }
};

// Also export as default for backward compatibility
export default AuthService;