import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, ShieldCheck, Key, RefreshCw, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ItemHandoverDialogProps {
  claimId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ItemHandoverDialog({ claimId, isOpen, onClose }: ItemHandoverDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [step, setStep] = React.useState<"initiate" | "verify" | "success">("initiate");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [otp, setOtp] = React.useState("");
  const [maskedContact, setMaskedContact] = React.useState("");
  const [channel, setChannel] = React.useState("");

  React.useEffect(() => {
    if (!isOpen) {
      setStep("initiate");
      setOtp("");
      setMaskedContact("");
      setChannel("");
    }
  }, [isOpen]);

  const handleSendOTP = async () => {
    if (!claimId) return;
    setIsSubmitting(true);
    try {
      const res = await apiRequest("/api/agent/handover/otp/send", {
        method: "POST",
        data: { claimId },
      });
      const data = await res.json();
      setMaskedContact(data.maskedContact);
      setChannel(data.channel);
      setStep("verify");
      toast({
        title: "OTP Sent",
        description: `Handover code sent to user via ${data.channel}.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to send OTP",
        description: error.message || "Contact the user support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!claimId || !otp) return;
    setIsSubmitting(true);
    try {
      await apiRequest("/api/agent/handover/otp/verify", {
        method: "POST",
        data: { claimId, code: otp },
      });
      setStep("success");
      toast({
        title: "Handover Complete",
        description: "The item has been securely handed over and the record updated.",
      });
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid or expired code.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {t('dashboard.agent.handover') || "Secure Custody Transfer"}
          </DialogTitle>
          <DialogDescription>
            {step === "initiate" && (t('dashboard.agent.handoverInitiate') || "Initiate the secure handover of an item to its owner or finder.")}
            {step === "verify" && (t('dashboard.agent.handoverVerify', { channel }) || `Verify the code sent to the recipient's ${channel}.`)}
            {step === "success" && (t('dashboard.agent.handoverSuccess') || "Custody transfer successfully completed.")}
          </DialogDescription>
        </DialogHeader>

        {step === "initiate" && (
          <div className="py-6 space-y-4">
            <div className="bg-primary/5 p-4 rounded-lg flex items-start gap-3">
              <Key className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Security Protocol</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  To complete the handover, a verification code will be sent to the claimant. 
                  Once they receive it, they must provide it to you to confirm the physical exchange.
                </p>
              </div>
            </div>
            <Button 
                onClick={handleSendOTP} 
                className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20" 
                disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate Handover Code"}
            </Button>
          </div>
        )}

        {step === "verify" && (
          <div className="py-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="otp">Enter 6-Digit Handover Code</Label>
              <Input
                id="otp"
                placeholder="000000"
                className="text-center text-3xl font-mono tracking-[0.5em] h-16"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                autoFocus
              />
              <p className="text-xs text-center text-muted-foreground pt-1">
                Sent to: <span className="font-mono font-bold text-foreground">{maskedContact}</span>
              </p>
            </div>

            <div className="flex gap-4">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => setStep("initiate")}
                disabled={isSubmitting}
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Resend
              </Button>
              <Button 
                className="flex-[2] font-bold" 
                onClick={handleVerifyOTP}
                disabled={otp.length !== 6 || isSubmitting}
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify & Complete"}
              </Button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="py-10 flex flex-col items-center text-center space-y-4">
            <div className="h-20 w-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold">Transfer Verified</h3>
              <p className="text-muted-foreground text-sm">
                The item has been officially returned to its owner. 
                All system records have been updated to reflect this resolution.
              </p>
            </div>
            <Button onClick={onClose} className="w-full mt-4">
              Finish
            </Button>
          </div>
        )}

        {step !== "success" && (
          <DialogFooter>
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
