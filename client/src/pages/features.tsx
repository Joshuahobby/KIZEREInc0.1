import * as React from "react";
import { SEO } from "@/components/SEO";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Zap, Lock, Search, History, Fingerprint } from "lucide-react";

export default function FeaturesPage() {
  const features = [
    {
      icon: <ShieldCheck className="w-10 h-10 text-primary" />,
      title: "Immutable Digital Passports",
      description: "Register any item by its IMEI, VIN, or serial number. It receives a tamper-proof digital identity — permanently linked to its verified owner, impossible to alter or delete.",
    },
    {
      icon: <Search className="w-10 h-10 text-emerald-500" />,
      title: "Real-Time Matching Engine",
      description: "Lost and Found reports are continuously cross-referenced. The moment a match is detected, both the Distressed Owner and the Good Samaritan are notified instantly.",
    },
    {
      icon: <Lock className="w-10 h-10 text-amber-500" />,
      title: "Secure Claim Verification",
      description: "Fraudulent claims are blocked through a proof-of-ownership system: photo evidence, supporting documents, and moderator review for high-value items.",
    },
    {
      icon: <Fingerprint className="w-10 h-10 text-purple-500" />,
      title: "Verified Identity (KYC)",
      description: "Users can verify their government ID and complete a biometric liveness check. A verified owner and a verified Good Samaritan resolve claims faster — and with higher confidence on both sides.",
    },
    {
      icon: <History className="w-10 h-10 text-blue-500" />,
      title: "Transferable Chains of Title",
      description: "Transfer an Ownership Certificate to the new buyer instantly. The full chain of title updates permanently — giving the buyer verified proof before they leave the transaction.",
    },
    {
      icon: <Zap className="w-10 h-10 text-rose-500" />,
      title: "Theft Deterrence — Instant",
      description: "Report an item lost and it is broadcast to the public registry immediately. Instantly dangerous for thieves to attempt to pawn or sell it.",
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO 
        title="Platform Features | KIZERE Item Registry"
        description="Register, verify, and protect what you own — KIZERE gives every physical item a tamper-proof Digital Passport and a permanent chain of title."
      />
      <Header />
      
      <main className="flex-grow pt-24 pb-20">
        <section className="text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full -z-10" />
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold tracking-wider uppercase mb-6">
            The Infrastructure Behind Every Item
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Register. Verify. <br/><span className="text-gradient drop-shadow-sm">Protect.</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            Register any item. Verify any ownership claim. Transfer with a tamper-proof record. Built for everyone from an individual in Kigali to an insurer processing thousands of claims.
          </p>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <Card key={idx} className="group hover:border-primary/50 transition-colors duration-300 bg-card/50 backdrop-blur-xl border-border/50">
                <CardContent className="p-8">
                  <div className="mb-6 p-4 bg-background/80 rounded-2xl w-fit shadow-sm border border-border/50 group-hover:scale-110 transition-transform duration-500">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
