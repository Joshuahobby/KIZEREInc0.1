import { useState } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { PaymentModal } from "./payment-modal";
import { InitializePaymentRequest } from "@/services/payment.service";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface PaymentButtonProps extends Omit<ButtonProps, "onClick"> {
  paymentType: "registration" | "lost_report";
  amount?: number; // If not provided, will use default from server
  itemId?: number;
  reportId?: number;
  onPaymentSuccess?: (transactionRef: string) => void;
  onPaymentInitiate?: () => void;
  onPaymentCancel?: () => void;
  showAmount?: boolean;
}

export function PaymentButton({
  paymentType,
  amount,
  itemId,
  reportId,
  onPaymentSuccess,
  onPaymentInitiate,
  onPaymentCancel,
  showAmount = true,
  children,
  ...buttonProps
}: PaymentButtonProps) {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Payment details
  const paymentDetails: Omit<InitializePaymentRequest, "amount"> & { amount: number } = {
    type: paymentType,
    amount: amount || (paymentType === "registration" ? 500 : 500), // Default amounts
    ...(itemId && { itemId }),
    ...(reportId && { reportId })
  };

  // Handle button click
  const handleClick = () => {
    try {
      setIsLoading(true);
      if (onPaymentInitiate) {
        onPaymentInitiate();
      }
      setIsModalOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate payment process",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = (transactionRef: string) => {
    if (onPaymentSuccess) {
      onPaymentSuccess(transactionRef);
    }
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={isLoading}
        {...buttonProps}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            {children || `Pay ${showAmount ? `${paymentDetails.amount} RWF` : ''}`}
          </>
        )}
      </Button>
      
      <PaymentModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        paymentDetails={paymentDetails}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentCancel={onPaymentCancel}
      />
    </>
  );
}