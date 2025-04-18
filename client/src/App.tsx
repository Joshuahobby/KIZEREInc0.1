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

const HomeRoute = () => {
  const { user } = useAuth();
  
  if (user) {
    return <Dashboard />;
  }
  return <LandingPage />;
};

function App() {
  return (
    <TooltipProvider>
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route path="/" component={HomeRoute} />
        <ProtectedRoute path="/dashboard" component={Dashboard} />
        <ProtectedRoute path="/register" component={RegisterItem} />
        <ProtectedRoute path="/search" component={Search} />
        <ProtectedRoute path="/lost-found" component={LostFound} />
        <ProtectedRoute path="/user-management" component={UserManagement} />
        <Route component={NotFound} />
      </Switch>
    </TooltipProvider>
  );
}

export default App;