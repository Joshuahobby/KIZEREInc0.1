import * as React from "react";
import { useLocation } from "wouter";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { motion, Variants } from "framer-motion";
import {
  Shield,
  Search,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Globe,
  Database,
  Fingerprint
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

import heroBg from "../assets/hero-network.png";

const smoothEase = [0.16, 1, 0.3, 1];

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: smoothEase } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.05 } }
};

export default function LandingPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [_, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleVerifySearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/verify-item?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(`/verify-item`);
    }
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
    <div className="min-h-screen flex flex-col font-sans bg-[#0B0F1A] text-white selection:bg-[#2563EB]/30 overflow-x-hidden w-full">
        <SEO schema={[orgSchema, websiteSchema]} title="KIZERE | The Identity of Things" description="Register, verify, and protect what you own — instantly." />
        
        <div className="dark">
            <Header />
        </div>

        {/* HERO SECTION Mobile-First */}
        <section className="relative pt-24 pb-16 md:pt-32 md:pb-32 overflow-hidden flex items-center min-h-[85vh] md:min-h-[90vh]">
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[#0B0F1A] z-10 opacity-95 md:opacity-90 backdrop-blur-3xl md:backdrop-blur-3xl"></div>
                
                {/* Subtle slow background pan - reduced opacity on mobile for performance */}
                <motion.div 
                    animate={{ scale: [1, 1.05, 1], opacity: [0.05, 0.08, 0.05] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0"
                >
                    <img src={heroBg} alt="Digital Identity Network" className="w-full h-full object-cover object-center mix-blend-screen blur-md md:blur-lg" loading="lazy" />
                </motion.div>
                <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-[#0B0F1A] via-[#0B0F1A]/70 to-transparent z-10"></div>
            </div>

            {/* Glowing Orbs - optimized for mobile rendering (hidden or simplified) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[800px] md:h-[500px] bg-[#2563EB]/10 md:bg-[#2563EB]/15 rounded-full blur-[100px] md:blur-[150px] pointer-events-none z-0" />
            <div className="hidden md:block absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-400/10 rounded-full blur-[100px] pointer-events-none z-0" />

            <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-20 w-full flex flex-col items-center">
                <div className="w-full max-w-4xl mx-auto text-center mt-4 md:mt-12">
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate="show"
                    >
                        <motion.div variants={fadeInUp} className="flex flex-col items-center">
                            {/* Responsive Typography: smaller on mobile, massive on desktop */}
                            <h1 className="text-[2.75rem] leading-[1.1] sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tight md:tracking-tighter text-white mb-4 md:mb-6">
                                The Identity <br className="md:hidden" />
                                <span className="hidden md:inline"> of </span>
                                <span className="md:hidden text-gray-300">of </span> 
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-cyan-400">Things.</span>
                            </h1>
                            <p className="mt-2 md:mt-6 text-base sm:text-lg md:text-2xl text-gray-400 max-w-[280px] sm:max-w-xl md:max-w-2xl mx-auto font-medium leading-relaxed tracking-wide">
                                Register, verify, and protect what you own — instantly.
                            </p>
                        </motion.div>

                        {/* Search Bar: Stacked on mobile, row on tablet/desktop */}
                        <motion.div variants={fadeInUp} className="mt-10 md:mt-14 w-full max-w-2xl mx-auto">
                            <div className="relative group w-full">
                                <div className="hidden md:block absolute -inset-1 bg-gradient-to-r from-[#2563EB] to-cyan-400 rounded-2xl blur opacity-25 group-hover:opacity-40 group-focus-within:opacity-50 transition-all duration-500"></div>
                                
                                <form onSubmit={handleVerifySearch} className="relative flex flex-col sm:flex-row bg-[#111827] sm:bg-[#111827]/90 border border-white/10 group-focus-within:border-cyan-500/50 rounded-2xl p-2 md:p-2 sm:shadow-2xl sm:backdrop-blur-xl transition-colors duration-300 gap-2 sm:gap-0 w-full">
                                    <div className="flex items-center flex-1 w-full bg-[#1F2937]/50 sm:bg-transparent rounded-xl sm:rounded-none px-2 h-14 sm:h-auto border border-white/5 sm:border-0">
                                        <Search className="w-5 h-5 md:w-6 md:h-6 text-gray-400 ml-2 mr-3 group-focus-within:text-cyan-400 transition-colors shrink-0" />
                                        <Input
                                            type="text"
                                            placeholder="Enter Tag ID or Serial Number..."
                                            className="flex-1 bg-transparent border-0 text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 text-base md:text-lg h-full p-0 w-full truncate"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto sm:ml-2 shrink-0">
                                        <Button
                                            type="submit"
                                            className="w-full sm:w-auto h-14 px-8 rounded-xl bg-gradient-to-b from-[#3B82F6] to-[#2563EB] hover:from-[#60A5FA] hover:to-[#3B82F6] border border-white/10 text-white font-bold text-base md:text-lg transition-colors shadow-lg shadow-blue-900/40 sm:shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                                        >
                                            Verify
                                        </Button>
                                    </motion.div>
                                </form>
                                <div className="mt-4 md:mt-5 text-xs md:text-sm text-gray-400 font-medium px-2">
                                    Try: <button type="button" onClick={() => setSearchQuery("MacBook Pro - SN: C02X1234")} className="text-cyan-400 hover:text-cyan-300 active:text-cyan-500 underline decoration-cyan-400/30 underline-offset-4 transition-colors p-1 -m-1 ml-1 touch-manipulation">MacBook Pro – SN: C02X1234</button>
                                </div>
                            </div>
                        </motion.div>

                        {/* CTAs: Vertical stack on mobile with proper spacing */}
                        <motion.div variants={fadeInUp} className="mt-12 md:mt-14 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 md:gap-5 w-full max-w-sm sm:max-w-none mx-auto">
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                                <Button
                                    onClick={() => navigate("/auth?tab=register")}
                                    size="lg"
                                    className="h-14 md:h-14 px-10 text-base md:text-lg rounded-xl bg-white text-[#0B0F1A] hover:bg-gray-100/90 hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] font-black w-full transition-all duration-300 shadow-md"
                                >
                                    Get Started
                                </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                                <Button
                                    onClick={() => document.getElementById('future-vision')?.scrollIntoView({ behavior: 'smooth' })}
                                    variant="outline"
                                    size="lg"
                                    className="h-14 md:h-14 px-10 text-base md:text-lg rounded-xl border-white/20 text-white hover:bg-white/5 hover:border-white/40 font-bold w-full backdrop-blur-sm transition-all duration-300"
                                >
                                    Learn More
                                </Button>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>

        {/* TRUST STRIP: Horizontal scroll on mobile to save vertical space and feel app-like */}
        <section className="border-y border-white/10 bg-[#0d1323]/80 backdrop-blur-md py-6 md:py-8 relative z-20 w-full overflow-hidden">
            <div className="w-full overflow-x-auto snap-x hide-scroll-bar overscroll-x-contain pb-2 md:pb-0 px-5 sm:px-6 lg:px-8">
                <div className="flex flex-row md:justify-center items-center gap-8 lg:gap-32 min-w-max md:min-w-0 mx-auto">
                    
                    <div className="flex flex-row items-center gap-6 md:gap-16 opacity-90 pl-1 md:pl-0">
                        <div className="flex items-center gap-2.5 group snap-center cursor-default shrink-0">
                            <Lock className="w-5 h-5 md:w-6 md:h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                            <span className="text-sm md:text-lg font-bold tracking-widest uppercase text-gray-200">Secure</span>
                        </div>
                        <div className="flex items-center gap-2.5 group snap-center cursor-default shrink-0">
                            <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-[#2563EB] group-hover:scale-110 transition-transform" />
                            <span className="text-sm md:text-lg font-bold tracking-widest uppercase text-gray-200">Verifiable</span>
                        </div>
                        <div className="flex items-center gap-2.5 group snap-center cursor-default shrink-0">
                            <Globe className="w-5 h-5 md:w-6 md:h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                            <span className="text-sm md:text-lg font-bold tracking-widest uppercase text-gray-200">Transferable</span>
                        </div>
                    </div>

                    <div className="hidden md:block w-px h-10 bg-white/10 shrink-0"></div>
                    <div className="md:hidden w-px h-8 bg-white/10 shrink-0 opacity-50 ml-2"></div>
                    
                    <div className="flex items-center gap-3 text-gray-400 snap-center pr-5 md:pr-0 shrink-0 cursor-default">
                        <div className="flex -space-x-2 md:-space-x-3 shrink-0">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#111827] flex items-center justify-center border-2 border-[#0B0F1A] shadow-inner text-[10px] md:text-xs font-bold text-gray-300">JD</div>
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#1E3A8A] flex items-center justify-center border-2 border-[#0B0F1A] shadow-inner text-[10px] md:text-xs font-bold text-white relative z-10 transition-transform hover:scale-110 hover:z-20">MK</div>
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#0E7490] flex items-center justify-center border-2 border-[#0B0F1A] shadow-inner text-[10px] md:text-xs font-bold text-white relative z-0 transition-transform hover:scale-110 hover:z-20">RN</div>
                        </div>
                        <span className="text-xs md:text-sm font-medium leading-tight whitespace-nowrap">Trusted by individuals<br/><span className="text-gray-300">across Rwanda</span></span>
                    </div>
                </div>
            </div>
            {/* Custom CSS to hide scrollbar cross browser */}
            <style dangerouslySetInnerHTML={{__html: `
                .hide-scroll-bar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .hide-scroll-bar::-webkit-scrollbar {
                    display: none;
                }
            `}} />
        </section>

        {/* HOW IT WORKS: Stacked vertically on mobile, heavy padding, distinct cards */}
        <section className="py-20 md:py-32 relative z-20 bg-gradient-to-b from-[#0B0F1A] to-[#0A0D14] w-full">
            <div className="hidden md:block absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
            <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-12 md:mb-20">
                    <motion.div
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeInUp}
                    >
                        <h2 className="text-[2.25rem] leading-tight md:text-5xl font-black text-white mb-4 md:mb-6 tracking-tight">How It Works</h2>
                        <p className="text-gray-400 text-base md:text-xl max-w-sm sm:max-w-2xl mx-auto leading-relaxed">Four seamless steps to absolute digital ownership and verifiable truth.</p>
                    </motion.div>
                </div>

                <motion.div 
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-8"
                >
                    {[
                        { step: "01", title: "Register", desc: "Add item in seconds", icon: Database },
                        { step: "02", title: "Verify", desc: "Secure digital proof", icon: Fingerprint },
                        { step: "03", title: "Tag", desc: "QR or digital ID", icon: QrCode },
                        { step: "04", title: "Recover", desc: "Get it back if lost", icon: ArrowRight }
                    ].map((item, idx) => (
                        <motion.div 
                            variants={fadeInUp}
                            key={idx} 
                            className="group relative p-6 md:p-8 rounded-[1.75rem] md:rounded-3xl bg-[#111827]/70 md:bg-[#111827]/40 backdrop-blur-md border border-white/5 hover:border-cyan-400/40 hover:bg-[#111827] transition-all duration-300 md:hover:-translate-y-1.5 hover:shadow-[0_10px_30px_-10px_rgba(34,211,238,0.15)] overflow-hidden flex flex-col items-start cursor-default active:scale-[0.98] md:active:scale-100"
                        >
                            <div className="absolute inset-x-0 bottom-0 h-1 md:h-[2px] bg-gradient-to-r from-[#2563EB] to-cyan-400 opacity-20 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300"></div>
                            
                            <div className="absolute -top-6 -right-6 md:-top-10 md:-right-10 text-8xl md:text-9xl font-black text-white/[0.02] md:group-hover:text-cyan-400/[0.04] transition-colors duration-500 pointer-events-none">{item.step}</div>
                            
                            <div className="relative z-10 w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#2563EB]/15 border border-[#2563EB]/25 flex items-center justify-center mb-6 md:mb-8 md:group-hover:scale-[1.05] transition-all shadow-inner">
                                <item.icon className="w-7 h-7 md:w-8 md:h-8 text-blue-400 md:group-hover:text-cyan-300" strokeWidth={2.5} />
                            </div>
                            
                            <div className="relative z-10">
                                <h3 className="text-xl md:text-2xl font-bold text-white mb-2 md:md-3 group-hover:text-cyan-300 transition-colors">{item.title}</h3>
                                <p className="text-gray-400 font-medium text-sm md:text-lg leading-snug">{item.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>

        {/* VALUE SECTION - Stack text ABOVE product mockup explicitly on mobile */}
        <section className="py-20 md:py-32 relative z-20 bg-[#0B0F1A] border-y border-white/5 w-full flex flex-col items-center">
            <div className="hidden md:block absolute top-1/2 right-0 w-[600px] h-[600px] bg-[#2563EB]/10 rounded-full blur-[150px] pointer-events-none -translate-y-1/2"></div>
            
            <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10 w-full">
                <div className="flex flex-col lg:flex-row gap-16 md:gap-20 items-center justify-between">
                    
                    {/* Text block: centered on mobile, left aligned on desktop */}
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-50px" }}
                        className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left"
                    >
                        <motion.h2 variants={fadeInUp} className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 md:mb-10 leading-[1.1] tracking-tighter">
                            Own What <br className="hidden md:block"/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-[#2563EB]">Matters.</span>
                        </motion.h2>
                        
                        <motion.div variants={fadeInUp} className="w-16 md:w-20 h-1.5 bg-gradient-to-r from-[#2563EB] to-cyan-400 rounded-full mb-8 md:mb-10"></motion.div>
                        
                        <div className="space-y-6 md:space-y-8 w-full max-w-sm sm:max-w-md mx-auto lg:mx-0">
                            {[
                                { text: "Prevent theft", icon: Shield, desc: "Deter theft by giving items a global digital footprint." },
                                { text: "Prove ownership", icon: CheckCircle2, desc: "Access verified digital certificates anywhere." },
                                { text: "Transfer safely", icon: Lock, desc: "Buy and sell securely with a tamper-proof history." }
                            ].map((item, idx) => (
                                <motion.div variants={fadeInUp} key={idx} className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-5 group cursor-default text-center sm:text-left">
                                    <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#111827] flex items-center justify-center border border-white/10 shrink-0 shadow-md sm:mt-1">
                                        <item.icon className="w-5 h-5 md:w-6 md:h-6 text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl md:text-2xl text-gray-100 font-bold mb-1.5">{item.text}</h4>
                                        <p className="text-gray-400 text-sm md:text-lg leading-snug">{item.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                    
                    {/* Premium Product UI Mockup - Dominant on Mobile */}
                    <div className="w-full lg:w-1/2 flex items-center justify-center">
                        <div className="relative w-full max-w-[480px] min-h-[480px] md:h-[650px] rounded-[2rem] md:rounded-[2.5rem] border border-white/5 bg-[#0B0F1A] shadow-xl md:shadow-[0_0_80px_rgba(37,99,235,0.05)] flex items-center justify-center p-4 md:p-8 overflow-hidden group">
                            
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] md:w-[400px] md:h-[400px] bg-cyan-500/10 blur-[80px] rounded-full"></div>
                            
                            {/* Inner mockup card scales nicely via w-full */}
                            <motion.div 
                                className="relative w-full bg-[#111827]/90 backdrop-blur-3xl rounded-3xl md:rounded-[2rem] border border-white/10 p-5 md:p-8 shadow-2xl flex flex-col z-10 mx-auto"
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.6, ease: smoothEase, delay: 0.1 }}
                                animate={{ y: [0, -4, 0] }} // Reduced float distance for mobile stability
                            >
                                {/* Card Header */}
                                <div className="flex justify-between items-start mb-6 md:mb-8">
                                    <div className="pr-4">
                                        <div className="flex items-center gap-2 mb-2 md:mb-3">
                                            <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] px-1 relative shrink-0">
                                                <div className="absolute inset-0 bg-cyan-400 rounded-full animate-ping opacity-60"></div>
                                            </div>
                                            <span className="text-[10px] md:text-sm font-bold text-cyan-400 uppercase tracking-widest truncate">Protected Status</span>
                                        </div>
                                        <h3 className="text-2xl md:text-3xl font-black text-white mb-1 tracking-tight leading-tight">MacBook Pro M3</h3>
                                        <p className="text-xs md:text-sm text-gray-400 font-mono tracking-wider">SN: C02X123</p>
                                    </div>
                                    <div className="hidden sm:flex p-2 md:p-3 bg-[#111827] rounded-2xl border border-white/10 shrink-0">
                                        <QrCode className="w-8 h-8 md:w-12 md:h-12 text-white opacity-80" />
                                    </div>
                                </div>
                                
                                <div className="h-px w-full bg-white/10 my-4 md:my-6"></div>
                                
                                {/* Owner Info block */}
                                <div className="flex items-center gap-4 md:gap-5 mb-6 md:mb-8">
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-indigo-500 to-[#2563EB] flex items-center justify-center shrink-0 shadow-lg">
                                        <span className="text-white font-bold text-base md:text-lg">JD</span>
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-widest mb-1 font-semibold truncate">Verified Owner</p>
                                        <p className="text-lg md:text-xl text-white font-bold flex items-center gap-1.5 truncate">
                                            John Doe
                                            <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-cyan-400 shrink-0" />
                                        </p>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
                                    <div className="bg-[#0B0F1A] rounded-xl p-3 md:p-4 border border-white/5">
                                        <p className="text-[10px] md:text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">Registered</p>
                                        <p className="text-sm md:text-base text-gray-200 font-bold">Oct 12, 26</p>
                                    </div>
                                    <div className="bg-[#0B0F1A] rounded-xl p-3 md:p-4 border border-white/5">
                                        <p className="text-[10px] md:text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">Condition</p>
                                        <p className="text-sm md:text-base text-gray-200 font-bold">New</p>
                                    </div>
                                </div>
                                
                                {/* Always visible on mobile, hover reveal on desktop */}
                                <div className="block md:hidden mb-4">
                                    <div className="flex items-center gap-2 bg-cyan-950/30 border border-cyan-500/30 rounded-lg p-2.5">
                                        <Database className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                        <p className="text-[10px] font-mono text-cyan-200 truncate">Tx: 0x8a7... verified</p>
                                    </div>
                                </div>

                                {/* Desktop Hover Reveal Details */}
                                <div className="hidden md:block h-0 overflow-hidden group-hover:h-[60px] opacity-0 group-hover:opacity-100 transition-all duration-300">
                                    <div className="flex items-center gap-3 bg-cyan-950/30 border border-cyan-500/20 rounded-xl p-3 mb-4">
                                        <Database className="w-4 h-4 text-cyan-400 shrink-0" />
                                        <p className="text-xs font-mono text-cyan-200 truncate">Tx: 0x8a7...3f9e • Block Verified</p>
                                    </div>
                                </div>
                                
                                {/* Actions - large tap targets */}
                                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-1 md:mt-2">
                                    <button className="w-full bg-[#1F2937] border border-white/10 rounded-xl py-3.5 md:py-4 text-sm md:text-base font-bold text-white transition-colors hover:bg-[#273242] active:bg-[#374151]">
                                        History
                                    </button>
                                    <button className="w-full bg-gradient-to-br from-[#3B82F6] to-[#2563EB] border border-[#60A5FA]/30 rounded-xl py-3.5 md:py-4 text-sm md:text-base font-black text-white transition-colors active:scale-95 md:active:scale-100 shadow-md">
                                        Transfer
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* VISION SECTION - Center Aligned, Highly Readable */}
        <section id="future-vision" className="py-24 md:py-40 relative z-20 bg-[#0B0F1A] border-y border-white/5 overflow-hidden w-full">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15vw] md:text-[15vw] font-black tracking-tighter text-white/[0.02] whitespace-nowrap select-none pointer-events-none w-full text-center">
                INFRASTRUCTURE
             </div>
             
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[800px] md:h-[400px] bg-[#2563EB]/10 blur-[100px] md:blur-[150px] rounded-full pointer-events-none"></div>

             <div className="max-w-4xl mx-auto px-5 text-center relative z-10">
                <motion.div 
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={staggerContainer}
                    className="flex flex-col items-center"
                >
                    <motion.h2 variants={fadeInUp} className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[1.1] tracking-tighter mb-6 md:mb-8 text-shadow-sm">
                        Every item deserves <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-[#2563EB] to-[#2563EB] drop-shadow-sm pb-2 inline-block">an identity.</span>
                    </motion.h2>
                    
                    <motion.div variants={fadeInUp} className="w-16 md:w-24 h-1 md:h-1.5 bg-gradient-to-r from-cyan-400 to-[#2563EB] rounded-full mb-6 md:mb-8 shadow-sm"></motion.div>
                    
                    <motion.p variants={fadeInUp} className="text-lg md:text-3xl lg:text-4xl font-bold text-gray-300 max-w-xs sm:max-w-2xl mx-auto leading-relaxed md:leading-snug tracking-tight">
                        KIZERE is building the infrastructure <br className="hidden md:block"/>for trusted global ownership.
                    </motion.p>
                </motion.div>
            </div>
        </section>

        {/* FINAL CTA SECTION - Mobile friendly spacing & buttons */}
        <section className="py-24 md:py-40 relative z-20 bg-[#0B0F1A] overflow-hidden w-full">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
            
            <div className="max-w-5xl mx-auto px-5 text-center">
                <motion.div
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={staggerContainer}
                    className="flex flex-col flex-wrap items-center relative z-10"
                >
                    <motion.h2 variants={fadeInUp} className="text-[3.5rem] leading-[0.95] md:text-8xl lg:text-[9rem] font-black text-white mb-10 md:mb-16 tracking-tighter drop-shadow-lg">
                        Own It.<br className="md:hidden"/> <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">Prove It.</span><br className="md:hidden"/> Protect It.
                    </motion.h2>
                    
                    <motion.div variants={fadeInUp} className="w-full sm:w-auto relative group inline-block">
                        <div className="hidden md:block absolute -inset-2 bg-gradient-to-r from-cyan-400 via-[#2563EB] to-[#2563EB] rounded-[2.5rem] blur-xl opacity-40"></div>
                        
                        <motion.div whileTap={{ scale: 0.96 }} className="w-full">
                            <Button
                                onClick={() => navigate("/auth?tab=register")}
                                size="lg"
                                className="w-full sm:w-auto relative h-16 md:h-24 px-8 md:px-20 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-b from-[#3B82F6] to-[#2563EB] hover:from-[#60A5FA] hover:to-[#3B82F6] text-white font-black text-xl md:text-3xl shadow-xl z-10 border border-white/20 active:scale-95 transition-transform"
                            >
                                Get Started — Free
                            </Button>
                        </motion.div>
                    </motion.div>
                </motion.div>
            </div>
        </section>

        <div className="dark bg-[#090C15] border-t border-white/5">
            <Footer />
        </div>
    </div>
  );
}