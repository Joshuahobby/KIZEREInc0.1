import { Link } from "wouter";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { motion } from "framer-motion";
import { Logo } from "@/components/ui/logo";
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Github, 
  Mail, 
  Phone, 
  MapPin 
} from "lucide-react";

export function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: t('landing.footer.quickLinks') || "Quick Links",
      links: [
        { label: t('landing.footer.home') || "Home", href: "/" },
        { 
          label: t('landing.footer.features') || "Features", 
          href: "/#features",
          onClick: (e: React.MouseEvent) => {
            if (window.location.pathname === '/') {
              e.preventDefault();
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }
          }
        },
        { label: t('nav.about') || "About", href: "/about" },
        { label: t('landing.footer.faq') || "FAQ", href: "/faq" },
      ]
    },
    {
      title: t('landing.footer.resources') || "Resources",
      links: [
        { label: t('nav.contact') || "Contact", href: "/contact" },
        { label: t('landing.footer.blog') || "Blog", href: "/blog" },
        { label: t('landing.footer.documentation') || "Documentation", href: "/docs" },
        { label: t('landing.footer.community') || "Community", href: "/community" },
      ]
    }
  ];

  const socialLinks = [
    { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
    { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
    { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
    { icon: Github, href: "https://github.com", label: "GitHub" },
  ];

  const contactInfo = [
    { icon: Mail, label: "support@kizere.com", href: "mailto:support@kizere.com" },
    { icon: Phone, label: "+254 712 345 678", href: "tel:+254712345678" },
    { icon: MapPin, label: t('landing.footer.location') || "Kigali, Rwanda", href: "#" },
  ];

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-white py-16 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern opacity-30"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Brand & Description */}
          <div className="md:col-span-4 lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Link href="/" className="flex items-center gap-2 mb-6 group">
                <Logo className="h-8 w-8 text-white group-hover:scale-110 transition-transform" />
                <span className="text-2xl font-display font-bold text-white tracking-tight">KIZERE</span>
              </Link>
              <p className="text-gray-400 mb-8 max-w-md text-base leading-relaxed">
                {t('landing.footerDescription') || t('footer.description')}
              </p>
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <a 
                    key={social.label}
                    href={social.href} 
                    aria-label={social.label} 
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all duration-200 border border-white/10"
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </motion.div>
          </div>
          
          {/* Links Sections */}
          {footerSections.map((section, idx) => (
            <motion.div 
              key={section.title}
              className="md:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * (idx + 1) }}
              viewport={{ once: true }}
            >
              <h4 className="text-lg font-semibold mb-6 text-white">{section.title}</h4>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link 
                      href={link.href} 
                      onClick={link.onClick}
                      className="text-gray-400 hover:text-white transition-colors duration-200 inline-flex items-center group"
                    >
                      <span className="relative">
                        {link.label}
                        <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
          
          {/* Contact Section */}
          <motion.div 
            className="md:col-span-4 lg:col-span-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-semibold mb-6 text-white">{t('landing.footer.contact') || "Contact Us"}</h4>
            <ul className="space-y-4">
              {contactInfo.map((item) => (
                <li key={item.label}>
                  <a 
                    href={item.href} 
                    className="flex items-center text-gray-400 group transition-colors hover:text-white"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mr-4 group-hover:bg-primary/20 transition-colors shrink-0">
                      <item.icon className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
        
        {/* Bottom Bar */}
        <motion.div 
          className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <p className="text-gray-500 text-sm">
            {t('landing.footer.copyright', { year: currentYear }) || `© ${currentYear} KIZERE. All rights reserved.`}
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
            <Link href="/privacy" className="text-gray-500 hover:text-white transition-colors duration-200 text-xs font-medium">
              {t('landing.footer.privacyPolicy') || "Privacy Policy"}
            </Link>
            <Link href="/terms" className="text-gray-500 hover:text-white transition-colors duration-200 text-xs font-medium">
              {t('landing.footer.termsOfService') || "Terms of Service"}
            </Link>
            <Link href="/cookies" className="text-gray-500 hover:text-white transition-colors duration-200 text-xs font-medium">
              {t('landing.footer.cookiePolicy') || "Cookie Policy"}
            </Link>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
