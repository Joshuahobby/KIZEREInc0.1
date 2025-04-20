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
import { Loader2 } from "lucide-react";
import { InitializePaymentRequest, PaymentService } from "@/services/payment.service";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentDetails: Omit<InitializePaymentRequest, "amount"> & { amount: number };
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
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [transactionRef, setTransactionRef] = useState<string | null>(null);
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Function to initialize payment
  const initializePayment = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to make a payment",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsInitializing(true);
      const response = await PaymentService.initializePayment(paymentDetails);
      setPaymentUrl(response.paymentUrl);
      setTransactionRef(response.transactionRef);
    } catch (error) {
      toast({
        title: "Payment initialization failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
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
        toast({
          title: "Payment successful",
          description: "Your payment has been processed successfully",
          variant: "default"
        });
        
        if (onPaymentSuccess) {
          onPaymentSuccess(transactionRef);
        }
        
        onOpenChange(false);
      } else {
        toast({
          title: "Payment verification",
          description: response.message,
          variant: "destructive"
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

  // Initialize payment when modal opens
  useEffect(() => {
    if (open && !paymentUrl) {
      initializePayment();
    }
  }, [open]);

  // Handle payment window
  const openPaymentWindow = () => {
    if (!paymentUrl) return;
    
    // Open a new window for the payment
    const newWindow = window.open(paymentUrl, '_blank', 'width=500,height=600');
    setPaymentWindow(newWindow);
    
    // Set up a timer to check if window closed
    const checkWindowClosed = setInterval(() => {
      if (newWindow?.closed) {
        clearInterval(checkWindowClosed);
        verifyPayment();
      }
    }, 1000);
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setPaymentUrl(null);
      setTransactionRef(null);
      setPaymentWindow(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payment for {paymentDetails.type === 'registration' ? 'Item Registration' : 'Lost Item Report'}</DialogTitle>
          <DialogDescription>
            You are about to make a payment of {paymentDetails.amount} RWF. 
            Please complete the payment process to continue.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center justify-center p-4">
          {isInitializing ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Initializing payment...</p>
            </div>
          ) : paymentUrl ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-center">
                Click the button below to proceed with your payment using Flutterwave.
              </p>
              <Button 
                onClick={openPaymentWindow} 
                className="w-full"
              >
                Proceed to Payment
              </Button>
              
              {isVerifying && (
                <div className="flex items-center gap-2 mt-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <p className="text-sm text-muted-foreground">Verifying payment...</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-destructive">
              Failed to initialize payment. Please try again.
            </p>
          )}
        </div>
        
        <DialogFooter className="flex flex-row items-center justify-between sm:justify-between">
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
          
          {paymentUrl && (
            <Button 
              variant="ghost"
              onClick={verifyPayment} 
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying
                </>
              ) : (
                "Check Payment Status"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}