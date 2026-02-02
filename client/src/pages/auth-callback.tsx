import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthService } from "@/services/auth.service";
import { UserPreferences } from "@shared/schema";

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const { user, isLoading, error } = useAuth();
  
  useEffect(() => {
    // If user is successfully authenticated, redirect them
    if (user && !isLoading) {
      const redirectPath = AuthService.getDashboardPathByRole(
        user.role, 
        (user.preferences as UserPreferences)?.dashboardStyle
      );
      console.log("[AuthCallback] User authenticated, redirecting to:", redirectPath);
      setLocation(redirectPath);
    }
  }, [user, isLoading, setLocation]);

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
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-4">
              <Button onClick={() => setLocation("/")} className="w-full">
                Return to Home Page
              </Button>
            </CardFooter>
          </>
        ) : (
          // Loading state (Waiting for useAuth to finish sync)
          <>
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-2">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              </div>
              <CardTitle className="text-xl">Finalizing Sign In</CardTitle>
              <CardDescription>Please wait while we verify your account...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary animate-pulse rounded-full w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}