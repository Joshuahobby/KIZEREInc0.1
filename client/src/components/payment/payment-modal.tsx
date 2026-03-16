import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Phone, CheckCircle2, AlertTriangle, Info, ShieldCheck, Ticket } from "lucide-react";
import { InitializePaymentRequest, PaymentService } from "@/services/payment.service";
import { CouponService, CouponValidationResponse } from "@/services/coupon.service";
import { PaymentPackageSelector, PaymentPackage } from "./payment-package-selector";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentDetails: Omit<InitializePaymentRequest, "amount" | "phoneNumber"> & { 
    amount?: number;
    bountyAmount?: number;
  };
  onPaymentSuccess?: (transactionRef: string) => void;
  onPaymentCancel?: () => void;
}

export function PaymentModal({
  open,
  onOpenChange,
  paymentDetails,
  onPaymentSuccess,
  onPaymentCancel
}: PaymentModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isInitializing, setIsInitializing] = useState(false);
  const [transactionRef, setTransactionRef] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<{ id: number; amount: number; name?: string } | null>(null);
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [step, setStep] = useState<"loading" | "package" | "phone" | "waiting" | "done" | "failed">("loading");
  const [failureMessage, setFailureMessage] = useState<string | null>(null);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResponse | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);


  // Fetch packages for this payment type to decide the flow
  const { data: packages, isLoading: isLoadingPackages, error: packagesError } = useQuery({
    queryKey: ['/api/payment-packages/type', paymentDetails.type],
    queryFn: async () => {
      return await apiRequest<PaymentPackage[]>(`/api/payment-packages/type/${paymentDetails.type}`);
    },
    enabled: open,
  });

  // Auto-decide the flow when packages load
  useEffect(() => {
    if (!open || isLoadingPackages) {
      if (open && isLoadingPackages) setStep("loading");
      return;
    }

    if (packagesError || !packages || packages.length === 0) {
      // No packages available — show error in the phone step area
      setStep("phone");
      return;
    }

    if (packages.length === 1) {
      // Only one package — auto-select it and skip straight to phone entry
      const pkg = packages[0];
      setSelectedPackage({ id: pkg.id, amount: Number(pkg.amount), name: pkg.name });
      setStep("phone");
    } else {
      // Multiple packages — let user choose
      // But pre-select the default
      const defaultPkg = packages.find(p => p.isDefault) || packages[0];
      setSelectedPackage({ id: defaultPkg.id, amount: Number(defaultPkg.amount), name: defaultPkg.name });
      setStep("package");
    }
  }, [packages, isLoadingPackages, packagesError, open]);

  // Handle package selection
  const handlePackageSelect = (packageId: number, amount: number) => {
    const pkg = packages?.find(p => p.id === packageId);
    setSelectedPackage({ id: packageId, amount, name: pkg?.name });
  };

  // Move to phone number entry after package selection
  const proceedToPhoneEntry = () => {
    if (!selectedPackage) return;
    setStep("phone");
  };

  // Handle coupon validation
  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    
    try {
      setIsValidatingCoupon(true);
      setCouponError(null);
      
      const pkgAmount = selectedPackage?.amount ?? paymentDetails.amount ?? 0;
      const resp = await CouponService.validateCoupon(couponCode, pkgAmount, paymentDetails.type);
      
      if (resp.isValid) {
        setAppliedCoupon(resp);
        toast({
          title: "Coupon applied!",
          description: `You saved ${resp.discountAmount.toLocaleString()} RWF`,
        });
      } else {
        setCouponError(resp.message || "Invalid coupon");
      }
    } catch (error: any) {
      setCouponError(error.message || "Failed to validate coupon");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError(null);
  };

  // Resolve the final payment amount (Package Fee + Bounty)
  const pkgAmount = selectedPackage?.amount ?? paymentDetails.amount ?? 0;
  const bountyAmount = paymentDetails.bountyAmount ?? 0;
  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const resolvedAmount = pkgAmount + bountyAmount - discountAmount;

  // Function to initialize payment via PawaPay Direct Deposit
  const initiatePayment = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to make a payment",
        variant: "destructive"
      });
      return;
    }

    if (!phoneNumber.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter your mobile money phone number",
        variant: "destructive"
      });
      return;
    }

    if (resolvedAmount <= 0) {
      toast({
        title: "Payment configuration error",
        description: "No valid payment amount found. Please contact support.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsInitializing(true);

      const requestDetails = {
        ...paymentDetails,
        amount: resolvedAmount,
        packageId: selectedPackage?.id,
        phoneNumber: phoneNumber.trim(),
        couponCode: appliedCoupon ? couponCode : undefined,
      };

      const response = await PaymentService.initializePayment(requestDetails);
      setTransactionRef(response.transactionRef);
      setStep("waiting");

      toast({
        title: "Payment request sent",
        description: "Check your phone for a mobile money prompt to approve the payment.",
      });
    } catch (error) {
      toast({
        title: "Payment initiation failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
      setStep("phone");
    } finally {
      setIsInitializing(false);
    }
  };

  // Function to verify payment status
  const verifyPayment = async () => {
    if (!transactionRef) return;

    try {
      setIsVerifying(true);
      const response = await PaymentService.verifyPayment(transactionRef);

      if (response.status === "successful") {
        setStep("done");
        toast({
          title: "Payment successful",
          description: "Your payment has been processed successfully",
          variant: "default"
        });

        if (onPaymentSuccess) {
          onPaymentSuccess(transactionRef);
        }

        setTimeout(() => onOpenChange(false), 2000);
      } else if (response.status === "failed") {
        setFailureMessage(response.message || "The payment was not completed");
        toast({
          title: "Payment failed",
          description: response.message || "The payment was not completed",
          variant: "destructive"
        });
        setStep("failed");
      } else {
        toast({
          title: "Payment pending",
          description: "The payment is still being processed. Please approve the prompt on your phone.",
        });
      }
    } catch (error) {
      toast({
        title: "Payment verification failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Polling for payment status
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;

    if (step === "waiting" && transactionRef && open) {
      pollInterval = setInterval(async () => {
        try {
          const response = await PaymentService.verifyPayment(transactionRef);
          if (response.status === "successful") {
            setStep("done");
            if (onPaymentSuccess) {
              onPaymentSuccess(transactionRef);
            }
            if (pollInterval) clearInterval(pollInterval);
            setTimeout(() => onOpenChange(false), 3000);
          } else if (response.status === "failed") {
            setFailureMessage(response.message || "The payment was not completed");
            toast({
              title: "Payment failed",
              description: response.message || "The payment was not completed",
              variant: "destructive"
            });
            setStep("failed");
            if (pollInterval) clearInterval(pollInterval);
          }
        } catch (error) {
          console.error("Polling error:", error);
        }
      }, 5000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [step, transactionRef, open, onPaymentSuccess, onOpenChange, toast]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setTransactionRef(null);
      setStep("loading");
      setSelectedPackage(null);
      setPhoneNumber(user?.phoneNumber || "");
      setFailureMessage(null);
      setAppliedCoupon(null);
      setCouponCode("");
      setCouponError(null);
    }
  }, [open, user]);

  // Determine the dialog title
  const getTitle = () => {
    const typeLabel = paymentDetails.type === 'registration' ? 'Item Registration' : 'Lost Item Report';
    if (step === "done") return "Payment Successful!";
    if (step === "failed") return "Payment Failed";
    return `Pay for ${typeLabel}`;
  };

  // Determine the dialog description
  const getDescription = () => {
    switch (step) {
      case "loading": return "Loading payment options...";
      case "package": return "Choose the plan that works best for you.";
      case "phone": return null; // Let the breakdown card speak for itself
      case "waiting": return "Approve the prompt sent to your phone.";
      case "done": return "Your payment has been confirmed.";
      case "failed": return failureMessage || "The payment was not completed.";
      default: return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] rounded-3xl p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold tracking-tight">{getTitle()}</DialogTitle>
          {getDescription() && <DialogDescription className="text-sm">{getDescription()}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-6">
          {/* Loading */}
          {step === "loading" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Package Selection */}
          {step === "package" && (
            <div className="space-y-4">
              <PaymentPackageSelector
                paymentType={paymentDetails.type}
                onSelectPackage={handlePackageSelect}
                selectedPackageId={selectedPackage?.id}
              />

              <Button
                onClick={proceedToPhoneEntry}
                disabled={!selectedPackage}
                className="w-full h-11 rounded-xl"
              >
                Continue — {selectedPackage ? `${selectedPackage.amount.toLocaleString()} RWF` : "Select a plan"}
              </Button>
            </div>
          )}

          {/* Phone Number Entry */}
          {step === "phone" && (
            <div className="space-y-5">
              {/* Payment summary card - Sleeker version */}
              {selectedPackage && resolvedAmount > 0 && (
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-border/50">
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-medium">Processing Fee</span>
                      <span className="font-semibold">{pkgAmount.toLocaleString()} RWF</span>
                    </div>
                    {bountyAmount > 0 && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-medium">Item Reward</span>
                        <span className="font-semibold text-emerald-600">+{bountyAmount.toLocaleString()} RWF</span>
                      </div>
                    )}
                    {appliedCoupon && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-medium">Discount ({appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}%` : 'Coupon'})</span>
                        <span className="font-semibold text-emerald-600">-{appliedCoupon.discountAmount.toLocaleString()} RWF</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-border/40 flex justify-between items-end">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Due</span>
                      <div className="text-right leading-none">
                        <span className="text-2xl font-black">{resolvedAmount.toLocaleString()}</span>
                        <span className="text-[10px] ml-1 font-bold opacity-50">RWF</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* No packages error */}
              {(!packages || packages.length === 0) && !isLoadingPackages && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    No payment packages configured.
                  </AlertDescription>
                </Alert>
              )}

              {/* Coupon input */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Offer Code"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value);
                        if (couponError) setCouponError(null);
                      }}
                      disabled={!!appliedCoupon || isValidatingCoupon}
                      className="pl-10 h-11 rounded-xl bg-background border-border/60"
                    />
                  </div>
                  {appliedCoupon ? (
                    <Button 
                      variant="outline" 
                      onClick={removeCoupon}
                      className="h-11 px-4 rounded-xl border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/5 hover:text-emerald-700"
                    >
                      Remove
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={validateCoupon}
                      disabled={!couponCode.trim() || isValidatingCoupon}
                      className="h-11 px-4 rounded-xl"
                    >
                      {isValidatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                    </Button>
                  )}
                </div>
                {couponError && <p className="text-[10px] text-destructive px-1 font-medium">{couponError}</p>}
                {appliedCoupon && appliedCoupon.description && (
                  <p className="text-[10px] text-emerald-600 px-1 font-medium">{appliedCoupon.description}</p>
                )}
              </div>

              {/* Phone input */}
              <div className="space-y-2">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="momo-phone"
                    type="tel"
                    placeholder="Mobile Money Number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10 h-11 rounded-xl bg-background border-border/60"
                    autoFocus
                  />
                </div>
              </div>

              <Button
                onClick={initiatePayment}
                className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20"
                disabled={isInitializing || !phoneNumber.trim() || resolvedAmount <= 0}
              >
                {isInitializing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  `Pay ${resolvedAmount.toLocaleString()} RWF`
                )}
              </Button>

              {/* Back to package selection */}
              {packages && packages.length > 1 && (
                <button
                  onClick={() => setStep("package")}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors font-medium underline underline-offset-4"
                >
                  Change payment plan
                </button>
              )}
            </div>
          )}

          {/* Waiting for approval */}
          {step === "waiting" && (
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                <Loader2 className="w-12 h-12 animate-spin text-primary relative z-10" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-bold text-lg">Check your phone</p>
                <p className="text-sm text-muted-foreground max-w-[240px] mx-auto">
                  A prompt was sent to <strong>{phoneNumber}</strong>. Enter your PIN to confirm.
                </p>
              </div>

              <div className="w-full p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-700 font-medium">
                  <strong>Not appearing?</strong> Dial <strong>*182*7*1#</strong> on MTN to approve manually.
                </p>
              </div>

              <Button
                onClick={verifyPayment}
                variant="outline"
                className="w-full h-11 rounded-xl"
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  "I've approved — Check Status"
                )}
              </Button>
            </div>
          )}

          {/* Success */}
          {step === "done" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <p className="text-xl font-bold">Success!</p>
              <p className="text-sm text-muted-foreground text-center">
                Payment of {resolvedAmount.toLocaleString()} RWF confirmed.
              </p>
            </div>
          )}

          {/* Failed */}
          {step === "failed" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-destructive" />
              </div>
              <p className="text-xl font-bold text-center">Payment Failed</p>
              <p className="text-sm text-muted-foreground text-center">
                {failureMessage || "Something went wrong."}
              </p>
              <Button
                onClick={() => {
                  setFailureMessage(null);
                  setStep("phone");
                }}
                className="w-full h-11 rounded-xl mt-2"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>

        {step !== "done" && step !== "loading" && (
          <DialogFooter className="mt-4 pt-4 border-t border-border/40 flex flex-col gap-2">
            <div className="flex items-center justify-between w-full">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-4 rounded-lg text-muted-foreground"
                onClick={() => {
                  if (onPaymentCancel) onPaymentCancel();
                  onOpenChange(false);
                }}
                disabled={isInitializing || isVerifying}
              >
                Cancel
              </Button>

              {step === "waiting" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("phone")}
                  disabled={isVerifying}
                  className="h-9 px-4 rounded-lg text-primary text-xs font-bold"
                >
                  Edit number
                </Button>
              )}
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}