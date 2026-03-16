import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableFooter
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, Search, Download, MoreHorizontal, RefreshCw, AlertCircle, Calendar, DollarSign, CreditCard, Users, BarChart3 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { AuthWall } from "@/components/ui/auth-wall";
import { PageLayout } from "@/components/layout/page-layout";
import { DEFAULT_CURRENCY } from "@/config/payment.config";
import { CommandCenterLayout } from "@/components/layouts/command-center-layout";
import { waitForAuthSync } from "@/lib/queryClient";

// Placeholder for real data fetching
interface PaymentTransaction {
  id: number;
  userId: number;
  username: string;
  transactionRef: string;
  amount: string;
  currency: string;
  type: string;
  status: string;
  paymentDate: string | null;
  createdAt: string;
}

// Revenue summary interface
interface RevenueSummary {
  totalRevenue: number;
  registrationRevenue: number;
  lostReportRevenue: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
}

export default function AdminPaymentDashboard() {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const { toast } = useToast();

  if (!user && !isLoadingAuth) {
    return (
      <PageLayout>
        <div className="container max-w-7xl mx-auto py-20 flex items-center justify-center">
          <AuthWall returnUrl="/admin/payment-dashboard" />
        </div>
      </PageLayout>
    );
  }
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("_all_statuses");
  const [typeFilter, setTypeFilter] = useState<string>("_all_types");
  const [dateRange, setDateRange] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // Check if user has admin role
  const isAdmin = user?.role === "Admin";

  // Revenue summary query
  const {
    data: revenueSummary,
    isLoading: isRevenueSummaryLoading,
    refetch: refetchRevenueSummary
  } = useQuery<RevenueSummary>({
    queryKey: ["/api/admin/payments/summary"],
    queryFn: async () => {
      return apiRequest("/api/admin/payments/summary");
    },
    enabled: !!isAdmin,
  });

  // Payments table query with pagination and filters
  const {
    data: paymentsData,
    isLoading: isPaymentsLoading,
    error: paymentsError,
    refetch: refetchPayments
  } = useQuery<{ transactions: PaymentTransaction[], total: number }>({
    queryKey: ["/api/admin/payments", page, statusFilter, typeFilter, dateRange, searchTerm],
    queryFn: async () => {
      // Build query parameters
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("pageSize", pageSize.toString());

      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter && !statusFilter.startsWith("_all_")) params.append("status", statusFilter);
      if (typeFilter && !typeFilter.startsWith("_all_")) params.append("type", typeFilter);
      if (dateRange && dateRange !== "all") params.append("dateRange", dateRange);

      const data = await apiRequest(`/api/admin/payments?${params.toString()}`);
      setTotalPages(Math.ceil(data.total / pageSize));
      return data;
    },
    enabled: !!isAdmin,
  });

  // Effect to show error toast if query fails
  useEffect(() => {
    if (paymentsError) {
      toast({
        title: "Error",
        description: paymentsError instanceof Error
          ? paymentsError.message
          : "Failed to load payment data",
        variant: "destructive"
      });
    }
  }, [paymentsError, toast]);

  // Handle refund action
  const handleRefund = async (transactionId: number, transactionRef: string) => {
    if (!confirm(`Are you sure you want to process a refund for transaction ${transactionRef}?`)) {
      return;
    }

    try {
      await apiRequest(`/api/admin/payments/refund/${transactionId}`, {
        method: "POST"
      });

      toast({
        title: "Refund processed",
        description: "The refund has been successfully processed",
      });

      // Refresh data
      refetchPayments();
      refetchRevenueSummary();
    } catch (error) {
      toast({
        title: "Refund failed",
        description: error instanceof Error ? error.message : "Failed to process the refund",
        variant: "destructive"
      });
    }
  };

  // Function to export payment data as CSV
  const exportTransactions = async () => {
    try {
      // Build query parameters for export (all data, not just current page)
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter && !statusFilter.startsWith("_all_")) params.append("status", statusFilter);
      if (typeFilter && !typeFilter.startsWith("_all_")) params.append("type", typeFilter);
      if (dateRange && dateRange !== "all") params.append("dateRange", dateRange);

      // We need to handle this differently as we need text data, not JSON
      await waitForAuthSync();
      const res = await fetch(`/api/admin/payments/export?${params.toString()}`, {
        method: "GET",
        credentials: "include"
      });

      if (!res.ok) {
        throw new Error("Failed to export payment data");
      }

      // Get the CSV data and create a download link
      const csvData = await res.text();
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment-transactions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export successful",
        description: "Payment data has been exported as CSV",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export payment data",
        variant: "destructive"
      });
    }
  };

  // Function to get status badge variant
  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" | "success" => {
    switch (status) {
      case "successful": return "success";
      case "pending": return "outline";
      case "failed": case "cancelled": return "destructive";
      case "refunded": return "secondary";
      default: return "default";
    }
  };

  // Function to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "PPP p");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Function to get payment type display name
  const getPaymentTypeDisplay = (type: string) => {
    switch (type) {
      case "registration": return "Item Registration";
      case "lost_report": return "Lost Item Report";
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  // Function to clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("_all_statuses");
    setTypeFilter("_all_types");
    setDateRange("all");
    setPage(1);
  };

  // If user is not admin, show access denied
  if (!isAdmin) {
    return (
      <CommandCenterLayout>
        <div className="max-w-5xl mx-auto px-4 py-10">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <AlertCircle className="h-16 w-16 text-amber-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground text-center">
                You need administrator permissions to access the payment dashboard.
              </p>
            </CardContent>
          </Card>
        </div>
      </CommandCenterLayout>
    );
  }

  return (
    <CommandCenterLayout>
      <div className="container py-8">
        <div className="flex flex-col space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payment Dashboard</h1>
            <p className="text-muted-foreground">
              Manage and analyze payment transactions across the platform
            </p>
          </div>

          {/* Revenue Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isRevenueSummaryLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {(revenueSummary?.totalRevenue || 0).toLocaleString()} {DEFAULT_CURRENCY}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      From {revenueSummary?.successfulTransactions || 0} successful transactions
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Registration Revenue</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isRevenueSummaryLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {(revenueSummary?.registrationRevenue || 0).toLocaleString()} {DEFAULT_CURRENCY}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      From item registration fees
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lost Report Revenue</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isRevenueSummaryLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {(revenueSummary?.lostReportRevenue || 0).toLocaleString()} {DEFAULT_CURRENCY}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      From lost item report fees
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transaction Stats</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isRevenueSummaryLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {((revenueSummary?.successfulTransactions || 0) /
                        ((revenueSummary?.successfulTransactions || 0) +
                          (revenueSummary?.failedTransactions || 0)) * 100).toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Success rate ({revenueSummary?.pendingTransactions || 0} pending)
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Transactions</CardTitle>
              <CardDescription>
                Manage and filter payment transactions across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters and Actions */}
              <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
                <div className="grid gap-2 flex-1">
                  <div className="flex gap-2">
                    {/* Search input */}
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search transactions..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        refetchPayments();
                        refetchRevenueSummary();
                      }}
                      title="Refresh data"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {/* Status filter */}
                    <Select
                      value={statusFilter}
                      onValueChange={(value) => setStatusFilter(value)}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Status: All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all_statuses">Status: All</SelectItem>
                        <SelectItem value="successful">Successful</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Type filter */}
                    <Select
                      value={typeFilter}
                      onValueChange={(value) => setTypeFilter(value)}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Type: All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all_types">Type: All</SelectItem>
                        <SelectItem value="registration">Registration</SelectItem>
                        <SelectItem value="lost_report">Lost Report</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Date Range filter */}
                    <Select
                      value={dateRange}
                      onValueChange={setDateRange}
                    >
                      <SelectTrigger className="w-[160px]">
                        <Calendar className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Date range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="yesterday">Yesterday</SelectItem>
                        <SelectItem value="week">This week</SelectItem>
                        <SelectItem value="month">This month</SelectItem>
                        <SelectItem value="year">This year</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Clear Filters */}
                    {(searchTerm || statusFilter !== "_all_statuses" || typeFilter !== "_all_types" || dateRange !== "all") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-10"
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                </div>

                {/* Export button */}
                <Button
                  variant="outline"
                  onClick={exportTransactions}
                  className="min-w-[120px]"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>

              {/* Transactions Table */}
              {isPaymentsLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : paymentsData?.transactions.length === 0 ? (
                <div className="h-80 flex flex-col items-center justify-center text-center">
                  <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-1">No transactions found</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    {searchTerm || statusFilter !== "_all_statuses" || typeFilter !== "_all_types" || dateRange !== "all"
                      ? "Try adjusting your search filters to find what you're looking for."
                      : "There are no payment transactions recorded in the system yet."}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentsData?.transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-mono text-xs">
                            {transaction.transactionRef}
                          </TableCell>
                          <TableCell>{transaction.username}</TableCell>
                          <TableCell>
                            {Number(transaction.amount).toLocaleString()} {transaction.currency}
                          </TableCell>
                          <TableCell>
                            {getPaymentTypeDisplay(transaction.type)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(transaction.status)}>
                              {transaction.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(transaction.paymentDate || transaction.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => window.open(`/admin/payments/${transaction.id}`, "_blank")}
                                >
                                  View details
                                </DropdownMenuItem>
                                {transaction.status === "successful" && (
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() => handleRefund(transaction.id, transaction.transactionRef)}
                                  >
                                    Process refund
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {!isPaymentsLoading && (paymentsData?.transactions?.length ?? 0) > 0 && (
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing <span className="font-medium">{paymentsData?.transactions?.length ?? 0}</span>{" "}
                    of <span className="font-medium">{paymentsData?.total ?? 0}</span> transactions
                  </div>

                  {totalPages > 1 && (
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </CommandCenterLayout>
  );
}