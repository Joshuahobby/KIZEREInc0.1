import * as React from "react";
// Force HMR refresh
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

// Use a global singleton for AuthContext to prevent duplicate instances
// when the module is loaded multiple times (e.g. via alias vs relative path)
const AUTH_CONTEXT_KEY = Symbol.for("kizere-auth-context");
const globalSymbols = Object.getOwnPropertySymbols(globalThis);
const hasAuthContext = globalSymbols.includes(AUTH_CONTEXT_KEY);

const AuthContext = ((globalThis as any)[AUTH_CONTEXT_KEY] as React.Context<AuthContextType | undefined>) || React.createContext<AuthContextType | undefined>(undefined);

if (!(globalThis as any)[AUTH_CONTEXT_KEY]) {
  (globalThis as any)[AUTH_CONTEXT_KEY] = AuthContext;
  AuthContext.displayName = "AuthContext";
  console.log("[useAuth] Created new AuthContext and assigned to global scope");
} else {
  console.log("[useAuth] Reusing existing AuthContext from global scope");
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [, setLocation] = useLocation();
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const { toast } = useToast();
  const isMounted = React.useRef(true);

  // Refs for debouncing and preventing duplicate sync calls
  const syncInProgressRef = React.useRef(false);
  const lastSyncTimeRef = React.useRef(0);
  const syncDebounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const pendingFirebaseUserRef = React.useRef<any>(null);
  const SYNC_COOLDOWN_MS = 5000; // 5 second cooldown between syncs
  const SYNC_DEBOUNCE_MS = 500; // 500ms debounce for rapid calls

  React.useEffect(() => {
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
      if (isMounted.current) setIsLoading(false);
      return;
    }

    // Check if sync is already in progress using ref (instant, no re-render delay)
    if (syncInProgressRef.current) {
      console.log("[useAuth] Skipping sync - already in progress");
      return;
    }

    console.log("[useAuth] Starting performSync for user:", firebaseUser.email);
    try {
      syncInProgressRef.current = true;
      const token = await firebaseUser.getIdToken(true);
      console.log("[useAuth] ID Token retrieved successfully");

      const payload = {
        email: firebaseUser.email,
        name: firebaseUser.displayName || 'User',
        uid: firebaseUser.uid,
        token,
        photoURL: firebaseUser.photoURL
      };

      console.log("[useAuth] Calling /api/auth/google...");
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include"
      });


      console.log("[useAuth] /api/auth/google response status:", res.status);
      if (res.ok) {
        lastSyncTimeRef.current = Date.now(); // Update last sync time on success
        const userData = await res.json();
        console.log("[useAuth] Sync successful, user role:", userData.role);
        if (isMounted.current) {
          setUser(userData);
          setError(null);
          // Only toast if it's the first login in this session to avoid noise
          if (!user) {
            toast({
              title: "Welcome!",
              description: `Signed in as ${userData.fullName || userData.email}`,
            });
          }
        }
      } else {
        const errText = await res.text();
        let err;
        try { err = JSON.parse(errText); } catch { err = { message: errText }; }
        console.error("[useAuth] Session sync failed", err);
        // If rate limited, respect the retry-after
        if (res.status === 429 && err.retryAfter) {
          lastSyncTimeRef.current = Date.now(); // Prevent immediate retry
          console.log(`[useAuth] Rate limited, retry after ${err.retryAfter}s`);
        }
        if (isMounted.current) setError(err.message || "Login failed");
      }

    } catch (e: any) {
      console.error("[useAuth] Sync network error", e);
      if (isMounted.current) setError("Network error during login: " + e.message);
    } finally {
      syncInProgressRef.current = false;
      if (isMounted.current) {
        console.log("[useAuth] performSync finally, setting isLoading to false");
        setIsLoading(false);
      }
    }
  };

  // Debounced wrapper - batches rapid calls and only executes the last one
  const synchronizeWithServer = (firebaseUser: any) => {
    if (!isMounted.current) return;

    console.log("[useAuth] synchronizeWithServer called for:", firebaseUser.email);
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
        console.log("[useAuth] Debounce timer fired, calling performSync");
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
  React.useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupAuth = async () => {
      try {
        // Check server session once at start
        const sessionResponse = await fetch("/api/user", { credentials: "include" });

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

    // Safety timeout - ensure we don't stay in loading state forever
    const safetyTimeout = setTimeout(() => {
      setIsLoading(prev => {
        if (isMounted.current && prev) {
          console.warn("[useAuth] Safety timeout reached in AuthProvider, forcing isLoading to false");
          return false;
        }
        return prev;
      });
    }, 30000);



    return () => {
      if (unsubscribe) unsubscribe();
      if (safetyTimeout) clearTimeout(safetyTimeout);
    };

  }, [toast]);

  // Handle redirections based on user role
  React.useEffect(() => {
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
  React.useEffect(() => {
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

      let errorMessage = error.message || "Login failed";
      let errorTitle = "Login Error";

      if (error.code === 'auth/popup-blocked' || error.message?.includes('popup-blocked')) {
        errorTitle = "Popup Blocked";
        errorMessage = "Please allow popups for this site to sign in with Google.";
      }

      setError(errorMessage);
      toast({
        title: errorTitle,
        description: errorMessage,
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
      } catch (e) { }

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

  const value = React.useMemo(() => ({
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
  }), [user, isLoading, error, loginMutation, registerMutation, logoutMutation]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};