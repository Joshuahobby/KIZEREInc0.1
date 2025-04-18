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

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      {/* Show landing page to non-authenticated users, dashboard to logged in users */}
      <Route path="/">
        {() => user ? <Dashboard /> : <LandingPage />}
      </Route>
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/register" component={RegisterItem} />
      <ProtectedRoute path="/search" component={Search} />
      <ProtectedRoute path="/lost-found" component={LostFound} />
      <ProtectedRoute path="/user-management" component={UserManagement} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Router />
    </TooltipProvider>
  );
}

export default App;
