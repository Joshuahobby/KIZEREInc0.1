import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { motion } from "framer-motion";
import { BookOpen, Rocket, Shield, Search, ChevronRight } from "lucide-react";

export default function DocsPage() {
  const { t } = useLanguage();

  const sections = [
    {
      title: t('docs_page.getting_started.title'),
      icon: Rocket,
      items: [
        t('docs_page.getting_started.step1'),
        t('docs_page.getting_started.step2'),
        t('docs_page.getting_started.step3')
      ]
    },
    {
      title: t('docs_page.guides.title'),
      icon: BookOpen,
      items: [
        t('docs_page.guides.registration'),
        t('docs_page.guides.ownership'),
        t('docs_page.guides.lost_found'),
        t('docs_page.guides.qr_codes')
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-grow py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-12">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 flex-shrink-0">
              <div className="sticky top-24 space-y-8">
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">Documentation</h3>
                  <nav className="space-y-1">
                    {sections.map((section, sidx) => (
                      <div key={sidx} className="pb-4">
                        <div className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-foreground">
                          <section.icon className="h-4 w-4" />
                          {section.title}
                        </div>
                        <div className="ml-6 space-y-1 mt-1 border-l border-border/50">
                          {section.items.map((item, iidx) => (
                            <a 
                              key={iidx} 
                              href="#" 
                              className="block px-4 py-1.5 text-sm text-muted-foreground hover:text-primary hover:border-l hover:border-primary transition-all -ml-[1px]"
                            >
                              {item}
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </nav>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-grow">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h1 className="text-4xl font-bold mb-4">{t('docs_page.title')}</h1>
                <p className="text-xl text-muted-foreground mb-12">
                  {t('docs_page.subtitle')}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                  <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-all group cursor-pointer">
                    <Rocket className="h-8 w-8 text-primary mb-4" />
                    <h3 className="text-lg font-bold mb-2">Quick Start Guide</h3>
                    <p className="text-sm text-muted-foreground">Go from zero to registered in less than 5 minutes.</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/10 transition-all group cursor-pointer">
                    <Shield className="h-8 w-8 text-blue-500 mb-4" />
                    <h3 className="text-lg font-bold mb-2">Security at KIZERE</h3>
                    <p className="text-sm text-muted-foreground">Learn how we protect your items and personal data.</p>
                  </div>
                </div>

                <article className="prose prose-slate dark:prose-invert max-w-none">
                  <h2 className="text-2xl font-bold mb-6 border-b pb-2">Welcome to KIZERE</h2>
                  <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                    This documentation is designed to help you get the most out of KIZERE. Whether you are a first-time user looking to register your valuables or an agent helping with recovery, you'll find everything you need here.
                  </p>
                  
                  <div className="bg-muted/50 p-6 rounded-xl border border-border mb-8">
                    <h4 className="font-bold flex items-center gap-2 mb-2 italic">
                      <Search className="h-4 w-4" /> Tip
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Use the search bar at the top of the header to quickly find information about any registered item or help topic.
                    </p>
                  </div>

                  <h3 className="text-xl font-bold mb-4">Core Concepts</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold mt-1">1</div>
                      <div>
                        <h4 className="font-bold">Digital Identity</h4>
                        <p className="text-muted-foreground text-sm">Every item in KIZERE has a unique digital identity that belongs to you.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold mt-1">2</div>
                      <div>
                        <h4 className="font-bold">Trust Network</h4>
                        <p className="text-muted-foreground text-sm">Our community-driven recovery process helps items find their owners.</p>
                      </div>
                    </div>
                  </div>
                </article>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
