import { Switch, Route } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import RegisterItem from "@/pages/register-item";
import Search from "@/pages/search";
import LostFound from "@/pages/lost-found";
import UserManagement from "@/pages/user-management";
import LandingPage from "@/pages/landing-page";
import { useAuth } from "@/hooks/use-auth";

function App() {
  return (
    <TooltipProvider>
      <Switch>
        {/* Public routes - using modal authentication on landing page */}
        <Route path="/" component={LandingPage} />
        
        {/* Protected routes with role-based access */}
        
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