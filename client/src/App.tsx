import { Switch, Route } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import RegisterItem from "@/pages/register-item";
import Search from "@/pages/search";
import LostFound from "@/pages/lost-found";
import UserManagement from "@/pages/user-management";
import LandingPage from "@/pages/landing-page";
import { useAuth } from "@/hooks/use-auth";

// Home route will handle unauthenticated vs authenticated users
const HomeRoute = () => {
  const { user } = useAuth();
  
  if (user) {
    // This will be handled by the ProtectedRoute with path="/"
    // which will redirect to the appropriate dashboard based on role
    return <Dashboard />;
  }
  return <LandingPage />;
};

function App() {
  return (
    <TooltipProvider>
      <Switch>
        {/* Public routes */}
        <Route path="/auth" component={AuthPage} />
        
        {/* Home route with role-based redirect */}
        <ProtectedRoute path="/" component={Dashboard} />
        
        {/* Role-restricted routes */}
        <ProtectedRoute path="/dashboard" component={Dashboard} requiredRole="Subscriber" />
        <ProtectedRoute path="/register" component={RegisterItem} requiredRole="any" />
        <ProtectedRoute path="/search" component={Search} requiredRole="any" />
        <ProtectedRoute path="/lost-found" component={LostFound} requiredRole="any" />
        <ProtectedRoute path="/user-management" component={UserManagement} requiredRole="Admin" />
        
        {/* 404 route */}
        <Route component={NotFound} />
      </Switch>
    </TooltipProvider>
  );
}

export default App;