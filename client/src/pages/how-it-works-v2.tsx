import * as React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { SEO } from "@/components/SEO";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import {
    UserPlus,
    ShieldCheck,
    QrCode,
    RefreshCw,
    ArrowRight,
    ChevronDown,
    Shield,
    Zap,
    Lock
} from "lucide-react";

export default function HowItWorks() {
    const { t } = useLanguage();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100
            }
        }
    };

    const steps = [
        {
            icon: <UserPlus className="h-8 w-8 text-primary" />,
            title: t('howItWorksPage.step1_title'),
            desc: t('howItWorksPage.step1LongDesc'),
            color: "from-blue-500/20 to-cyan-500/20"
        },
        {
            icon: <ShieldCheck className="h-8 w-8 text-primary" />,
            title: t('howItWorksPage.step2_title'),
            desc: t('howItWorksPage.step2LongDesc'),
            color: "from-indigo-500/20 to-purple-500/20"
        },
        {
            icon: <QrCode className="h-8 w-8 text-primary" />,
            title: t('howItWorksPage.step3_title'),
            desc: t('howItWorksPage.step3LongDesc'),
            color: "from-amber-500/20 to-orange-500/20"
        },
        {
            icon: <RefreshCw className="h-8 w-8 text-primary" />,
            title: t('howItWorksPage.step4_title'),
            desc: t('howItWorksPage.step4LongDesc'),
            color: "from-green-500/20 to-emerald-500/20"
        }
    ];

    const benefits = [
        {
            icon: <Shield className="h-6 w-6 text-primary" />,
            title: t('howItWorksPage.benefit1Title'),
            desc: t('howItWorksPage.benefit1Desc')
        },
        {
            icon: <Zap className="h-6 w-6 text-primary" />,
            title: t('howItWorksPage.benefit2Title'),
            desc: t('howItWorksPage.benefit2Desc')
        },
        {
            icon: <Lock className="h-6 w-6 text-primary" />,
            title: t('howItWorksPage.benefit3Title'),
            desc: t('howItWorksPage.benefit3Desc')
        }
    ];

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <SEO 
                title={`${t('howItWorksPage.processTitle')} | KIZERE`}
                description={t('howItWorksPage.processSubtitle')}
            />
            <Header />

            <main className="flex-grow">
                {/* Hero Section */}
                <section className="relative overflow-hidden pt-24 pb-20 md:pt-40 md:pb-32">
                    {/* Premium Background Effects */}
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(100%_100%_at_50%_0%,rgba(0,122,255,0.08)_0%,transparent_100%)]" />
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 opacity-30 animate-pulse-slow" />
                    <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] -z-10 opacity-20" />

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wider uppercase mb-8 backdrop-blur-md">
                                <Shield className="h-3.5 w-3.5" />
                                {t('common.brandName')} {t('common.securityLabel')}
                            </div>
                            <h1 className="text-2xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
                                <span className="text-gradient drop-shadow-sm">{t('howItWorksPage.heroTitle')}</span>
                            </h1>
                            <p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
                                {t('howItWorksPage.heroSubtitle')}
                            </p>
                            <div className="flex flex-wrap justify-center gap-4">
                                <Button 
                                    size="lg" 
                                    className="rounded-full px-8 py-7 shadow-lg shadow-primary/20 premium-button text-lg group"
                                    onClick={() => {
                                        document.getElementById('steps-section')?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                >
                                    {t('howItWorksPage.ctaButton')}
                                    <motion.div
                                        animate={{ y: [0, 5, 0] }}
                                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                    >
                                        <ChevronDown className="ml-2 h-5 w-5" />
                                    </motion.div>
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Steps Section */}
                <section id="steps-section" className="py-24 relative">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-20">
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">{t('howItWorksPage.processTitle')}</h2>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                                {t('howItWorksPage.processSubtitle')}
                            </p>
                        </div>

                        <motion.div
                            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-100px" }}
                        >
                            {steps.map((step, idx) => (
                                <motion.div
                                    key={idx}
                                    variants={itemVariants}
                                    whileHover={{ y: -8, scale: 1.02 }}
                                    className="relative group p-8 rounded-[2rem] glass border border-white/5 hover:border-primary/30 transition-all duration-500 overflow-hidden"
                                >
                                    <div className={`absolute -inset-1 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity duration-700 blur-2xl`} />

                                    <div className="relative z-10">
                                        <div className="mb-8 p-4 bg-primary/10 rounded-2xl w-fit group-hover:bg-primary/20 transition-all duration-500 group-hover:rotate-6">
                                            {step.icon}
                                        </div>
                                        <div className="absolute top-2 right-4 text-8xl font-bold text-primary/[0.03] group-hover:text-primary/[0.08] transition-all duration-700 select-none">
                                            {idx + 1}
                                        </div>
                                        <h3 className="text-2xl font-bold mb-4 tracking-tight group-hover:text-primary transition-colors">
                                            {t(`howItWorksPage.step${idx + 1}_title`)}
                                        </h3>
                                        <p className="text-muted-foreground text-base leading-relaxed font-medium">
                                            {step.desc}
                                        </p>
                                    </div>

                                    {/* Bottom underline effect */}
                                    <div className="absolute bottom-0 left-0 h-1 w-0 bg-primary group-hover:w-full transition-all duration-700 ease-in-out" />
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="py-24 relative overflow-hidden">
                    <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] -z-10 opacity-50" />
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -40 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                            >
                                <div className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-bold tracking-wider uppercase mb-6 backdrop-blur-md">
                                    {t('howItWorksPage.benefitsTitle')}
                                </div>
                                <h2 className="text-3xl md:text-5xl font-bold mb-10 tracking-tight">{t('howItWorksPage.benefitsTitle')}</h2>
                                <div className="space-y-10">
                                    {benefits.map((benefit, idx) => (
                                        <div key={idx} className="flex gap-6 group">
                                            <div className="mt-1 flex-shrink-0 p-3 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                                                {benefit.icon}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-xl mb-2 tracking-tight">{benefit.title}</h4>
                                                <p className="text-muted-foreground text-lg leading-relaxed">{benefit.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            <motion.div
                                className="relative"
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1 }}
                            >
                                <div className="aspect-square rounded-[2.5rem] overflow-hidden glass border border-white/10 shadow-3xl relative p-1">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-secondary/10" />
                                    {/* Premium Abstract UI */}
                                    <div className="absolute inset-4 rounded-[2rem] overflow-hidden bg-slate-950/40 backdrop-blur-3xl border border-white/5 p-8 flex flex-col items-center justify-center">
                                        <div className="w-24 h-24 bg-primary/20 rounded-3xl flex items-center justify-center mb-8 animate-float">
                                            <ShieldCheck className="w-12 h-12 text-primary drop-shadow-[0_0_15px_rgba(0,122,255,0.5)]" />
                                        </div>
                                        <div className="w-3/4 h-2 bg-primary/20 rounded-full mb-4" />
                                        <div className="w-1/2 h-2 bg-white/10 rounded-full mb-10" />

                                        <div className="grid grid-cols-3 gap-4 w-full">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="aspect-square rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                                    <div className="w-8 h-8 rounded-lg bg-primary/10 animate-pulse-slow" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Floating Orbs */}
                                    <div className="absolute top-10 right-10 w-20 h-20 bg-primary/40 rounded-full blur-2xl animate-pulse-slow" />
                                    <div className="absolute bottom-10 left-10 w-32 h-32 bg-secondary/30 rounded-full blur-3xl animate-pulse-slow delay-700" />
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-32 relative">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <motion.div
                            className="p-16 md:p-24 rounded-[3rem] bg-slate-950 text-white relative overflow-hidden border border-white/5 shadow-3xl"
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            {/* Abstract CTA Background */}
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/30 blur-[120px] -mr-64 -mt-64" />
                            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/20 blur-[120px] -ml-64 -mb-64 opacity-50" />
                            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xl" />

                            <div className="relative z-10 flex flex-col items-center">
                                <h2 className="text-3xl md:text-5xl font-bold mb-8 tracking-tight max-w-2xl mx-auto leading-tight">
                                    {t('howItWorksPage.ctaTitle')}
                                </h2>
                                <Link href="/auth">
                                    <Button size="lg" className="rounded-full px-12 py-8 text-xl premium-button shadow-2xl shadow-primary/40 group">
                                        {t('howItWorksPage.ctaButton')}
                                        <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                                <div className="mt-10 flex items-center gap-6 text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-primary" />
                                        <span className="text-sm font-medium">{t('common.secureLabel')}</span>
                                    </div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
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
