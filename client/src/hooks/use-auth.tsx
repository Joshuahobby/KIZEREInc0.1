import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import type { User } from "@shared/schema";

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
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

  // Check if user is already authenticated on mount
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const setupAuth = async () => {
      try {
        // First, check server-side session
        const sessionResponse = await fetch("/api/user");
        if (sessionResponse.ok) {
          const userData = await sessionResponse.json();
          setUser(userData);
          console.log("[useAuth] User authenticated from session", userData);
          setIsLoading(false);
          return;
        }
        
        // If no session, listen to Firebase auth state changes
        const { onAuthChange } = await import('@/lib/firebase');
        
        unsubscribe = onAuthChange(async (firebaseUser) => {
          if (firebaseUser) {
            console.log("[useAuth] Firebase user signed in", firebaseUser.email);
            
            // When Firebase user signs in, create or get server session
            try {
              // Call server endpoint to sync Firebase auth with server session
              const response = await fetch("/api/auth/google", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email: firebaseUser.email,
                  name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                  uid: firebaseUser.uid,
                  token: await firebaseUser.getIdToken(),
                  photoURL: firebaseUser.photoURL,
                }),
              });
              
              if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                console.log("[useAuth] Server session created for Firebase user", userData);
              } else {
                console.error("[useAuth] Failed to create server session", await response.text());
              }
            } catch (error) {
              console.error("[useAuth] Error syncing Firebase auth with server:", error);
            }
          } else {
            // User is signed out
            console.log("[useAuth] No Firebase user");
            setUser(null);
          }
          
          setIsLoading(false);
        });
      } catch (error) {
        console.error("[useAuth] Error setting up authentication:", error);
        setIsLoading(false);
      }
    };

    setupAuth();
    
    // Cleanup function to unsubscribe from Firebase auth changes
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

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

  const loginWithGoogle = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the Firebase SDK for Google authentication
      const { signInWithGoogle } = await import('@/lib/firebase');
      await signInWithGoogle();
      
      // Firebase will handle the redirect flow
      // After redirect back, we'll check auth state in useEffect
      console.log("[useAuth] Initiated Firebase Google sign-in");
    } catch (error) {
      console.error("[useAuth] Google login error:", error);
      setError(error instanceof Error ? error.message : "Google login failed");
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      // Sign out from Firebase first
      const { logOut } = await import('@/lib/firebase');
      await logOut();
      
      // Also sign out from server session
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      
      setUser(null);
      setLocation("/");
      console.log("[useAuth] Successfully signed out");
    } catch (error) {
      console.error("[useAuth] Logout error:", error);
      setError(error instanceof Error ? error.message : "Logout failed");
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