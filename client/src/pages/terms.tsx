import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function TermsPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">{t('footer.termsOfService') || "Terms of Service"}</h1>
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">1. Terms</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              By accessing the KIZERE platform, you agree to be bound by these terms.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
