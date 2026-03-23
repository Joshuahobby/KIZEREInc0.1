import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Separator } from "@/components/ui/separator";
import { Shield, Server, FileCheck, Lock, Users, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function CompliancePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Header />
      <main className="flex-grow py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-4xl mx-auto space-y-12">
          
          <div className="text-center space-y-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4"
            >
              <Shield className="h-10 w-10 text-primary" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">Data Protection & Compliance</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              At KIZERE, safeguarding your personal data is a foundational architectural principle. We are proactively implementing robust technical and organizational measures aligned with the stringent standards of the <strong>Rwanda Data Protection and Privacy Law (Law No. 058/2021)</strong> as we systematically progress towards formal certification.
            </p>
          </div>

          <Separator className="bg-primary/20" />

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card p-6 md:p-8 rounded-2xl border shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Server className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold">1. Security Architecture</h2>
              </div>
              <ul className="space-y-3 text-muted-foreground text-sm leading-relaxed">
                <li><strong className="text-foreground">Database Security:</strong> We utilize state-of-the-art serverless PostgreSQL infrastructure. Data is strictly encrypted both in transit (TLS 1.2+) and at rest.</li>
                <li><strong className="text-foreground">Sensitive Asset Isolation:</strong> Government IDs and biometric selfies processed during identity verification are never exposed publicly. They are stored in private Cloudinary buckets and accessed exclusively backend-to-backend via short-lived, cryptographically signed URLs.</li>
                <li><strong className="text-foreground">Authentication:</strong> User passwords are mathematically protected using the memory-hard Scrypt Key Derivation Function (KDF) to prevent brute-force and dictionary attacks.</li>
                <li><strong className="text-foreground">Role-Based Access Control (RBAC):</strong> Strict logical boundaries prevent lateral data access. Administrative capabilities are tightly scoped and continuously audited.</li>
              </ul>
            </div>

            <div className="bg-card p-6 md:p-8 rounded-2xl border shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold">2. Data Subject Empowerment</h2>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                We empower you to exercise your rights under Articles 18-24 of the Law instantly through our platform interface:
              </p>
              <ul className="space-y-3 text-muted-foreground text-sm leading-relaxed">
                <li><strong className="text-foreground">Real-Time Portability:</strong> A "Download My Data" interface provides an immediate, machine-readable JSON export of your personal footprint on KIZERE.</li>
                <li><strong className="text-foreground">Right to Erasure:</strong> Initiating an account deletion triggers a structured 7-day grace period (soft delete), after which your proprietary data is irrevocably purged from active systems.</li>
                <li><strong className="text-foreground">Processing Restriction Toggles:</strong> Users can manually pause active processing of their profile data, ensuring immediate compliance without requiring prolonged email correspondence.</li>
              </ul>
            </div>

            <div className="bg-card p-6 md:p-8 rounded-2xl border shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <FileCheck className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold">3. Privacy-First Workflows</h2>
              </div>
              <ul className="space-y-3 text-muted-foreground text-sm leading-relaxed">
                <li><strong className="text-foreground">Consent Architecture:</strong> We maintain a cryptographic log of user consent for auditing purposes. Explicit Check-gates prohibit registration or document tracking without affirmative consent.</li>
                <li><strong className="text-foreground">Sensitive Data Check-gates:</strong> Separate, compartmentalized consent is mandated prior to the upload of sensitive biometric or governmental documents.</li>
                <li><strong className="text-foreground">Age Gating:</strong> Enforced checks ensure individuals beneath the age of 16 cannot register without parental authorizations.</li>
                <li><strong className="text-foreground">Cookie Management:</strong> Transparent banners govern the deployment of non-essential tracking mechanisms.</li>
              </ul>
            </div>

            <div className="bg-card p-6 md:p-8 rounded-2xl border shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold">4. Operational Governance</h2>
              </div>
              <ul className="space-y-3 text-muted-foreground text-sm leading-relaxed">
                <li><strong className="text-foreground">Internal Auditing:</strong> KIZERE generates and reviews Data Protection Impact Assessments (DPIAs) and Records of Processing Activities (ROPA) as part of its core DevSecOps pipeline.</li>
                <li><strong className="text-foreground">Incident Readiness:</strong> In the highly unlikely event of a data breach, structured algorithmic playbooks are constructed to notify the National Cyber Security Authority (NCSA) and affected Data Subjects within the 48-hour statutory window.</li>
                <li><strong className="text-foreground">DPO Function:</strong> A dedicated Data Protection Officer oversees compliance and fields inquiries from users regarding their personal data.</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center p-8 bg-muted/30 rounded-2xl border shadow-sm">
            <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Transparency & Commitment</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              This overview is designed to offer full transparency to our users and inspecting authorities regarding the substantive safeguards underlying the KIZERE platform. We are continuously enhancing our posture and engaged in the administrative process toward formal regulatory certification.
            </p>
            <div className="flex justify-center gap-4">
              <a href="/privacy" className="text-sm font-medium text-primary hover:underline transition-colors">
                Read our full Privacy Policy
              </a>
              <span className="text-muted-foreground">•</span>
              <a href="mailto:dpo@kizere.rw" className="text-sm font-medium text-primary hover:underline transition-colors">
                Contact our DPO
              </a>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
