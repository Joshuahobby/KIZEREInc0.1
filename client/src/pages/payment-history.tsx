import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { PaymentService, PaymentHistoryItem } from "@/services/payment.service";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, DollarSign, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { AuthWall } from "@/components/ui/auth-wall";
import { PageLayout } from "@/components/layout/page-layout";

export default function PaymentHistory() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [, setLocation] = useLocation();
  const { user, isLoading: isLoadingAuth } = useAuth();

  // Fetch payment history
  const {
    data: payments,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ["/api/payments"],
    queryFn: () => PaymentService.getPaymentHistory(),
    enabled: !!user
  });

  if (!user && !isLoadingAuth) {
    return (
      <PageLayout>
        <div className="container max-w-7xl mx-auto py-20 flex items-center justify-center">
          <AuthWall returnUrl="/payment-history" />
        </div>
      </PageLayout>
    );
  }

  // Display error toast if fetch fails
  useEffect(() => {
    if (isError) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch payment history",
        variant: "destructive"
      });
    }
  }, [isError, error]);

  // Filter payments based on search term
  const filteredPayments = payments?.filter(payment => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      payment.transactionRef.toLowerCase().includes(searchLower) ||
      payment.type.toLowerCase().includes(searchLower) ||
      payment.status.toLowerCase().includes(searchLower) ||
      payment.amount.toString().includes(searchLower)
    );
  });

  // Function to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "PPP p");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Function to get badge color based on payment status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "successful":
        return "success";
      case "pending":
        return "warning";
      case "failed":
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  // Function to get payment type display name
  const getPaymentTypeDisplay = (type: string) => {
    switch (type) {
      case "registration":
        return "Item Registration";
      case "lost_report":
        return "Lost Item Report";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  return (
    <PageLayout>
      <div className="container py-10">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
            <p className="text-muted-foreground">
              View and manage your payment transactions
            </p>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <CardTitle>Payment Transactions</CardTitle>
                  <CardDescription>
                    Your payment history for all services
                  </CardDescription>
                </div>

                <div className="flex gap-2">
                  <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search payments..."
                      className="pl-8 w-full sm:w-[200px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => refetch()}
                    disabled={isLoading}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : payments && payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction Ref</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments?.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">
                            {payment.transactionRef.substring(0, 12)}...
                          </TableCell>
                          <TableCell>{getPaymentTypeDisplay(payment.type)}</TableCell>
                          <TableCell>{payment.amount} {payment.currency}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(payment.status) as any}>
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDate(payment.paymentDate || payment.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setLocation(`/payment-status?tx_ref=${payment.transactionRef}`)}
                            >
                              Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="rounded-full bg-muted p-4">
                    <DollarSign className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-medium">No payment history</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      You haven't made any payments yet.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => setLocation("/")}
                  >
                    Go to Dashboard
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}