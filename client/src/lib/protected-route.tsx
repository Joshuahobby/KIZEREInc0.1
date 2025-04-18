import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  // Helper function to always return a component
  const LoadingComponent = () => (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
    </div>
  );

  const RedirectComponent = () => <Redirect to="/auth" />;

  if (isLoading) {
    return <Route path={path} component={LoadingComponent} />;
  }

  if (!user) {
    return <Route path={path} component={RedirectComponent} />;
  }

  return <Route path={path} component={Component} />;
}
