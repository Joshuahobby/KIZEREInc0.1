import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface Transaction {
  id: number;
  transactionRef: string;
  amount: string | number;
  currency: string;
  status: string;
  type: string;
  createdAt: string;
  username: string;
}

interface RecentTransactionsProps {
  transactions?: Transaction[];
  isLoading?: boolean;
}

export function RecentTransactions({ transactions = [], isLoading = false }: RecentTransactionsProps) {
  const { t } = useLanguage();
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
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Function to get payment type display name
  const getPaymentTypeDisplay = (type: string) => {
    switch (type) {
      case "registration": return t('dashboard.table.itemRegistration');
      case "lost_report": return t('dashboard.table.lostItemReport');
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  return (
    <Card className="col-span-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-medium">{t('dashboard.admin.recentTransactions')}</CardTitle>
          <CardDescription>{t('dashboard.table.latestPaymentActivity')}</CardDescription>
        </div>
        <Link href="/admin/payment-dashboard">
          <Button variant="ghost" size="sm" className="gap-1">
            {t('dashboard.table.viewAll')} <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-8 text-muted-foreground">
            <p>{t('dashboard.table.noRecentTransactions')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{transaction.username}</span>
                  <span className="text-sm text-muted-foreground">
                    {getPaymentTypeDisplay(transaction.type)} - {formatDate(transaction.createdAt)}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-medium">
                    {typeof transaction.amount === 'string' ? transaction.amount : transaction.amount.toLocaleString()} {transaction.currency}
                  </span>
                  <Badge variant={getStatusBadgeVariant(transaction.status)}>
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}