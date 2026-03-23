import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Separator } from "@/components/ui/separator";
import { FileText, ShieldAlert, Scale, AlertTriangle } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Header />
      <main className="flex-grow py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-4xl mx-auto space-y-12">
          
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
              <FileText className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">Terms of Service</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Welcome to KIZERE. Please read these Terms of Service carefully before using our platform to register properties, report lost items, or fulfill found claims.
            </p>
            <div className="text-sm font-medium text-muted-foreground/80 mt-4">
              Last Updated: March 2026
            </div>
          </div>

          <Separator className="bg-primary/20" />

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-12">

            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Scale className="h-6 w-6 text-primary" />
                1. Acceptance of Terms
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using the KIZERE Registry platform (the "Service"), developed and operated by KIZERE INC., you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions of this agreement, you may not access the Service.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                The Service is only available to individuals who are at least 16 years old. By registering, you explicitly warrant that you meet this age requirement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                KIZERE provides a centralized registry for personal items, allowing users to catalog properties (like electronics or documents) to establish a digital chain of ownership. It facilitates reporting lost items and matching them with found items aggregated by community participants, local authorities, and partner institutions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <ShieldAlert className="h-6 w-6 text-primary" />
                3. User Responsibilities & Identity Verification
              </h2>
              <ul className="list-disc pl-5 text-muted-foreground space-y-3">
                <li><strong>Accuracy of Information:</strong> You agree to provide true, accurate, current, and complete information regarding your identity and the items you register.</li>
                <li><strong>Identity Verification:</strong> Before claiming high-value items, KIZERE requires you to verify your identity utilizing government-issued documentation (e.g., Rwandan National ID, Passport) and a biometric selfie liveness check.</li>
                <li><strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials. KIZERE shall not be liable for any loss resulting from unauthorized access caused by your failure to secure your credentials.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Privacy and Data Protection</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your privacy is paramount. KIZERE processes your personal and sensitive data in strict adherence to the <strong>Rwanda Data Protection and Privacy Law (Law No. 058/2021)</strong>.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Please review our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> to understand how we collect, use, and protect your information, and how you can exercise your Data Subject Rights (such as the Right to Access, Restriction, and Erasure).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-primary" />
                5. Prohibited Conduct
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                While utilizing the Service, you exclusively agree not to:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                <li>Register items you do not legitimately own or possess lawful rights to.</li>
                <li>Submit false claims on items reported as found.</li>
                <li>Upload fraudulent, digitally altered, or stolen Identity Documents during verification.</li>
                <li>Attempt to bypass the platform's security mechanisms.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                To the maximum extent permitted by applicable Rwandan law, KIZERE INC. shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising out of your access to or inability to access the Service, or any conduct of third parties on the platform.
              </p>
            </section>

            <section className="p-6 bg-card rounded-2xl border text-center">
              <h2 className="text-xl font-bold mb-2">Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have any questions about these Terms, please contact us at:
              </p>
              <a href="mailto:support@kizere.rw" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                Contact Support
              </a>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
