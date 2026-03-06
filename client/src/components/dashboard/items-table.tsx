import React from "react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Item } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Eye, MoreHorizontal, Pencil, Trash, QrCode, AlertTriangle, DollarSign } from "lucide-react";
import { ReportRegisteredItemDialog } from "@/components/reports/report-registered-item-dialog";
import { PaymentModal } from "@/components/payment/payment-modal";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface ItemsTableProps {
  items: Item[];
  isLoading?: boolean;
  showHeader?: boolean;
}

export const ItemsTable: React.FC<ItemsTableProps> = ({
  items = [],
  isLoading = false,
  showHeader = true,
}) => {
  const [, navigate] = useLocation();
  const [reportItem, setReportItem] = useState<Item | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [paymentItem, setPaymentItem] = useState<Item | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleReportLost = (item: Item) => {
    setReportItem(item);
    setIsReportDialogOpen(true);
  };

  // Format registration date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle view item click
  const handleViewItem = (itemId: number) => {
    navigate(`/items/${itemId}`);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    let className = '';

    switch (status.toLowerCase()) {
      case 'registered':
        className = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        break;
      case 'pending_payment':
      case 'pending':
        className = 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
        break;
      case 'lost':
        className = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        break;
      default:
        className = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }

    return (
      <Badge variant="outline" className={className}>
        {status === 'Pending_Payment' ? 'Unpaid' : status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-md" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No items found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate('/register-item')}
        >
          Register Your First Item
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full divide-y divide-border/50 bg-background rounded-md">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-center space-x-4 min-w-0">
            {item.imageUrls && item.imageUrls.length > 0 ? (
              <div className="h-12 w-12 rounded-md bg-muted overflow-hidden flex-shrink-0 border border-border">
                <img
                  src={item.imageUrls[0]}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                <QrCode className="h-6 w-6 text-primary" />
              </div>
            )}
            <div className="flex flex-col overflow-hidden">
              <span className="font-semibold text-foreground truncate">{item.name}</span>
              <span className="font-mono text-xs text-muted-foreground truncate opacity-80">
                {item.uniqueIdentifier ? `SN: ${item.uniqueIdentifier}` : item.category}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4 ml-4 shrink-0">
            <div className="hidden sm:block">
              {getStatusBadge(item.status)}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleViewItem(item.id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  <span>View Details</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>Edit Item</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <QrCode className="mr-2 h-4 w-4" />
                  <span>Generate QR Code</span>
                </DropdownMenuItem>

                {item.status === 'Registered' && (
                  <DropdownMenuItem
                    onClick={() => handleReportLost(item)}
                    className="text-amber-600 focus:text-amber-700"
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    <span>Report as Lost</span>
                  </DropdownMenuItem>
                )}

                {item.status === 'Pending_Payment' && (
                  <DropdownMenuItem
                    onClick={() => {
                      setPaymentItem(item);
                      setIsPaymentModalOpen(true);
                    }}
                    className="text-amber-600 font-bold focus:text-amber-700 bg-amber-50 dark:bg-amber-900/10"
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    <span>Pay Now</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 dark:text-red-400">
                  <Trash className="mr-2 h-4 w-4" />
                  <span>Delete Item</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}

      {reportItem && (
        <ReportRegisteredItemDialog
          item={reportItem}
          open={isReportDialogOpen}
          onOpenChange={setIsReportDialogOpen}
        />
      )}

      {paymentItem && (
        <PaymentModal
          open={isPaymentModalOpen}
          onOpenChange={setIsPaymentModalOpen}
          paymentDetails={{
            type: 'registration',
            itemId: paymentItem.id,
            amount: 2000
          }}
          onPaymentSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/items"] });
          }}
        />
      )}
    </div>
  );
};