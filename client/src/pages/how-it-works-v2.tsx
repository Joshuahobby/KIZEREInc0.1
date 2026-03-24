import * as React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { SEO } from "@/components/SEO";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import {
    ShieldCheck,
    Smartphone,
    Search,
    ArrowRight,
    ChevronDown,
    Lock,
    RefreshCw,
    Database,
    Zap,
    CheckCircle2
} from "lucide-react";
import { Card } from "@/components/ui/card";

export default function HowItWorks() {
    const { t } = useLanguage();

    const coreSteps = [
        {
            title: "1. Secure Identity Creation",
            subtitle: "Bank-Level Protection",
            description: "Sign up using your Google account or email. KIZERE uses advanced encryption to secure your digital identity. Only you have access to your personal data and registered assets. Our multi-factor verification ensures bad actors are kept out of the ecosystem.",
            image: "/images/localized/secure_identity.png",
            features: ["End-to-End Encryption", "Multi-Factor Protection", "Anonymous Verification"],
            icon: <Lock className="h-6 w-6 text-primary" />,
            color: "from-blue-500/20 to-cyan-500/20"
        },
        {
            title: "2. Register Your Assets",
            subtitle: "Comprehensive Digital Logging",
            description: "Log your valuable devices and items into your dashboard. Scan the unique identifiers like IMEI or serial numbers. Upload proof of purchase, photos, and warranty details. This creates a permanent, verifiable digital twin of your physical asset.",
            image: "/images/localized/asset_registration.png",
            features: ["Instant QR/Barcode Scanning", "Secure Document Vault", "Unlimited Asset Logging"],
            icon: <Smartphone className="h-6 w-6 text-primary" />,
            color: "from-amber-500/20 to-orange-500/20",
            reverse: true
        },
        {
            title: "3. Rapid Community Recovery",
            subtitle: "Public Verification & Alerts",
            description: "If an item is lost or stolen, simply change its status on your dashboard. Instant alerts sync to our global database. Anyone attempting to buy or verify the item through our public search will see it flagged as stolen, effectively killing the resale market for stolen goods.",
            image: "/images/localized/community_recovery.png",
            features: ["Public Search Registry", "Instant Flagging System", "Deters Resale"],
            icon: <Search className="h-6 w-6 text-primary" />,
            color: "from-green-500/20 to-emerald-500/20"
        }
    ];

    const techHighlights = [
        {
            icon: <Database className="h-8 w-8 text-primary" />,
            title: "Immutable Database",
            desc: "Once an item is registered and verified, its history is permanently recorded, preventing tampering."
        },
        {
            icon: <RefreshCw className="h-8 w-8 text-primary" />,
            title: "Real-Time Sync",
            desc: "Status changes (e.g., marking a phone as 'Lost') propagate to our public search endpoint instantaneously."
        },
        {
            icon: <Zap className="h-8 w-8 text-primary" />,
            title: "Open Verification",
            desc: "Our API allows unauthenticated users and authorities to instantly check if an item is safe to purchase."
        }
    ];

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <SEO 
                title={`${t('howItWorksPage.processTitle')} | KIZERE`}
                description="Discover how KIZERE's end-to-end ecosystem protects your valuable assets and securely reconnects you with what matters."
            />
            <Header />

            <main className="flex-grow">
                {/* Hero Section */}
                <section className="relative overflow-hidden pt-28 pb-24 md:pt-40 md:pb-32">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(100%_100%_at_50%_0%,rgba(0,122,255,0.08)_0%,transparent_100%)]" />
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 opacity-30 animate-pulse-slow" />
                    
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="max-w-3xl mx-auto"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wider uppercase mb-8 backdrop-blur-md">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                {t('common.brandName')} Protection Workflow
                            </div>
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
                                <span className="text-gradient drop-shadow-sm">How KIZERE Protects What Matters</span>
                            </h1>
                            <p className="text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed">
                                A comprehensive guide to our secure ecosystem. From registering your identity to recovering lost assets, KIZERE leverages cutting-edge technology to give you peace of mind.
                            </p>
                            <Button 
                                size="lg" 
                                className="rounded-full px-8 py-6 shadow-lg shadow-primary/20 premium-button text-lg group"
                                onClick={() => {
                                    document.getElementById('core-workflow')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                            >
                                Explore The Workflow
                                <motion.div
                                    animate={{ y: [0, 5, 0] }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                >
                                    <ChevronDown className="ml-2 h-5 w-5" />
                                </motion.div>
                            </Button>
                        </motion.div>
                    </div>
                </section>

                {/* Alternating Flow Section (The Core Workflow) */}
                <section id="core-workflow" className="py-24 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-32">
                        {coreSteps.map((step, idx) => (
                            <div key={idx} className={`flex flex-col gap-12 lg:gap-20 items-center ${step.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
                                {/* Text Content */}
                                <motion.div 
                                    className="flex-1 space-y-8"
                                    initial={{ opacity: 0, x: step.reverse ? 50 : -50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 0.8 }}
                                >
                                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-muted/50 border border-border">
                                        <div className="p-2 bg-primary/10 rounded-xl">
                                            {step.icon}
                                        </div>
                                        <span className="font-semibold text-primary">{step.subtitle}</span>
                                    </div>
                                    
                                    <div>
                                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
                                            {step.title}
                                        </h2>
                                        <p className="text-lg text-muted-foreground leading-relaxed">
                                            {step.description}
                                        </p>
                                    </div>
                                    
                                    <ul className="space-y-4">
                                        {step.features.map((feature, fIdx) => (
                                            <li key={fIdx} className="flex items-center gap-3 text-foreground font-medium">
                                                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                </div>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>

                                {/* Image Content */}
                                <motion.div 
                                    className="flex-1 w-full"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 0.8, delay: 0.2 }}
                                >
                                    <div className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden glass border border-white/10 shadow-3xl group">
                                        <div className={`absolute inset-0 bg-gradient-to-tr ${step.color} opacity-40 mix-blend-overlay z-10`} />
                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500 z-10" />
                                        
                                        <img 
                                            src={step.image} 
                                            alt={step.title}
                                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                                            loading="lazy"
                                        />
                                        
                                        {/* Decorative elements */}
                                        <div className="absolute top-6 right-6 w-24 h-24 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 z-20 flex items-center justify-center -rotate-12 group-hover:rotate-0 transition-transform duration-500 shadow-2xl">
                                            <div className="w-12 h-12 bg-primary/20 rounded-xl animate-pulse" />
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Technical Highlights Section */}
                <section className="py-32 relative bg-muted/30 border-y border-border/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto mb-20">
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Built on Trust & Transparency</h2>
                            <p className="text-lg text-muted-foreground">
                                Our platform leverages modern technology to ensure that your data remains secure and verification requests are processed instantly.
                            </p>
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-8">
                            {techHighlights.map((tech, idx) => (
                                <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                                >
                                    <Card className="h-full p-8 bg-background border-border shadow-lg hover:border-primary/30 transition-colors group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-10 group-hover:bg-primary/10 transition-colors" />
                                        <div className="mb-6 p-4 bg-primary/10 w-fit rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                            {tech.icon}
                                        </div>
                                        <h3 className="text-2xl font-bold mb-4">{tech.title}</h3>
                                        <p className="text-muted-foreground leading-relaxed">{tech.desc}</p>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Final CTA Section */}
                <section className="py-32 relative">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <motion.div
                            className="p-16 md:p-24 rounded-[3rem] bg-slate-950 text-white relative overflow-hidden border border-white/5 shadow-3xl"
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/30 blur-[120px] -mr-64 -mt-64" />
                            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/20 blur-[120px] -ml-64 -mb-64 opacity-50" />
                            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xl" />

                            <div className="relative z-10 flex flex-col items-center">
                                <h2 className="text-3xl md:text-5xl font-bold mb-8 tracking-tight max-w-2xl mx-auto leading-tight">
                                    Ready to Secure Your Important Assets?
                                </h2>
                                <Link href="/auth">
                                    <Button size="lg" className="rounded-full px-12 py-8 text-xl premium-button shadow-2xl shadow-primary/40 group">
                                        Create Free Account
                                        <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                                <div className="mt-10 flex flex-wrap justify-center items-center gap-6 text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-primary" />
                                        <span className="text-sm font-medium">{t('common.secureLabel')}</span>
                                    </div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700 hidden sm:block" />
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-amber-400" />
                                        <span className="text-sm font-medium">{t('landing.noCardRequired')}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
