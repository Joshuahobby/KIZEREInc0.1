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
  CreditCard,
  Award,
  Loader2,
  X,
  Download,
  ArrowLeftRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import { PaymentModal } from "@/components/payment/payment-modal";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { useState } from "react";
import { PageLayout } from "@/components/layout";
import { SEO } from "@/components/SEO";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function ItemDetailPage() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const itemId = parseInt(id || "");
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [showMarkFoundDialog, setShowMarkFoundDialog] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certPhone, setCertPhone] = useState("");
  const [certPurchasing, setCertPurchasing] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferQuery, setTransferQuery] = useState("");
  const [transferStep, setTransferStep] = useState<"search" | "confirm">("search");
  const [foundUser, setFoundUser] = useState<{ id: number; fullName: string | null; username: string; avatarUrl: string | null } | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [labelDownloading, setLabelDownloading] = useState(false);

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

  const isOwner = item && user && item.userId === user.id;

  const { data: certificates = [] } = useQuery<any[]>({
    queryKey: [`/api/items/${itemId}/certificates`],
    queryFn: () => apiRequest(`/api/items/${itemId}/certificates`),
    enabled: !!itemId && !!user && !!isOwner,
    staleTime: 30_000,
    retry: false,
  });

  const activeCert = certificates[0] ?? null;

  const handleCertPurchase = async () => {
    if (!certPhone.trim() || !item) return;
    setCertPurchasing(true);
    try {
      await apiRequest("/api/payments/initiate", {
        method: "POST",
        data: {
          type: "ownership_certificate",
          itemId: item.id,
          phoneNumber: certPhone.trim(),
        },
      });
      toast({
        title: t("consumer.certificate.initiated"),
        description: t("consumer.certificate.initiatedDesc"),
      });
      setCertModalOpen(false);
      setCertPhone("");
    } catch {
      toast({ title: "Purchase failed. Please try again.", variant: "destructive" });
    } finally {
      setCertPurchasing(false);
    }
  };

  const handleCertDownload = () => {
    if (!activeCert || !item) return;
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 8;
    ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

    // Title
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 28px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("KIZERE OWNERSHIP CERTIFICATE", canvas.width / 2, 80);

    // Item name
    ctx.font = "bold 22px sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(item.name, canvas.width / 2, 130);

    // Category
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText(item.category, canvas.width / 2, 160);

    // Cert code label
    ctx.fillStyle = "#3b82f6";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("CERTIFICATE CODE", canvas.width / 2, 230);

    // Cert code value
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px monospace";
    ctx.fillText(activeCert.certificateCode, canvas.width / 2, 285);

    // Identifier
    ctx.font = "14px sans-serif";
    ctx.fillStyle = "#475569";
    ctx.fillText(`Identifier: ${item.uniqueIdentifier}`, canvas.width / 2, 340);

    // Date
    const issuedDate = activeCert.createdAt
      ? new Date(activeCert.createdAt).toLocaleDateString("en-RW", { year: "numeric", month: "long", day: "numeric" })
      : "";
    ctx.fillText(`Issued: ${issuedDate}`, canvas.width / 2, 370);

    // Footer
    ctx.font = "italic 11px sans-serif";
    ctx.fillStyle = "#1e40af";
    ctx.fillText("KIZERE INC. — Official Ownership Certificate", canvas.width / 2, 460);

    const link = document.createElement("a");
    link.download = `KIZERE-Certificate-${activeCert.certificateCode}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleLabelDownload = async () => {
    if (!item) return;
    setLabelDownloading(true);
    try {
      const verifyUrl = `${window.location.origin}/verify/${encodeURIComponent(item.uniqueIdentifier)}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 300, margin: 1 });

      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 480;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("KIZERE", canvas.width / 2, 42);

      ctx.fillStyle = "#64748b";
      ctx.font = "11px sans-serif";
      ctx.fillText("Registered Item", canvas.width / 2, 60);

      const qrImg = new Image();
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = reject;
        qrImg.src = qrDataUrl;
      });
      ctx.drawImage(qrImg, 50, 75, 300, 300);

      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(item.name, canvas.width / 2, 400);

      ctx.fillStyle = "#64748b";
      ctx.font = "10px monospace";
      ctx.fillText(item.uniqueIdentifier, canvas.width / 2, 420);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "9px sans-serif";
      ctx.fillText("Scan to verify ownership at kizere.rw", canvas.width / 2, 460);

      const link = document.createElement("a");
      link.download = `KIZERE-Label-${item.uniqueIdentifier}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      toast({ title: "Failed to generate label", variant: "destructive" });
    } finally {
      setLabelDownloading(false);
    }
  };

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

  const transferMutation = useMutation({
    mutationFn: async (recipientId: number) => {
      await apiRequest(`/api/items/${itemId}/transfer`, {
        method: "POST",
        data: { recipientId },
      });
    },
    onSuccess: () => {
      toast({ title: t("consumer.transfer.success"), description: t("consumer.transfer.successDesc") });
      setTransferModalOpen(false);
      setTransferQuery("");
      setFoundUser(null);
      setTransferStep("search");
      navigate("/dashboard");
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: t("consumer.transfer.failed"), description: err.message || t("consumer.transfer.failedDesc") });
    },
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
      {item && (
        <SEO
          title={`${item.name} | KIZERE`}
          description={item.description || `View details for ${item.name} on KIZERE.`}
          image={item.imageUrls?.[0]}
        />
      )}
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
                      disabled={item.status === 'Pending_Payment' || labelDownloading}
                      onClick={item.status !== 'Pending_Payment' ? handleLabelDownload : undefined}
                    >
                      {item.status === 'Pending_Payment'
                        ? 'Payment Required'
                        : labelDownloading
                          ? 'Generating…'
                          : 'Download Label'}
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

              {isOwner && (
                <Button
                  className="w-full justify-between bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-border/40 dark:border-white/10 hover:border-primary/30 hover:bg-primary/5 transition-all text-foreground group h-12"
                  variant="outline"
                  onClick={() => setCertModalOpen(true)}
                >
                  <span className="flex items-center font-bold">
                    <Award className="mr-3 h-4 w-4 text-sky-500" />
                    {activeCert ? t("consumer.certificate.view") : t("consumer.certificate.get")}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Button>
              )}

              {isOwner && item.status === "Registered" && (
                <Button
                  className="w-full justify-between bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-border/40 dark:border-white/10 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all text-foreground group h-12"
                  variant="outline"
                  onClick={() => { setTransferStep("search"); setFoundUser(null); setLookupError(null); setTransferQuery(""); setTransferModalOpen(true); }}
                >
                  <span className="flex items-center font-bold">
                    <ArrowLeftRight className="mr-3 h-4 w-4 text-violet-500" />
                    {t("consumer.transfer.button")}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Button>
              )}

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
      {/* Transfer Ownership Modal */}
      <Dialog open={transferModalOpen} onOpenChange={(open) => {
        setTransferModalOpen(open);
        if (!open) { setTransferStep("search"); setTransferQuery(""); setFoundUser(null); setLookupError(null); }
      }}>
        <DialogContent className="sm:max-w-[420px] rounded-3xl p-0 overflow-hidden border-none">
          <div className="bg-gradient-to-b from-violet-500/10 to-background p-8 pt-10 text-center relative">
            <button
              type="button"
              title="Close"
              onClick={() => setTransferModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground/40 hover:text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="h-16 w-16 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowLeftRight className="h-8 w-8 text-violet-500" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-black tracking-tight">
                {transferStep === "search" ? t("consumer.transfer.title") : t("consumer.transfer.confirm")}
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed mt-2">
                {transferStep === "search"
                  ? t("consumer.transfer.subtitle")
                  : t("consumer.transfer.confirmDesc", { item: item?.name ?? "", user: foundUser?.fullName || foundUser?.username || "" })}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-8 pb-8 space-y-3">
            {transferStep === "search" ? (
              <>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                    {t("consumer.transfer.inputLabel")}
                  </label>
                  <Input
                    value={transferQuery}
                    onChange={(e) => { setTransferQuery(e.target.value); setLookupError(null); setFoundUser(null); }}
                    placeholder={t("consumer.transfer.inputPlaceholder")}
                    className="h-12 rounded-xl"
                    type="text"
                  />
                </div>
                {lookupError && (
                  <p className="text-xs text-destructive font-medium">{lookupError}</p>
                )}
                {foundUser && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-black text-muted-foreground shrink-0 overflow-hidden">
                      {foundUser.avatarUrl
                        ? <img src={foundUser.avatarUrl} alt="" className="h-full w-full object-cover" />
                        : (foundUser.fullName || foundUser.username).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{foundUser.fullName || foundUser.username}</p>
                      <p className="text-xs text-muted-foreground truncate">@{foundUser.username}</p>
                    </div>
                  </div>
                )}
                <Button
                  type="button"
                  onClick={async () => {
                    const q = transferQuery.trim();
                    if (q.length < 3) { setLookupError(t("consumer.transfer.minChars")); return; }
                    if (foundUser) { setTransferStep("confirm"); return; }
                    setLookupLoading(true);
                    setLookupError(null);
                    try {
                      const data = await apiRequest<{ id: number; fullName: string | null; username: string; avatarUrl: string | null }>(
                        `/api/items/transfer/lookup?q=${encodeURIComponent(q)}`
                      );
                      setFoundUser(data);
                    } catch (err: any) {
                      setLookupError(err?.message || "User not found");
                    } finally {
                      setLookupLoading(false);
                    }
                  }}
                  disabled={lookupLoading || transferQuery.trim().length < 3}
                  className="w-full h-12 rounded-xl font-bold"
                >
                  {lookupLoading
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {t("consumer.transfer.lookingUp")}</>
                    : foundUser
                      ? <><ArrowLeftRight className="h-4 w-4 mr-2" /> {t("consumer.transfer.continueWith", { name: foundUser.fullName || foundUser.username })}</>
                      : t("consumer.transfer.findUser")}
                </Button>
              </>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/20 text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-destructive mb-1">{t("consumer.transfer.irreversible")}</p>
                  <p className="text-sm text-foreground/80">
                    {t("consumer.transfer.warning", { item: item?.name ?? "", user: foundUser?.fullName || foundUser?.username || "" })}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => foundUser && transferMutation.mutate(foundUser.id)}
                  disabled={transferMutation.isPending || !foundUser}
                  variant="destructive"
                  className="w-full h-12 rounded-xl font-bold"
                >
                  {transferMutation.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {t("consumer.transfer.transferring")}</>
                    : t("consumer.transfer.confirmBtn")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setTransferStep("search")}
                  className="w-full h-10 rounded-xl text-xs text-muted-foreground"
                >
                  {t("consumer.transfer.goBack")}
                </Button>
              </>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => setTransferModalOpen(false)}
              className="w-full h-10 rounded-xl text-xs text-muted-foreground"
            >
              {t("consumer.transfer.cancel")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Certificate Modal */}
      <Dialog open={certModalOpen} onOpenChange={setCertModalOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-3xl p-0 overflow-hidden border-none">
          <div className="bg-gradient-to-b from-sky-500/10 to-background p-8 pt-10 text-center relative">
            <button
              type="button"
              title="Close"
              onClick={() => setCertModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground/40 hover:text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="h-16 w-16 bg-sky-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="h-8 w-8 text-sky-500" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-black tracking-tight">
                {activeCert ? t("consumer.certificate.title") : t("consumer.certificate.get")}
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed mt-2">
                {activeCert
                  ? `${t("consumer.certificate.certCode")}: ${activeCert.certificateCode}`
                  : t("consumer.certificate.noCertDesc")}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-8 pb-8 space-y-4">
            {activeCert ? (
              <>
                <div className="p-4 rounded-2xl bg-muted/40 border border-border/30 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t("consumer.certificate.certCode")}</p>
                  <p className="font-mono text-xl font-black tracking-widest text-foreground">{activeCert.certificateCode}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Issued {activeCert.createdAt ? new Date(activeCert.createdAt).toLocaleDateString("en-RW", { year: "numeric", month: "long", day: "numeric" }) : ""}
                  </p>
                </div>
                <Button onClick={handleCertDownload} className="w-full h-12 rounded-xl font-bold">
                  <Download className="h-4 w-4 mr-2" />
                  {t("consumer.certificate.download")}
                </Button>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                    {t("consumer.certificate.momoLabel")}
                  </label>
                  <Input
                    value={certPhone}
                    onChange={(e) => setCertPhone(e.target.value)}
                    placeholder={t("consumer.certificate.momoPlaceholder")}
                    className="h-12 rounded-xl"
                    type="tel"
                  />
                </div>
                <Button
                  onClick={handleCertPurchase}
                  disabled={certPurchasing || !certPhone.trim()}
                  className="w-full h-12 rounded-xl font-bold"
                >
                  {certPurchasing
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {t("consumer.certificate.purchasing")}</>
                    : <><Award className="h-4 w-4 mr-2" /> {t("consumer.certificate.purchase")}</>}
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              onClick={() => setCertModalOpen(false)}
              className="w-full h-10 rounded-xl text-xs text-muted-foreground"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout >
  );
}
