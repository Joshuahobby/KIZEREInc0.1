import * as React from "react";
// Force HMR refresh
import { useLocation } from "wouter";
import { User, InsertUser, UserPreferences } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from "@/services/auth.service";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, clearCsrfToken } from "@/lib/queryClient";

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

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);
AuthContext.displayName = "AuthContext";

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
      const userData = await apiRequest<any>("/api/auth/google", {
        method: "POST",
        data: payload
      });

      console.log("[useAuth] /api/auth/google sync successful, user role:", userData.role);
      lastSyncTimeRef.current = Date.now(); // Update last sync time on success
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
    } catch (e: any) {
      console.error("[useAuth] Sync error", e);
      if (isMounted.current) setError(e.message || "Login failed");
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
        setUser(data || null);
      }
    } catch (error) {
      console.error("[useAuth] Failed to refresh user:", error);
    }
  };

  // Check if user is already authenticated on mount
  React.useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isTerminated = false;

    const setupAuth = async () => {
      try {
        console.log("[useAuth] Initializing authentication...");

        // 1. Initial server session check
        let initialUserData = null;
        try {
          const sessionResponse = await fetch("/api/user", { credentials: "include" });
          if (sessionResponse.ok) {
            initialUserData = await sessionResponse.json();
            if (initialUserData && !isTerminated && isMounted.current) {
              console.log("[useAuth] Valid session found on startup");
              setUser(initialUserData);
              // Don't set isLoading(false) yet, we still want to wait for Firebase
              // just in case they are different (e.g. user just switched accounts)
            }
          }
        } catch (sessionError) {
          console.warn("[useAuth] Session check failed:", sessionError);
        }

        const { onAuthChange, handleRedirectResult } = await import('@/lib/firebase');

        // 2. Handle Redirect Result (popups/redirects)
        try {
          const result = await handleRedirectResult();
          if (result && result.success && result.user) {
            console.log("[useAuth] Redirect/popup login detected");
            await performSync(result.user);
            return; // performSync handles isLoading(false)
          }
        } catch (e) {
          console.error("[useAuth] Redirect results handling error", e);
        }

        // 3. Listen for Auth State Changes (this is the source of truth)
        unsubscribe = onAuthChange(async (firebaseUser) => {
          if (isTerminated || !isMounted.current) return;

          if (firebaseUser) {
            console.log("[useAuth] Firebase user state: Active (", firebaseUser.email, ")");
            await performSync(firebaseUser);
          } else {
            console.log("[useAuth] Firebase user state: Empty");

            // If we have a server session but no Firebase user, 
            // we'll TRUST the server session for now to avoid flickering,
            // but we'll stop loading.
            if (!user && !initialUserData) {
              setUser(null);
            }
            if (isMounted.current) {
              setIsLoading(false);
            }
          }
        });

      } catch (error) {
        console.error("[useAuth] Auth setup failed:", error);
        if (isMounted.current) setIsLoading(false);
      }
    };

    setupAuth();

    return () => {
      isTerminated = true;
      if (unsubscribe) unsubscribe();
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
      return await apiRequest("/api/auth/login", {
        method: "POST",
        data: credentials,
      });
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
      return await apiRequest("/api/auth/register", {
        method: "POST",
        data,
      });
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

      await apiRequest("/api/auth/logout", {
        method: "POST",
      });

      setUser(null);
      setError(null);

      // Clear all query cache to prevent stale data
      queryClient.clear();

      // Clear cached CSRF token since session is destroyed
      clearCsrfToken();

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