import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { motion } from "framer-motion";
import pedestrianCrowdImage from "../assets/pedestrian_crowd.png";
import { 
  Shield, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Smartphone, 
  Users, 
  BarChart, 
  Calendar,
  Lock,
  BarChart2,
  MessageCircle,
  ArrowRight
} from "lucide-react";

export default function LandingPage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const currentDate = new Date();
  const formattedDate = new Intl.DateTimeFormat('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }).format(currentDate);

  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate("/");
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <motion.div 
                className="text-2xl font-display font-bold flex items-center gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Shield className="h-8 w-8 text-primary" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">KIZERE</span>
              </motion.div>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <motion.nav 
                className="flex items-center gap-6 font-medium"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <a 
                  href="#features" 
                  className="text-foreground/70 hover:text-primary transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Features
                </a>
                <a 
                  href="#how-it-works" 
                  className="text-foreground/70 hover:text-primary transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  How It Works
                </a>
                <a 
                  href="#testimonials" 
                  className="text-foreground/70 hover:text-primary transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Testimonials
                </a>
              </motion.nav>
            </div>
            
            <motion.div 
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ThemeToggle />
              <button 
                onClick={() => navigate("/auth")} 
                className="font-medium text-foreground/80 hover:text-primary transition-colors"
              >
                Login
              </button>
              <Button 
                onClick={() => navigate("/auth")}
                className="shadow-md hover:shadow-lg transition-shadow"
                size="sm"
              >
                Get Started
              </Button>
            </motion.div>
          </div>
        </div>
      </header>

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
                Trusted by 15,000+ users worldwide
              </motion.span>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                <motion.span 
                  className="text-gradient block"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                >
                  Secure Your
                </motion.span>
                <motion.span 
                  className="text-gradient block"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  Valuables Digitally
                </motion.span>
              </h1>
              
              <motion.p 
                className="mt-6 text-lg text-gray-700 dark:text-gray-300 max-w-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                KIZERE is your modern platform for registering, tracking, and recovering your valuable belongings with advanced technology and a supportive community.
              </motion.p>
              
              <motion.div 
                className="mt-8 flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <Button 
                  onClick={() => navigate("/auth")}
                  className="yellow-button group relative overflow-hidden h-12"
                  size="lg"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Register Now
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
                  Learn More
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
                  <span className="text-sm text-gray-600 dark:text-gray-400">Secure & Encrypted</span>
                </div>
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-primary mr-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Digital Certificates</span>
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
                    <h3 className="text-xl font-semibold text-foreground">Item Registration</h3>
                    <motion.span 
                      className="px-3 py-1 bg-green-100 dark:bg-green-900/60 text-green-800 dark:text-green-200 rounded-full text-sm font-medium"
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 1, repeat: Infinity, repeatDelay: 3 }}
                    >
                      Registered
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
                        <h4 className="font-medium text-foreground">iPhone 14 Pro</h4>
                        <p className="text-sm text-muted-foreground mt-1">Serial: IMEI493049302939</p>
                        <p className="text-sm text-muted-foreground">Registered on April 10, 2025</p>
                      </div>
                    </div>
                    
                    <div className="border-t border-border pt-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Shield className="w-5 h-5 text-primary mr-2" />
                          <span className="text-sm font-medium text-foreground">Secure Digital Certificate</span>
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
                Powerful Features
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                The Complete Solution for <span className="text-gradient">Item Management</span>
              </h2>
              <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
                KIZERE provides all the tools you need to register, protect, and recover your valuable possessions.
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
              <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">Secure Registration</h3>
              <p className="text-muted-foreground">
                Register your items securely with detailed information, photos, and unique digital certificates.
              </p>
              <div className="mt-4 flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Learn more</span>
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
              <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-red-500 transition-colors">Lost Item Reporting</h3>
              <p className="text-muted-foreground">
                Quickly report lost items and get real-time notifications when they're found by community members.
              </p>
              <div className="mt-4 flex items-center text-red-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Learn more</span>
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
              <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-blue-500 transition-colors">Advanced Search</h3>
              <p className="text-muted-foreground">
                Search through our comprehensive database to find lost items using advanced filtering options.
              </p>
              <div className="mt-4 flex items-center text-blue-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Learn more</span>
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
              <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-purple-500 transition-colors">Mobile Access</h3>
              <p className="text-muted-foreground">
                Access your digital inventory anytime, anywhere from any device with our responsive platform.
              </p>
              <div className="mt-4 flex items-center text-purple-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Learn more</span>
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
              <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-emerald-500 transition-colors">Community Network</h3>
              <p className="text-muted-foreground">
                Connect with a community committed to helping each other recover lost possessions quickly.
              </p>
              <div className="mt-4 flex items-center text-emerald-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Learn more</span>
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
              <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-amber-500 transition-colors">Intuitive Dashboard</h3>
              <p className="text-muted-foreground">
                Track your registered items, lost reports, and recovery progress through a user-friendly dashboard.
              </p>
              <div className="mt-4 flex items-center text-amber-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Learn more</span>
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
                Start Today
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                Ready to Secure Your Valuables?
              </h2>
              <p className="text-xl max-w-3xl mx-auto mb-8 text-white/80">
                Join thousands of users who trust KIZERE to keep track of their important possessions.
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
                    Create Free Account
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </motion.div>
              
              <div className="mt-6 flex items-center justify-center gap-2 text-white">
                <CheckCircle2 className="h-5 w-5 text-white" />
                <span>No credit card required. Get started in minutes.</span>
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
              <p className="text-muted-foreground text-lg">Items Registered</p>
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
              <p className="text-muted-foreground text-lg">Items Recovered</p>
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
              <p className="text-muted-foreground text-lg">Happy Users</p>
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
              <p className="text-muted-foreground text-lg">Satisfaction Rate</p>
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
                Simple Process
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                How KIZERE Works
              </h2>
              <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
                Our platform makes it easy to register, track, and recover your valuables in just a few simple steps.
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
                  src={pedestrianCrowdImage} 
                  alt="Busy pedestrian crossing with people from diverse backgrounds" 
                  className="w-full h-auto object-cover"
                  initial={{ scale: 1.1, filter: "blur(5px)" }}
                  whileInView={{ scale: 1, filter: "blur(0px)" }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-sm md:text-base font-medium">Community-powered item recovery network spanning across cities and regions</p>
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
                    <h3 className="text-xl font-bold text-foreground mb-2">Register Your Items</h3>
                    <p className="text-muted-foreground">
                      Create an account and add your valuables to your digital inventory with photos, 
                      descriptions, and unique identifiers.
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
                    <h3 className="text-xl font-bold text-foreground mb-2">Get Digital Certificates</h3>
                    <p className="text-muted-foreground">
                      Each item receives a secure digital certificate proving ownership that can be
                      transferred if the item changes hands.
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
                    <h3 className="text-xl font-bold text-foreground mb-2">Report If Lost or Found</h3>
                    <p className="text-muted-foreground">
                      Easily report items that are lost or found. Our system automatically matches 
                      reports and notifies the appropriate parties.
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
                    <h3 className="text-xl font-bold text-foreground mb-2">Recovery & Reunification</h3>
                    <p className="text-muted-foreground">
                      Connect with the finder or owner through our secure messaging system and 
                      coordinate the return of lost items safely.
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
                User Success Stories
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                What Our Users Say
              </h2>
              <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
                Hear from people who have successfully recovered their lost items with KIZERE.
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
                  <h4 className="font-medium text-foreground text-lg">James Mutembei</h4>
                  <p className="text-sm text-muted-foreground">Nairobi, Kenya</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                "I lost my laptop at the airport and thought it was gone forever. Thanks to KIZERE, someone found it and contacted me within hours!"
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
                  <h4 className="font-medium text-foreground text-lg">Florence Nkatha</h4>
                  <p className="text-sm text-muted-foreground">Mombasa, Kenya</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                "The registration process was so simple! I've cataloged all my electronics and jewelry. Now I feel much more secure about my valuables."
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
                  <h4 className="font-medium text-foreground text-lg">Robert Kabugi</h4>
                  <p className="text-sm text-muted-foreground">Nakuru, Kenya</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                "I found someone's wallet and used KIZERE to locate the owner. The platform made it easy to connect and return the wallet safely."
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
              View More Testimonials
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
                  Mobile Access
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                  Take KIZERE With You Everywhere
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Our mobile application gives you instant access to your digital inventory, allowing you to
                  report lost items or scan found items on the go. Available for iOS and Android devices.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-foreground">Scan QR codes on found items to quickly identify owners</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-foreground">Receive instant notifications about your items</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-foreground">Securely transfer ownership with just a few taps</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-foreground">Take photos and document your valuables anywhere</p>
                  </div>
                </div>
                
                <div className="mt-8 flex gap-4">
                  <button className="bg-black text-white flex items-center gap-2 px-5 py-3 rounded-lg transition-transform hover:scale-105">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path d="M17.566 11.996c-.036-2.033 1.351-3.231 1.414-3.279-1.047-1.497-2.708-1.596-3.242-1.596-1.854-.036-3.279 1.036-4.134 1.036-.893 0-2.135-1.013-3.514-1.013-1.8 0-3.455 1.05-4.379 2.674-1.879 3.279-.507 8.086 1.326 10.754.905 1.292 1.963 2.674 3.361 2.634 1.351-.036 1.879-.854 3.514-.854 1.634 0 2.101.854 3.528.828 1.465-.036 2.386-1.301 3.27-2.634 1.048-1.481 1.465-2.925 1.48-3.003-.036-.012-2.844-1.06-2.864-4.236-.021-1.327 1.097-2.634 2.24-3.311z"/>
                      <path d="M14.918 3.636c.727-.893 1.23-2.135 1.096-3.384-1.065.071-2.386.727-3.137 1.597-.69.785-1.301 2.061-1.145 3.264 1.193.089 2.404-.604 3.186-1.477z"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-xs">Download on the</div>
                      <div className="text-lg font-semibold leading-tight">App Store</div>
                    </div>
                  </button>
                  
                  <button className="bg-black text-white flex items-center gap-2 px-5 py-3 rounded-lg transition-transform hover:scale-105">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path d="M3.609 1.814 13.792 12 3.609 22.186c-.181.181-.29.423-.29.684V1.13c0 .261.109.503.29.684zm1.505-.648v21.667l11-10.833-11-10.834zm3.29 4.728 5.5 5.388 1.634-1.604L6.825 2.066l1.579 3.828zm0 12.389 1.579 3.828 9.209-9.039-1.634-1.604-9.154 6.815z"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-xs">GET IT ON</div>
                      <div className="text-lg font-semibold leading-tight">Google Play</div>
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
                    src="https://i.ibb.co/QdQDwVC/mobile-mockup.png" 
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
                Questions & Answers
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Frequently Asked Questions
              </h2>
              <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
                Get answers to common questions about KIZERE's platform.
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
                    How secure is my information?
                  </h3>
                  <p className="text-muted-foreground">
                    We use industry-standard encryption and security protocols to protect your data. 
                    Your information is only visible to you and authorized personnel in case of a recovery scenario.
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
                    What items can I register?
                  </h3>
                  <p className="text-muted-foreground">
                    You can register any valuable items including electronics, jewelry, documents, vehicles, 
                    accessories, and more. Any item with a unique identifier or distinguishing characteristics.
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
                    How does the lost and found system work?
                  </h3>
                  <p className="text-muted-foreground">
                    When you report a lost item, it's added to our database. If someone finds an item, they can report it, 
                    and our system will automatically match it with lost reports and notify the owner.
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
                  <BarChart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    Is there a limit to how many items I can register?
                  </h3>
                  <p className="text-muted-foreground">
                    Basic accounts can register up to 10 items. Premium accounts have unlimited registration capacity 
                    and additional features like priority support and advanced analytics.
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
              More Questions? Contact Us
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-grid-pattern opacity-30"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h3 className="text-2xl font-bold mb-6 text-white">KIZERE</h3>
                <p className="text-gray-400 mb-6 max-w-md">
                  The ultimate platform for item registration, lost and found management, and ownership protection.
                </p>
                <div className="flex items-center space-x-4">
                  <a href="#" className="bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors duration-200">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                    </svg>
                  </a>
                  <a href="#" className="bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors duration-200">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                  <a href="#" className="bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors duration-200">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                  </a>
                  <a href="#" className="bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors duration-200">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z" />
                    </svg>
                  </a>
                </div>
              </motion.div>
            </div>
            
            <motion.div 
              className="md:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <h4 className="text-lg font-semibold mb-6 text-white">Quick Links</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Home</a></li>
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors duration-200">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">FAQ</a></li>
              </ul>
            </motion.div>
            
            <motion.div 
              className="md:col-span-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h4 className="text-lg font-semibold mb-6 text-white">Resources</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Community</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Tutorials</a></li>
              </ul>
            </motion.div>
            
            <motion.div 
              className="md:col-span-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <h4 className="text-lg font-semibold mb-6 text-white">Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-400 group">
                  <svg className="h-5 w-5 mr-3 text-primary group-hover:text-white transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="group-hover:text-white transition-colors duration-200">support@kizere.com</span>
                </li>
                <li className="flex items-center text-gray-400 group">
                  <svg className="h-5 w-5 mr-3 text-primary group-hover:text-white transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="group-hover:text-white transition-colors duration-200">+254 712 345 678</span>
                </li>
                <li className="flex items-center text-gray-400 group">
                  <svg className="h-5 w-5 mr-3 text-primary group-hover:text-white transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="group-hover:text-white transition-colors duration-200">Nairobi, Kenya</span>
                </li>
              </ul>
            </motion.div>
          </div>
          
          <motion.div 
            className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <p className="text-gray-500">© {new Date().getFullYear()} KIZERE. All rights reserved.</p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <a href="#" className="text-gray-500 hover:text-white transition-colors duration-200 text-sm">Privacy Policy</a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors duration-200 text-sm">Terms of Service</a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors duration-200 text-sm">Cookie Policy</a>
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}