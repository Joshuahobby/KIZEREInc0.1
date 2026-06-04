import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Crown, Check, X, Loader2, Infinity, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { PremiumUpgradeModal } from "@/components/subscription/PremiumUpgradeModal";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

const FREE_LIMIT = 3;

interface SubscriptionStatus {
  isPremium: boolean;
  premiumExpiresAt: string | null;
  registrationCount: number;
  registrationLimit: number | null;
}

interface PaymentPackage {
  id: number;
  amount: string;
  currency: string;
  name: string;
}

export default function PremiumPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const { data: subscriptionStatus } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/consumer/subscription"],
    queryFn: () => apiRequest("/api/consumer/subscription"),
    enabled: !!user,
    staleTime: 60_000,
    retry: false,
  });

  const { data: packages, isLoading: packagesLoading } = useQuery<PaymentPackage[]>({
    queryKey: ["/api/payments/type/consumer_subscription"],
    queryFn: () => apiRequest("/api/payments/type/consumer_subscription"),
    staleTime: 300_000,
    retry: false,
  });

  const pkg = packages?.[0];
  const isPremium = subscriptionStatus?.isPremium ?? false;
  const limit = subscriptionStatus?.registrationLimit ?? FREE_LIMIT;

  const FREE_FEATURES = [
    t("consumer.premium.freeFeat1", { limit }),
    t("consumer.premium.freeFeat2"),
    t("consumer.premium.freeFeat3"),
  ];

  const PREMIUM_FEATURES = [
    t("consumer.premium.premFeat1"),
    t("consumer.premium.premFeat2"),
    t("consumer.premium.premFeat3"),
    t("consumer.premium.premFeat4"),
  ];

  return (
    <PageLayout hideSidebar>
      <div className="min-h-[80vh] max-w-3xl mx-auto py-12 px-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="relative">
              <Crown className="h-7 w-7 text-primary" />
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full border-4 border-background flex items-center justify-center">
                <Infinity className="h-2 w-2 text-primary-foreground" />
              </div>
            </div>
            <span className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
              {t("consumer.premium.title")}
            </span>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-md mx-auto">
            {t("consumer.premium.subtitle")}
          </p>
        </motion.div>

        {/* Plan cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {/* Free tier */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card
              className={cn(
                "relative overflow-hidden h-full",
                !isPremium && "border-primary/30 ring-1 ring-primary/20"
              )}
            >
              {!isPremium && (
                <Badge className="absolute top-3 right-3 bg-primary/10 text-primary border-primary/20 text-[10px] uppercase tracking-wide">
                  {t("consumer.premium.banner.active")}
                </Badge>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-black uppercase tracking-widest text-muted-foreground">
                  {t("consumer.premium.pageFreeTitle")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {t("consumer.premium.pageFreeDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-black">RWF 0</div>
                <ul className="space-y-2">
                  {FREE_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-muted-foreground/50 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* Premium tier */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card
              className={cn(
                "relative overflow-hidden h-full border-primary/40 bg-gradient-to-b from-primary/5 to-background",
                isPremium && "ring-2 ring-primary/40"
              )}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-blue-500" />
              {isPremium && (
                <Badge className="absolute top-3 right-3 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] uppercase tracking-wide">
                  {t("consumer.premium.alreadyPremium")}
                </Badge>
              )}
              <CardHeader className="pb-2 pt-6">
                <CardTitle className="text-base font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                  <Crown className="h-4 w-4" />
                  {t("consumer.premium.pagePremiumTitle")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {t("consumer.premium.pagePremiumDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-end gap-1">
                  {packagesLoading ? (
                    <span className="text-sm text-muted-foreground">{t("consumer.premium.priceFetching")}</span>
                  ) : pkg ? (
                    <>
                      <span className="text-2xl font-black">
                        {Number(pkg.amount).toLocaleString()} {pkg.currency}
                      </span>
                      <span className="text-sm text-muted-foreground pb-0.5">
                        {t("consumer.premium.pricePerYear")}
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl font-black text-primary">Premium</span>
                  )}
                </div>

                {isPremium && subscriptionStatus?.premiumExpiresAt && (
                  <p className="text-xs text-emerald-600 font-medium">
                    {t("consumer.premium.expiresOn", {
                      date: format(new Date(subscriptionStatus.premiumExpiresAt), "MMM d, yyyy"),
                    })}
                  </p>
                )}

                <ul className="space-y-2">
                  {PREMIUM_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <div className="h-4 w-4 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-2.5 w-2.5 text-emerald-500" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>

                {!isPremium && (
                  <Button
                    onClick={() => setUpgradeOpen(true)}
                    disabled={!user}
                    className="w-full h-12 rounded-xl font-bold mt-2 shadow-lg shadow-primary/20"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    {t("consumer.premium.upgradeCta")}
                  </Button>
                )}

                {!user && (
                  <Button asChild variant="ghost" size="sm" className="w-full rounded-xl text-xs">
                    <Link href="/auth?redirect=/premium">Sign in to subscribe</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Feature comparison table */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                Feature Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 pr-4 font-bold text-xs uppercase tracking-widest text-muted-foreground">Feature</th>
                    <th className="text-center py-2 px-4 font-bold text-xs uppercase tracking-widest text-muted-foreground">Free</th>
                    <th className="text-center py-2 pl-4 font-bold text-xs uppercase tracking-widest text-primary">Premium</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {[
                    { feature: "Item registrations", free: `Up to ${limit}`, premium: "Unlimited" },
                    { feature: "Full verification reports", free: false, premium: true },
                    { feature: "Lost & found reports", free: true, premium: true },
                    { feature: "Ownership transfer", free: true, premium: true },
                    { feature: "Ownership certificates", free: true, premium: true },
                    { feature: "Priority support", free: false, premium: true },
                  ].map(({ feature, free, premium }) => (
                    <tr key={feature}>
                      <td className="py-3 pr-4 text-foreground/80">{feature}</td>
                      <td className="py-3 px-4 text-center">
                        {free === true ? (
                          <Check className="h-4 w-4 text-muted-foreground mx-auto" />
                        ) : free === false ? (
                          <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                        ) : (
                          <span className="text-xs font-medium text-muted-foreground">{free}</span>
                        )}
                      </td>
                      <td className="py-3 pl-4 text-center">
                        {premium === true ? (
                          <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                            <Check className="h-3 w-3 text-emerald-500" />
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-primary">{premium}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <PremiumUpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </PageLayout>
  );
}
