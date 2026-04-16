import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crown, Check, Loader2, X, Infinity } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface PremiumUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional: called once payment is successfully initiated */
  onInitiated?: (transactionRef: string) => void;
}

export function PremiumUpgradeModal({
  open,
  onOpenChange,
  onInitiated,
}: PremiumUpgradeModalProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const BENEFITS = [
    t("consumer.premium.benefit1"),
    t("consumer.premium.benefit2"),
    t("consumer.premium.benefit3"),
    t("consumer.premium.benefit4"),
  ];

  const handleUpgrade = async () => {
    if (!phoneNumber.trim()) return;
    setLoading(true);
    try {
      const data = await apiRequest<any>("/api/consumer/subscription/purchase", {
        method: "POST",
        data: { phoneNumber: phoneNumber.trim() },
      });

      toast({
        title: t("consumer.premium.initiated"),
        description: t("consumer.premium.initiatedDesc"),
      });

      onOpenChange(false);
      setPhoneNumber("");

      if (onInitiated && data?.transactionRef) {
        onInitiated(data.transactionRef);
      }
    } catch {
      toast({
        title: t("consumer.premium.failed"),
        description: t("consumer.premium.failedDesc"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-none rounded-3xl shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-b from-primary/15 to-background p-8 pt-10 text-center relative">
          <button
            type="button"
            title="Close"
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
            <Crown className="h-8 w-8 text-primary" />
            <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full border-4 border-background flex items-center justify-center">
              <Infinity className="h-2.5 w-2.5 text-primary-foreground" />
            </div>
          </div>

          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">
              {t("consumer.premium.title")}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed mt-2">
              {t("consumer.premium.subtitle")}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Benefits */}
        <div className="px-8 py-4">
          <ul className="space-y-2.5">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm">
                <div className="mt-0.5 h-4 w-4 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Check className="h-2.5 w-2.5 text-emerald-500" />
                </div>
                <span className="text-foreground/80">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Payment form */}
        <div className="px-8 pb-8 space-y-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              {t("consumer.premium.momoLabel")}
            </label>
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+250 78 000 0000"
              className="h-12 rounded-xl"
              type="tel"
            />
          </div>

          <Button
            onClick={handleUpgrade}
            disabled={loading || !phoneNumber.trim()}
            className="w-full h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/20"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t("consumer.premium.initiating")}
              </>
            ) : (
              <>
                <Crown className="h-4 w-4 mr-2" />
                {t("consumer.premium.upgradeCta")}
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full h-10 rounded-xl text-xs text-muted-foreground"
          >
            {t("consumer.premium.maybeLater")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
