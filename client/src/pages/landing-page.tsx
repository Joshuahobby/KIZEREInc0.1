import * as React from "react";
import { useLocation, Link } from "wouter";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { motion } from "framer-motion";
import crowdImage from "../assets/crowd.jpg";
import mobileMockupImage from "../assets/mobile-mockup.png";
import {
  Shield,
  Search,
  AlertTriangle,
  CheckCircle2,
  Smartphone,
  Users,
  BarChart2,
  Calendar,
  Lock,
  ArrowRight,
  Globe,
  Mail,
  Paperclip,
  Phone,
  ClipboardCheck,
  ShieldCheck,
  QrCode
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function LandingPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [_, navigate] = useLocation();

  // Auto-redirect if already logged in
  React.useEffect(() => {
    if (user) {
      const dashboardPath = "/dashboard"; // Default to unified dashboard
      navigate(dashboardPath);
    }
  }, [user, navigate]);
  // Animation variants
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

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": t('landing.faq.questions.security.question'),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": t('landing.faq.questions.security.answer')
        }
      },
      {
        "@type": "Question",
        "name": t('landing.faq.questions.items.question'),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": t('landing.faq.questions.items.answer')
        }
      },
      {
        "@type": "Question",
        "name": t('landing.faq.questions.lostFound.question'),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": t('landing.faq.questions.lostFound.answer')
        }
      },
      {
        "@type": "Question",
        "name": t('landing.faq.questions.limits.question'),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": t('landing.faq.questions.limits.answer')
        }
      }
    ]
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "KIZERE",
    "url": "https://kizere.rw",
    "logo": "https://kizere.rw/icons/icon-512x512.png"
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": "https://kizere.rw/",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://kizere.rw/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO schema={[orgSchema, websiteSchema, faqSchema]} />

      {/* Unified Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative pt-16 pb-12 lg:pt-20 lg:pb-16 overflow-hidden">
        {/* Ambient Dark Mode Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] md:w-[800px] h-[300px] md:h-[400px] bg-primary/10 dark:bg-primary/20 blur-[80px] md:blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[70%] md:w-[500px] h-[300px] md:h-[500px] bg-emerald-500/5 dark:bg-emerald-500/10 blur-[80px] md:blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <motion.div
              className="lg:w-1/2"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.span
                className="inline-block mb-3 px-4 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {t('landing.trustedUsers')}
              </motion.span>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
                <motion.span
                  className="text-gradient block whitespace-nowrap"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                >
                  {t('landing.heroTitle1')}
                </motion.span>
                <motion.span
                  className="text-gradient block whitespace-nowrap"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  {t('landing.heroTitle2')}
                </motion.span>
              </h1>

              <motion.p
                className="mt-6 text-lg text-muted-foreground max-w-lg font-medium"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                {t('landing.heroSubtitle')}
              </motion.p>

              {/* Added Stats to Hero */}
              <motion.div
                className="mt-12 grid grid-cols-2 sm:flex sm:flex-wrap gap-8 sm:gap-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-primary">15,000+</span>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('landing.statItems')}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-primary">1,230+</span>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('landing.statRecoveries')}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-primary">98%</span>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('landing.statSatisfaction')}</span>
                </div>
              </motion.div>

              <motion.div
                className="mt-14 flex flex-row flex-nowrap gap-4 sm:gap-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <Button
                  onClick={() => navigate("/auth?tab=register")}
                  variant="premium"
                  className="h-12 px-4 sm:px-8 flex-1 sm:flex-none whitespace-nowrap text-sm sm:text-base"
                  size="lg"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {t('landing.registerNow')}
                    <ArrowRight className="h-4 w-4 hidden sm:block group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-4 sm:px-8 flex-1 sm:flex-none whitespace-nowrap border-primary/30 hover:border-primary hover:-translate-y-1 hover:shadow-md transition-all duration-300 text-sm sm:text-base"
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {t('landing.learnMore')}
                </Button>
              </motion.div>

              <motion.div
                className="mt-12 flex flex-wrap items-center gap-8 sm:gap-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                <div className="flex items-center">
                  <Lock className="h-4 w-4 text-primary mr-1.5" />
                  <span className="text-xs text-muted-foreground/80 font-medium">{t('landing.secure')}</span>
                </div>
                <div className="flex items-center">
                  <Shield className="h-4 w-4 text-primary mr-1.5" />
                  <span className="text-xs text-muted-foreground/80 font-medium">{t('landing.digitalCertificates')}</span>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              className="lg:w-1/2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="relative">
                <div className="absolute -left-10 -top-10 w-64 h-64 bg-primary/20 rounded-full opacity-60 filter blur-3xl"></div>
                <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[var(--yellow-light)] rounded-full opacity-60 filter blur-3xl"></div>

                <motion.div
                  className="relative bg-card backdrop-blur-sm bg-opacity-95 p-5 sm:p-8 rounded-2xl shadow-xl border border-border overflow-hidden"
                  whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full"></div>
                  
                  {/* High-tech scan animation overlay */}
                  <motion.div 
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent z-20 shadow-[0_0_15px_hsl(var(--primary)/0.5)]"
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>

                  <div className="flex justify-between items-center mb-8 relative z-10">
                    <h2 className="text-xl font-semibold text-foreground">{t('landing.itemRegistration')}</h2>
                    <motion.span
                      className="px-3 py-1 bg-green-100 dark:bg-green-900/60 text-green-800 dark:text-green-200 rounded-full text-sm font-medium"
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 1, repeat: Infinity, repeatDelay: 3 }}
                    >
                      {t('landing.registered')}
                    </motion.span>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <motion.div
                        className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0"
                        whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        <Smartphone className="w-7 h-7 text-primary" />
                      </motion.div>
                      <div>
                        <h4 className="font-medium text-foreground">{t('landing.demoItem.name')}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{t('landing.demoItem.serial')}</p>
                        <p className="text-sm text-muted-foreground">{t('landing.demoItem.date')}</p>
                      </div>
                    </div>

                    <div className="border-t border-border pt-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Shield className="w-5 h-5 text-primary mr-2" />
                          <span className="text-sm font-medium text-foreground">{t('landing.demoItem.certificate')}</span>
                        </div>
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 1, delay: 1 }}
                        >
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </motion.div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 mt-6">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 1.5, delay: 0.5 }}
                        />
                      </div>
                      <span className="text-xs font-medium text-primary">100%</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Recruitment Dialog */}

      {/* Features Section */}
      <section id="features" className="py-12 md:py-16 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <span className="inline-block mb-3 px-4 py-1 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                {t('landing.powerfulFeatures')}
              </span>
              <h2 className="text-2xl md:text-4xl font-bold text-foreground">
                {t('landing.completeSolution')} <span className="text-gradient">{t('landing.itemManagement')}</span>
              </h2>
              <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
                {t('landing.kizereProvides')}
              </p>
            </motion.div>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.div
              className="group relative bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200/60 dark:border-white/10 shadow-sm transition-all duration-500 overflow-hidden hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)] dark:hover:shadow-[0_0_30px_hsl(var(--primary)/0.1)]"
              variants={itemVariants}
              whileHover={{ y: -8, transition: { type: "spring", stiffness: 200 } }}
            >
              <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">{t('landing.feature1Title')}</h3>
              <p className="text-muted-foreground">
                {t('landing.feature1Desc')}
              </p>
              <div className="mt-4 flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <span>{t('landing.learnMoreAction')}</span>
                <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </motion.div>

            <motion.div
              className="group relative bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200/60 dark:border-white/10 shadow-sm transition-all duration-500 overflow-hidden hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)] dark:hover:shadow-[0_0_30px_hsl(var(--primary)/0.1)]"
              variants={itemVariants}
              whileHover={{ y: -8, transition: { type: "spring", stiffness: 200 } }}
            >
              <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 group-hover:bg-red-500/20 transition-colors">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-red-500 transition-colors">{t('landing.feature2Title')}</h3>
              <p className="text-muted-foreground">
                {t('landing.feature2Desc')}
              </p>
              <div className="mt-4 flex items-center text-red-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <span>{t('landing.learnMoreAction')}</span>
                <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </motion.div>

            <motion.div
              className="group relative bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200/60 dark:border-white/10 shadow-sm transition-all duration-500 overflow-hidden hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)] dark:hover:shadow-[0_0_30px_hsl(var(--primary)/0.1)]"
              variants={itemVariants}
              whileHover={{ y: -8, transition: { type: "spring", stiffness: 200 } }}
            >
              <div className="h-16 w-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
                <Search className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-blue-500 transition-colors">{t('landing.feature3Title')}</h3>
              <p className="text-muted-foreground">
                {t('landing.feature3Desc')}
              </p>
              <div className="mt-4 flex items-center text-blue-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <span>{t('landing.learnMoreAction')}</span>
                <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </motion.div>

            <motion.div
              className="group relative bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200/60 dark:border-white/10 shadow-sm transition-all duration-500 overflow-hidden hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)] dark:hover:shadow-[0_0_30px_hsl(var(--primary)/0.1)]"
              variants={itemVariants}
              whileHover={{ y: -8, transition: { type: "spring", stiffness: 200 } }}
            >
              <div className="h-16 w-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
                <Smartphone className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-purple-500 transition-colors">{t('landing.feature4Title')}</h3>
              <p className="text-muted-foreground">
                {t('landing.feature4Desc')}
              </p>
              <div className="mt-4 flex items-center text-purple-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <span>{t('landing.learnMoreAction')}</span>
                <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </motion.div>

            <motion.div
              className="group relative bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200/60 dark:border-white/10 shadow-sm transition-all duration-500 overflow-hidden hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)] dark:hover:shadow-[0_0_30px_hsl(var(--primary)/0.1)]"
              variants={itemVariants}
              whileHover={{ y: -8, transition: { type: "spring", stiffness: 200 } }}
            >
              <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
                <Users className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-emerald-500 transition-colors">{t('landing.feature5Title')}</h3>
              <p className="text-muted-foreground">
                {t('landing.feature5Desc')}
              </p>
              <div className="mt-4 flex items-center text-emerald-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <span>{t('landing.learnMoreAction')}</span>
                <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </motion.div>

            <motion.div
              className="group relative bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200/60 dark:border-white/10 shadow-sm transition-all duration-500 overflow-hidden hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)] dark:hover:shadow-[0_0_30px_hsl(var(--primary)/0.1)]"
              variants={itemVariants}
              whileHover={{ y: -8, transition: { type: "spring", stiffness: 200 } }}
            >
              <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 group-hover:bg-amber-500/20 transition-colors">
                <BarChart2 className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-amber-500 transition-colors">{t('landing.feature6Title')}</h3>
              <p className="text-muted-foreground">
                {t('landing.feature6Desc')}
              </p>
              <div className="mt-4 flex items-center text-amber-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <span>{t('landing.learnMoreAction')}</span>
                <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>






      {/* How It Works Section */}
      <section id="how-it-works" className="py-12 md:py-16 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <span className="inline-block mb-3 px-4 py-1 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                {t('landing.howItWorks.simpleProcess')}
              </span>
              <h2 className="text-2xl md:text-4xl font-bold text-foreground">
                {t('landing.howItWorks.sectionTitle')}
              </h2>
              <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
                {t('landing.howItWorks.description')}
              </p>
            </motion.div>
          </div>

          <div className="relative">
            {/* Desktop Connecting Line */}
            <div className="hidden lg:block absolute top-[2.75rem] left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent z-0">
              <motion.div 
                className="absolute inset-0 bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                initial={{ width: "0%" }}
                whileInView={{ width: "100%" }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                viewport={{ once: true }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
              {[
                {
                  id: 1,
                  title: t('landing.howItWorks.step1Title'),
                  desc: t('landing.howItWorks.step1Desc'),
                  icon: ClipboardCheck,
                  delay: 0.1
                },
                {
                  id: 2,
                  title: t('landing.howItWorks.step2Title'),
                  desc: t('landing.howItWorks.step2Desc'),
                  icon: ShieldCheck,
                  delay: 0.2
                },
                {
                  id: 3,
                  title: t('landing.howItWorks.step3Title'),
                  desc: t('landing.howItWorks.step3Desc'),
                  icon: QrCode,
                  delay: 0.3
                },
                {
                  id: 4,
                  title: t('landing.howItWorks.step4Title'),
                  desc: t('landing.howItWorks.step4Desc'),
                  icon: CheckCircle2,
                  delay: 0.4
                }
              ].map((step) => (
                <motion.div
                  key={step.id}
                  className="glass group p-8 rounded-3xl border border-primary/10 hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(var(--primary),0.15)]"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: step.delay }}
                  viewport={{ once: true }}
                >
                  <div className="relative mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary relative z-10 group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                      <step.icon className="h-7 w-7" />
                    </div>
                    <div className="absolute -top-2 -left-2 text-4xl font-black text-primary/5 select-none z-0">
                      0{step.id}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </div>


          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 md:py-16 bg-background relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-transparent to-transparent"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <span className="inline-block mb-3 px-4 py-1 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                {t('landing.testimonials.sectionTitle')}
              </span>
              <h2 className="text-2xl md:text-4xl font-bold text-foreground">
                {t('landing.testimonials.mainTitle')}
              </h2>
              <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
                {t('landing.testimonials.subtitle')}
              </p>
            </motion.div>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.div
              className="bg-card p-8 rounded-xl shadow-md border border-border relative"
              variants={itemVariants}
              whileHover={{ y: -8, transition: { type: "spring", stiffness: 200 } }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-3xl"></div>
              <div className="flex items-center mb-6">
                <div className="mr-4">
                  <motion.div
                    className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center"
                    whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <span className="text-primary font-bold text-xl">JM</span>
                  </motion.div>
                </div>
                <div>
                  <h4 className="font-medium text-foreground text-lg">{t('landing.testimonials.testimonial1.name')}</h4>
                  <p className="text-sm text-muted-foreground">{t('landing.testimonials.testimonial1.location')}</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                {t('landing.testimonials.testimonial1.quote')}
              </p>
              <div className="mt-6 flex items-center text-primary">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
                <span className="ml-2 text-sm text-muted-foreground">5.0</span>
              </div>
            </motion.div>

            <motion.div
              className="group relative bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200/60 dark:border-white/10 shadow-sm transition-all duration-500 overflow-hidden hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)] dark:hover:shadow-[0_0_30px_hsl(var(--primary)/0.1)]"
              variants={itemVariants}
              whileHover={{ y: -8, transition: { type: "spring", stiffness: 200 } }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-3xl"></div>
              <div className="flex items-center mb-6">
                <div className="mr-4">
                  <motion.div
                    className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center"
                    whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <span className="text-primary font-bold text-xl">FN</span>
                  </motion.div>
                </div>
                <div>
                  <h4 className="font-medium text-foreground text-lg">{t('landing.testimonials.testimonial2.name')}</h4>
                  <p className="text-sm text-muted-foreground">{t('landing.testimonials.testimonial2.location')}</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                {t('landing.testimonials.testimonial2.quote')}
              </p>
              <div className="mt-6 flex items-center text-primary">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
                <span className="ml-2 text-sm text-muted-foreground">5.0</span>
              </div>
            </motion.div>

            <motion.div
              className="group relative bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200/60 dark:border-white/10 shadow-sm transition-all duration-500 overflow-hidden hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)] dark:hover:shadow-[0_0_30px_hsl(var(--primary)/0.1)]"
              variants={itemVariants}
              whileHover={{ y: -8, transition: { type: "spring", stiffness: 200 } }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-3xl"></div>
              <div className="flex items-center mb-6">
                <div className="mr-4">
                  <motion.div
                    className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center"
                    whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <span className="text-primary font-bold text-xl">RK</span>
                  </motion.div>
                </div>
                <div>
                  <h4 className="font-medium text-foreground text-lg">{t('landing.testimonials.testimonial3.name')}</h4>
                  <p className="text-sm text-muted-foreground">{t('landing.testimonials.testimonial3.location')}</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                {t('landing.testimonials.testimonial3.quote')}
              </p>
              <div className="mt-6 flex items-center text-primary">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
                <span className="ml-2 text-sm text-muted-foreground">5.0</span>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </section>



      {/* FAQ Section */}
      <section id="faq" className="py-12 md:py-16 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <span className="inline-block mb-3 px-4 py-1 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                {t('landing.faq.sectionTitle')}
              </span>
              <h2 className="text-2xl md:text-4xl font-bold text-foreground">
                {t('landing.faq.mainTitle')}
              </h2>
              <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
                {t('landing.faq.description')}
              </p>
            </motion.div>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.div
              className="bg-card p-8 rounded-xl shadow-md border border-border hover:shadow-xl transition-shadow"
              variants={itemVariants}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {t('landing.faq.questions.security.question')}
                  </h3>
                  <p className="text-muted-foreground">
                    {t('landing.faq.questions.security.answer')}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-card p-8 rounded-xl shadow-md border border-border hover:shadow-xl transition-shadow"
              variants={itemVariants}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {t('landing.faq.questions.items.question')}
                  </h3>
                  <p className="text-muted-foreground">
                    {t('landing.faq.questions.items.answer')}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-card p-8 rounded-xl shadow-md border border-border hover:shadow-xl transition-shadow"
              variants={itemVariants}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {t('landing.faq.questions.lostFound.question')}
                  </h3>
                  <p className="text-muted-foreground">
                    {t('landing.faq.questions.lostFound.answer')}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-card p-8 rounded-xl shadow-md border border-border hover:shadow-xl transition-shadow"
              variants={itemVariants}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <BarChart2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {t('landing.faq.questions.limits.question')}
                  </h3>
                  <p className="text-muted-foreground">
                    {t('landing.faq.questions.limits.answer')}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <div className="mt-12 text-center">
            <Button
              variant="outline"
              size="lg"
              className="border-primary/30 hover:border-primary"
              onClick={() => navigate("/contact")}
            >
              {t('landing.faq.contactUs')}
            </Button>
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="py-12 md:py-16 bg-background relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
            <div className="md:w-1/2 order-2 md:order-1">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <span className="inline-block mb-3 px-4 py-1 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                  {t('landing.mobileApp.sectionTitle')}
                </span>
                <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-6">
                  {t('landing.mobileApp.mainTitle')}
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  {t('landing.mobileApp.description')}
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-foreground">{t('landing.mobileApp.features.feature1')}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-foreground">{t('landing.mobileApp.features.feature2')}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-foreground">{t('landing.mobileApp.features.feature3')}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-foreground">{t('landing.mobileApp.features.feature4')}</p>
                  </div>
                </div>

                <div className="mt-8 flex gap-4">
                  <button className="bg-black text-white flex items-center gap-2 px-5 py-3 rounded-lg transition-transform hover:scale-105">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path d="M17.566 11.996c-.036-2.033 1.351-3.231 1.414-3.279-1.047-1.497-2.708-1.596-3.242-1.596-1.854-.036-3.279 1.036-4.134 1.036-.893 0-2.135-1.013-3.514-1.013-1.8 0-3.455 1.05-4.379 2.674-1.879 3.279-.507 8.086 1.326 10.754.905 1.292 1.963 2.674 3.361 2.634 1.351-.036 1.879-.854 3.514-.854 1.634 0 2.101.854 3.528.828 1.465-.036 2.386-1.301 3.27-2.634 1.048-1.481 1.465-2.925 1.48-3.003-.036-.012-2.844-1.06-2.864-4.236-.021-1.327 1.097-2.634 2.24-3.311z" />
                      <path d="M14.918 3.636c.727-.893 1.23-2.135 1.096-3.384-1.065.071-2.386.727-3.137 1.597-.69.785-1.301 2.061-1.145 3.264 1.193.089 2.404-.604 3.186-1.477z" />
                    </svg>
                    <div className="text-left">
                      <div className="text-xs">{t('landing.mobileApp.downloadOn')}</div>
                      <div className="text-lg font-semibold leading-tight">{t('landing.mobileApp.appStore')}</div>
                    </div>
                  </button>

                  <button className="bg-black text-white flex items-center gap-2 px-5 py-3 rounded-lg transition-transform hover:scale-105">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path d="M3.609 1.814 13.792 12 3.609 22.186c-.181.181-.29.423-.29.684V1.13c0 .261.109.503.29.684zm1.505-.648v21.667l11-10.833-11-10.834zm3.29 4.728 5.5 5.388 1.634-1.604L6.825 2.066l1.579 3.828zm0 12.389 1.579 3.828 9.209-9.039-1.634-1.604-9.154 6.815z" />
                    </svg>
                    <div className="text-left">
                      <div className="text-xs">{t('landing.mobileApp.getItOn')}</div>
                      <div className="text-lg font-semibold leading-tight">{t('landing.mobileApp.googlePlay')}</div>
                    </div>
                  </button>
                </div>
              </motion.div>
            </div>

            <div className="md:w-1/2 order-1 md:order-2 flex justify-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                animate={{ 
                  y: [0, -15, 0],
                }}
                transition={{ 
                  y: {
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  },
                  opacity: { duration: 0.8 },
                  default: { duration: 0.8 }
                }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/30 rounded-full filter blur-3xl opacity-30"></div>
                <div className="relative z-10">
                  <img
                    src={mobileMockupImage}
                    alt="KIZERE Mobile App"
                    className="max-w-full h-auto drop-shadow-2xl"
                    width={400}
                    height={800}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}