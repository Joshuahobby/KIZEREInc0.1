import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { PageLayout } from "@/components/layout/page-layout";
import { SEO } from "@/components/SEO";
import { ReportWizard } from "@/components/reports/report-wizard";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import { AuthWall } from "@/components/ui/auth-wall";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import ReactGA from "react-ga4";
import { PaymentModal } from "@/components/payment/payment-modal";

export default function CreateReport() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [success, setSuccess] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdReport, setCreatedReport] = useState<any>(null);

  // Determine report type from URL path
  const [isLostRoute] = useRoute("/report-lost");
  const type: "lost" | "found" = isLostRoute ? "lost" : "found";

  // Pre-fill uniqueIdentifier from ?identifier= query param (e.g. from /verify/:id stolen alert)
  const prefillIdentifier = new URLSearchParams(window.location.search).get("identifier") || undefined;
  const initialValues = prefillIdentifier ? { uniqueIdentifier: prefillIdentifier } : undefined;

  const mutation = useMutation({
    mutationFn: async ({ data, images }: { data: any; images: File[] }) => {
      // Upload images first if any
      let imageUrls: string[] = [];
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((img) => formData.append("images", img));
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageUrls = uploadData.urls || [];
        }
      }

      const payload = {
        ...data,
        type,
        imageUrls: [...(data.imageUrls || []), ...imageUrls],
        date: new Date(data.date).toISOString(),
      };

      return await apiRequest<any>("/api/reports", {
        method: "POST",
        data: payload,
      });
    },
    onSuccess: (data) => {
      if (data?.receiptNumber) {
        setReceiptNumber(data.receiptNumber);
      }

      ReactGA.event("report_submitted", {
        category: "report",
        type,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });

      // If lost report requires payment, open PaymentModal instead of success screen
      if (data?.paymentStatus === 'pending' && type === 'lost') {
        setCreatedReport(data);
        setShowPaymentModal(true);
        toast({
          title: t("reports.reportCreated") || "Report Created",
          description: t("reports.proceedToPayment") || "Complete payment to publish your report.",
        });
      } else {
        setSuccess(true);
        toast({
          title: t("reports.successTitle") || "Report Submitted!",
          description:
            t("reports.successDescription") ||
            "Your report has been filed successfully.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: t("reports.errorTitle") || "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: any, images: File[]) => {
    mutation.mutate({ data, images });
  };

  if (!user) {
    return (
      <PageLayout>
        <div className="container max-w-7xl mx-auto py-20 flex items-center justify-center">
          <AuthWall
            returnUrl={type === "lost" ? "/report-lost" : "/report-found"}
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Payment Modal for Lost Reports */}
      {createdReport && (
        <PaymentModal
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
          paymentDetails={{
            type: 'lost_report',
            reportId: createdReport.id,
            bountyAmount: createdReport.bountyAmount ? Number(createdReport.bountyAmount) : 0,
          }}
          onPaymentSuccess={() => {
            setShowPaymentModal(false);
            setSuccess(true);
            toast({
              title: t("reports.paymentSuccess") || "Payment Successful!",
              description: t("reports.reportPublished") || "Your lost item report is now live.",
            });
          }}
          onPaymentCancel={() => {
            setShowPaymentModal(false);
            toast({
              title: t("reports.paymentPending") || "Payment Pending",
              description: t("reports.payLater") || "Your report has been saved. You can pay from your dashboard to publish it.",
              variant: "default",
            });
            navigate("/dashboard");
          }}
        />
      )}
      <SEO
        title={
          type === "lost"
            ? "KIZERE - Report Lost Item"
            : "KIZERE - Report Found Item"
        }
        description={
          type === "lost"
            ? "Report a lost item and notify the KIZERE community to help you find it."
            : "Report a found item and help reconnect it with its owner."
        }
      />
      <div className="py-6 min-h-[calc(100dvh-4rem)]">
        <div className="max-w-2xl mx-auto px-4">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("common.back") || "Back to Dashboard"}
          </Button>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                    {t("reports.successTitle") || "Report Submitted!"}
                  </h2>
                  <p className="text-muted-foreground max-w-sm">
                    {t("reports.successDescription") ||
                      "Your report has been filed successfully. We'll notify you of any matches."}
                  </p>
                  {receiptNumber && (
                    <div className="bg-muted/50 px-4 py-2 rounded-lg border">
                      <span className="text-xs text-muted-foreground">
                        Receipt Number
                      </span>
                      <p className="font-mono font-bold text-primary">
                        {receiptNumber}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-3 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => navigate("/dashboard")}
                    >
                      {t("common.backToDashboard") || "Back to Dashboard"}
                    </Button>
                    <Button
                      onClick={() => navigate("/search")}
                    >
                      {t("nav.explore") || "Browse Reports"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card className="border-border/50 shadow-premium overflow-hidden">
              <div
                className={`p-5 border-b ${
                  type === "lost"
                    ? "bg-destructive/5 border-destructive/20"
                    : "bg-emerald-500/5 border-emerald-500/20"
                }`}
              >
                <h1
                  className={`text-xl font-bold ${
                    type === "lost"
                      ? "text-destructive dark:text-red-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {type === "lost"
                    ? t("reports.reportLostItem") || "Report Lost Item"
                    : t("reports.reportFoundItem") || "Report Found Item"}
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  {type === "lost"
                    ? t("report_lost_subtitle") ||
                      "Fill in the details below to file a lost item report."
                    : t("report_found_subtitle") ||
                      "Fill in the details below to submit a found item report."}
                </p>
              </div>
              <CardContent className="p-0">
                <ReportWizard
                  type={type}
                  onSubmit={handleSubmit}
                  isSubmitting={mutation.isPending}
                  initialValues={initialValues}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
