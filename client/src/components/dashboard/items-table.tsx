import React from "react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
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
import { Eye, MoreHorizontal, Pencil, Trash, QrCode, AlertTriangle, DollarSign, Package, Shield, PlusCircle } from "lucide-react";
import { ReportRegisteredItemDialog } from "@/components/reports/report-registered-item-dialog";
import { motion, AnimatePresence } from "framer-motion";
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
        className = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }

    return (
      <Badge variant="secondary" className={cn("px-2 py-0.5 text-[10px] uppercase font-semibold tracking-wider border-none shadow-sm", className)}>
        {status === 'Pending_Payment' ? 'Unpaid' : status}
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
      <div className="py-12 sm:py-16 flex flex-col items-center justify-center px-4 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative mb-6 group">
          <motion.div
            className="absolute -inset-6 bg-gradient-to-br from-primary/20 to-blue-500/10 rounded-full blur-2xl"
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="relative h-20 w-20 sm:h-24 sm:w-24 bg-background/60 rounded-3xl flex items-center justify-center border border-muted/30 backdrop-blur-xl shadow-xl"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Shield className="h-10 w-10 sm:h-12 sm:w-12 text-primary/60" />
          </motion.div>
        </div>

        <h3 className="text-lg sm:text-xl font-bold tracking-tight mb-2 text-center text-foreground">
          Your Vault is Empty
        </h3>
        <p className="text-sm text-muted-foreground max-w-[250px] text-center mb-6 opacity-80 leading-relaxed font-medium">
          Register your physical assets and sensitive documents to secure them against loss.
        </p>

        <Button
          variant="default"
          onClick={() => navigate("/register-item")}
          className="rounded-full px-8 h-11 bg-primary hover:bg-primary/90 font-bold transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5"
        >
          <PlusCircle className="mr-2 h-4 w-4 text-white" />
          Secure First Item
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full divide-y divide-border/50 bg-background rounded-md">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between p-3 sm:px-4 hover:bg-muted/30 dark:hover:bg-white/5 transition-colors group cursor-pointer">
          <div className="flex items-center space-x-4 min-w-0" onClick={() => handleViewItem(item.id)}>
            {item.imageUrls && item.imageUrls.length > 0 ? (
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-muted overflow-hidden flex-shrink-0 border border-border/50 group-hover:border-primary/30 transition-colors">
                <img
                  src={item.imageUrls[0]}
                  alt={item.name}
                  className="h-full w-full object-cover"
                  width={48}
                  height={48}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ) : (
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0 border border-primary/10 group-hover:border-primary/30 transition-colors">
                <QrCode className="h-5 w-5 sm:h-6 sm:w-6 text-primary/70" />
              </div>
            )}
            <div className="flex flex-col overflow-hidden">
              <span className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">{item.name}</span>
              <span className="font-mono text-[10px] sm:text-xs text-muted-foreground truncate opacity-80 mt-0.5">
                {item.uniqueIdentifier ? `SN: ${item.uniqueIdentifier}` : item.category}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4 ml-4 shrink-0">
            <div className="hidden sm:block">
              {getStatusBadge(item.status)}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
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
          }}
          onPaymentSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/items"] });
          }}
        />
      )}
    </div>
  );
};