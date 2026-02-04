import { Switch, Route } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/lib/protected-route";
import { useEffect, lazy, Suspense } from "react";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { ErrorBoundary } from "@/components/error-boundary";
import { AuthProvider } from "@/hooks/use-auth";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

// Lazy load all pages
const LandingPage = lazy(() => import("@/pages/landing-page"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const AuthCallback = lazy(() => import("@/pages/auth-callback"));
const UnifiedDashboard = lazy(() => import("@/pages/unified-dashboard"));
const ItemRegistration = lazy(() => import("@/pages/item-registration"));
const MyItems = lazy(() => import("@/pages/my-items"));
const ItemDetail = lazy(() => import("@/pages/item-detail"));
const Search = lazy(() => import("@/pages/search"));
const LostFound = lazy(() => import("@/pages/lost-found"));
const ReportDetailPage = lazy(() => import("@/pages/report-detail"));
const ClaimDetailPage = lazy(() => import("@/pages/claim-detail"));
const UserManagement = lazy(() => import("@/pages/user-management"));
const AdminUserManagement = lazy(() => import("@/pages/admin/user-management"));
const NewUser = lazy(() => import("@/pages/admin/new-user"));
const AdminItemManagement = lazy(() => import("@/pages/admin/item-management"));
const AdminItemDetail = lazy(() => import("@/pages/admin/item-detail"));
const NewItem = lazy(() => import("@/pages/admin/new-item"));
const PaymentStatus = lazy(() => import("@/pages/payment-status"));
const PaymentHistory = lazy(() => import("@/pages/payment-history"));
const PaymentTest = lazy(() => import("@/pages/payment-test"));
const PaymentDashboard = lazy(() => import("@/pages/admin/payment-dashboard"));
const AdminDashboardClassic = lazy(() => import("@/pages/admin/dashboard"));
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard-new"));
const CommandCenter = lazy(() => import("@/pages/admin/command-center"));
const AdminReports = lazy(() => import("@/pages/admin/reports"));
const PaymentPackages = lazy(() => import("@/pages/admin/payment-packages"));
const NewPaymentPackage = lazy(() => import("@/pages/admin/payment-packages/new"));
const CreatePackage = lazy(() => import("@/pages/admin/payment-packages/create-package"));
const ProfilePage = lazy(() => import("@/pages/profile"));
const IdentityVerification = lazy(() => import("@/pages/verification-page"));
const AdminVerifications = lazy(() => import("@/pages/admin/verifications"));
const BlogPage = lazy(() => import("./pages/blog"));
const DocsPage = lazy(() => import("./pages/docs"));
const CommunityPage = lazy(() => import("./pages/community"));
const FAQPage = lazy(() => import("./pages/faqs"));
const AboutPage = lazy(() => import("./pages/about"));
const ContactPage = lazy(() => import("./pages/contact"));
const PrivacyPage = lazy(() => import("./pages/privacy"));
const TermsPage = lazy(() => import("./pages/terms"));
const NotFound = lazy(() => import("@/pages/not-found"));

function App() {
  // Handle Firebase redirect result
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const { handleRedirectResult } = await import('@/lib/firebase');
        const result = await handleRedirectResult();
        if (result && !('success' in result && result.success === false)) {
          console.log('[App] Successfully handled Firebase redirect result');
        }
      } catch (error) {
        console.error('[App] Error handling Firebase redirect:', error);
      }
    };
    
    setTimeout(() => {
      handleRedirect().catch(err => {
        console.error('[App] Unhandled error in redirect handler:', err);
      });
    }, 0);
  }, []);

  const IframeWarning = () => {
    const isIframe = window.self !== window.top;
    if (!isIframe) return null;

    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-orange-500 text-white p-2 text-center text-sm font-medium shadow-md">
        ⚠️ Preview window detected. Google Login may fail.
        <a href={window.location.href} target="_blank" rel="noopener noreferrer" className="underline ml-2 font-bold">Open in New Tab</a>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <IframeWarning />
      <LanguageProvider defaultLanguage="en">
        <AuthProvider>
          <TooltipProvider>
            <Suspense fallback={<LoadingOverlay alwaysShow={true} />}>
              <Switch>
                <Route path="/">
                  <LandingPage />
                </Route>
                <Route path="/auth-callback">
                  <AuthCallback />
                </Route>
                <Route path="/auth">
                  <AuthPage />
                </Route>
                
                {/* Protected routes */}
                <ProtectedRoute path="/dashboard" component={UnifiedDashboard} requiredRole="any" />
                <ProtectedRoute path="/register-item" component={ItemRegistration} requiredRole="any" />
                <ProtectedRoute path="/my-items" component={MyItems} requiredRole="any" />
                <ProtectedRoute path="/items/:id" component={ItemDetail} requiredRole="any" />
                <Route path="/search">
                  <Search />
                </Route>
                <ProtectedRoute path="/lost-found" component={LostFound} requiredRole="any" />
                <ProtectedRoute path="/lost-found/report" component={LostFound} requiredRole="any" />
                <ProtectedRoute path="/lost-found/report/:type" component={LostFound} requiredRole="any" />
                <ProtectedRoute path="/report/:id" component={ReportDetailPage} requiredRole="any" />
                <ProtectedRoute path="/reports/:id" component={ReportDetailPage} requiredRole="any" />
                <ProtectedRoute path="/claims/:id" component={ClaimDetailPage} requiredRole="any" />
                <ProtectedRoute path="/user-management" component={UserManagement} requiredRole="Admin" />
                
                {/* Payment routes */}
                <Route path="/payment-status">
                  <PaymentStatus />
                </Route>
                <ProtectedRoute path="/payment-history" component={PaymentHistory} requiredRole="any" />
                <ProtectedRoute path="/payment-test" component={PaymentTest} requiredRole="any" />
                
                {/* Admin routes */}
                <ProtectedRoute path="/admin" component={AdminDashboard} requiredRole="Admin" />
                <ProtectedRoute path="/admin/command-center" component={CommandCenter} requiredRole="Admin" />
                <ProtectedRoute path="/admin/classic" component={AdminDashboardClassic} requiredRole="Admin" />
                <ProtectedRoute path="/admin/payment-dashboard" component={PaymentDashboard} requiredRole="Admin" />
                <ProtectedRoute path="/admin/payment-packages" component={PaymentPackages} requiredRole="Admin" />
                <ProtectedRoute path="/admin/payment-packages/new" component={NewPaymentPackage} requiredRole="Admin" />
                <ProtectedRoute path="/admin/payment-packages/create" component={CreatePackage} requiredRole="Admin" />
                <ProtectedRoute path="/admin/users" component={AdminUserManagement} requiredRole="Admin" />
                <ProtectedRoute path="/admin/users/new" component={NewUser} requiredRole="Admin" />
                <ProtectedRoute path="/admin/item-management" component={AdminItemManagement} requiredRole="Admin" />
                <ProtectedRoute path="/admin/item-management/new" component={NewItem} requiredRole="Admin" />
                <ProtectedRoute path="/admin/item-management/:id" component={AdminItemDetail} requiredRole="Admin" />
                <ProtectedRoute path="/admin/reports" component={AdminReports} requiredRole="Admin" />
                <ProtectedRoute path="/admin/verifications" component={AdminVerifications} requiredRole="Admin" />
                
                {/* Profile route */}
                <ProtectedRoute path="/profile" component={ProfilePage} requiredRole="any" />
                <ProtectedRoute path="/identity-verification" component={IdentityVerification} requiredRole="any" />
                
                {/* Static Pages */}
                <Route path="/faq">
                  <FAQPage />
                </Route>
                <Route path="/about">
                  <AboutPage />
                </Route>
                <Route path="/contact">
                  <ContactPage />
                </Route>
                <Route path="/privacy">
                  <PrivacyPage />
                </Route>
                <Route path="/terms">
                  <TermsPage />
                </Route>
                <Route path="/blog">
                  <BlogPage />
                </Route>
                <Route path="/docs">
                  <DocsPage />
                </Route>
                <Route path="/community">
                  <CommunityPage />
                </Route>
                
                {/* 404 route */}
                <Route>
                  <NotFound />
                </Route>
              </Switch>
            </Suspense>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;