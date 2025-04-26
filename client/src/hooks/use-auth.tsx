import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (redirectUrl?: string) => Promise<void>;
  signOut: () => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { toast } = useToast();

  // Check if user is already authenticated on mount
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isMounted = true; // Track mounted state to prevent setState on unmounted component
    
    const setupAuth = async () => {
      try {
        // First, check server-side session
        try {
          const sessionResponse = await fetch("/api/user");
          if (sessionResponse.ok) {
            const userData = await sessionResponse.json();
            if (isMounted) {
              setUser(userData);
              console.log("[useAuth] User authenticated from session", userData);
              setIsLoading(false);
              return;
            }
          } else {
            console.log("[useAuth] No server session found, status:", sessionResponse.status);
          }
        } catch (sessionError) {
          console.warn("[useAuth] Error checking session:", sessionError);
          // Continue to Firebase auth if session check fails
        }
        
        // If no session, try to handle any pending Firebase redirect
        try {
          const { handleRedirectResult } = await import('@/lib/firebase');
          const redirectResult = await handleRedirectResult();
          
          if (redirectResult) {
            console.log("[useAuth] Processing Firebase redirect result:", redirectResult);
            
            // Type guard for error result
            if ('success' in redirectResult && redirectResult.success === false && 'error' in redirectResult) {
              // Handle authentication errors from redirect
              console.warn("[useAuth] Firebase redirect authentication failed:", redirectResult.error);
              
              if (isMounted) {
                // Safe access to error message with fallback
                const errorMessage = redirectResult.error?.message || 'Unknown authentication error';
                setError(`Authentication failed: ${errorMessage}`);
                toast({
                  title: "Authentication Failed",
                  description: "There was a problem signing in with Google. Please try again.",
                  variant: "destructive"
                });
                setIsLoading(false);
              }
              return;
            } 
            // Type guard for successful result
            else if ('success' in redirectResult && redirectResult.success === true && 'user' in redirectResult) {
              // Successfully authenticated with Firebase from redirect
              await synchronizeWithServer(redirectResult.user);
            }
            // Legacy format support
            else if ('user' in redirectResult) {
              // Handle legacy redirect result format
              await synchronizeWithServer(redirectResult.user);
            }
          }
        } catch (redirectError) {
          console.error("[useAuth] Error handling Firebase redirect:", redirectError);
          // Continue to normal Firebase auth state monitoring
        }
        
        // Set up Firebase auth state change listener
        const { onAuthChange } = await import('@/lib/firebase');
        
        unsubscribe = onAuthChange(async (firebaseUser) => {
          if (!isMounted) return;
          
          if (firebaseUser) {
            console.log("[useAuth] Firebase auth state changed - user signed in:", firebaseUser.email);
            await synchronizeWithServer(firebaseUser);
          } else {
            // User is signed out from Firebase
            console.log("[useAuth] Firebase auth state changed - no user");
            setUser(null);
            setIsLoading(false);
          }
        });
      } catch (error) {
        console.error("[useAuth] Critical error setting up authentication:", error);
        
        if (isMounted) {
          toast({
            title: "Authentication System Error",
            description: "There was a problem with the authentication system. Please reload the page or try again later.",
            variant: "destructive"
          });
          setError("Authentication system error");
          setIsLoading(false);
        }
      }
    };
    
    // Helper function to synchronize Firebase auth with server session
    const synchronizeWithServer = async (firebaseUser: any) => {
      if (!isMounted) return;
      
      try {
        // Validate basic user data
        if (!firebaseUser.email) {
          console.error("[useAuth] Firebase user missing email");
          setError("Missing email from authentication provider");
          setIsLoading(false);
          return;
        }
        
        let token = null;
        let tokenError = null;
        
        // Get Firebase ID token with retry logic
        try {
          token = await firebaseUser.getIdToken(true); // Force token refresh
          console.log("[useAuth] Successfully retrieved Firebase ID token");
        } catch (error) {
          console.warn("[useAuth] Failed to get Firebase ID token:", error);
          tokenError = error;
          
          // Even without a token, we'll try to authenticate with the server
          // The server is now more permissive for Replit environments
        }
        
        // Extract user data from Firebase user
        const userData = {
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          uid: firebaseUser.uid,
          token,
          photoURL: firebaseUser.photoURL || null,
          // Additional context for debugging
          authTimestamp: localStorage.getItem('firebase_auth_timestamp'),
          authOrigin: localStorage.getItem('firebase_auth_origin'),
          authState: localStorage.getItem('firebase_auth_state'),
          currentOrigin: window.location.origin,
          tokenError: tokenError ? {
            message: tokenError instanceof Error ? tokenError.message : String(tokenError),
            name: tokenError instanceof Error ? tokenError.name : 'UnknownError',
            code: (tokenError as any)?.code || 'unknown'
          } : null
        };
        
        // Call server endpoint to sync Firebase auth with server session
        console.log("[useAuth] Synchronizing Firebase auth with server with payload:", {
          email: userData.email,
          name: userData.name,
          uid: userData.uid,
          hasToken: !!userData.token,
          hasPhotoURL: !!userData.photoURL
        });
        
        const response = await fetch("/api/auth/google", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
          credentials: "include" // Important for cookies
        });
        
        if (response.ok) {
          const serverUser = await response.json();
          
          if (isMounted) {
            setUser(serverUser);
            setError(null);
            console.log("[useAuth] Server session created/updated for Firebase user", serverUser);
            
            // Show success toast
            toast({
              title: "Welcome!",
              description: `Signed in as ${serverUser.fullName || serverUser.email}`,
            });
          }
        } else {
          // Handle server-side authentication errors
          let errorMessage = "Failed to create server session";
          
          try {
            // Try to parse error as JSON
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (jsonError) {
            // If not JSON, try to get as text
            try {
              const errorText = await response.text();
              if (errorText) errorMessage = errorText;
            } catch (textError) {
              // Keep default error message
            }
          }
          
          console.error("[useAuth] Server auth failed:", {
            status: response.status,
            message: errorMessage
          });
          
          if (isMounted) {
            setError(errorMessage);
            toast({
              title: "Authentication Error",
              description: "There was a problem with the server authentication. Please try again.",
              variant: "destructive"
            });
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("[useAuth] Error syncing Firebase auth with server:", {
          message: errorMessage,
          error: error
        });
        
        if (isMounted) {
          // Apply a more specific error message
          if (error instanceof TypeError && errorMessage.includes('NetworkError')) {
            setError("Network error: Could not connect to authentication server. Please check your internet connection.");
          } else if (error instanceof TypeError && errorMessage.includes('Failed to fetch')) {
            setError("Server connection error: Authentication server is not responding. Please try again later.");
          } else {
            setError(`Authentication error: ${errorMessage}`);
          }
          
          toast({
            title: "Authentication Error",
            description: "There was a problem connecting to the authentication service. Please try again later.",
            variant: "destructive"
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Start the authentication setup
    setupAuth();
    
    // Cleanup function to prevent memory leaks and side effects
    return () => {
      isMounted = false;
      if (unsubscribe) {
        console.log("[useAuth] Unsubscribing from Firebase auth changes");
        unsubscribe();
      }
    };
  }, [toast]);

  // Handle redirections based on user role
  useEffect(() => {
    if (!user || isRedirecting) return;

    const pathname = window.location.pathname;
    
    // Don't redirect on these routes
    if (
      pathname === "/login" ||
      pathname === "/register" ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/agent")
    ) {
      return;
    }

    let dashboardPath = "/dashboard";
    
    // Set the appropriate dashboard path based on user role
    if (user.role === "Admin") {
      dashboardPath = "/admin/dashboard";
    } else if (user.role === "Agent") {
      dashboardPath = "/agent/dashboard";
    }
    
    // Redirect to the appropriate dashboard
    if (user) {
      console.log("[useAuth] Redirecting to dashboard:", dashboardPath);
      setIsRedirecting(true);
      setLocation(dashboardPath);
    }
  }, [user, setLocation, isRedirecting]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const userData = await response.json();
      setUser(userData);
      
      // Redirect based on role
      if (userData.role === "Admin") {
        setLocation("/admin/dashboard");
      } else if (userData.role === "Agent") {
        setLocation("/agent/dashboard");
      } else {
        setLocation("/dashboard");
      }
    } catch (error) {
      console.error("[useAuth] Login error:", error);
      setError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (redirectUrl?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use our custom Google authentication method that bypasses Firebase handlers
      const { openGoogleAuthWindow } = await import('@/lib/custom-auth');
      console.log("[useAuth] Initiating custom Google sign-in...");
      
      // Determine the appropriate redirect URL
      const redirectPath = redirectUrl || '/dashboard';
      
      // Open the popup window to Google authentication
      const result = await openGoogleAuthWindow(redirectPath);
      
      // Check if authentication was successful
      if (result.success && result.user) {
        console.log("[useAuth] Custom authentication successful");
        
        // User data is already synchronized with server in our backend
        // Just set the user in state
        setUser(result.user);
        
        toast({
          title: "Welcome!",
          description: `Signed in as ${result.user.fullName || result.user.email}`,
        });
        
        // Determine which dashboard to redirect to based on user role
        let dashboardPath = "/dashboard";
        if (result.user.role === "Admin") {
          dashboardPath = "/admin/dashboard";
        } else if (result.user.role === "Agent") {
          dashboardPath = "/agent/dashboard";
        }
        
        // Redirect to the appropriate dashboard
        setLocation(dashboardPath);
        
      } else {
        // Authentication failed
        const errorMessage = result.error || "Authentication failed";
        console.error("[useAuth] Custom authentication failed:", errorMessage);
        
        toast({
          title: "Authentication Failed",
          description: errorMessage,
          variant: "destructive"
        });
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("[useAuth] Google login error:", error);
      setError(error instanceof Error ? error.message : "Google login failed");
      
      toast({
        title: "Authentication Error",
        description: error instanceof Error ? error.message : "Google authentication failed. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      console.log("[useAuth] Starting logout process");
      
      // Sign out from Firebase first
      try {
        const { logOut } = await import('@/lib/firebase');
        await logOut();
        console.log("[useAuth] Firebase logout successful");
      } catch (firebaseError) {
        console.warn("[useAuth] Firebase logout error:", firebaseError);
        // Continue with server logout even if Firebase logout fails
      }
      
      // Also sign out from server session
      try {
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include", // Important for cookies
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        if (response.ok) {
          console.log("[useAuth] Server session logout successful");
        } else {
          console.warn("[useAuth] Server logout returned non-OK status:", response.status);
        }
      } catch (serverError) {
        console.warn("[useAuth] Server logout request failed:", serverError);
        // Continue even if server logout fails
      }
      
      // Clear local state regardless of API results
      setUser(null);
      setError(null);
      setLocation("/");
      
      // Show success notification
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
      
      console.log("[useAuth] Logout complete");
    } catch (error) {
      console.error("[useAuth] Logout error:", error);
      setError(error instanceof Error ? error.message : "Logout failed");
      
      // Show error notification
      toast({
        title: "Logout Error",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, fullName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      const userData = await response.json();
      setUser(userData);
      setLocation("/dashboard");
    } catch (error) {
      console.error("[useAuth] Registration error:", error);
      setError(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    loginWithGoogle,
    signOut,
    signup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};