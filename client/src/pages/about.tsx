import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { motion } from "framer-motion";
import { Shield, Target, Eye, ArrowRight, Zap, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function AboutPage() {
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

  const values = [
    {
      title: t('about_page.mission'),
      description: t('about_page.mission_text'),
      icon: <Target className="h-6 w-6" />,
      color: "from-blue-500/20 to-cyan-500/20",
      iconColor: "text-blue-500"
    },
    {
      title: t('about_page.vision'),
      description: t('about_page.vision_text'),
      icon: <Eye className="h-6 w-6" />,
      color: "from-purple-500/20 to-pink-500/20",
      iconColor: "text-purple-500"
    },
    {
      title: t('landing.powerfulFeatures') || "Trust",
      description: t('howItWorksPage.benefit1Desc'),
      icon: <Shield className="h-6 w-6" />,
      color: "from-emerald-500/20 to-teal-500/20",
      iconColor: "text-emerald-500"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO 
        title={`${t('about_page.title')} | KIZERE`} 
        description={t('about_page.story_text')} 
      />
      <Header />
      
      <main className="flex-grow">
        {/* Premium Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-20 md:pt-40 md:pb-32 bg-primary/5">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(100%_100%_at_50%_0%,rgba(0,122,255,0.05)_0%,transparent_100%)]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wider uppercase mb-8 backdrop-blur-md">
                <Heart className="h-3.5 w-3.5" />
                {t('common.brandName')} {t('nav.about')}
              </div>
              <h1 className="text-2xl md:text-5xl font-bold tracking-tight mb-8 leading-tight max-w-4xl mx-auto">
                {t('about_page.title')}
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {t('landing.footerDescription')}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Mission, Vision & Values Grid */}
        <section className="py-24 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="grid gap-8 md:grid-cols-3"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {values.map((value, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  whileHover={{ y: -8 }}
                  className="relative p-8 rounded-[2rem] glass border border-white/5 hover:border-primary/30 transition-all duration-500"
                >
                  <div className={`p-4 rounded-2xl w-fit mb-6 bg-gradient-to-br ${value.color} ${value.iconColor}`}>
                    {value.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-4 tracking-tight">{value.title}</h3>
                  <p className="text-muted-foreground leading-relaxed font-medium">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
          <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 opacity-30" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold tracking-wider uppercase mb-6">
                  {t('about_page.story')}
                </div>
                <h2 className="text-3xl md:text-5xl font-bold mb-8 tracking-tight">{t('about_page.story')}</h2>
                <div className="space-y-6 text-xl text-slate-300 leading-relaxed font-light mb-10">
                  <p>{t('about_page.story_text')}</p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <Link href="/auth">
                    <Button className="rounded-full px-6 py-2.5 text-sm font-semibold shadow-md premium-button group">
                      {t('auth.getStarted')}
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>

              <motion.div
                className="relative hidden lg:block"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
              >
                <div className="aspect-video rounded-[2.5rem] overflow-hidden glass border border-white/10 p-1">
                  <div className="w-full h-full rounded-[2rem] bg-gradient-to-tr from-primary/20 to-secondary/10 flex items-center justify-center">
                    <Shield className="w-24 h-24 text-primary/40" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

      </main>
      
      <Footer />
    </div>
  );
}
