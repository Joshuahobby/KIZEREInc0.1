import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useLocation } from "wouter";
import { User, InsertUser, UserPreferences } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from "@/services/auth.service";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export interface AuthContextType {
  user: User | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loginMutation: any; // Using any for simplicity with mutations
  registerMutation: any;
  logoutMutation: any;
  loginWithGoogle: (redirectUrl?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: (userData?: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { toast } = useToast();
  const isMounted = useRef(true);
  
  // Refs for debouncing and preventing duplicate sync calls
  const syncInProgressRef = useRef(false);
  const lastSyncTimeRef = useRef(0);
  const syncDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingFirebaseUserRef = useRef<any>(null);
  const SYNC_COOLDOWN_MS = 5000; // 5 second cooldown between syncs
  const SYNC_DEBOUNCE_MS = 500; // 500ms debounce for rapid calls

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      // Clean up debounce timer on unmount
      if (syncDebounceTimerRef.current) {
        clearTimeout(syncDebounceTimerRef.current);
      }
    };
  }, []);

  // Core sync function - actually performs the server sync
  const performSync = async (firebaseUser: any) => {
      if (!isMounted.current) return;
      
      // Check cooldown - skip if we synced recently
      const now = Date.now();
      if (now - lastSyncTimeRef.current < SYNC_COOLDOWN_MS) {
        console.log("[useAuth] Skipping sync - within cooldown period");
        setIsLoading(false);
        return;
      }
      
      // Check if sync is already in progress using ref (instant, no re-render delay)
      if (syncInProgressRef.current) {
        console.log("[useAuth] Skipping sync - already in progress");
        return;
      }

      try {
        syncInProgressRef.current = true;
        const token = await firebaseUser.getIdToken();
        
        const payload = {
          email: firebaseUser.email,
          name: firebaseUser.displayName || 'User',
          uid: firebaseUser.uid,
          token,
          photoURL: firebaseUser.photoURL
        };

        console.log("[useAuth] Syncing session...");
        const res = await fetch("/api/auth/google", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify(payload)
        });

        if (res.ok) {
           lastSyncTimeRef.current = Date.now(); // Update last sync time on success
           const userData = await res.json();
           if (isMounted.current) {
             setUser(userData);
             setError(null);
             toast({
              title: "Welcome!",
              description: `Signed in as ${userData.fullName || userData.email}`,
            });
           }
        } else {
           const err = await res.json();
           console.error("[useAuth] Session sync failed", err);
           // If rate limited, respect the retry-after
           if (res.status === 429 && err.retryAfter) {
             lastSyncTimeRef.current = Date.now(); // Prevent immediate retry
             console.log(`[useAuth] Rate limited, retry after ${err.retryAfter}s`);
           }
           if (isMounted.current) setError(err.message || "Login failed");
        }

      } catch (e) {
         console.error("[useAuth] Sync network error", e);
         if (isMounted.current) setError("Network error during login");
      } finally {
         syncInProgressRef.current = false;
         if (isMounted.current) {
            setIsLoading(false); 
         }
      }
  };

  // Debounced wrapper - batches rapid calls and only executes the last one
  const synchronizeWithServer = (firebaseUser: any) => {
      if (!isMounted.current) return;
      
      // Store the pending user
      pendingFirebaseUserRef.current = firebaseUser;
      
      // Clear any existing debounce timer
      if (syncDebounceTimerRef.current) {
        clearTimeout(syncDebounceTimerRef.current);
      }
      
      // Set new debounce timer
      syncDebounceTimerRef.current = setTimeout(() => {
        const userToSync = pendingFirebaseUserRef.current;
        pendingFirebaseUserRef.current = null;
        syncDebounceTimerRef.current = null;
        
        if (userToSync && isMounted.current) {
          performSync(userToSync);
        }
      }, SYNC_DEBOUNCE_MS);
  };

  const refreshUser = async (userData?: User) => {
    if (userData) {
      setUser(userData);
      return;
    }
    
    try {
      const response = await fetch("/api/user");
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error("[useAuth] Failed to refresh user:", error);
    }
  };

  // Check if user is already authenticated on mount
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const setupAuth = async () => {
      try {
        // Check server session once at start
        const sessionResponse = await fetch("/api/user");
        let initialUserData = null;
        if (sessionResponse.ok) {
          initialUserData = await sessionResponse.json();
          if (isMounted.current) {
            setUser(initialUserData);
            setIsLoading(false);
            console.log("[useAuth] Session valid from initial check");
          }
        } else {
          console.log("[useAuth] No active session on startup");
        }

        const { onAuthChange, handleRedirectResult } = await import('@/lib/firebase');

        // Handle Redirect Result FIRST
        try {
           const result = await handleRedirectResult();
           if (result && result.user) {
              console.log("[useAuth] Redirect result found");
              await synchronizeWithServer(result.user);
           }
        } catch (e) {
           console.error("[useAuth] Redirect handling error", e);
        }

        // Listen for Auth State Changes
        unsubscribe = onAuthChange(async (firebaseUser) => {
          if (!isMounted.current) return;
          
          if (firebaseUser) {
            console.log("[useAuth] Firebase user detected");
            await synchronizeWithServer(firebaseUser);
          } else {
            // Firebase says no user, but let's see if we already have a valid server session
            // If we have a session but NO Firebase user, we'll keep the session until it actually fails
            console.log("[useAuth] Firebase user signed out or not found");
            
            // If we don't have a user state yet, OR we were specifically waiting for firebase
            // then we should set to null. But if we already have a user from the initial 
            // session check, let's NOT clear it just because Firebase is null.
            // Using the current user state instead of a fresh fetch saves latency
            if (!user && !initialUserData) {
              console.log("[useAuth] No existing session and no Firebase user, set to null");
              setUser(null);
            } else {
              console.log("[useAuth] Keeping existing session despite missing Firebase user");
            }
            setIsLoading(false);
          }
        });

      } catch (error) {
        console.error("[useAuth] Auth setup failed", error);
        if (isMounted.current) setIsLoading(false);
      }
    };

    setupAuth();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [toast]);

  // Handle redirections based on user role
  useEffect(() => {
    if (!user || isRedirecting || isLoading) return;

    const pathname = window.location.pathname;
    
    if (
      pathname === "/login" ||
      pathname === "/register" ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/agent")
    ) {
      return;
    }

    if (user) {
      const preferredStyle = (user.preferences as UserPreferences)?.dashboardStyle;
      const dashboardPath = AuthService.getDashboardPathByRole(user.role, preferredStyle);
      console.log("[useAuth] Redirecting to dashboard:", dashboardPath);
      setIsRedirecting(true);
      setLocation(dashboardPath);
    }
  }, [user, setLocation, isRedirecting, isLoading]);

  // Reset isRedirecting when path matches dashboard
  useEffect(() => {
    if (!user || !isRedirecting) return;
    
    const preferredStyle = (user.preferences as UserPreferences)?.dashboardStyle;
    const dashboardPath = AuthService.getDashboardPathByRole(user.role, preferredStyle);
    if (window.location.pathname === dashboardPath) {
      console.log("[useAuth] Arrived at dashboard, resetting isRedirecting");
      setIsRedirecting(false);
    }
  }, [user, isRedirecting]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: any) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      return await response.json();
    },
    onSuccess: (userData: User) => {
      setUser(userData);
      const preferredStyle = (userData.preferences as UserPreferences)?.dashboardStyle;
      const dashboardPath = AuthService.getDashboardPathByRole(userData.role, preferredStyle);
      setLocation(dashboardPath);
    },
    onError: (err: Error) => {
      toast({
        title: "Login Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      return await response.json();
    },
    onSuccess: (userData: User) => {
      setUser(userData);
      setLocation("/dashboard");
    },
    onError: (err: Error) => {
      toast({
        title: "Registration Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const loginWithGoogle = async (redirectUrl?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { signInWithGoogle } = await import('@/lib/firebase');
      const callbackUrl = redirectUrl || '/dashboard';
      
      const result = await signInWithGoogle(callbackUrl);
      
      if (result && result.user) {
         console.log("[useAuth] Popup success, syncing...");
         await synchronizeWithServer(result.user);
         
         import('@/lib/auth-helpers').then(({ AuthHelpers }) => {
             const target = redirectUrl || '/dashboard'; 
             setLocation(target);
         });
      }
      
    } catch (error: any) {
      console.error("[useAuth] Login error", error);
      setError(error.message || "Login failed");
      toast({
         title: "Login Error",
         description: error.message || "Failed to login with Google",
         variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      try {
        const { logOut } = await import('@/lib/firebase');
        await logOut();
      } catch (e) {}
      
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      
      setUser(null);
      setError(null);
      
      // Clear all query cache to prevent stale data
      queryClient.clear();
      
      // Clear all local and session storage for a fresh start
      localStorage.clear();
      sessionStorage.clear();
      
      setIsRedirecting(false); // Reset redirecting state
      setLocation("/");
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      console.error("[useAuth] Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const logoutMutation = useMutation({
    mutationFn: signOut,
  });

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    isLoading,
    error,
    loginMutation,
    registerMutation,
    logoutMutation,
    loginWithGoogle,
    signOut,
    refreshUser,
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