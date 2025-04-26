import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { handleRedirectResult } from "@/lib/firebase";
import { queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { AuthService } from "@/services/auth.service";

/**
 * Auth Callback Page
 * 
 * This page handles the redirect from Firebase authentication
 * It processes the redirect result from Firebase, synchronizes with the server,
 * and redirects the user to the appropriate dashboard
 */
export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [processingAuth, setProcessingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Check for saved redirect URL from local storage
    const savedRedirectUrl = localStorage.getItem('firebase_auth_redirect');
    
    // If user is already authenticated, redirect to dashboard or saved URL
    if (user && !isLoading) {
      // Determine where to redirect the user
      let redirectPath = savedRedirectUrl || getUserRedirectPath(user.role);
      
      // Clean up saved redirect URL
      if (savedRedirectUrl) {
        localStorage.removeItem('firebase_auth_redirect');
        console.log("[AuthCallback] Redirecting to saved URL:", redirectPath);
      } else {
        console.log("[AuthCallback] User authenticated, redirecting to role-based dashboard:", redirectPath);
      }
      
      // Perform the redirect
      window.location.href = redirectPath; // Use direct navigation to avoid wouter issues with external URLs
      return;
    }
    
    const processAuth = async () => {
      try {
        console.log("[AuthCallback] Processing authentication redirect");
        
        // If we're still loading auth state, wait
        if (isLoading) {
          console.log("[AuthCallback] Auth state is still loading, waiting...");
          return;
        }
        
        // Verify CSRF protection state if present
        const savedState = localStorage.getItem('firebase_auth_state');
        if (savedState) {
          console.log("[AuthCallback] Found saved authentication state");
          // We'll clean this up after successful auth
        }
        
        // Handle the Firebase redirect result
        console.log("[AuthCallback] Processing Firebase redirect result");
        const result = await handleRedirectResult();
        
        if (!result) {
          // No redirect result could mean user navigated here directly without auth flow
          console.log("[AuthCallback] No redirect result found");
          setError("No authentication data found. Please try signing in again.");
          setTimeout(() => setLocation("/"), 2000);
          return;
        }
        
        if ('success' in result && result.success === false && 'error' in result) {
          // Authentication failed with a structured error
          const errorData = result.error || { message: "Unknown error" };
          console.error("[AuthCallback] Authentication failed:", errorData);
          setError(`Authentication failed: ${errorData.message || "Unknown error"}`);
          toast({
            title: "Authentication Failed",
            description: errorData.message || "Failed to complete authentication",
            variant: "destructive",
          });
          // Clean up stored state and redirect URL on failure
          localStorage.removeItem('firebase_auth_state');
          localStorage.removeItem('firebase_auth_redirect');
          setTimeout(() => setLocation("/"), 2000);
          return;
        }
        
        // Success case - user authenticated with Firebase
        console.log("[AuthCallback] Firebase authentication successful");
        
        // Clean up the stored state once we've processed the result
        localStorage.removeItem('firebase_auth_state');
        
        // The useAuth hook takes care of synchronizing the Firebase auth state
        // with the server-side session, so we just need to wait for that to complete
        setTimeout(() => {
          // If there's a saved redirect URL, we'll handle it in the first useEffect
          // when the user state updates in the auth context
          setProcessingAuth(false);
        }, 2000);
        
      } catch (error: any) {
        console.error("[AuthCallback] Authentication processing error:", error);
        setError(error.message || "An unexpected error occurred");
        toast({
          title: "Authentication Error",
          description: error.message || "An unexpected error occurred during authentication",
          variant: "destructive",
        });
        
        // Clean up stored state and redirect URL on error
        localStorage.removeItem('firebase_auth_state');
        localStorage.removeItem('firebase_auth_redirect');
        
        setTimeout(() => setLocation("/"), 2000);
      } finally {
        setProcessingAuth(false);
      }
    };
    
    // Process the authentication
    processAuth();
  }, [isLoading, user, setLocation, toast]);

  // Use the centralized AuthService for determining dashboard paths
  const getUserRedirectPath = (role: string): string => {
    return AuthService.getDashboardPathByRole(role);
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        {error ? (
          // Error state
          <>
            <div className="mx-auto h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h1 className="text-2xl font-bold text-destructive mb-2">Authentication Error</h1>
            <p className="text-muted-foreground mb-4">{error}</p>
            <p className="text-sm">Redirecting to homepage...</p>
          </>
        ) : (
          // Loading state
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <h1 className="mt-6 text-2xl font-bold">Completing sign in...</h1>
            <p className="mt-2 text-muted-foreground">
              Please wait while we authenticate your account
            </p>
          </>
        )}
      </div>
    </div>
  );
}