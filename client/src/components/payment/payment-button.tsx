import { useState } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { PaymentModal } from "./payment-modal";
import { InitializePaymentRequest } from "@/services/payment.service";
import { PaymentType } from "@shared/schema";

interface PaymentButtonProps extends Omit<ButtonProps, "onClick"> {
  paymentType: PaymentType;
  amount?: number; // Optional — if not provided, the modal will resolve from admin packages
  itemId?: number;
  reportId?: number;
  onPaymentSuccess?: (transactionRef: string) => void;
  onPaymentInitiate?: () => void;
  onPaymentCancel?: () => void;
}

export function PaymentButton({
  paymentType,
  amount,
  itemId,
  reportId,
  onPaymentSuccess,
  onPaymentInitiate,
  onPaymentCancel,
  children,
  className,
  onSuccess, // Extract to prevent leaking to <Button>
  ...props
}: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Payment details for the modal — amount is optional, modal resolves it from packages
  const paymentDetails: Omit<InitializePaymentRequest, "amount" | "phoneNumber"> & { amount?: number } = {
    type: paymentType,
    ...(amount ? { amount } : {}),
    ...(itemId ? { itemId } : {}),
    ...(reportId ? { reportId } : {}),
  };

  const handleClick = () => {
    if (onPaymentInitiate) onPaymentInitiate();
    setIsModalOpen(true);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        className={className}
        {...props}
      >
        {children || "Proceed to Payment"}
      </Button>

      <PaymentModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        paymentDetails={paymentDetails as any}
        onPaymentSuccess={(ref) => {
          if (onPaymentSuccess) onPaymentSuccess(ref);
        }}
        onPaymentCancel={() => {
          if (onPaymentCancel) onPaymentCancel();
        }}
      />
    </>
  );
}