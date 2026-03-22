import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Instagram, Youtube, Twitter, Facebook, ExternalLink, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ContactPage() {
  const { t } = useLanguage();

  const contactInfo = [
    {
      icon: MapPin,
      title: "Address",
      content: t('contact_page.info.address'),
      desc: "Kigali, Rwanda - Main Office"
    },
    {
      icon: Phone,
      title: "Phone",
      content: t('contact_page.info.phone'),
      desc: "Available Mon-Fri, 9am - 5pm"
    },
    {
      icon: Mail,
      title: "Email",
      content: t('contact_page.info.email'),
      desc: "Expect a response within 24 hours"
    }
  ];

  const socialLinks = [
    { icon: Twitter, href: "#" },
    { icon: Instagram, href: "#" },
    { icon: Youtube, href: "#" },
    { icon: Facebook, href: "#" }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden bg-slate-50 dark:bg-slate-900/50">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,#FACC15_0%,transparent_50%)]" />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
                {t('contact_page.title')}
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
                {t('contact_page.subtitle')}
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              
              {/* Contact Info Column */}
              <motion.div 
                className="lg:col-span-5 space-y-12"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div>
                  <h2 className="text-3xl font-bold mb-6">Get in Touch</h2>
                  <p className="text-muted-foreground text-lg mb-8">
                    Have questions about KIZERE? Our team is ready to help you secure what matters most.
                  </p>
                </div>

                <div className="space-y-6">
                  {contactInfo.map((item, index) => (
                    <motion.div 
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors duration-300 border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <item.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{item.title}</h3>
                        <p className="text-foreground font-medium">{item.content}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="pt-8 border-t border-border">
                  <h3 className="font-bold mb-4">Follow Us</h3>
                  <div className="flex gap-4">
                    {socialLinks.map((social, idx) => (
                      <a 
                        key={idx} 
                        href={social.href}
                        aria-label={`Follow us on ${social.icon.name}`}
                        className="h-10 w-10 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
                      >
                        <social.icon className="h-5 w-5" />
                      </a>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Contact Form Column */}
              <motion.div 
                className="lg:col-span-7"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="bg-card p-8 md:p-12 rounded-[2.5rem] border border-border shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors duration-500" />
                  
                  <form className="space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold ml-1">{t('contact_page.form.name')}</label>
                        <Input placeholder="John Doe" className="rounded-2xl h-12 bg-background border-border hover:border-primary/50 focus:border-primary transition-all duration-300" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold ml-1">{t('contact_page.form.email')}</label>
                        <Input type="email" placeholder="john@example.com" className="rounded-2xl h-12 bg-background border-border hover:border-primary/50 focus:border-primary transition-all duration-300" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold ml-1">{t('contact_page.form.subject')}</label>
                      <Input placeholder="How can we help?" className="rounded-2xl h-12 bg-background border-border hover:border-primary/50 focus:border-primary transition-all duration-300" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold ml-1">{t('contact_page.form.message')}</label>
                      <Textarea 
                        placeholder="Tell us more about your inquiry..." 
                        className="rounded-2xl min-h-[160px] bg-background border-border hover:border-primary/50 focus:border-primary transition-all duration-300 resize-none p-4" 
                      />
                    </div>

                    <Button type="submit" className="w-full h-14 rounded-2xl yellow-button font-black text-lg shadow-xl shadow-yellow-500/20 flex items-center justify-center gap-2 group transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                      {t('contact_page.form.send')}
                      <Send className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Button>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Global Support Section */}
        <section className="py-20 bg-slate-50 dark:bg-slate-900/30">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              24/7 SUPPORT AVAILABLE
            </div>
            <h2 className="text-3xl font-bold mb-4">Regional Assistance</h2>
            <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">
              KIZERE provides support across Rwanda. Find your nearest agent for offline registration and label printing.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {["Kigali City", "Eastern Province", "Western Province", "Northern Province"].map((region) => (
                <div key={region} className="bg-background p-6 rounded-2xl border border-border flex items-center justify-between group cursor-pointer hover:border-primary transition-all transition-duration-300">
                  <span className="font-bold">{region}</span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
