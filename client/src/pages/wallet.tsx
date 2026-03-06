
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Payment } from "@shared/schema";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, CreditCard, CheckCircle, XCircle, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function WalletPage() {
    const { data: payments, isLoading } = useQuery<Payment[]>({
        queryKey: ["/api/payments/history"],
        queryFn: async () => {
            const res = await apiRequest<Payment[]>("/api/payments/history");
            return res;
        }
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "successful":
            case "completed":
                return (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                        <CheckCircle className="w-3 h-3 mr-1" /> Successful
                    </Badge>
                );
            case "pending":
                return (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                        <Clock className="w-3 h-3 mr-1" /> Pending
                    </Badge>
                );
            case "failed":
                return (
                    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                        <XCircle className="w-3 h-3 mr-1" /> Failed
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "registration": return "Item Registration";
            case "lost_report": return "Lost Item Report";
            case "bounty": return "Bounty Payment";
            default: return type.replace('_', ' ');
        }
    };

    return (
        <div className="container mx-auto p-4 space-y-6">
            <DashboardPageHeader
                title="My Wallet"
                description="Manage your payments and transaction history"
                actions={
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border">
                        <CreditCard className="w-4 h-4" />
                        <span>Secure Payments via PawaPay</span>
                    </div>
                }
            />

            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>All your past payments and transactions on KIZERE.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : !payments || payments.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <CreditCard className="mx-auto h-12 w-12 opacity-20 mb-3" />
                            <p>No transactions found.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Reference</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                {payment.transactionRef}
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(payment.createdAt), "MMM d, yyyy HH:mm")}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {getTypeLabel(payment.type)}
                                            </TableCell>
                                            <TableCell>
                                                {formatCurrency(Number(payment.amount), payment.currency)}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
