import { Switch, Route } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import EnhancedDashboard from "@/pages/enhanced-dashboard";
import UnifiedDashboard from "@/pages/unified-dashboard";
import RegisterItem from "@/pages/register-item";
import Search from "@/pages/search";
import LostFound from "@/pages/lost-found";
import UserManagement from "@/pages/user-management";
import LandingPage from "@/pages/landing-page";
import AuthCallback from "@/pages/auth-callback";
import PaymentStatus from "@/pages/payment-status";
import PaymentHistory from "@/pages/payment-history";
import PaymentTest from "@/pages/payment-test";
import PaymentDashboard from "@/pages/admin/payment-dashboard";
import AdminDashboard from "@/pages/admin/dashboard";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { ErrorBoundary } from "@/components/error-boundary";
import { AuthProvider } from "@/hooks/use-auth";

// Import our new transition components
import { LoadingProvider } from "@/hooks/use-loading-state";
import { RouteTransition } from "@/components/ui/route-transition";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

function App() {
  // Create safe component wrappers to ensure JSX Elements are always returned
  const DashboardComponent = () => <Dashboard />;
  const EnhancedDashboardComponent = () => <EnhancedDashboard />;
  const UnifiedDashboardComponent = () => <UnifiedDashboard />;
  const RegisterItemComponent = () => <RegisterItem />;
  const SearchComponent = () => <Search />;
  const LostFoundComponent = () => <LostFound />;
  const UserManagementComponent = () => <UserManagement />;
  const PaymentStatusComponent = () => <PaymentStatus />;
  const PaymentHistoryComponent = () => <PaymentHistory />;
  const PaymentTestComponent = () => <PaymentTest />;
  const AdminDashboardComponent = () => <AdminDashboard />;
  const PaymentDashboardComponent = () => <PaymentDashboard />;
  
  return (
    <ErrorBoundary>
      <LanguageProvider defaultLanguage="rw">
        <AuthProvider>
          <LoadingProvider>
            <TooltipProvider>
              {/* Loading overlay for page transitions */}
              <LoadingOverlay />
              
              {/* Route transition wrapper for smooth animations */}
              <RouteTransition>
                <Switch>
                  {/* Public routes - using modal authentication on landing page */}
                  <Route path="/" component={LandingPage} />
                  
                  {/* Auth callback route for handling OAuth redirects */}
                  <Route path="/auth-callback" component={AuthCallback} />
                  
                  {/* Protected routes with role-based access */}
                  
                  {/* Role-restricted routes */}
                  <ProtectedRoute path="/dashboard" component={UnifiedDashboardComponent} requiredRole="any" />
                  <ProtectedRoute path="/old-dashboard" component={DashboardComponent} requiredRole="any" />
                  <ProtectedRoute path="/enhanced-dashboard" component={EnhancedDashboardComponent} requiredRole="any" />
                  <ProtectedRoute path="/register-item" component={RegisterItemComponent} requiredRole="any" />
                  <ProtectedRoute path="/search" component={SearchComponent} requiredRole="any" />
                  <ProtectedRoute path="/lost-found" component={LostFoundComponent} requiredRole="any" />
                  <ProtectedRoute path="/lost-found/report" component={LostFoundComponent} requiredRole="any" />
                  <ProtectedRoute path="/lost-found/report/:type" component={LostFoundComponent} requiredRole="any" />
                  <ProtectedRoute path="/user-management" component={UserManagementComponent} requiredRole="Admin" />
                  
                  {/* Payment routes */}
                  <Route path="/payment-status" component={PaymentStatusComponent} />
                  <ProtectedRoute path="/payment-history" component={PaymentHistoryComponent} requiredRole="any" />
                  <ProtectedRoute path="/payment-test" component={PaymentTestComponent} requiredRole="any" />
                  
                  {/* Admin routes */}
                  <ProtectedRoute path="/admin" component={AdminDashboardComponent} requiredRole="Admin" />
                  <ProtectedRoute path="/admin/payment-dashboard" component={PaymentDashboardComponent} requiredRole="Admin" />
                  
                  {/* 404 route */}
                  <Route component={NotFound} />
                </Switch>
              </RouteTransition>
            </TooltipProvider>
          </LoadingProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;