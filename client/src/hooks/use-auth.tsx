import * as React from "react";
// Force HMR refresh
import { useLocation } from "wouter";
import { User, InsertUser, UserPreferences } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from "@/services/auth.service";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, clearCsrfToken, setAuthSyncing } from "@/lib/queryClient";

function safeReturnUrl(url: string | null): string | null {
  if (!url) return null;
  // Block absolute URLs and protocol-relative URLs to prevent open redirects
  if (!url.startsWith("/") || url.startsWith("//")) return null;
  return url;
}

const RETURN_URL_SESSION_KEY = "kizere_post_auth_returnUrl";

export interface Pending2FAData {
  userId: number;
  methods: string[];
  maskedPhone: string | null;
  maskedEmail: string | null;
  preferredMethod?: string | null;
  isRegistration?: boolean;
}

export interface AuthContextType {
  user: User | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loginMutation: any;
  registerMutation: any;
  logoutMutation: any;
  loginWithGoogle: (redirectUrl?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: (userData?: User) => Promise<void>;
  // 2FA
  pending2FA: Pending2FAData | null;
  send2FACode: (channel: 'sms' | 'email') => Promise<void>;
  verify2FAMutation: any;
  clear2FA: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);
AuthContext.displayName = "AuthContext";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [, setLocation] = useLocation();
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const [pending2FA, setPending2FA] = React.useState<Pending2FAData | null>(() => {
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem('pending_2fa') : null;
    if (saved) {
      try {
        console.log("[useAuth] Restoring pending2FA from sessionStorage");
        return JSON.parse(saved);
      } catch (e) {
        console.error("[useAuth] Failed to parse saved 2FA state", e);
      }
    }
    return null;
  });

  // Persist pending2FA to sessionStorage
  React.useEffect(() => {
    if (pending2FA) {
      console.log("[useAuth] Persisting pending2FA to sessionStorage:", pending2FA.userId);
      sessionStorage.setItem('pending_2fa', JSON.stringify(pending2FA));
    } else {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('pending_2fa');
      }
    }
  }, [pending2FA]);
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
      setAuthSyncing(true); // Signal to queryClient that we are syncing
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
        data: payload,
        skipSyncWait: true
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
      setAuthSyncing(false); // Signal that sync is complete
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
            setAuthSyncing(true); // Lock early
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
            setAuthSyncing(true); // Lock early to prevent other requests
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
    
    // Only redirect if they are on auth pages or root
    const authPaths = ["/", "/auth", "/login", "/register"];
    
    if (authPaths.includes(pathname)) {
      const returnUrl = safeReturnUrl(new URLSearchParams(window.location.search).get("returnUrl"));
      if (returnUrl) {
        setLocation(returnUrl);
        return;
      }
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
    onSuccess: (data: any) => {
      const currentReturnUrl = safeReturnUrl(new URLSearchParams(window.location.search).get("returnUrl"));

      // Check if 2FA is required
      if (data.requires2FA) {
        if (currentReturnUrl) sessionStorage.setItem(RETURN_URL_SESSION_KEY, currentReturnUrl);
        setPending2FA({
          userId: data.userId,
          methods: data.methods,
          maskedPhone: data.maskedPhone,
          maskedEmail: data.maskedEmail,
          preferredMethod: data.preferredMethod,
        });
        console.log("[useAuth] Login requires 2FA, redirecting to /verify-2fa", data);
        setLocation('/verify-2fa');
        return;
      }

      // Normal login (no 2FA)
      const userData = data as User;
      setUser(userData);
      const preferredStyle = (userData.preferences as UserPreferences)?.dashboardStyle;
      const dashboardPath = AuthService.getDashboardPathByRole(userData.role, preferredStyle);
      setLocation(currentReturnUrl || dashboardPath);
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
    onSuccess: (data: any) => {
      console.log("[useAuth] Registration successful data:", data);
      const currentReturnUrl = safeReturnUrl(new URLSearchParams(window.location.search).get("returnUrl"));

      if (data.requires2FA) {
        console.log("[useAuth] Registration requires 2FA, setting pending state and redirecting", {
          userId: data.userId,
          methods: data.methods,
          maskedPhone: data.maskedPhone
        });
        if (currentReturnUrl) sessionStorage.setItem(RETURN_URL_SESSION_KEY, currentReturnUrl);
        setPending2FA({
          userId: data.userId,
          methods: data.methods,
          maskedPhone: data.maskedPhone,
          maskedEmail: data.maskedEmail,
          preferredMethod: data.preferredMethod,
          isRegistration: true
        });
        setLocation('/verify-2fa');
        return;
      }

      setUser(data as User);
      setLocation(currentReturnUrl || "/dashboard");
    },
    onError: (err: Error) => {
      console.error("[useAuth] Registration failed error:", err);
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
      // 1. Log out from Firebase first
      try {
        const { logOut } = await import('@/lib/firebase');
        await logOut();
        console.log("[useAuth] Firebase logout successful");
      } catch (e) {
        console.warn("[useAuth] Firebase logout failed or already out:", e);
      }

      // 2. Clear cached CSRF token before logout to ensure we don't use a stale one
      // this helps prevent the 403 Forbidden error on logout
      clearCsrfToken();

      // 3. Attempt server-side logout
      try {
        await apiRequest("/api/auth/logout", {
          method: "POST",
        });
        console.log("[useAuth] Server logout successful");
      } catch (error) {
        console.error("[useAuth] Server logout failed (expected if session expired):", error);
        // We continue anyway as we want to clear client state
      }

      // 4. ALWAYS clear client-side state regardless of server response
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
      console.error("[useAuth] Critical logout error:", error);
      // Even in a critical error, try to at least clear user and redirect
      setUser(null);
      setLocation("/");
    } finally {
      setIsLoading(false);
    }
  };

  const logoutMutation = useMutation({
    mutationFn: signOut,
  });

  // 2FA: Send verification code
  const send2FACode = React.useCallback(async (channel: 'sms' | 'email') => {
    try {
      await apiRequest('/api/auth/2fa/send', {
        method: 'POST',
        data: { channel },
      });
      toast({
        title: 'Code Sent',
        description: `Verification code sent via ${channel === 'sms' ? 'SMS' : 'email'}.`,
      });
    } catch (err: any) {
      toast({
        title: 'Failed to send code',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  }, []);

  // 2FA: Verify code and complete login
  const verify2FAMutation = useMutation({
    mutationFn: async (code: string) => {
      return await apiRequest('/api/auth/2fa/verify', {
        method: 'POST',
        data: { code },
      });
    },
    onSuccess: (userData: User) => {
      setPending2FA(null);
      setUser(userData);
      const preferredStyle = (userData.preferences as UserPreferences)?.dashboardStyle;
      const dashboardPath = AuthService.getDashboardPathByRole(userData.role, preferredStyle);
      const storedReturnUrl = safeReturnUrl(sessionStorage.getItem(RETURN_URL_SESSION_KEY));
      sessionStorage.removeItem(RETURN_URL_SESSION_KEY);
      setLocation(storedReturnUrl || dashboardPath);
      toast({
        title: 'Welcome!',
        description: `Signed in as ${userData.fullName || userData.username}`,
      });
    },
    onError: (err: Error) => {
      toast({
        title: 'Verification Failed',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const clear2FA = React.useCallback(() => setPending2FA(null), []);

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
    // 2FA
    pending2FA,
    send2FACode,
    verify2FAMutation,
    clear2FA,
  }), [user, isLoading, error, loginMutation, registerMutation, logoutMutation, pending2FA, verify2FAMutation]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};