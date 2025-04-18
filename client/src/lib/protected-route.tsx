import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { User } from "@shared/schema";

// Type for role requirements
type RoleRequirement = 'Admin' | 'Agent' | 'Subscriber' | 'any';

export function ProtectedRoute({
  path,
  component: Component,
  requiredRole = 'any',
}: {
  path: string;
  component: () => JSX.Element;
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
      <Redirect to="/dashboard" />
    </div>
  );

  // Redirect to login if not authenticated
  const RedirectToLoginComponent = () => <Redirect to="/auth" />;

  // Function to check if the user has the required role
  const hasRequiredRole = (user: Omit<User, "password">, requiredRole: RoleRequirement): boolean => {
    if (requiredRole === 'any') return true;
    return user.role === requiredRole;
  };

  // Function to get the appropriate dashboard for a user's role
  const getDashboardByRole = (role: string): string => {
    switch (role) {
      case 'Admin':
        return '/user-management';
      case 'Agent':
        return '/lost-found';
      case 'Subscriber':
      default:
        return '/dashboard';
    }
  };

  if (isLoading) {
    return <Route path={path} component={LoadingComponent} />;
  }

  if (!user) {
    return <Route path={path} component={RedirectToLoginComponent} />;
  }

  // Check if the path is / and redirect to appropriate dashboard by role
  if (path === '/') {
    const RedirectToDashboard = () => <Redirect to={getDashboardByRole(user.role)} />;
    return <Route path={path} component={RedirectToDashboard} />;
  }

  // Check role restrictions
  if (!hasRequiredRole(user, requiredRole)) {
    return <Route path={path} component={UnauthorizedComponent} />;
  }

  return <Route path={path} component={Component} />;
}
