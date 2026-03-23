import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, Mail, Database, Scale, Fingerprint, Lock, Globe } from "lucide-react";

export default function PrivacyPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Header />
      <main className="flex-grow py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-4xl mx-auto space-y-12">
          
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
              <ShieldCheck className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">{t('footer.privacyPolicy') || "Privacy & Data Protection Policy"}</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              This Privacy Policy explains how KIZERE collects, uses, protects, and handles your personal data in strict compliance with the Rwanda Data Protection and Privacy Law (Law No. 058/2021 of 13/10/2021).
            </p>
            <div className="text-sm font-medium text-muted-foreground/80 mt-4">
              Last Updated: March 2026
            </div>
          </div>

          <Separator className="bg-primary/20" />

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-12">
            
            <section className="bg-card p-6 md:p-8 rounded-2xl border border-border/50 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />
              <div className="flex items-center gap-3 mb-6">
                <Database className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold m-0 border-none">1. Data Controller Information</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                KIZERE INC. acts as the Data Controller for the personal data processed through our registry platform.
                We are registered in Rwanda.
              </p>
              <ul className="list-none space-y-2 mt-4 text-muted-foreground">
                <li className="flex items-center gap-2"><Globe className="h-4 w-4" /> <strong>Address:</strong> Kigali, Rwanda</li>
                <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> <strong>Data Protection Officer (DPO):</strong> dpo@kizere.rw</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Fingerprint className="h-6 w-6 text-primary" />
                2. Personal Data We Collect
              </h2>
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div className="bg-background border rounded-xl p-5 shadow-sm">
                  <h3 className="font-bold text-lg mb-2">Standard Personal Data</h3>
                  <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                    <li>Identity Data: Full name, username</li>
                    <li>Contact Data: Email address, phone number</li>
                    <li>Technical Data: IP address, browser type, device information, geolocation</li>
                    <li>Usage Data: Interaction with our platform, item registries, searches</li>
                  </ul>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 shadow-sm">
                  <h3 className="font-bold text-lg mb-2 text-primary">Sensitive Personal Data</h3>
                  <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                    <li>Government-issued Identification (NID, Passports)</li>
                    <li>Biometric Data / Selfies (used solely for identity verification)</li>
                  </ul>
                  <p className="text-sm mt-3 text-primary/80 italic">Protected by explicit consent under Art. 6.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. Purposes and Legal Basis for Processing</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We process your personal data based on the following legal grounds per Law No. 058/2021:
              </p>
              <div className="space-y-4">
                <div className="flex gap-4 p-4 border rounded-lg bg-card text-muted-foreground">
                  <div className="font-bold min-w-[120px] text-foreground">Explicit Consent</div>
                  <div>Used for processing sensitive data (ID verification), marketing, and non-essential cookies (Art. 6).</div>
                </div>
                <div className="flex gap-4 p-4 border rounded-lg bg-card text-muted-foreground">
                  <div className="font-bold min-w-[120px] text-foreground">Contract</div>
                  <div>To provide the core services of registering, finding, and returning lost items, and to manage your user account.</div>
                </div>
                <div className="flex gap-4 p-4 border rounded-lg bg-card text-muted-foreground">
                  <div className="font-bold min-w-[120px] text-foreground">Legal Obligation</div>
                  <div>To comply with statutory requirements, fraud prevention, and response to valid legal requests from Rwandan authorities.</div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Scale className="h-6 w-6 text-primary" />
                4. Your Data Subject Rights
              </h2>
              <p className="text-muted-foreground mb-4">
                Under Rwandan Law No. 058/2021, you possess the following rights regarding your personal data:
              </p>
              <ul className="grid md:grid-cols-2 gap-4 text-muted-foreground">
                <li className="bg-card p-4 rounded-lg border"><strong>Right to Information (Art. 18):</strong> Know how your data is used.</li>
                <li className="bg-card p-4 rounded-lg border"><strong>Right of Access (Art. 19):</strong> Obtain a copy of your data (available in Settings).</li>
                <li className="bg-card p-4 rounded-lg border"><strong>Right to Rectification (Art. 20):</strong> Correct inaccurate data.</li>
                <li className="bg-card p-4 rounded-lg border"><strong>Right to Erasure (Art. 21):</strong> Request deletion of your account (with 7-day grace period).</li>
                <li className="bg-card p-4 rounded-lg border"><strong>Right to Restriction (Art. 22):</strong> Temporarily halt processing.</li>
                <li className="bg-card p-4 rounded-lg border"><strong>Right to Object (Art. 23):</strong> Object to direct marketing or automated decisions.</li>
              </ul>
              <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm text-foreground">
                <strong>How to exercise these rights:</strong> You can manage your consent, download your data, restrict processing, and request account deletion directly from the <strong>Privacy & Data</strong> tab in your Account Settings. Alternatively, contact our DPO at <a href="mailto:dpo@kizere.rw" className="text-primary hover:underline">dpo@kizere.rw</a>. We will respond to requests within thirty (30) days.
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Lock className="h-6 w-6 text-primary" />
                5. Security and Data Retention
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational measures to ensure a level of security appropriate to the risk, including encryption in transit (HTTPS) and at rest, secure password hashing (scrypt), and strict Access Control (RBAC).
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                <strong>Data Retention:</strong> We keep your personal data only as long as necessary to provide our services and fulfill the purposes outlined in this policy. Upon requesting account deletion, we institute a 7-day grace period, after which your personal data is permanently anonymized or deleted from our active databases.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Cross-Border Transfers</h2>
              <p className="text-muted-foreground leading-relaxed">
                While KIZERE operates primarily in Rwanda, our cloud infrastructure (including database and media storage) may be hosted outside of Rwanda. By using our services, you consent to the transfer of your data to these secure servers. Any cross-border transfer is executed in compliance with Rwandan law, ensuring the destination provides an adequate level of data protection.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Automated Decision-Making</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may use automated decision-making processes for identity verification (e.g., verifying a selfie against an ID document). You have the right to request human intervention for these automated processes by contacting our support team or utilizing the human review option during the verification flow.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Age Restriction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our services are not directed to children under 16 without parental consent. We do not knowingly collect personal data from anyone under the age of 16 without such consent.
              </p>
            </section>

            <section className="p-6 bg-primary/5 rounded-2xl border border-primary/20 text-center">
              <h2 className="text-xl font-bold mb-2">Have a question or complaint?</h2>
              <p className="text-muted-foreground mb-4">
                If you believe your data protection rights have been violated, please contact our DPO first. You also have the right to lodge a complaint with the National Cyber Security Authority (NCSA) of Rwanda.
              </p>
              <a href="mailto:dpo@kizere.rw" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                Contact the Data Protection Officer
              </a>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
