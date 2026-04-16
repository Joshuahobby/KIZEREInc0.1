import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Search,
  Loader2,
  Lock,
  LogIn,
  Fingerprint,
  User,
  Calendar,
  Tag,
  Phone,
  Mail,
  RefreshCw,
  Crown,
  X,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FreeSummary {
  identifier: string;
  isRegistered: boolean;
  isFlagged: boolean;
  status: string | null;
  category: string | null;
}

interface FullReport extends FreeSummary {
  name: string | null;
  registeredAt: string | null;
  owner: {
    fullName: string;
    email: string;
    phoneNumber: string;
  } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "***";
  return `${email[0]}***${email.slice(at)}`;
}

function maskPhone(phone: string): string {
  if (phone.length <= 7) return phone;
  return `${phone.slice(0, 7)}***${phone.slice(-3)}`;
}

function is402(err: unknown): boolean {
  return err instanceof Error && err.message.startsWith("402:");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConsumerVerifyPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [identifier, setIdentifier] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [freeSummary, setFreeSummary] = useState<FreeSummary | null>(null);
  const [fullReport, setFullReport] = useState<FullReport | null>(null);

  const [summaryLoading, setSummaryLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // Polling state after payment initiation
  const [pendingRef, setPendingRef] = useState<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollAttempts = useRef(0);
  const MAX_POLLS = 24; // 2 minutes at 5-second intervals

  // Read ?id= or ?q= from URL on first mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id") || params.get("q");
    if (id) {
      setIdentifier(id);
      doLookup(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for full report after purchase
  useEffect(() => {
    if (!pendingRef || !activeId || !user) return;

    pollTimer.current = setTimeout(() => {
      pollAttempts.current += 1;
      if (pollAttempts.current > MAX_POLLS) {
        setPendingRef(null);
        toast({
          title: "Payment taking longer than expected",
          description: "Your MoMo payment may still be processing. Refresh the page in a few minutes to check your report.",
        });
        return;
      }
      fetchFullReport(activeId, /* fromPoll */ true);
    }, 5000);

    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingRef, activeId, user, pollAttempts.current]);

  // ─── API calls ─────────────────────────────────────────────────────────────

  const doLookup = async (id: string) => {
    const searchId = id.trim();
    if (!searchId) return;

    setActiveId(searchId);
    setFreeSummary(null);
    setFullReport(null);
    setPendingRef(null);
    pollAttempts.current = 0;
    setSummaryLoading(true);

    try {
      const data = await apiRequest<FreeSummary>(
        `/api/consumer/verify/${encodeURIComponent(searchId)}`
      );
      setFreeSummary(data ?? null);
    } catch (err) {
      toast({ title: "Lookup failed. Please try again.", variant: "destructive" });
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchFullReport = async (id: string, fromPoll = false) => {
    if (!user) return;
    setReportLoading(true);
    try {
      const data = await apiRequest<FullReport>(
        `/api/consumer/verify/${encodeURIComponent(id)}/report`
      );
      if (data) {
        setFullReport(data);
        setPendingRef(null);
        if (fromPoll) {
          toast({ title: "Report ready", description: "Your full verification report has been loaded." });
        }
      }
    } catch (err) {
      if (is402(err)) {
        if (fromPoll) {
          // Still waiting — re-trigger poll effect by bumping a counter
          setPendingRef(r => r); // identity update re-schedules the effect
        } else {
          setPurchaseOpen(true);
        }
      } else {
        toast({ title: "Failed to fetch report", variant: "destructive" });
      }
    } finally {
      setReportLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!activeId || !phoneNumber.trim()) return;
    setPurchaseLoading(true);
    try {
      const data = await apiRequest<any>(
        `/api/consumer/verify/${encodeURIComponent(activeId)}/purchase`,
        { method: "POST", data: { phoneNumber: phoneNumber.trim() } }
      );

      if (data?.alreadyPurchased) {
        setPurchaseOpen(false);
        fetchFullReport(activeId);
        return;
      }

      setPendingRef(data?.transactionRef ?? "pending");
      setPurchaseOpen(false);
      pollAttempts.current = 0;
      toast({
        title: "Payment initiated",
        description: "Check your phone for the MoMo prompt. Your report will load automatically once payment is confirmed.",
      });
    } catch (err) {
      toast({ title: "Purchase failed. Please try again.", variant: "destructive" });
    } finally {
      setPurchaseLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <PageLayout hideSidebar>
      <div className="min-h-[80vh] flex flex-col items-center justify-start py-12 px-4">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 max-w-xl"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <Fingerprint className="h-7 w-7 text-primary" />
            <span className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
              Item Verification
            </span>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Enter any IMEI, serial number, or KIZERE ID to check registration status.
            Get a full ownership report by purchasing a one-time report or upgrading to Premium.
          </p>
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-xl"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (identifier.trim()) doLookup(identifier);
            }}
            className="flex gap-2"
          >
            <Input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="IMEI, serial number, or KIZERE ID…"
              className="h-12 rounded-xl text-sm"
            />
            <Button
              type="submit"
              disabled={summaryLoading || !identifier.trim()}
              className="h-12 px-5 rounded-xl shrink-0"
            >
              {summaryLoading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Search className="h-4 w-4" />}
            </Button>
          </form>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {summaryLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-10 flex flex-col items-center gap-3 text-muted-foreground"
            >
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Searching registry…</p>
            </motion.div>
          )}

          {!summaryLoading && freeSummary && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-xl mt-8 space-y-4"
            >
              {/* Free Summary Card */}
              <FreeSummaryCard summary={freeSummary} />

              {/* Full Report Section */}
              {freeSummary.isRegistered && (
                <FullReportSection
                  activeId={activeId!}
                  user={user}
                  fullReport={fullReport}
                  reportLoading={reportLoading}
                  pendingRef={pendingRef}
                  onGetReport={() => fetchFullReport(activeId!)}
                  onCancelPending={() => setPendingRef(null)}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Purchase Modal */}
      <Dialog open={purchaseOpen} onOpenChange={setPurchaseOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl p-0 overflow-hidden border-none">
          <div className="bg-gradient-to-b from-primary/10 to-background p-8 pt-10 text-center relative">
            <button
              onClick={() => setPurchaseOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground/40 hover:text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-black tracking-tight">Get Full Report</DialogTitle>
              <DialogDescription className="text-sm leading-relaxed mt-2">
                Purchase a 48-hour access window to the full ownership report for{" "}
                <span className="font-semibold text-foreground font-mono text-xs">{activeId}</span>.
                Or{" "}
                <Link href="/subscription" className="text-primary underline-offset-2 hover:underline">
                  upgrade to Premium
                </Link>{" "}
                for unlimited reports.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-8 pb-8 pt-4 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                MoMo Phone Number
              </label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+250 78 000 0000"
                className="h-12 rounded-xl"
                type="tel"
              />
            </div>
            <Button
              onClick={handlePurchase}
              disabled={purchaseLoading || !phoneNumber.trim()}
              className="w-full h-12 rounded-xl font-bold"
            >
              {purchaseLoading
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Initiating…</>
                : <><ShieldCheck className="h-4 w-4 mr-2" /> Pay & Get Report</>}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setPurchaseOpen(false)}
              className="w-full h-10 rounded-xl text-muted-foreground text-xs"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}

// ─── FreeSummaryCard ──────────────────────────────────────────────────────────

function FreeSummaryCard({ summary }: { summary: FreeSummary }) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border bg-card/80 backdrop-blur-sm",
        summary.isFlagged ? "border-destructive/30" : "border-border/50"
      )}
    >
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1",
          summary.isFlagged
            ? "bg-gradient-to-r from-red-500 to-rose-600"
            : summary.isRegistered
            ? "bg-gradient-to-r from-emerald-400 to-primary"
            : "bg-gradient-to-r from-muted to-muted-foreground/30"
        )}
      />
      <CardHeader className="pb-3 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0",
                summary.isFlagged
                  ? "bg-destructive/10 text-destructive"
                  : summary.isRegistered
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {summary.isFlagged ? (
                <AlertTriangle className="h-6 w-6" />
              ) : summary.isRegistered ? (
                <ShieldCheck className="h-6 w-6" />
              ) : (
                <Search className="h-6 w-6" />
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
                Identifier
              </p>
              <p className="font-mono text-sm font-semibold text-foreground break-all">
                {summary.identifier}
              </p>
            </div>
          </div>
          {summary.isFlagged ? (
            <Badge variant="destructive" className="shrink-0 uppercase text-[10px] tracking-wide">
              Flagged
            </Badge>
          ) : summary.isRegistered ? (
            <Badge className="shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white border-transparent uppercase text-[10px] tracking-wide">
              Registered
            </Badge>
          ) : (
            <Badge variant="outline" className="shrink-0 uppercase text-[10px] tracking-wide text-muted-foreground">
              Not Found
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-5">
        {summary.isRegistered ? (
          <div className="grid grid-cols-2 gap-3 mt-2">
            <InfoChip icon={Tag} label="Category" value={summary.category ?? "—"} />
            <InfoChip icon={ShieldCheck} label="Status" value={summary.status ?? "—"} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">
            This identifier is not in the KIZERE registry. The item may be counterfeit or unregistered.
          </p>
        )}

        {summary.isFlagged && (
          <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            This item has been reported as lost or stolen. Transactions may be prohibited.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── FullReportSection ────────────────────────────────────────────────────────

interface FullReportSectionProps {
  activeId: string;
  user: any;
  fullReport: FullReport | null;
  reportLoading: boolean;
  pendingRef: string | null;
  onGetReport: () => void;
  onCancelPending: () => void;
}

function FullReportSection({
  activeId,
  user,
  fullReport,
  reportLoading,
  pendingRef,
  onGetReport,
  onCancelPending,
}: FullReportSectionProps) {
  // Already have the report
  if (fullReport) {
    return <FullReportCard report={fullReport} />;
  }

  // Waiting for payment confirmation
  if (pendingRef) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-6 flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div>
            <p className="font-semibold text-sm">Waiting for payment confirmation…</p>
            <p className="text-xs text-muted-foreground mt-1">
              Approve the MoMo prompt on your phone. Your report will load automatically.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancelPending}
            className="text-xs text-muted-foreground mt-1"
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <Card className="border-border/40">
        <CardContent className="py-6 flex flex-col items-center gap-4 text-center">
          <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-sm">Full report requires sign-in</p>
            <p className="text-xs text-muted-foreground mt-1">
              Sign in to purchase or access the full ownership report.
            </p>
          </div>
          <Button asChild size="sm" className="rounded-xl">
            <Link href={`/auth?redirect=${encodeURIComponent(`/verify-item?id=${encodeURIComponent(activeId)}`)}`}>
              <LogIn className="h-4 w-4 mr-2" />
              Sign in to continue
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Logged in, no report yet
  return (
    <Card className="border-border/40">
      <CardContent className="py-6 flex flex-col items-center gap-4 text-center">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm">Full Ownership Report Available</p>
          <p className="text-xs text-muted-foreground mt-1">
            Owner details, registration date, and full history. Valid 48 hours.
            Premium users get instant access.
          </p>
        </div>
        <Button
          onClick={onGetReport}
          disabled={reportLoading}
          className="rounded-xl px-6"
        >
          {reportLoading
            ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…</>
            : <><ShieldCheck className="h-4 w-4 mr-2" /> Get Full Report</>}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── FullReportCard ───────────────────────────────────────────────────────────

function FullReportCard({ report }: { report: FullReport }) {
  return (
    <Card className="border-primary/20 bg-primary/5 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-blue-500" />
      <CardHeader className="pb-2 pt-6">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="h-5 w-5" />
          <p className="text-xs font-black uppercase tracking-widest">Full Ownership Report</p>
        </div>
        <p className="font-bold text-lg tracking-tight">{report.name ?? report.identifier}</p>
      </CardHeader>
      <CardContent className="pb-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <InfoChip icon={Tag} label="Category" value={report.category ?? "—"} />
          <InfoChip icon={ShieldCheck} label="Status" value={report.status ?? "—"} />
          {report.registeredAt && (
            <InfoChip
              icon={Calendar}
              label="Registered"
              value={format(new Date(report.registeredAt), "MMM d, yyyy")}
            />
          )}
        </div>

        {report.owner && (
          <div className="mt-4 p-4 rounded-2xl bg-background/60 border border-border/40 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Registered Owner
            </p>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-primary" />
              </div>
              <p className="font-semibold text-sm">{report.owner.fullName}</p>
            </div>
            <div className="space-y-2 pl-12">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="font-mono">{maskEmail(report.owner.email)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span className="font-mono">{maskPhone(report.owner.phoneNumber)}</span>
              </div>
            </div>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground/60 text-center">
          Report access is valid for 48 hours from purchase.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── InfoChip ─────────────────────────────────────────────────────────────────

function InfoChip({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/30">
      <div className="p-1.5 bg-primary/10 rounded-lg text-primary shrink-0">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p className="text-xs font-semibold truncate">{value}</p>
      </div>
    </div>
  );
}
