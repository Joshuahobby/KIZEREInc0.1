import { AuthService } from "@/services/auth.service";
import { User } from "@shared/schema";

/**
 * Role-based redirection helper functions
 * These functions help determine the correct routing based on user roles
 */

/**
 * Get the dashboard path for a user based on their role
 * 
 * @param user User object or role string
 * @returns The appropriate dashboard path
 */
export function getDashboardPath(user: Partial<User> | string | null): string {
  if (!user) return "/";
  
  // If user is a string, assume it's a role
  const role = typeof user === 'string' ? user : user.role;
  
  if (!role) return "/dashboard";
  
  // Use the AuthService to determine the path
  return AuthService.getDashboardPathByRole(role);
}

/**
 * Check if a user has a specific role or any of a list of roles
 * 
 * @param user User object
 * @param roles Single role or array of roles to check
 * @param allowAny Whether "any" should match any role
 * @returns Boolean indicating if user has the required role
 */
export function hasRole(
  user: Partial<User> | null, 
  roles: string | string[],
  allowAny = true
): boolean {
  if (!user || !user.role) return false;
  
  // If "any" is passed and allowAny is true, any authenticated user passes
  if (roles === "any" && allowAny) return true;
  
  // Convert single role to array for consistent handling
  const roleArray = Array.isArray(roles) ? roles : [roles];
  
  // Special case for "any" in an array
  if (allowAny && roleArray.includes("any")) return true;
  
  // Check if user's role is in the allowed roles array
  return roleArray.includes(user.role);
}

/**
 * Check if a route is accessible to a user
 * 
 * @param user User object
 * @param requiredRole Required role for the route
 * @returns Boolean indicating if user can access the route
 */
export function canAccessRoute(
  user: Partial<User> | null,
  requiredRole: string | string[]
): boolean {
  return hasRole(user, requiredRole);
}

/**
 * Check if a specific feature or action is available to a user
 * 
 * @param user User object
 * @param featureRoles Role(s) required for the feature
 * @returns Boolean indicating if user can use the feature
 */
export function hasFeatureAccess(
  user: Partial<User> | null,
  featureRoles: string | string[]
): boolean {
  return hasRole(user, featureRoles);
}

/**
 * Get the next redirect URL after login
 * If a specific redirect is requested and the user has access, use that
 * Otherwise, determine the appropriate dashboard based on user role
 * 
 * @param user User object
 * @param requestedRedirect User-requested redirect URL
 * @returns The appropriate redirect URL
 */
export function getPostLoginRedirect(
  user: Partial<User>,
  requestedRedirect?: string
): string {
  // If there's a requested redirect, check if user has access
  if (requestedRedirect) {
    // Extract the path component from the requested redirect
    const path = requestedRedirect.startsWith('http') 
      ? new URL(requestedRedirect).pathname
      : requestedRedirect;
      
    // Simple role-based access check based on path
    // This is a basic implementation - in a real app, you'd have a more robust way
    // to determine which routes require which roles
    if (
      (path.startsWith('/admin') && user.role === 'Admin') ||
      (path.startsWith('/agent') && (user.role === 'Agent' || user.role === 'Admin')) ||
      (!path.startsWith('/admin') && !path.startsWith('/agent'))
    ) {
      return requestedRedirect;
    }
  }
  
  // Default to the appropriate dashboard based on role
  return getDashboardPath(user);
}

/**
 * Centralized export of all auth helpers
 */
export const AuthHelpers = {
  getDashboardPath,
  hasRole,
  canAccessRoute,
  hasFeatureAccess,
  getPostLoginRedirect
};

export default AuthHelpers;