import { Switch, Route } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import UnifiedDashboard from "@/pages/unified-dashboard";
import ItemRegistration from "@/pages/item-registration";
import MyItems from "@/pages/my-items";
import Search from "@/pages/search";
import LostFound from "@/pages/lost-found";
import UserManagement from "@/pages/user-management";
import AdminUserManagement from "@/pages/admin/user-management";
import NewUser from "@/pages/admin/new-user";
import AdminItemManagement from "@/pages/admin/item-management";
import AdminItemDetail from "@/pages/admin/item-detail";
import NewItem from "@/pages/admin/new-item";
import LandingPage from "@/pages/landing-page";
import AuthCallback from "@/pages/auth-callback";
import PaymentStatus from "@/pages/payment-status";
import PaymentHistory from "@/pages/payment-history";
import PaymentTest from "@/pages/payment-test";
import PaymentDashboard from "@/pages/admin/payment-dashboard";
import AdminDashboardClassic from "@/pages/admin/dashboard";
import AdminDashboard from "@/pages/admin/dashboard-new";
import CommandCenter from "@/pages/admin/command-center";
import AdminReports from "@/pages/admin/reports";
import PaymentPackages from "@/pages/admin/payment-packages";
import NewPaymentPackage from "@/pages/admin/payment-packages/new";
import ProfilePage from "@/pages/profile";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { ErrorBoundary } from "@/components/error-boundary";
import { useEffect } from "react";
import { AuthProvider } from "@/hooks/use-auth";

// Import our new transition components
import { LoadingProvider } from "@/hooks/use-loading-state";
import { RouteTransition } from "@/components/ui/route-transition";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

function App() {
  // Handle Firebase redirect result when the app loads
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const { handleRedirectResult } = await import('@/lib/firebase');
        const result = await handleRedirectResult();
        
        // Check if result is a successful login or an error object
        if (result) {
          if ('success' in result && result.success === false) {
            // This is an error result from our enhanced error handling
            console.warn('[App] Firebase redirect had an error:', result.error);
          } else {
            // This is a successful authentication result
            console.log('[App] Successfully handled Firebase redirect result');
          }
        }
      } catch (error) {
        // This catch block should never be reached due to our improved error handling,
        // but we'll keep it as a fallback
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : 'No stack trace';
        
        console.error('[App] Error handling Firebase redirect:', {
          message: errorMessage,
          stack: errorStack,
          error
        });
        
        // We don't want to show UI errors for this, as it happens on page load
        // and would be confusing to users.
        // Instead, log to monitoring/analytics in a real production environment.
      }
    };
    
    // Handle the redirect in a way that prevents unhandled promise rejections
    setTimeout(() => {
      handleRedirect().catch(err => {
        console.error('[App] Unhandled error in redirect handler:', err);
      });
    }, 0);
  }, []);

  // Create safe component wrappers to ensure JSX Elements are always returned
  const UnifiedDashboardComponent = () => <UnifiedDashboard />;
  const ItemRegistrationComponent = () => <ItemRegistration />;
  const MyItemsComponent = () => <MyItems />;
  const SearchComponent = () => <Search />;
  const LostFoundComponent = () => <LostFound />;
  const UserManagementComponent = () => <UserManagement />;
  const PaymentStatusComponent = () => <PaymentStatus />;
  const PaymentHistoryComponent = () => <PaymentHistory />;
  const PaymentTestComponent = () => <PaymentTest />;
  const AdminDashboardComponent = () => <AdminDashboard />;
  const AdminDashboardClassicComponent = () => <AdminDashboardClassic />;
  const CommandCenterComponent = () => <CommandCenter />;
  const PaymentDashboardComponent = () => <PaymentDashboard />;
  const PaymentPackagesComponent = () => <PaymentPackages />;
  const NewPaymentPackageComponent = () => <NewPaymentPackage />;
  const ProfilePageComponent = () => <ProfilePage />;
  const AdminUserManagementComponent = () => <AdminUserManagement />;
  const NewUserComponent = () => <NewUser />;
  const AdminItemManagementComponent = () => <AdminItemManagement />;
  const AdminItemDetailComponent = () => <AdminItemDetail />;
  const NewItemComponent = () => <NewItem />;
  const AdminReportsComponent = () => <AdminReports />;
  
  return (
    <ErrorBoundary>
      <LanguageProvider defaultLanguage="en">
        <AuthProvider>
          <TooltipProvider>
            <Switch>
              {/* Root path needs special handling to redirect authenticated users */}
              <Route path="/" component={LandingPage} />
              
              {/* Auth callback route for handling OAuth redirects */}
              <Route path="/auth-callback" component={AuthCallback} />
              
              {/* Protected routes with role-based access */}
              
              {/* Role-restricted routes */}
              <ProtectedRoute path="/dashboard" component={UnifiedDashboardComponent} requiredRole="any" />
              <ProtectedRoute path="/register-item" component={ItemRegistrationComponent} requiredRole="any" />
              <ProtectedRoute path="/my-items" component={MyItemsComponent} requiredRole="any" />
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
              <ProtectedRoute path="/admin/command-center" component={CommandCenterComponent} requiredRole="Admin" />
              <ProtectedRoute path="/admin/classic" component={AdminDashboardClassicComponent} requiredRole="Admin" />
              <ProtectedRoute path="/admin/payment-dashboard" component={PaymentDashboardComponent} requiredRole="Admin" />
              <ProtectedRoute path="/admin/payment-packages" component={PaymentPackagesComponent} requiredRole="Admin" />
              <ProtectedRoute path="/admin/payment-packages/new" component={NewPaymentPackageComponent} requiredRole="Admin" />
              <ProtectedRoute path="/admin/users" component={AdminUserManagementComponent} requiredRole="Admin" />
              <ProtectedRoute path="/admin/users/new" component={NewUserComponent} requiredRole="Admin" />
              <ProtectedRoute path="/admin/item-management" component={AdminItemManagementComponent} requiredRole="Admin" />
              <ProtectedRoute path="/admin/item-management/new" component={NewItemComponent} requiredRole="Admin" />
              <ProtectedRoute path="/admin/item-management/:id" component={AdminItemDetailComponent} requiredRole="Admin" />
              <ProtectedRoute path="/admin/reports" component={AdminReportsComponent} requiredRole="Admin" />
              
              {/* Profile route */}
              <ProtectedRoute path="/profile" component={ProfilePageComponent} requiredRole="any" />
              
              {/* 404 route */}
              <Route component={NotFound} />
            </Switch>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;