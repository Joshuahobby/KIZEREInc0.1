import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { motion } from "framer-motion";
import { Shield, Target, Eye } from "lucide-react";

export default function AboutPage() {
  const { t } = useLanguage();

  const values = [
    {
      title: t('about_page.mission'),
      description: t('about_page.mission_text'),
      icon: Target,
      color: "bg-blue-500/10 text-blue-500"
    },
    {
      title: t('about_page.vision'),
      description: t('about_page.vision_text'),
      icon: Eye,
      color: "bg-purple-500/10 text-purple-500"
    },
    {
      title: t('landing.powerfulFeatures') || "Trust",
      description: t('landing.feature1Desc') || "Reliable and secure item protection.",
      icon: Shield,
      color: "bg-emerald-500/10 text-emerald-500"
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
        <section className="py-20 bg-primary/5 border-b border-primary/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h1 
              className="text-4xl md:text-6xl font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {t('about_page.title')}
            </motion.h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('landing.footerDescription')}
            </p>
          </div>
        </section>
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-6">{t('about_page.story')}</h2>
            <div className="space-y-4 text-lg text-muted-foreground">
              <p>{t('about_page.story_text')}</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
