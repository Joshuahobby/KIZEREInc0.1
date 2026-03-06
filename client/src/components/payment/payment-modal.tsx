import { useState, useEffect } from "react";
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
import { Loader2, Phone, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { InitializePaymentRequest, PaymentService } from "@/services/payment.service";
import { PaymentPackageSelector } from "./payment-package-selector";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentDetails: Omit<InitializePaymentRequest, "amount" | "phoneNumber"> & { amount: number };
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
  const [depositStatus, setDepositStatus] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<{ id: number, amount: number } | null>(null);
  const [showPackageSelector, setShowPackageSelector] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [step, setStep] = useState<"package" | "phone" | "waiting" | "done" | "failed">("package");
  const [failureMessage, setFailureMessage] = useState<string | null>(null);

  // Handle package selection
  const handlePackageSelect = (packageId: number, amount: number) => {
    setSelectedPackage({ id: packageId, amount });
  };

  // Move to phone number entry after package selection
  const proceedToPhoneEntry = () => {
    if (!selectedPackage) return;
    setStep("phone");
  };

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

    try {
      setIsInitializing(true);
      setStep("waiting");

      const requestDetails = {
        ...paymentDetails,
        amount: selectedPackage ? selectedPackage.amount : paymentDetails.amount,
        packageId: selectedPackage?.id,
        phoneNumber: phoneNumber.trim(),
      };

      const response = await PaymentService.initializePayment(requestDetails);
      setTransactionRef(response.transactionRef);
      setDepositStatus(response.depositStatus || "ACCEPTED");

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
      // Start polling every 5 seconds
      pollInterval = setInterval(async () => {
        try {
          const response = await PaymentService.verifyPayment(transactionRef);
          if (response.status === "successful") {
            setStep("done");
            if (onPaymentSuccess) {
              onPaymentSuccess(transactionRef);
            }
            if (pollInterval) clearInterval(pollInterval);

            // Auto close after success
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
          // Don't stop polling on error, maybe network hiccup
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
      setDepositStatus(null);
      setStep("package");
      setShowPackageSelector(true);
      setPhoneNumber(user?.phoneNumber || "");
      setFailureMessage(null);
    }
  }, [open, user]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${step === 'package' ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}>
        <DialogHeader>
          <DialogTitle>Payment for {paymentDetails.type === 'registration' ? 'Item Registration' : 'Lost Item Report'}</DialogTitle>
          <DialogDescription>
            {step === "package" && "Select a payment package to continue."}
            {step === "phone" && `Pay ${selectedPackage?.amount || paymentDetails.amount} RWF via Mobile Money`}
            {step === "waiting" && "A payment prompt has been sent to your phone."}
            {step === "done" && "Payment completed successfully!"}
          </DialogDescription>
        </DialogHeader>

        <div className="p-4">
          {/* Step 1: Package Selection */}
          {step === "package" && (
            <div className="mb-4">
              <PaymentPackageSelector
                paymentType={paymentDetails.type}
                onSelectPackage={handlePackageSelect}
                selectedPackageId={selectedPackage?.id}
              />

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={proceedToPhoneEntry}
                  disabled={!selectedPackage}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Phone Number Entry */}
          {step === "phone" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="momo-phone">Mobile Money Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="momo-phone"
                    type="tel"
                    placeholder="e.g. 0788123456"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter your phone number (e.g. 0788123456). Country code is optional.
                  A payment prompt will be sent to this number.
                </p>
              </div>

              <Button
                onClick={initiatePayment}
                className="w-full"
                disabled={isInitializing || !phoneNumber.trim()}
              >
                {isInitializing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending payment request...
                  </>
                ) : (
                  `Pay ${selectedPackage?.amount || paymentDetails.amount} RWF`
                )}
              </Button>
            </div>
          )}

          {/* Step 3: Waiting for approval */}
          {step === "waiting" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="relative">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium">
                  Approve the payment on your phone
                </p>
                <p className="text-sm text-muted-foreground">
                  A mobile money prompt has been sent to <strong>{phoneNumber}</strong>.
                  Please enter your PIN to confirm the payment.
                </p>
              </div>

              <Alert className="mt-2">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Didn't get the prompt?</strong> Dial <strong>*182*7*1#</strong> on MTN to view and approve pending payments.
                </AlertDescription>
              </Alert>

              <Button
                onClick={verifyPayment}
                variant="outline"
                className="w-full mt-4"
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking status...
                  </>
                ) : (
                  "I've approved — Check Payment Status"
                )}
              </Button>
            </div>
          )}

          {/* Step 4: Success */}
          {step === "done" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
              <p className="text-center font-medium text-lg">Payment Successful!</p>
              <p className="text-sm text-muted-foreground text-center">
                Your payment of {selectedPackage?.amount || paymentDetails.amount} RWF has been confirmed.
              </p>
            </div>
          )}

          {/* Step 5: Failed */}
          {step === "failed" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <AlertTriangle className="w-16 h-16 text-destructive" />
              <p className="text-center font-medium text-lg">Payment Failed</p>
              <p className="text-sm text-muted-foreground text-center">
                {failureMessage || "The payment was not completed."}
              </p>
              <Button
                onClick={() => {
                  setFailureMessage(null);
                  setStep("phone");
                }}
                className="w-full mt-2"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-row items-center justify-between sm:justify-between">
          {step !== "done" && (
            <Button
              variant="outline"
              onClick={() => {
                if (onPaymentCancel) onPaymentCancel();
                onOpenChange(false);
              }}
              disabled={isInitializing || isVerifying}
            >
              Cancel
            </Button>
          )}

          {step === "waiting" && (
            <Button
              variant="ghost"
              onClick={() => setStep("phone")}
              disabled={isVerifying}
              size="sm"
            >
              Use different number
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}