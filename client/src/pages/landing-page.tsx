import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { motion } from "framer-motion";
import { AuthModal } from "@/components/ui/auth-modal";
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
  ArrowRight
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function LandingPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [_, navigate] = useLocation();
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");
  
  // Auto-redirect if already logged in
  useEffect(() => {
    if (user) {
      const dashboardPath = "/dashboard"; // Default to unified dashboard
      navigate(dashboardPath);
    }
  }, [user, navigate]);

  // Open auth modal with specific tab
  const openAuthModal = (tab: "login" | "register") => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };




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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authModalTab}
      />
      
      {/* Unified Header */}
      <Header />

      {/* Hero Section */}
      <section className="hero-section">
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
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                <motion.span 
                  className="text-gradient block"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                >
                  {t('landing.heroTitle1')}
                </motion.span>
                <motion.span 
                  className="text-gradient block"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  {t('landing.heroTitle2')}
                </motion.span>
              </h1>
              
              <motion.p 
                className="mt-6 text-lg text-gray-700 dark:text-gray-300 max-w-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                {t('landing.heroSubtitle')}
              </motion.p>
              
              <motion.div 
                className="mt-8 flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <Button 
                  onClick={() => openAuthModal("register")}
                  className="yellow-button group relative overflow-hidden h-12"
                  size="lg"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {t('landing.registerNow')}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="absolute inset-0 bg-[var(--yellow-accent)] group-hover:bg-[var(--yellow-hover)] transition-colors duration-300"></span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-primary/30 hover:border-primary"
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {t('landing.learnMore')}
                </Button>
              </motion.div>
              
              <motion.div
                className="mt-8 flex items-center gap-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                <div className="flex items-center">
                  <Lock className="h-5 w-5 text-primary mr-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('landing.secure')}</span>
                </div>
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-primary mr-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('landing.digitalCertificates')}</span>
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
                  className="relative bg-card backdrop-blur-sm bg-opacity-95 p-8 rounded-2xl shadow-xl border border-border overflow-hidden"
                  whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full"></div>
                  
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-semibold text-foreground">{t('landing.itemRegistration')}</h3>
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

      {/* Features Section */}
      <section id="features" className="py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <span className="inline-block mb-3 px-4 py-1 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                {t('landing.powerfulFeatures')}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
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
              className="feature-card group" 
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
              className="feature-card group" 
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
              className="feature-card group" 
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
              className="feature-card group" 
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
              className="feature-card group" 
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
              className="feature-card group" 
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

      {/* Call to Action Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700 to-primary-900"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-grid-pattern opacity-25"></div>
          <div className="h-full w-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-400/20 via-transparent to-transparent"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center">
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <span className="inline-block mb-3 px-4 py-1 rounded-full bg-white/10 text-white font-semibold text-sm">
                {t('landing.startToday')}
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                {t('landing.readyToSecure')}
              </h2>
              <p className="text-xl max-w-3xl mx-auto mb-8 text-white/80">
                {t('landing.joinThousands')}
              </p>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Button 
                  onClick={() => navigate("/auth")}
                  size="lg"
                  className="bg-[#FFDE59] hover:bg-[#FFD60A] text-[#333333] font-bold text-lg px-8 py-6 rounded-xl shadow-lg shadow-primary-900/30 group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {t('landing.createFreeAccount')}
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </motion.div>
              
              <div className="mt-6 flex items-center justify-center gap-2 text-white">
                <CheckCircle2 className="h-5 w-5 text-white" />
                <span>{t('landing.noCardRequired')}</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="bg-card p-8 rounded-2xl shadow-md border border-border hover:border-primary/30 transition-colors">
              <motion.div 
                className="text-5xl font-bold text-primary mb-2"
                initial={{ scale: 0.8 }}
                whileInView={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                viewport={{ once: true }}
              >
                15,000+
              </motion.div>
              <p className="text-muted-foreground text-lg">{t('landing.statItems')}</p>
            </div>
            
            <div className="bg-card p-8 rounded-2xl shadow-md border border-border hover:border-primary/30 transition-colors">
              <motion.div 
                className="text-5xl font-bold text-primary mb-2"
                initial={{ scale: 0.8 }}
                whileInView={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                viewport={{ once: true }}
              >
                1,230+
              </motion.div>
              <p className="text-muted-foreground text-lg">{t('landing.statRecoveries')}</p>
            </div>
            
            <div className="bg-card p-8 rounded-2xl shadow-md border border-border hover:border-primary/30 transition-colors">
              <motion.div 
                className="text-5xl font-bold text-primary mb-2"
                initial={{ scale: 0.8 }}
                whileInView={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                viewport={{ once: true }}
              >
                8,500+
              </motion.div>
              <p className="text-muted-foreground text-lg">{t('landing.statUsers')}</p>
            </div>
            
            <div className="bg-card p-8 rounded-2xl shadow-md border border-border hover:border-primary/30 transition-colors">
              <motion.div 
                className="text-5xl font-bold text-primary mb-2"
                initial={{ scale: 0.8 }}
                whileInView={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                viewport={{ once: true }}
              >
                98%
              </motion.div>
              <p className="text-muted-foreground text-lg">{t('landing.statSatisfaction')}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <span className="inline-block mb-3 px-4 py-1 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                {t('landing.howItWorks.simpleProcess')}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                {t('landing.howItWorks.sectionTitle')}
              </h2>
              <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
                {t('landing.howItWorks.description')}
              </p>
            </motion.div>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-start gap-12 md:gap-16">
            <div className="relative md:w-1/2">
              <motion.div 
                className="rounded-2xl overflow-hidden shadow-xl border border-border relative"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-primary/30 to-black/50 mix-blend-overlay z-10 dark:mix-blend-soft-light"></div>
                <motion.img 
                  src={crowdImage} 
                  alt="Busy pedestrian crossing with people from diverse backgrounds" 
                  className="w-full h-auto object-cover"
                  initial={{ scale: 1.1, filter: "blur(5px)" }}
                  whileInView={{ scale: 1, filter: "blur(0px)" }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-sm md:text-base font-medium">{t('landing.howItWorks.communityDesc')}</p>
                </div>
              </motion.div>
            </div>
            
            <div className="md:w-1/2">
              <div className="space-y-10">
                <motion.div 
                  className="flex gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{t('landing.howItWorks.step1Title')}</h3>
                    <p className="text-muted-foreground">
                      {t('landing.howItWorks.step1Desc')}
                    </p>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{t('landing.howItWorks.step2Title')}</h3>
                    <p className="text-muted-foreground">
                      {t('landing.howItWorks.step2Desc')}
                    </p>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{t('landing.howItWorks.step3Title')}</h3>
                    <p className="text-muted-foreground">
                      {t('landing.howItWorks.step3Desc')}
                    </p>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                    4
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{t('landing.howItWorks.step4Title')}</h3>
                    <p className="text-muted-foreground">
                      {t('landing.howItWorks.step4Desc')}
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white dark:bg-gray-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-background to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <span className="inline-block mb-3 px-4 py-1 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                {t('landing.testimonials.sectionTitle')}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
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
          
          <div className="mt-12 text-center">
            <Button 
              variant="outline" 
              size="lg"
              className="border-primary/30 hover:border-primary"
            >
              {t('landing.testimonials.viewMore')}
            </Button>
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="py-24 bg-white dark:bg-gray-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-gray-50 dark:from-gray-900 to-transparent"></div>
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
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
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
                      <path d="M17.566 11.996c-.036-2.033 1.351-3.231 1.414-3.279-1.047-1.497-2.708-1.596-3.242-1.596-1.854-.036-3.279 1.036-4.134 1.036-.893 0-2.135-1.013-3.514-1.013-1.8 0-3.455 1.05-4.379 2.674-1.879 3.279-.507 8.086 1.326 10.754.905 1.292 1.963 2.674 3.361 2.634 1.351-.036 1.879-.854 3.514-.854 1.634 0 2.101.854 3.528.828 1.465-.036 2.386-1.301 3.27-2.634 1.048-1.481 1.465-2.925 1.48-3.003-.036-.012-2.844-1.06-2.864-4.236-.021-1.327 1.097-2.634 2.24-3.311z"/>
                      <path d="M14.918 3.636c.727-.893 1.23-2.135 1.096-3.384-1.065.071-2.386.727-3.137 1.597-.69.785-1.301 2.061-1.145 3.264 1.193.089 2.404-.604 3.186-1.477z"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-xs">{t('landing.mobileApp.downloadOn')}</div>
                      <div className="text-lg font-semibold leading-tight">{t('landing.mobileApp.appStore')}</div>
                    </div>
                  </button>
                  
                  <button className="bg-black text-white flex items-center gap-2 px-5 py-3 rounded-lg transition-transform hover:scale-105">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path d="M3.609 1.814 13.792 12 3.609 22.186c-.181.181-.29.423-.29.684V1.13c0 .261.109.503.29.684zm1.505-.648v21.667l11-10.833-11-10.834zm3.29 4.728 5.5 5.388 1.634-1.604L6.825 2.066l1.579 3.828zm0 12.389 1.579 3.828 9.209-9.039-1.634-1.604-9.154 6.815z"/>
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
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/30 rounded-full filter blur-3xl opacity-30"></div>
                <div className="relative z-10">
                  <img 
                    src={mobileMockupImage} 
                    alt="KIZERE Mobile App" 
                    className="max-w-full h-auto drop-shadow-2xl"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <span className="inline-block mb-3 px-4 py-1 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                {t('landing.faq.sectionTitle')}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
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
              onClick={() => navigate("/auth")}
            >
              {t('landing.faq.contactUs')}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}