import { Link } from "wouter";
import { Logo } from "@/components/ui/logo";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { Facebook, Instagram, Twitter } from "lucide-react";

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container py-8 md:py-12">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <div className="mb-2 flex items-center gap-2">
              <Logo className="h-6 w-6" />
              <span className="text-lg font-bold">KIZERE</span>
            </div>
            <p className="mb-4 max-w-sm text-sm text-muted-foreground">
              {t("footer.description")}
            </p>
            <div className="flex space-x-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground transition-colors hover:text-primary"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground transition-colors hover:text-primary"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground transition-colors hover:text-primary"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-3 text-sm font-medium">{t("footer.quickLinks")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/">
                  <a className="text-muted-foreground transition-colors hover:text-primary">
                    {t("nav.home")}
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/register-item">
                  <a className="text-muted-foreground transition-colors hover:text-primary">
                    {t("nav.register")}
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/search">
                  <a className="text-muted-foreground transition-colors hover:text-primary">
                    {t("nav.search")}
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/lost-found">
                  <a className="text-muted-foreground transition-colors hover:text-primary">
                    {t("nav.lostFound")}
                  </a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-3 text-sm font-medium">{t("footer.resources")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/faq">
                  <a className="text-muted-foreground transition-colors hover:text-primary">
                    {t("footer.faq")}
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/help">
                  <a className="text-muted-foreground transition-colors hover:text-primary">
                    {t("footer.helpCenter")}
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy">
                  <a className="text-muted-foreground transition-colors hover:text-primary">
                    {t("footer.privacyPolicy")}
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service">
                  <a className="text-muted-foreground transition-colors hover:text-primary">
                    {t("footer.termsOfService")}
                  </a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-3 text-sm font-medium">{t("footer.contact")}</h3>
            <address className="space-y-2 text-sm not-italic">
              <p className="text-muted-foreground">
                KN 05 St, Kigali, Rwanda
              </p>
              <p className="text-muted-foreground">
                support@kizere.com
              </p>
              <p className="text-muted-foreground">
                +250 788 123 456
              </p>
            </address>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t pt-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-center text-xs text-muted-foreground">
              © {currentYear} KIZERE. {t("footer.allRightsReserved")}
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
              <Link href="/privacy-policy">
                <a className="hover:text-primary">{t("footer.privacyPolicy")}</a>
              </Link>
              <Link href="/terms-of-service">
                <a className="hover:text-primary">{t("footer.termsOfService")}</a>
              </Link>
              <Link href="/cookies">
                <a className="hover:text-primary">{t("footer.cookies")}</a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}