import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { handleRedirectResult } from "@/lib/firebase";
import { queryClient } from "@/lib/queryClient";
import { AlertTriangle, CheckCircle, Copy, Loader2 } from "lucide-react";
import { AuthService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

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
        
        // Get auth context from localStorage
        const savedState = localStorage.getItem('firebase_auth_state');
        const savedRedirect = localStorage.getItem('firebase_auth_redirect');
        const savedTimestamp = localStorage.getItem('firebase_auth_timestamp');
        const savedOrigin = localStorage.getItem('firebase_auth_origin');
        
        // Log authentication context for debugging
        console.log("[AuthCallback] Authentication context:", {
          hasState: !!savedState,
          hasRedirect: !!savedRedirect,
          timestamp: savedTimestamp ? new Date(parseInt(savedTimestamp)).toISOString() : null,
          origin: savedOrigin,
          currentUrl: window.location.href,
          urlParams: window.location.search
        });
        
        // Handle the Firebase redirect result with timeout protection
        console.log("[AuthCallback] Processing Firebase redirect result");
        
        // Create a timeout promise to prevent hanging
        const timeout = new Promise<null>((resolve) => {
          setTimeout(() => {
            console.warn("[AuthCallback] Redirect result processing timed out");
            resolve(null);
          }, 10000); // 10 second timeout
        });
        
        // Race between the redirect result and timeout
        const result = await Promise.race([
          handleRedirectResult(),
          timeout
        ]);
        
        if (!result) {
          // No redirect result could mean user navigated here directly without auth flow
          // or the processing timed out
          console.log("[AuthCallback] No redirect result found or processing timed out");
          setError("Authentication process did not complete. This could be due to an interrupted sign-in flow or incorrect Firebase configuration. Please try signing in again.");
          return;
        }
        
        // Handle error case
        if ('success' in result && result.success === false && 'error' in result) {
          // Authentication failed with a structured error
          const errorData = result.error || { message: "Unknown error" };
          console.error("[AuthCallback] Authentication failed:", errorData);
          
          // Check for specific Firebase error codes
          let errorMessage = errorData.message || "Unknown error";
          let troubleShootingTip = "";
          
          // Get the error code - handle both object shapes
          const errorCode = (errorData as any).code || '';
          
          if (errorCode === 'auth/invalid-api-key') {
            troubleShootingTip = "The Firebase API key appears to be invalid. Please check your Firebase configuration.";
          } else if (errorCode === 'auth/internal-error') {
            troubleShootingTip = "An internal Firebase error occurred. This could be due to misconfigured Firebase settings or network issues.";
          } else if (errorCode === 'auth/network-request-failed') {
            troubleShootingTip = "A network error occurred. Please check your internet connection and try again.";
          } else if (errorCode === 'auth/operation-not-allowed') {
            troubleShootingTip = "The sign-in provider is not enabled in your Firebase console.";
          } else if (errorCode === 'auth/unauthorized-domain') {
            troubleShootingTip = "This domain is not authorized to use Firebase Authentication. Add your domain to the authorized domains list in the Firebase console.";
          } else if (errorMessage.includes('domain')) {
            troubleShootingTip = "This domain may not be authorized for Firebase Authentication. Check the authorized domains in your Firebase console.";
          }
          
          const fullErrorMessage = troubleShootingTip 
            ? `${errorMessage}. ${troubleShootingTip}` 
            : errorMessage;
          
          setError(fullErrorMessage);
          toast({
            title: "Authentication Failed",
            description: "There was a problem signing in with Google. Please try again.",
            variant: "destructive",
          });
          
          // Clean up stored state and redirect URL on failure
          localStorage.removeItem('firebase_auth_state');
          localStorage.removeItem('firebase_auth_redirect');
          return;
        }
        
        // Success case - user authenticated with Firebase
        console.log("[AuthCallback] Firebase authentication successful");
        
        // Clean up the stored state once we've processed the result
        localStorage.removeItem('firebase_auth_state');
        
        // Toast success message
        toast({
          title: "Sign in successful!",
          description: "You've successfully authenticated with Google",
        });
        
        // The useAuth hook takes care of synchronizing the Firebase auth state
        // with the server-side session, so we just need to wait for that to complete
        
        // If after 5 seconds we still don't have a user in context, show an error
        const userContextTimeout = setTimeout(() => {
          if (!user && !isLoading) {
            console.error("[AuthCallback] Firebase authenticated but server session was not created");
            setError("Authentication completed, but server session could not be created. This could be a server-side issue.");
          }
        }, 5000);
        
        // Clean up timeout if component unmounts
        return () => clearTimeout(userContextTimeout);
        
      } catch (error: any) {
        console.error("[AuthCallback] Authentication processing error:", error);
        
        // Handle different error types with more specific messages
        let errorMessage = "An unexpected error occurred during authentication";
        
        if (error.name === 'TimeoutError') {
          errorMessage = "The authentication process timed out. Please try again.";
        } else if (error.message && error.message.includes('network')) {
          errorMessage = "A network error occurred during authentication. Please check your connection and try again.";
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setError(errorMessage);
        toast({
          title: "Authentication Error",
          description: errorMessage,
          variant: "destructive",
        });
        
        // Clean up stored state and redirect URL on error
        localStorage.removeItem('firebase_auth_state');
        localStorage.removeItem('firebase_auth_redirect');
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
  
  // Function to copy Firebase debug information to clipboard
  const copyDebugInfo = () => {
    try {
      const debugInfo = {
        timestamp: new Date().toISOString(),
        authState: localStorage.getItem('firebase_auth_state'),
        authRedirect: localStorage.getItem('firebase_auth_redirect'),
        authTimestamp: localStorage.getItem('firebase_auth_timestamp'),
        authOrigin: localStorage.getItem('firebase_auth_origin'),
        currentUrl: window.location.href,
        currentOrigin: window.location.origin,
        currentHostname: window.location.hostname,
        error: error
      };
      
      navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
      toast({
        title: "Debug Info Copied",
        description: "Firebase authentication debug information has been copied to clipboard"
      });
    } catch (e) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy debug information"
      });
    }
  };
  
  // Function to render troubleshooting tips
  const renderTroubleshootingTips = () => (
    <div className="text-left text-sm mt-6 border-t pt-4">
      <h3 className="font-semibold mb-2 flex items-center">
        <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
        Troubleshooting Tips
      </h3>
      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
        <li>Make sure your Firebase project has this domain in the authorized domains list</li>
        <li>Verify that the Google authentication provider is enabled in Firebase</li>
        <li>Check that your Firebase configuration keys are correct</li>
        <li>Try clearing your browser cache and cookies</li>
        <li>Ensure you're using a supported browser (Chrome, Firefox, Safari, Edge)</li>
      </ul>
      <Button 
        variant="outline" 
        size="sm" 
        className="mt-3 text-xs"
        onClick={copyDebugInfo}
      >
        <Copy className="h-3 w-3 mr-1" />
        Copy Debug Info
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        {error ? (
          // Error state
          <>
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-2">
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-xl text-destructive">Authentication Failed</CardTitle>
              <CardDescription>There was a problem signing you in</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-3 rounded-md text-sm">
                <p>{error}</p>
              </div>
              {renderTroubleshootingTips()}
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-4">
              <Button onClick={() => setLocation("/")} className="w-full">
                Return to Home Page
              </Button>
            </CardFooter>
          </>
        ) : (
          // Loading state
          <>
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-2">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              </div>
              <CardTitle className="text-xl">Completing Sign In</CardTitle>
              <CardDescription>Please wait while we finish authenticating your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary animate-pulse rounded-full w-1/2"></div>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  You'll be redirected automatically when the process completes
                </p>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}