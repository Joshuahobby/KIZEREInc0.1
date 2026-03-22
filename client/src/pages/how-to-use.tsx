import * as React from "react";
import { SEO } from "@/components/SEO";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function HowToUsePage() {
  const steps = [
    {
      title: "1. Create your secure account",
      description: "Sign up using your Google account or email. KIZERE uses bank-level encryption to secure your identity.",
      // Placeholder image URL for where the screenshot goes
      screenshot: "/images/localized/blog-vision.png" 
    },
    {
      title: "2. Register your first item",
      description: "Navigate to the dashboard and click 'Add Item'. Fill in details like the IMEI, serial number, and upload proof of purchase or photos.",
      screenshot: "/images/localized/blog-security.png"
    },
    {
      title: "3. Verify ownership",
      description: "For high-value items, you can request manual verification by an agent. This adds a 'Verified' badge to your asset.",
      screenshot: "/images/localized/use-case-insurance.png"
    },
    {
      title: "4. Report a lost item",
      description: "If an item goes missing, flip its status to 'Lost'. The item's details are instantly pushed to the public search index to prevent resale.",
      screenshot: "/images/localized/use-case-owner.png"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO 
        title="How to Use KIZERE | Comprehensive Guides & Screenshots"
        description="A step-by-step visual guide to protecting your devices and jewelry using the KIZERE platform."
      />
      <Header />
      
      <main className="flex-grow pt-24 pb-20">
        <section className="text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold tracking-wider uppercase mb-6">
            Visual Guide
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
            Mastering <span className="text-primary">KIZERE</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            From account creation to recovering a lost item, follow these annotated screenshots to secure what matters most.
          </p>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          {steps.map((step, idx) => (
            <div key={idx} className="relative">
              <div className="absolute -left-4 md:-left-12 top-0 bottom-0 w-8 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold z-10 shadow-lg ring-4 ring-background">
                  {idx + 1}
                </div>
                {idx !== steps.length - 1 && (
                  <div className="w-1 flex-grow bg-primary/20 my-2 rounded-full" />
                )}
              </div>

              <div className="ml-8 md:ml-4 grid md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1">
                  <h2 className="text-3xl font-bold mb-6 tracking-tight flex items-center gap-3">
                    {step.title}
                  </h2>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                  
                  <ul className="mt-8 space-y-4">
                    <li className="flex items-center gap-3 text-muted-foreground">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Fully secure end-to-end
                    </li>
                    <li className="flex items-center gap-3 text-muted-foreground">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Real-time database sync
                    </li>
                  </ul>
                </div>

                <div className="order-1 md:order-2">
                  <Card className="overflow-hidden border-border/40 shadow-2xl skew-y-1 hover:skew-y-0 transition-transform duration-500 bg-card p-2 md:p-4">
                    <div className="rounded-xl overflow-hidden bg-muted">
                      <img 
                        src={step.screenshot} 
                        alt={step.title} 
                        className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}
