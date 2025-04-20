import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentService } from "@/services/payment.service";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function PaymentStatus() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "failed" | "error">("loading");
  const [message, setMessage] = useState<string>("");
  const [transactionRef, setTransactionRef] = useState<string | null>(null);

  useEffect(() => {
    // Parse query parameters from URL
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("status");
    const txRef = params.get("tx_ref");
    const errorMessage = params.get("message");

    if (errorMessage) {
      setStatus("error");
      setMessage(decodeURIComponent(errorMessage));
      return;
    }

    if (!txRef) {
      setStatus("error");
      setMessage("No transaction reference found");
      return;
    }

    setTransactionRef(txRef);

    // If status is already provided, show immediate feedback
    if (paymentStatus === "successful") {
      setStatus("success");
      setMessage("Payment successful");
    } else if (paymentStatus === "failed" || paymentStatus === "cancelled") {
      setStatus("failed");
      setMessage(paymentStatus === "failed" ? "Payment failed" : "Payment cancelled");
    }

    // Verify the payment with the server
    const verifyPayment = async () => {
      try {
        const response = await PaymentService.verifyPayment(txRef);
        
        if (response.status === "successful") {
          setStatus("success");
          setMessage("Payment has been verified and processed successfully");
          
          toast({
            title: "Payment successful",
            description: "Your payment has been processed successfully",
            variant: "default"
          });
        } else {
          setStatus("failed");
          setMessage(response.message || "Payment verification failed");
          
          toast({
            title: "Payment failed",
            description: response.message || "Payment verification failed",
            variant: "destructive"
          });
        }
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "An error occurred during payment verification");
        
        toast({
          title: "Verification error",
          description: error instanceof Error ? error.message : "An error occurred during payment verification",
          variant: "destructive"
        });
      }
    };

    // Only verify if not already successful from query params
    if (paymentStatus !== "successful") {
      verifyPayment();
    }
  }, []);

  return (
    <div className="container max-w-md mx-auto my-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-xl">Payment Status</CardTitle>
          <CardDescription className="text-center">
            {status === "loading" ? "Verifying your payment..." : "Your payment has been processed"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-center">Verifying payment status...</p>
            </div>
          )}
          
          {status === "success" && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <div className="text-center">
                <p className="font-medium text-lg">Payment Successful</p>
                <p className="text-muted-foreground mt-1">{message}</p>
                {transactionRef && (
                  <p className="text-xs mt-2 text-muted-foreground">
                    Transaction Reference: {transactionRef}
                  </p>
                )}
              </div>
            </div>
          )}
          
          {status === "failed" && (
            <div className="flex flex-col items-center gap-4">
              <XCircle className="h-16 w-16 text-red-500" />
              <div className="text-center">
                <p className="font-medium text-lg">Payment Failed</p>
                <p className="text-muted-foreground mt-1">{message}</p>
                {transactionRef && (
                  <p className="text-xs mt-2 text-muted-foreground">
                    Transaction Reference: {transactionRef}
                  </p>
                )}
              </div>
            </div>
          )}
          
          {status === "error" && (
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-16 w-16 text-amber-500" />
              <div className="text-center">
                <p className="font-medium text-lg">Verification Error</p>
                <p className="text-muted-foreground mt-1">{message}</p>
                {transactionRef && (
                  <p className="text-xs mt-2 text-muted-foreground">
                    Transaction Reference: {transactionRef}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            onClick={() => setLocation("/")}
            variant={status === "success" ? "default" : "outline"}
          >
            Return to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}