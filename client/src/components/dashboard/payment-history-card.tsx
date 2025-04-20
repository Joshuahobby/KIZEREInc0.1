import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { PaymentService } from "@/services/payment.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, ArrowRight } from "lucide-react";

export function PaymentHistoryCard() {
  const [, setLocation] = useLocation();
  const { data: payments, isLoading, isError } = useQuery({
    queryKey: ["/api/payments"],
    queryFn: () => PaymentService.getPaymentHistory(),
    staleTime: 60000, // 1 minute
  });

  // Show only the latest 5 payments
  const recentPayments = payments?.slice(0, 5);

  // Function to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "PP");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Function to get badge variant based on payment status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "successful":
        return "success";
      case "pending":
        return "outline";
      case "failed":
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Payment History</CardTitle>
        <CardDescription>Recent payment transactions</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
          </div>
        ) : isError ? (
          <div className="text-center py-4 text-muted-foreground">
            Error loading payment history
          </div>
        ) : recentPayments && recentPayments.length > 0 ? (
          <div className="space-y-3">
            {recentPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex justify-between items-center p-2 rounded-md border hover:bg-muted/50 transition-colors"
              >
                <div className="flex gap-3 items-center">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <CreditCard className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {payment.type === "registration"
                        ? "Item Registration"
                        : "Lost Report"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(payment.paymentDate || payment.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">
                    {payment.amount} {payment.currency}
                  </p>
                  <Badge
                    variant={getStatusBadgeVariant(payment.status) as any}
                    className="ml-2"
                  >
                    {payment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No payment transactions yet
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setLocation("/payment-history")}
        >
          View All Transactions
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}