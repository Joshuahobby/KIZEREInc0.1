import * as React from "react";
import { Switch, Route, Redirect } from "wouter";
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
import { CookieBanner } from "@/components/ui/cookie-banner";

// Lazy load all pages
// Helper to handle chunk loading errors by forcing a page reload
const lazyWithRetry = (componentImport: () => Promise<{ default: React.ComponentType<any> }>) => 
  React.lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.localStorage.getItem('page-has-been-force-refreshed') || 'false'
    );

    try {
      const component = await componentImport();
      window.localStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        // A temporary 404 for a chunk often means a new deployment happened
        window.localStorage.setItem('page-has-been-force-refreshed', 'true');
        window.location.reload();
      }
      throw error; // If reload didn't help, throw original error
    }
  });

// Lazy load all pages with retry logic
const UnifiedDashboard = lazyWithRetry(() => import("@/pages/unified-dashboard"));
const ItemRegistration = lazyWithRetry(() => import("@/pages/item-registration"));
const LandingPage = lazyWithRetry(() => import("@/pages/landing-page"));
const HowItWorks = lazyWithRetry(() => import("@/pages/how-it-works-v2"));
const AuthPage = lazyWithRetry(() => import("@/pages/auth-page"));
const ForgotPasswordPage = lazyWithRetry(() => import("@/pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazyWithRetry(() => import("@/pages/auth/ResetPasswordPage"));
const VerifyOTPPage = lazyWithRetry(() => import("@/pages/auth/verify-otp-page"));
const AuthCallback = lazyWithRetry(() => import("@/pages/auth-callback"));
const MyItems = lazyWithRetry(() => import("@/pages/my-items"));
const ItemDetail = lazyWithRetry(() => import("@/pages/item-detail"));
const Search = lazyWithRetry(() => import("@/pages/search"));
const ReportDetailPage = lazyWithRetry(() => import("@/pages/report-detail"));
const ClaimDetailPage = lazyWithRetry(() => import("@/pages/claim-detail"));
const MyClaims = lazyWithRetry(() => import("@/pages/my-claims"));
const AdminUserManagement = lazyWithRetry(() => import("@/pages/admin/user-management"));
const RoleManagementPage = lazyWithRetry(() => import("@/pages/admin/role-management"));
const AuditLogsPage = lazyWithRetry(() => import("@/pages/admin/audit-logs"));
const AdminAnalytics = lazyWithRetry(() => import("@/pages/admin/analytics"));
const NewUser = lazyWithRetry(() => import("@/pages/admin/new-user"));
const AdminItemManagement = lazyWithRetry(() => import("@/pages/admin/item-management"));
const AdminItemDetail = lazyWithRetry(() => import("@/pages/admin/item-detail"));
const NewItem = lazyWithRetry(() => import("@/pages/admin/new-item"));
const PaymentStatus = lazyWithRetry(() => import("@/pages/payment-status"));
const PaymentHistory = lazyWithRetry(() => import("@/pages/payment-history"));
const PaymentTest = lazyWithRetry(() => import("@/pages/payment-test"));
const WalletPage = lazyWithRetry(() => import("@/pages/wallet"));
const PaymentDashboard = lazyWithRetry(() => import("@/pages/admin/payment-dashboard"));
const CommandCenter = lazyWithRetry(() => import("@/pages/admin/command-center"));
const AdminReports = lazyWithRetry(() => import("@/pages/admin/reports"));
const CouponManagement = lazyWithRetry(() => import("@/pages/admin/coupons"));
const PaymentPackages = lazyWithRetry(() => import("@/pages/admin/payment-packages"));
const NewPaymentPackage = lazyWithRetry(() => import("@/pages/admin/payment-packages/new"));
const CreatePackage = lazyWithRetry(() => import("@/pages/admin/payment-packages/create-package"));
const ProfilePage = lazyWithRetry(() => import("@/pages/profile"));
const SettingsPage = lazyWithRetry(() => import("@/pages/settings"));
const IdentityVerification = lazyWithRetry(() => import("@/pages/verification-page"));
const AdminVerifications = lazyWithRetry(() => import("@/pages/admin/verifications"));
const AdminClaimsManagement = lazyWithRetry(() => import("@/pages/admin/claims-management"));
const ClientManagement = lazyWithRetry(() => import("@/pages/admin/client-management"));
const BlogPage = lazyWithRetry(() => import("@/pages/blog"));
const BlogPostPage = lazyWithRetry(() => import("@/pages/blog-post"));
const UseCasesPage = lazyWithRetry(() => import("@/pages/use-cases"));
const HowToUsePage = lazyWithRetry(() => import("@/pages/how-to-use"));
const FeaturesPage = lazyWithRetry(() => import("@/pages/features"));
const DocsPage = lazyWithRetry(() => import("@/pages/docs"));
const CommunityPage = lazyWithRetry(() => import("@/pages/community"));
const FAQPage = lazyWithRetry(() => import("@/pages/faqs"));
const AboutPage = lazyWithRetry(() => import("@/pages/about"));
const ContactPage = lazyWithRetry(() => import("@/pages/contact"));
const PrivacyPage = lazyWithRetry(() => import("@/pages/privacy"));
const TermsPage = lazyWithRetry(() => import("@/pages/terms"));
const CookiePage = lazyWithRetry(() => import("@/pages/cookies"));
const CompliancePage = lazyWithRetry(() => import("@/pages/compliance"));
const Notifications = lazyWithRetry(() => import("@/pages/notifications"));
const NotFound = lazyWithRetry(() => import("@/pages/not-found"));

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
      <div className="relative z-[100] bg-orange-500 text-white p-2 text-center text-sm font-medium shadow-md">
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
                  <Route path="/forgot-password">
                    <ForgotPasswordPage />
                  </Route>
                  <Route path="/reset-password">
                    <ResetPasswordPage />
                  </Route>
                  <Route path="/verify-2fa">
                    <VerifyOTPPage />
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
                   <Route path="/user-management">
                     <Redirect to="/admin/users" />
                   </Route>

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
                  <Route path="/cookies">
                    <CookiePage />
                  </Route>
                  <Route path="/compliance">
                    <CompliancePage />
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
              <CookieBanner />
              <ChatWidget />
            </React.Suspense>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
