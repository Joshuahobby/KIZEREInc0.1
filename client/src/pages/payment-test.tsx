import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { PaymentService } from "@/services/payment.service";
import { getPaymentAmount, DEFAULT_CURRENCY } from "@/config/payment.config";
import { Loader2, ArrowRight } from "lucide-react";

export default function PaymentTestPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [transactionRef, setTransactionRef] = useState<string | null>(null);

  // Initialize a test payment directly
  const initializeTestPayment = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to make a payment",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Log to help debug
      console.log("Initializing test payment for user:", user);
      
      // Use the test amount (or default to half the regular amount)
      const testAmount = Math.floor(getPaymentAmount("registration") * 0.25);
      
      const response = await PaymentService.initializePayment({
        type: "registration",
        amount: testAmount, // Small test amount in the default currency
      });
      
      console.log("Payment initialization response:", response);
      
      setPaymentUrl(response.paymentUrl);
      setTransactionRef(response.transactionRef);
      
      toast({
        title: "Payment initialized",
        description: `Test payment of ${testAmount} ${DEFAULT_CURRENCY} has been initialized successfully`,
      });
    } catch (error) {
      console.error("Test payment initialization error:", error);
      toast({
        title: "Payment initialization failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Open payment window
  const openPaymentWindow = () => {
    if (!paymentUrl) return;
    
    window.open(paymentUrl, '_blank', 'width=500,height=600');
  };

  // Verify payment
  const verifyPayment = async () => {
    if (!transactionRef) return;
    
    try {
      setIsLoading(true);
      const response = await PaymentService.verifyPayment(transactionRef);
      
      toast({
        title: "Payment verification",
        description: `Payment status: ${response.status}`,
        variant: response.status === "successful" ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Payment verification failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 container max-w-4xl py-10">
        <h1 className="text-3xl font-bold mb-6">Payment Test Page</h1>
        <p className="text-muted-foreground mb-8">
          This page allows you to test the payment functionality without going through the registration process.
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle>Test Payment Integration</CardTitle>
            <CardDescription>Initialize a test payment and verify its status</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {!paymentUrl ? (
              <Button 
                onClick={initializeTestPayment}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Initializing Payment...
                  </>
                ) : (
                  <>
                    Initialize Test Payment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="p-4 border rounded-md bg-muted/50">
                  <p className="font-medium">Payment Initialized</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Transaction Reference: {transactionRef}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Test Amount: {Math.floor(getPaymentAmount("registration") * 0.25)} {DEFAULT_CURRENCY}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={openPaymentWindow}
                    className="flex-1"
                  >
                    Proceed to Payment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={verifyPayment}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Check Payment Status"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
}