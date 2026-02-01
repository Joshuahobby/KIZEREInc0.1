import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { HelpCircle, Shield, Package, Search, CreditCard } from "lucide-react";

export default function FAQPage() {
  const { t } = useLanguage();

  const faqCategories = [
    {
      id: "general",
      title: t('faqs_page.categories.general'),
      icon: HelpCircle,
      questions: [
        { q: t('faqs_page.questions.what_is_kizere'), a: t('faqs_page.questions.what_is_kizere_ans') },
        { q: t('faqs_page.questions.is_it_free'), a: t('faqs_page.questions.is_it_free_ans') }
      ]
    },
    {
      id: "registration",
      title: t('faqs_page.categories.registration'),
      icon: Package,
      questions: [
        { q: t('faqs_page.questions.how_to_register'), a: t('faqs_page.questions.how_to_register_ans') },
        { q: t('faqs_page.questions.what_is_digital_cert'), a: t('faqs_page.questions.what_is_digital_cert_ans') }
      ]
    },
    {
      id: "lost_found",
      title: t('faqs_page.categories.lost_found'),
      icon: Search,
      questions: [
        { q: t('faqs_page.questions.what_if_i_lose_it'), a: t('faqs_page.questions.what_if_i_lose_it_ans') }
      ]
    },
    {
      id: "security",
      title: t('faqs_page.categories.security'),
      icon: Shield,
      questions: [
        { q: t('faqs_page.questions.is_my_data_safe'), a: t('faqs_page.questions.is_my_data_safe_ans') }
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-grow py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {t('faqs_page.title')}
            </h1>
            <p className="text-xl text-muted-foreground">
              {t('faqs_page.subtitle')}
            </p>
          </motion.div>

          <div className="space-y-12">
            {faqCategories.map((category, index) => (
              <motion.div 
                key={category.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <category.icon className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {category.title}
                  </h2>
                </div>

                <Accordion type="single" collapsible className="w-full space-y-4">
                  {category.questions.map((item, qIndex) => (
                    <AccordionItem 
                      key={qIndex} 
                      value={`${category.id}-${qIndex}`}
                      className="border rounded-xl bg-card px-4 border-border/50 hover:border-primary/30 transition-colors shadow-sm"
                    >
                      <AccordionTrigger className="text-left py-4 hover:no-underline font-semibold text-lg hover:text-primary transition-colors">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            ))}
          </div>

          <motion.div 
            className="mt-20 p-8 rounded-2xl bg-primary/5 border border-primary/20 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <h3 className="text-2xl font-bold mb-4">{t('landing.faq.contactUs')}</h3>
            <p className="text-muted-foreground mb-6">
              {t('faqs_page.contact_us_text') || "Still have questions? We're here to help."}
            </p>
            <button className="yellow-button px-8 py-3 rounded-xl font-bold">
              {t('nav.contact')}
            </button>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
