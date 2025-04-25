import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User, InsertUser, UserLogin } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { auth, FirebaseService } from "../lib/firebase";
import { AuthService } from "../services/auth.service";
import { useLocation } from "wouter";
import { createLogger } from "../lib/logger";

const logger = createLogger('useAuth');

type AuthContextType = {
  user: Omit<User, "password"> | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<Omit<User, "password">, Error, UserLogin>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<Omit<User, "password">, Error, InsertUser>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const {
    data: user,
    error,
    isLoading,
    refetch,
  } = useQuery<Omit<User, "password"> | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Function to navigate to the correct dashboard based on role using AuthService
  function navigateToDashboard(user: Omit<User, "password">): void {
    navigate(AuthService.getDashboardPathByRole(user.role));
  }
  
  // Listen for Firebase auth state changes and sync with backend
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        logger.info("Firebase user authenticated", { uid: firebaseUser.uid });
        
        try {
          // Extract user info from Firebase user
          const userInfo = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || "",
            email: firebaseUser.email || "",
            photoURL: firebaseUser.photoURL,
            token: await firebaseUser.getIdToken()
          };
          
          // Don't proceed if email is missing
          if (!userInfo.email) {
            logger.error("No email from Firebase auth");
            return;
          }
          
          // Send Firebase auth data to our backend
          const response = await fetch("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
            throw new Error("Failed to authenticate with Google");
          }
          
          // Get user data from backend and update auth context
          const userData = await response.json();
          queryClient.setQueryData(["/api/user"], userData);
          
          // Navigate to the appropriate dashboard
          navigateToDashboard(userData);
          
          toast({
            title: "Sign in successful",
            description: `Welcome, ${userData.fullName || userData.username}!`,
          });
        } catch (error) {
          logger.error("Error syncing Firebase auth with backend", { error });
        }
      } else {
        logger.debug("No Firebase user authenticated");
      }
    });
    
    // Cleanup on unmount
    return () => unsubscribe();
  }, [navigate, toast]);
  
  // If user data changes and user is logged in, navigate to correct dashboard
  useEffect(() => {
    if (user && window.location.pathname === '/') {
      navigateToDashboard(user);
    }
  }, [user, navigate]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: UserLogin) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: Omit<User, "password">) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Logged in successfully",
        description: `Welcome back, ${user.fullName}!`,
      });
      // Navigate to the appropriate dashboard
      navigateToDashboard(user);
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: Omit<User, "password">) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome to KIZERE, ${user.fullName}!`,
      });
      // Navigate to the appropriate dashboard
      navigateToDashboard(user);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      logger.info("Starting logout process");
      // Use AuthService for logout
      await AuthService.signOut();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out successfully",
      });
      
      // Redirect to landing page after logout
      window.location.href = "/";
      logger.info("Logout completed successfully");
    },
    onError: (error: Error) => {
      logger.error("Logout failed", { error });
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
