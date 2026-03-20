import * as React from "react";
import { Switch, Route } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/lib/protected-route";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { ErrorBoundary } from "@/components/error-boundary";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { ThemeProvider } from "@/components/theme-provider";
import { ChatWidget } from "@/components/chat/chat-widget";
import { GlobalNotice } from "@/components/layout/global-notice";
import { useLocation } from "wouter";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";

// Lazy load all pages
const UnifiedDashboard = React.lazy(() => import("@/pages/unified-dashboard"));
const ItemRegistration = React.lazy(() => import("@/pages/item-registration"));
const LandingPage = React.lazy(() => import("@/pages/landing-page"));
const HowItWorks = React.lazy(() => import("@/pages/how-it-works-v2"));
const AuthPage = React.lazy(() => import("@/pages/auth-page"));
const AuthCallback = React.lazy(() => import("@/pages/auth-callback"));
const MyItems = React.lazy(() => import("@/pages/my-items"));
const ItemDetail = React.lazy(() => import("@/pages/item-detail"));
const Search = React.lazy(() => import("@/pages/search"));
const ReportDetailPage = React.lazy(() => import("@/pages/report-detail"));
const ClaimDetailPage = React.lazy(() => import("@/pages/claim-detail"));
const MyClaims = React.lazy(() => import("@/pages/my-claims"));
const UserManagement = React.lazy(() => import("@/pages/user-management"));
const AdminUserManagement = React.lazy(() => import("@/pages/admin/user-management"));
const RoleManagementPage = React.lazy(() => import("@/pages/admin/role-management"));
const AuditLogsPage = React.lazy(() => import("@/pages/admin/audit-logs"));
const AdminAnalytics = React.lazy(() => import("@/pages/admin/analytics"));
const NewUser = React.lazy(() => import("@/pages/admin/new-user"));
const AdminItemManagement = React.lazy(() => import("@/pages/admin/item-management"));
const AdminItemDetail = React.lazy(() => import("@/pages/admin/item-detail"));
const NewItem = React.lazy(() => import("@/pages/admin/new-item"));
const PaymentStatus = React.lazy(() => import("@/pages/payment-status"));
const PaymentHistory = React.lazy(() => import("@/pages/payment-history"));
const PaymentTest = React.lazy(() => import("@/pages/payment-test"));
const WalletPage = React.lazy(() => import("@/pages/wallet"));
const PaymentDashboard = React.lazy(() => import("@/pages/admin/payment-dashboard"));
const CommandCenter = React.lazy(() => import("@/pages/admin/command-center"));
const AdminReports = React.lazy(() => import("@/pages/admin/reports"));
const CouponManagement = React.lazy(() => import("@/pages/admin/coupons"));
const PaymentPackages = React.lazy(() => import("@/pages/admin/payment-packages"));
const NewPaymentPackage = React.lazy(() => import("@/pages/admin/payment-packages/new"));
const CreatePackage = React.lazy(() => import("@/pages/admin/payment-packages/create-package"));
const ProfilePage = React.lazy(() => import("@/pages/profile"));
const SettingsPage = React.lazy(() => import("@/pages/settings"));
const IdentityVerification = React.lazy(() => import("@/pages/verification-page"));
const AdminVerifications = React.lazy(() => import("@/pages/admin/verifications"));
const AdminClaimsManagement = React.lazy(() => import("@/pages/admin/claims-management"));
const ClientManagement = React.lazy(() => import("@/pages/admin/client-management"));
const BlogPage = React.lazy(() => import("@/pages/blog"));
const BlogPostPage = React.lazy(() => import("@/pages/blog-post"));
const UseCasesPage = React.lazy(() => import("@/pages/use-cases"));
const HowToUsePage = React.lazy(() => import("@/pages/how-to-use"));
const FeaturesPage = React.lazy(() => import("@/pages/features"));
const DocsPage = React.lazy(() => import("@/pages/docs"));
const CommunityPage = React.lazy(() => import("@/pages/community"));
const FAQPage = React.lazy(() => import("@/pages/faqs"));
const AboutPage = React.lazy(() => import("@/pages/about"));
const ContactPage = React.lazy(() => import("@/pages/contact"));
const PrivacyPage = React.lazy(() => import("@/pages/privacy"));
const TermsPage = React.lazy(() => import("@/pages/terms"));
const Notifications = React.lazy(() => import("@/pages/notifications"));
const NotFound = React.lazy(() => import("@/pages/not-found"));

function App() {
  // Handle Firebase redirect result
  React.useEffect(() => {
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

  // Announce route changes for screen readers
  const [location] = useLocation();
  const announcerRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (announcerRef.current) {
      announcerRef.current.textContent = `Navigated to ${document.title || location}`;
    }
  }, [location]);

  return (
    <ErrorBoundary>
      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:z-[200] focus:top-2 focus:left-2 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>
      {/* Screen reader route announcer */}
      <div ref={announcerRef} aria-live="polite" aria-atomic="true" className="sr-only" role="status" />
      <IframeWarning />
      <GoogleAnalytics />
      <ThemeProvider attribute="class" defaultTheme="system" storageKey="kizere-theme" enableSystem disableTransitionOnChange>
        <LanguageProvider defaultLanguage="en">
          <TooltipProvider>
            <React.Suspense fallback={<LoadingOverlay alwaysShow={true} />}>
              <GlobalNotice />
              <main id="main-content">
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
                  <Route path="/items/:id">
                    <ItemDetail />
                  </Route>
                  <ProtectedRoute path="/items/:id/edit" component={ItemRegistration} requiredRole="any" />
                  <Route path="/search">
                    <Search />
                  </Route>
                  <Route path="/report/:id">
                    <ReportDetailPage />
                  </Route>
                  <Route path="/reports/:id">
                    <ReportDetailPage />
                  </Route>
                  <ProtectedRoute path="/my-claims" component={MyClaims} requiredRole="any" />
                  <ProtectedRoute path="/claims/:id" component={ClaimDetailPage} requiredRole="any" />
                  <ProtectedRoute path="/user-management" component={UserManagement} requiredRole="Admin" />

                  {/* Payment routes */}
                  <Route path="/payment-status">
                    <PaymentStatus />
                  </Route>
                  <ProtectedRoute path="/payment-history" component={PaymentHistory} requiredRole="any" />
                  <ProtectedRoute path="/wallet" component={WalletPage} requiredRole="any" />
                  <ProtectedRoute path="/payment-test" component={PaymentTest} requiredRole="any" />

                  {/* Admin routes - Consolidated to UnifiedDashboard */}
                  <ProtectedRoute path="/admin" component={UnifiedDashboard} requiredRole="Admin" />
                  <ProtectedRoute path="/admin/classic" component={UnifiedDashboard} requiredRole="Admin" />
                  <ProtectedRoute path="/admin/command-center" component={CommandCenter} requiredRole="Admin" />
                  <ProtectedRoute path="/admin/analytics" component={AdminAnalytics} requiredRole="Admin" />
                  <ProtectedRoute path="/admin/payment-dashboard" component={PaymentDashboard} requiredRole="Admin" />
                  <ProtectedRoute path="/admin/payment-packages" component={PaymentPackages} requiredRole="Admin" />
                  <ProtectedRoute path="/admin/payment-packages/new" component={NewPaymentPackage} requiredRole="Admin" />
                  <ProtectedRoute path="/admin/payment-packages/create" component={CreatePackage} requiredRole="Admin" />
                  <ProtectedRoute path="/admin/users" component={AdminUserManagement} requiredRole="Admin" />
                  <ProtectedRoute path="/admin/users/new" component={NewUser} requiredRole="Admin" />
                  <ProtectedRoute path="/admin/item-management" component={AdminItemManagement} requiredRole="Admin" />
                  <ProtectedRoute path="/admin/items" component={AdminItemManagement} requiredRole="Admin" />
                  <ProtectedRoute path="/admin/item-management/new" component={NewItem} requiredRole="Admin" />
                  <ProtectedRoute path="/admin/items/new" component={NewItem} requiredRole="Admin" />
                  <ProtectedRoute path="/admin/item-management/:id" component={AdminItemDetail} requiredRole="Admin" />
                  <ProtectedRoute path="/admin/items/:id" component={AdminItemDetail} requiredRole="Admin" />
                  <ProtectedRoute path="/admin/reports" component={AdminReports} requiredRole="Admin" />
                  <ProtectedRoute path="/admin/coupons" component={CouponManagement} requiredRole="Admin" />
                  <ProtectedRoute path="/admin/clients" component={ClientManagement} requiredRole="Admin" />
                  <ProtectedRoute path="/admin/verifications" component={AdminVerifications} requiredRole="Admin" />
                  <ProtectedRoute path="/admin/claims" component={AdminClaimsManagement} requiredRole="Admin" />
                  <ProtectedRoute path="/admin/item-verification" component={AdminVerifications} requiredRole="Admin" />
                  <ProtectedRoute path="/admin/user-verification" component={AdminVerifications} requiredRole="Admin" />
                  <ProtectedRoute path="/admin/roles" component={RoleManagementPage} requiredRole="Admin" />
                  <ProtectedRoute path="/admin/audit-logs" component={AuditLogsPage} requiredRole="Admin" />

                  {/* Profile route */}
                  <ProtectedRoute path="/profile" component={ProfilePage} requiredRole="any" />
                  <ProtectedRoute path="/admin/settings" component={SettingsPage} requiredRole="Admin" />
                  <ProtectedRoute path="/settings" component={SettingsPage} requiredRole="any" />
                  <ProtectedRoute path="/dashboard/notifications" component={Notifications} requiredRole="any" />
                  <ProtectedRoute path="/verification" component={IdentityVerification} requiredRole="any" />

                  {/* Static Pages */}
                  <Route path="/how-it-works">
                    <HowItWorks />
                  </Route>
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
                  <Route path="/blog/:slug">
                    <BlogPostPage />
                  </Route>
                  <Route path="/use-cases">
                    <UseCasesPage />
                  </Route>
                  <Route path="/how-to-use">
                    <HowToUsePage />
                  </Route>
                  <Route path="/features">
                    <FeaturesPage />
                  </Route>
                  <Route path="/docs">
                    <DocsPage />
                  </Route>
                  <Route path="/community">
                    <CommunityPage />
                  </Route>

                  {/* Catch-all 404 Route */}
                  <Route component={NotFound} />
                </Switch>
                <ScrollToTop />
              </main>
              <ChatWidget />
            </React.Suspense>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
