import { useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { auth } from "@/lib/firebase";
import { queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

/**
 * Auth Callback Page
 * 
 * This page handles the redirect from OAuth providers (like Google)
 * It extracts tokens from the URL hash, validates them, and then
 * performs the necessary API calls to sign in the user
 */
export default function AuthCallback() {
  // In wouter, we use useLocation which returns a tuple of [location, setLocation]
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isLoading } = useAuth();
  
  useEffect(() => {
    const processAuth = async () => {
      try {
        // Get the hash fragment (contains tokens after # symbol)
        const hash = window.location.hash.substring(1);
        if (!hash) {
          throw new Error("No authentication data received");
        }
        
        // Parse the hash fragment
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const idToken = params.get("id_token");
        const state = params.get("state");
        
        // Verify the state for CSRF protection
        const storedState = localStorage.getItem("firebase_auth_nonce");
        if (state !== storedState) {
          throw new Error("Invalid authentication state");
        }
        
        // Validate tokens
        if (!accessToken || !idToken) {
          throw new Error("Invalid authentication response");
        }
        
        // Make API call to your backend with the tokens
        const response = await fetch("/api/auth/google", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accessToken,
            idToken
          }),
          credentials: "include"
        });
        
        if (!response.ok) {
          throw new Error("Failed to authenticate with server");
        }
        
        const userData = await response.json();
        
        // Update auth state
        queryClient.setQueryData(["/api/user"], userData);
        
        // Show success message
        toast({
          title: "Sign in successful",
          description: `Welcome, ${userData.fullName || userData.username}!`,
        });
        
        // Clean up
        localStorage.removeItem("firebase_auth_nonce");
        
        // Redirect based on user role
        setLocation(getUserRedirectPath(userData.role));
      } catch (error: any) {
        console.error("Authentication error:", error);
        toast({
          title: "Authentication failed",
          description: error.message || "Failed to complete authentication",
          variant: "destructive",
        });
        
        // Redirect to home page on error
        setLocation("/");
      }
    };
    
    // Process the authentication if we're not in a loading state
    if (!isLoading) {
      processAuth();
    }
  }, [isLoading, setLocation, toast]);

  // Helper function to determine redirect path based on role
  const getUserRedirectPath = (role: string): string => {
    switch (role) {
      case "Admin":
        return "/admin"; // Correct path to admin dashboard
      case "Agent":
        return "/lost-found";
      case "Subscriber":
      default:
        return "/dashboard"; // Redirect to unified dashboard
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
        <h1 className="mt-6 text-2xl font-bold">Completing sign in...</h1>
        <p className="mt-2 text-muted-foreground">
          Please wait while we authenticate your account
        </p>
      </div>
    </div>
  );
}