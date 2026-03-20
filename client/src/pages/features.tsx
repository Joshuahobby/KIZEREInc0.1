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
      description: "Create a permanent digital record for your valuables. By logging IMEI, VIN, or serial numbers, your items become inherently difficult to steal and resell.",
    },
    {
      icon: <Search className="w-10 h-10 text-emerald-500" />,
      title: "Real-Time Matching Engine",
      description: "Our advanced algorithms continuously cross-reference 'Lost' reports against 'Found' submissions, instantly notifying both parties when a match occurs.",
    },
    {
      icon: <Lock className="w-10 h-10 text-amber-500" />,
      title: "Secure Claim Verification",
      description: "We prevent fraudulent claims through a rigorous proof-of-ownership system, including photo verification, receipt uploads, and manual agent reviews for high-value assets.",
    },
    {
      icon: <Fingerprint className="w-10 h-10 text-purple-500" />,
      title: "Verified Identity (KYC)",
      description: "Users on KIZERE can choose to verify their government IDs. Dealing with verified owners and finders adds a critical layer of trust to online exchanges.",
    },
    {
      icon: <History className="w-10 h-10 text-blue-500" />,
      title: "Transferable Chains of Title",
      description: "Selling your registered laptop? Securely transfer the digital title to the new owner within the app, proving its legitimacy and boosting its resale value.",
    },
    {
      icon: <Zap className="w-10 h-10 text-rose-500" />,
      title: "Instant Public Blacklisting",
      description: "The moment you flip an item's status to 'Lost', it is broadcasted to our public search portal, making it instantly dangerous for thieves to attempt to pawn or sell it.",
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO 
        title="Platform Features | KIZERE Item Registry"
        description="Discover the powerful tools underlying the KIZERE platform, from real-time matching engines to secure digital passports."
      />
      <Header />
      
      <main className="flex-grow pt-24 pb-20">
        <section className="text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full -z-10" />
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold tracking-wider uppercase mb-6">
            Why Choose Us
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Security Meets <br/><span className="text-gradient drop-shadow-sm">Simplicity</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            Everything you need to secure your assets, prove ownership, and deter theft, all wrapped in a lightning-fast modern application.
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
