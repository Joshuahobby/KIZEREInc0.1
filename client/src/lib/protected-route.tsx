import * as React from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { User } from "@shared/schema";
import { AuthService } from "@/services/auth.service";

// Type for role requirements
type RoleRequirement = string | string[] | 'any';

// Helper component for loading with accessibility
const LoadingComponent = () => (
  <div className="flex items-center justify-center min-h-screen" role="status" aria-label="Loading page content">
    <Loader2 className="h-8 w-8 animate-spin text-primary-600" aria-hidden="true" />
    <span className="sr-only">Loading...</span>
  </div>
);

// Helper component for unauthorized access with accessibility
const UnauthorizedComponent = () => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4" role="alert">
    <h1 className="text-2xl font-bold mb-2" id="unauthorized-heading">Access Denied</h1>
    <p className="text-muted-foreground mb-4 text-center">
      You don't have the required permissions to access this page.
    </p>
    <Redirect to="/" />
  </div>
);

// Helper function to check if the user has the required role
const hasRequiredRole = (user: Omit<User, "password">, requiredRole: RoleRequirement): boolean => {
  if (requiredRole === 'any') return true;
  if (Array.isArray(requiredRole)) return requiredRole.includes(user.role);
  return user.role === requiredRole;
};

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
        <Redirect to="/" />
      </Route>
    );
  }

  // Check if the path is / and redirect to appropriate dashboard by role
  if (path === '/') {
    const dashboardPath = AuthService.getDashboardPathByRole(user.role);
    return (
      <Route path={path}>
        <Redirect to={dashboardPath} />
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
    <Route path={path} component={Component} />
  );
}
