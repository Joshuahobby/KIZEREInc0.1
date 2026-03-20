import {
  ArrowLeft,
  Package,
  Tag as TagIcon,
  Calendar,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Info,
  QrCode,
  Shield,
  FileText,
  Share2,
  Printer,
  ChevronRight,
  Edit,
  CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { PaymentModal } from "@/components/payment/payment-modal";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { useState } from "react";
import { PageLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShareWhatsAppButton } from "@/components/ui/share-whatsapp-button";
import { ReportRegisteredItemDialog } from "@/components/reports/report-registered-item-dialog";
import { AuthWall } from "@/components/ui/auth-wall";

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const itemId = parseInt(id || "");
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [showMarkFoundDialog, setShowMarkFoundDialog] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  if (!user) {
    return (
      <PageLayout>
        <AuthWall returnUrl={`/items/${itemId}`} />
      </PageLayout>
    );
  }

  const { data: item, isLoading, error } = useQuery<any>({
    queryKey: [`/api/items/${itemId}`],
    queryFn: () => apiRequest(`/api/items/${itemId}`),
    enabled: !!itemId && !!user
  });

  const markAsFoundMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/items/${itemId}/mark-found`, { method: 'POST' });
    },
    onSuccess: () => {
      toast({ title: "Item updated", description: "Your item has been marked as recovered." });
      queryClient.invalidateQueries({ queryKey: [`/api/items/${itemId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      setShowMarkFoundDialog(false);
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Failed to update item", description: err.message });
    }
  });

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container max-w-4xl mx-auto py-6 px-4">
          <Skeleton className="h-8 w-24 mb-6" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !item) {
    return (
      <PageLayout>
        <div className="container max-w-4xl mx-auto py-20 px-4 text-center">
          <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-full inline-block mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
          </div>
          <h1 className="text-xl font-bold mb-2">Item Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The item you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Link href="/my-items">
            <Button variant="default">
              Back to My Items
            </Button>
          </Link>
        </div>
      </PageLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'registered':
        return (
          <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 dark:bg-black/70 border-blue-500/20 shadow-xl backdrop-blur-md transition-all duration-300 font-black text-[10px] uppercase tracking-widest px-3 py-1.5 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            Registered
          </Badge>
        );
      case 'lost':
        return (
          <Badge className="bg-destructive/10 text-destructive dark:bg-black/80 border-destructive/30 animate-pulse shadow-xl backdrop-blur-md transition-all duration-300 font-black text-[10px] uppercase tracking-widest px-3 py-1.5 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
            Lost
          </Badge>
        );
      case 'found':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 dark:bg-black/70 border-emerald-500/20 shadow-xl backdrop-blur-md transition-all duration-300 font-black text-[10px] uppercase tracking-widest px-3 py-1.5 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            Found
          </Badge>
        );
      case 'recovered':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 dark:bg-black/70 border-emerald-500/20 shadow-xl backdrop-blur-md transition-all duration-300 font-black text-[10px] uppercase tracking-widest px-3 py-1.5 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            Recovered
          </Badge>
        );
      case 'pending_payment':
        return (
          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 dark:bg-black/70 border-amber-500/20 shadow-xl backdrop-blur-md transition-all duration-300 font-black text-[10px] uppercase tracking-widest px-3 py-1.5 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            Unpaid
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground dark:bg-black/70 border-white/10 shadow-xl backdrop-blur-md transition-all duration-300 font-black text-[10px] uppercase tracking-widest px-3 py-1.5 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-muted-foreground" />
            {status}
          </Badge>
        );
    }
  };

  return (
    <PageLayout>
      <div className="container max-w-4xl mx-auto py-4 md:py-8 px-4">
        {/* Breadcrumb / Back Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/my-items" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
          <div className="flex gap-2">
            <ShareWhatsAppButton
              itemName={item?.name || 'Item'}
              itemUrl={`${window.location.origin}/items/${itemId}`}
              size="sm"
              className="h-9 px-4 rounded-full font-bold shadow-sm"
              compact
            />
            <Button variant="outline" size="sm" className="h-9 rounded-full px-4 font-bold bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl border-slate-200/60 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm" onClick={() => {
              if (navigator.share) {
                navigator.share({ title: item?.name, url: `${window.location.origin}/items/${itemId}` });
              } else {
                navigator.clipboard.writeText(`${window.location.origin}/items/${itemId}`);
                toast({ title: 'Link copied!' });
              }
            }}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" className="h-9 rounded-full px-4 font-bold bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl border-slate-200/60 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-5 gap-6 md:gap-8">
          {/* Main Content - Left Side */}
          <div className="md:col-span-3 space-y-6">
            {item.status === 'Pending_Payment' && (
              <Card className="bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/20 shadow-none">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-amber-900 dark:text-amber-100">Registration Payment Required</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">Your item is registered but pending payment. Complete payment to activate full protection and access your smart label.</p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold whitespace-nowrap"
                    onClick={() => setIsPaymentModalOpen(true)}
                  >
                    Pay Now
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Header / Title Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-8"
            >
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
                {item.name}
              </h1>
              <p className={cn(
                "text-lg leading-relaxed max-w-3xl",
                item.description ? "text-muted-foreground dark:text-slate-300" : "text-muted-foreground/80 dark:text-slate-400/80 italic"
              )}>
                {item.description || "No detailed description was provided for this item during registration."}
              </p>
            </motion.div>

            {/* Bento Metadata Cards */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8"
            >
              <div className="bg-white shadow-sm border border-slate-100 dark:bg-slate-900/50 dark:border-white/10 rounded-xl p-4 flex flex-col justify-center transition-all hover:shadow-md hover:-translate-y-0.5 dark:hover:bg-slate-800/80">
                <label className="text-[10px] font-bold text-muted-foreground/80 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <TagIcon className="h-3 w-3 text-primary/80" />
                  Category
                </label>
                <span className="font-bold text-sm tracking-tight">{item.category}</span>
              </div>

              <div className="bg-white shadow-sm border border-slate-100 dark:bg-slate-900/50 dark:border-white/10 rounded-xl p-4 flex flex-col justify-center transition-all hover:shadow-md hover:-translate-y-0.5 dark:hover:bg-slate-800/80">
                <label className="text-[10px] font-bold text-muted-foreground/80 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-primary/80" />
                  Registered
                </label>
                <span className="font-bold text-sm tracking-tight">{format(new Date(item.registeredAt), 'MMM d, yyyy')}</span>
              </div>

              {item.location && (
                <div className="bg-white shadow-sm border border-slate-100 dark:bg-slate-900/50 dark:border-white/10 rounded-xl p-4 flex flex-col justify-center transition-all hover:shadow-md hover:-translate-y-0.5 dark:hover:bg-slate-800/80 col-span-2 md:col-span-1">
                  <label className="text-[10px] font-bold text-muted-foreground/80 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-primary/80" />
                    Last Location
                  </label>
                  <span className="font-bold text-sm tracking-tight line-clamp-1" title={item.location}>{item.location}</span>
                </div>
              )}
            </motion.div>

            {/* Image Section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
              className="relative overflow-hidden rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 backdrop-blur-xl aspect-[16/9] group border border-slate-200/60 dark:border-white/5 shadow-sm flex items-center justify-center p-4 mb-4"
            >
              {item.imageUrls && item.imageUrls.length > 0 ? (
                <>
                  <img
                    src={item.imageUrls[0]}
                    alt={item.name}
                    width={800}
                    height={450}
                    loading="eager"
                    decoding="async"
                    className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal drop-shadow-lg"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/40 bg-muted/10 rounded-xl border border-dashed border-border/50">
                  <Package className="h-16 w-16 mb-4 opacity-50 drop-shadow-sm" />
                  <p className="text-sm font-bold tracking-tight">No image available</p>
                </div>
              )}
              <div className="absolute top-4 left-4 z-10">
                {getStatusBadge(item.status)}
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Right Side */}
          <div className="md:col-span-2 space-y-4">
            {/* ID Card */}
            <Card className="bg-white shadow-sm dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-white/5 bg-gradient-to-b from-transparent to-slate-50/50 dark:to-slate-900/50 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
              <CardContent className="p-4 space-y-4 relative z-10">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-neutral-500 uppercase">Item ID</p>
                    <p className="font-mono text-sm font-bold mt-1 text-neutral-900 dark:text-white">{item.uniqueIdentifier}</p>
                  </div>
                  <Shield className="h-5 w-5 text-emerald-500" />
                </div>

                <div className={cn(
                  "p-3 rounded-lg border flex items-center gap-4 transition-colors",
                  item.status === 'Pending_Payment'
                    ? "bg-neutral-100/50 dark:bg-slate-800/50 border-border/40 dark:border-white/5 opacity-60"
                    : "bg-background/80 dark:bg-black/40 border-border/40 dark:border-white/5"
                )}>
                  <div className="h-12 w-12 bg-neutral-100 dark:bg-neutral-800 rounded flex items-center justify-center shrink-0">
                    <QrCode className={cn(
                      "h-8 w-8",
                      item.status === 'Pending_Payment' ? "text-neutral-400" : "text-neutral-900 dark:text-white"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {item.status === 'Pending_Payment' ? 'Smart Tag Inactive' : 'Smart Tag Active'}
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-sky-600 text-xs"
                      disabled={item.status === 'Pending_Payment'}
                    >
                      {item.status === 'Pending_Payment' ? 'Payment Required' : 'Download Label'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest pl-1 mb-3">Actions</p>

              {item.status === 'Registered' && (
                <Button
                  className="w-full justify-between bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-border/40 dark:border-white/10 hover:border-destructive/30 hover:bg-destructive/5 transition-all text-destructive dark:text-red-400 group h-12"
                  variant="outline"
                  onClick={() => setIsReportDialogOpen(true)}
                >
                  <span className="flex items-center font-bold">
                    <AlertTriangle className="mr-3 h-4 w-4" />
                    Report Lost
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Button>
              )}

              {item.status === 'Lost' && (
                <Button
                  className="w-full justify-between bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all h-12 group"
                  variant="outline"
                  onClick={() => setShowMarkFoundDialog(true)}
                  disabled={markAsFoundMutation.isPending}
                >
                  <span className="flex items-center font-bold">
                    <CheckCircle className="mr-3 h-4 w-4" />
                    {markAsFoundMutation.isPending ? "Updating..." : "Mark Found"}
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Button>
              )}

              {item.status === 'Pending_Payment' && (
                <Button
                  className="w-full justify-between bg-amber-500 hover:bg-amber-600 text-white border-none shadow-lg shadow-amber-500/20 h-12 group transition-all"
                  onClick={() => setIsPaymentModalOpen(true)}
                >
                  <span className="flex items-center font-bold">
                    <CreditCard className="mr-3 h-4 w-4" />
                    Complete Registration
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Button>
              )}

              <Button
                className="w-full justify-between bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-border/40 dark:border-white/10 hover:border-primary/30 hover:bg-primary/5 transition-all text-foreground group h-12"
                variant="outline"
              >
                <span className="flex items-center font-bold">
                  <FileText className="mr-3 h-4 w-4 text-sky-500" />
                  View Certificate
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Button>

              <Button
                className="w-full justify-between bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-border/40 dark:border-white/10 hover:border-primary/30 hover:bg-primary/5 transition-all text-foreground group h-12"
                variant="outline"
                onClick={() => navigate(`/items/${item.id}/edit`)}
              >
                <span className="flex items-center font-bold">
                  <Edit className="mr-3 h-4 w-4 text-muted-foreground" />
                  Edit Details
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ReportRegisteredItemDialog
        item={item}
        open={isReportDialogOpen}
        onOpenChange={setIsReportDialogOpen}
      />

      <AlertDialog open={showMarkFoundDialog} onOpenChange={setShowMarkFoundDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Found your item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark your item as "Recovered" and any associated lost reports will be resolved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                markAsFoundMutation.mutate();
              }}
              className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
            >
              Confirm Recovered
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {
        item && (
          <PaymentModal
            open={isPaymentModalOpen}
            onOpenChange={setIsPaymentModalOpen}
            paymentDetails={{
              type: 'registration',
              itemId: item.id,
            }}
            onPaymentSuccess={() => {
              queryClient.invalidateQueries({ queryKey: [`/api/items/${itemId}`] });
              queryClient.invalidateQueries({ queryKey: ['/api/items'] });
            }}
          />
        )
      }
    </PageLayout >
  );
}
