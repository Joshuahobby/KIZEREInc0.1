import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { apiGet } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock, Loader2, PackageOpen, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PendingStatus {
  success: boolean;
  status: string;
  businessName: string;
  pendingApproval: boolean;
}

const STEPS = [
  { key: "applied", icon: CheckCircle2, label: "business.pending.step1" },
  { key: "review", icon: Clock, label: "business.pending.step2" },
  { key: "active", icon: ShieldCheck, label: "business.pending.step3" },
];

export default function RetailerPendingPage() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [checking, setChecking] = useState(false);
  const [businessName, setBusinessName] = useState<string>("");

  const checkStatus = async () => {
    setChecking(true);
    try {
      const data = await apiGet<PendingStatus>("/api/pos/pending-status");
      if (!data) throw new Error("No response");
      if (data.businessName) setBusinessName(data.businessName);
      if (data.status === "active") {
        toast({
          title: t("business.pending.approvedTitle", "Your account is approved!"),
          description: t("business.pending.approvedDesc", "Redirecting to your dashboard…"),
        });
        // Reload to pick up updated session role before navigating
        window.location.href = "/retailer/dashboard";
      } else {
        toast({
          title: t("business.pending.stillPendingTitle", "Still under review"),
          description: t("business.pending.stillPendingDesc", "We'll notify you by email when it's approved."),
        });
      }
    } catch {
      toast({
        title: t("business.pending.checkError", "Unable to check status"),
        description: t("business.pending.checkErrorDesc", "Please try again later."),
        variant: "destructive",
      });
    } finally {
      setChecking(false);
    }
  };

  // Auto-check once on mount to handle the case where approval happened immediately
  useEffect(() => {
    apiGet<PendingStatus>("/api/pos/pending-status")
      .then((data) => {
        if (!data) return;
        if (data.businessName) setBusinessName(data.businessName);
        if (data.status === "active") {
          window.location.href = "/retailer/dashboard";
        }
      })
      .catch(() => {/* no-op — user may not be logged in yet */});
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Glass card */}
        <Card className="border-none bg-card/40 backdrop-blur-xl shadow-xl shadow-neutral-200/20 dark:shadow-none rounded-[2rem] overflow-hidden">
          <CardHeader className="text-center pb-2 pt-8 px-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <Badge
              variant="outline"
              className="mx-auto mb-3 border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
            >
              {t("business.pending.badge", "Under Review")}
            </Badge>
            <CardTitle className="text-2xl font-bold">
              {t("business.pending.title", "Application Received")}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {businessName ? (
                t("business.pending.descWithName", `${businessName} is under review.`, { name: businessName })
              ) : (
                t("business.pending.desc", "Your business application is under review.")
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-8 space-y-8">
            {/* SLA notice */}
            <p className="text-center text-sm text-muted-foreground">
              {t("business.pending.sla", "We typically approve applications within 24 hours. You'll receive an email with your API key and next steps.")}
            </p>

            {/* Vertical stepper */}
            <div className="relative space-y-0">
              {STEPS.map((step, index) => {
                const isFirst = index === 0;
                const isLast = index === STEPS.length - 1;
                const isComplete = isFirst;
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                          isComplete
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                            : "border-muted bg-muted/30"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 ${isComplete ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
                        />
                      </div>
                      {!isLast && (
                        <div className={`w-0.5 flex-1 my-1 ${isComplete ? "bg-green-300 dark:bg-green-700" : "bg-border"}`} style={{ minHeight: "24px" }} />
                      )}
                    </div>
                    <div className="pb-6">
                      <p
                        className={`text-sm font-medium leading-8 ${
                          isComplete ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {t(step.label, step.key)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Check status button */}
            <Button
              onClick={checkStatus}
              disabled={checking}
              className="w-full rounded-xl"
            >
              {checking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("business.pending.checking", "Checking…")}
                </>
              ) : (
                <>
                  <PackageOpen className="mr-2 h-4 w-4" />
                  {t("business.pending.checkButton", "Check Approval Status")}
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              {t("business.pending.contactNote", "Need help? Email")}{" "}
              <a href="mailto:hello@kizere.rw" className="underline underline-offset-2">
                hello@kizere.rw
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
