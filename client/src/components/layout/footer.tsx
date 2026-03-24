import * as React from "react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { motion } from "framer-motion";
import { Logo } from "@/components/ui/logo";
import {
  Mail,
  Phone,
  MapPin
} from "lucide-react";

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.22-.96 4.35-2.52 5.92-1.58 1.56-3.8 2.45-6.07 2.44-2.28-.02-4.49-.93-6.06-2.53C.384 21.08-.496 18.91-.496 16.64c.01-2.22.9-4.32 2.47-5.86 1.48-1.46 3.53-2.3 5.61-2.43.08 1.34.02 2.68.04 4.02-1.62.13-3.13.93-4.14 2.19-.94 1.18-1.37 2.71-1.14 4.19.23 1.49 1.25 2.76 2.58 3.39 1.31.62 2.87.69 4.21.13 1.31-.55 2.27-1.63 2.62-2.99.19-.74.22-1.53.22-2.3v-17z" />
  </svg>
);

export function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: t('landing.footer.quickLinks') || "Quick Links",
      links: [
        { label: "Features", href: "/features" },
        { label: "Use Cases", href: "/use-cases" },
        { label: t('nav.howItWorks') || "How It Works", href: "/how-it-works" },
        { label: t('nav.about') || "About", href: "/about" },
        { label: t('landing.footer.faq') || "FAQ", href: "/faq" },
      ]
    },
    {
      title: t('landing.footer.resources') || "Resources",
      links: [
        { label: "Blog & News", href: "/blog" },
        { label: t('nav.contact') || "Contact", href: "/contact" },
        { label: t('nav.lostDirectory') || "Lost Items", href: "/search?type=lost" },
        { label: t('nav.foundDirectory') || "Found Items", href: "/search?type=found" },
        { label: t('landing.footer.community') || "Community", href: "/community" },
      ]
    }
  ];

  const socialLinks = [
    { icon: XIcon, href: "https://twitter.com", label: "X (Twitter)" },
    { icon: TikTokIcon, href: "https://tiktok.com", label: "TikTok" },
  ];

  const contactInfo = [
    { icon: Mail, label: "support@kizere.com", href: "mailto:support@kizere.com" },
    { icon: Phone, label: "+250 793 895 236", href: "tel:+250793895236" },
    { icon: MapPin, label: t('landing.footer.location') || "Kigali, Rwanda", href: "#" },
  ];

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-white py-16 relative overflow-hidden" role="contentinfo">
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
              <Link href="/" className="flex items-center gap-2 mb-6 group" aria-label="KIZERE Home">
                <Logo className="h-8 w-8 text-white group-hover:scale-110 transition-transform" aria-hidden="true" />
                <span className="text-2xl font-display font-bold text-white tracking-tight">KIZERE</span>
              </Link>
              <p className="text-gray-300 mb-8 max-w-md text-base leading-relaxed">
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
                      className="text-gray-300 hover:text-white transition-colors duration-200 inline-flex items-center group"
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
                    className="flex items-center text-gray-300 group transition-colors hover:text-white"
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
          <p className="text-gray-400 text-sm">
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
            <Link href="/compliance" className="text-gray-500 hover:text-white transition-colors duration-200 text-xs font-medium border-l border-white/10 pl-4 ml-2">
              Data Protection & Compliance
            </Link>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}

