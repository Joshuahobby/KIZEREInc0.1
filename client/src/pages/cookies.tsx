import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Separator } from "@/components/ui/separator";
import { Cookie, Settings, ShieldAlert, CheckCircle } from "lucide-react";

export default function CookiePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Header />
      <main className="flex-grow py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-4xl mx-auto space-y-12">
          
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
              <Cookie className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">Cookie Policy</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              This policy explains how KIZERE systematically uses cookies and similar technologies to recognize you when you visit our platform, and how we comply with Rwanda Law No. 058/2021 regarding tracking technologies.
            </p>
            <div className="text-sm font-medium text-muted-foreground/80 mt-4">
              Last Updated: March 2026
            </div>
          </div>

          <Separator className="bg-primary/20" />

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-12">

            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-primary" />
                1. What Are Cookies?
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Cookies set by KIZERE are called "first-party cookies". Cookies set by parties other than us are called "third-party cookies". Third-party cookies enable third-party features or functionality to be provided on or through the website (e.g., analytics).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <ShieldAlert className="h-6 w-6 text-primary" />
                2. Why Do We Use Cookies?
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use first and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our platform to operate, and we refer to these as "Essential" or "Strictly Necessary" cookies. Other cookies enable us to track and target the interests of our users to enhance the experience.
              </p>

              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div className="bg-background border rounded-xl p-5 shadow-sm">
                  <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    Essential Cookies
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    These cookies are strictly necessary to provide you with services available through our platform and to use some of its features, such as access to secure secure areas (e.g., session tokens mapped to your authenticated account).
                  </p>
                  <span className="inline-block px-3 py-1 bg-muted rounded-full text-xs font-mono text-muted-foreground">connect.sid</span>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 shadow-sm">
                  <h3 className="font-bold text-lg mb-2 text-primary flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Analytics & Performance
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    These cookies collect information that is used either in aggregate form to help us understand how our platform is being used or how effective our campaigns are. <strong>Requires Explicit Consent.</strong>
                  </p>
                  <span className="inline-block px-3 py-1 bg-primary/10 rounded-full text-xs font-mono text-primary">_ga, _gid</span>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Settings className="h-6 w-6 text-primary" />
                3. How Can I Control Cookies?
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your preferences in the Cookie Consent Banner that appears upon your first visit to our platform.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                If you choose to reject cookies, you may still use our platform, although your access to some functionality and areas of our website might be functionally impaired. You can always revoke your consent by entirely clearing your browser's cookies.
              </p>
            </section>

            <section className="p-6 bg-card rounded-2xl border text-center">
              <h2 className="text-xl font-bold mb-2">Further Questions?</h2>
              <p className="text-muted-foreground mb-4">
                If you have any questions about our use of cookies or other technologies, please read our comprehensive <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> or contact our Data Protection Officer.
              </p>
              <a href="mailto:dpo@kizere.rw" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                Email dpo@kizere.rw
              </a>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
