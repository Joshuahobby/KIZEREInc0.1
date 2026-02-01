import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { User } from "@shared/schema";
import { AuthService } from "@/services/auth.service";

// Type for role requirements
type RoleRequirement = 'Admin' | 'Agent' | 'Subscriber' | 'any';

export function ProtectedRoute({
  path,
  component: Component,
  requiredRole = 'any',
}: {
  path: string;
  component: React.ComponentType<any>;
  requiredRole?: RoleRequirement;
}) {
  const { user, isLoading } = useAuth();

  // Helper function to always return a component
  const LoadingComponent = () => (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
    </div>
  );

  // Helper function for unauthorized access
  const UnauthorizedComponent = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
      <p className="text-muted-foreground mb-4 text-center">
        You don't have the required permissions to access this page.
      </p>
      <Redirect to="/" />
    </div>
  );

  // Redirect to landing page if not authenticated (modal login will be shown)
  const RedirectToLandingComponent = () => <Redirect to="/" />;

  // Function to check if the user has the required role
  const hasRequiredRole = (user: Omit<User, "password">, requiredRole: RoleRequirement): boolean => {
    if (requiredRole === 'any') return true;
    return user.role === requiredRole;
  };

  // Use the centralized AuthService for determining dashboard paths
  const getDashboardByRole = (role: string): string => {
    return AuthService.getDashboardPathByRole(role);
  };

  if (isLoading) {
    return (
      <Route path={path}>
        <LoadingComponent />
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <RedirectToLandingComponent />
      </Route>
    );
  }

  // Check if the path is / and redirect to appropriate dashboard by role
  if (path === '/') {
    const RedirectToDashboard = () => <Redirect to={getDashboardByRole(user.role)} />;
    return (
      <Route path={path}>
        <RedirectToDashboard />
      </Route>
    );
  }

  // Check role restrictions
  if (!hasRequiredRole(user, requiredRole)) {
    return (
      <Route path={path}>
        <UnauthorizedComponent />
      </Route>
    );
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}
