import { useState } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { PaymentModal } from "./payment-modal";
import { InitializePaymentRequest, PaymentService } from "@/services/payment.service";
import { PaymentType } from "@shared/schema";

interface PaymentButtonProps extends Omit<ButtonProps, "onClick"> {
  paymentType: PaymentType;
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
  className,
  ...props
}: PaymentButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Calculate payment amount if not provided
  const paymentAmount = amount ?? PaymentService.getPaymentAmount(paymentType);
  
  // Payment details for the modal
  const paymentDetails: Omit<InitializePaymentRequest, "amount"> & { amount: number } = {
    type: paymentType,
    amount: paymentAmount,
    ...(itemId ? { itemId } : {}),
    ...(reportId ? { reportId } : {})
  };
  
  // Handle button click to open payment modal
  const handleClick = () => {
    setIsLoading(true);
    if (onPaymentInitiate) {
      onPaymentInitiate();
    }
    setIsModalOpen(true);
    setIsLoading(false);
  };
  
  // Handle payment success
  const handlePaymentSuccess = (transactionRef: string) => {
    if (onPaymentSuccess) {
      onPaymentSuccess(transactionRef);
    }
  };
  
  // Handle payment cancel
  const handlePaymentCancel = () => {
    if (onPaymentCancel) {
      onPaymentCancel();
    }
  };
  
  return (
    <>
      <Button
        onClick={handleClick}
        disabled={isLoading}
        className={className}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        {children || (
          <>
            Pay {showAmount ? `${paymentAmount} RWF` : ""}
          </>
        )}
      </Button>
      
      <PaymentModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        paymentDetails={paymentDetails}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentCancel={handlePaymentCancel}
      />
    </>
  );
}