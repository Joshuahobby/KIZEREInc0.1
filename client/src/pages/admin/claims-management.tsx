import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  MoreHorizontal,
  Search,
  Shield,
  TrendingUp,
  ArrowUpDown,
  Loader2,
  Gavel,
  Ban,
  Info,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-700 border-yellow-300 dark:text-yellow-400", icon: <Clock className="h-3.5 w-3.5" /> },
  verified: { label: "Verified", color: "bg-green-500/10 text-green-700 border-green-300 dark:text-green-400", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-700 border-red-300 dark:text-red-400", icon: <XCircle className="h-3.5 w-3.5" /> },
  needs_info: { label: "Needs Info", color: "bg-blue-500/10 text-blue-700 border-blue-300 dark:text-blue-400", icon: <Info className="h-3.5 w-3.5" /> },
  withdrawn: { label: "Withdrawn", color: "bg-gray-500/10 text-gray-700 border-gray-300 dark:text-gray-400", icon: <Ban className="h-3.5 w-3.5" /> },
  resolved: { label: "Resolved", color: "bg-purple-500/10 text-purple-700 border-purple-300 dark:text-purple-400", icon: <CheckCircle className="h-3.5 w-3.5" /> },
};

export default function AdminClaimsManagement() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showAppealDialog, setShowAppealDialog] = React.useState(false);
  const [selectedAppeal, setSelectedAppeal] = React.useState<any>(null);
  const [appealNotes, setAppealNotes] = React.useState("");

  // Fetch claims with status filter
  const { data: claims = [], isLoading: claimsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/jobs/claims", activeTab],
    queryFn: async () => {
      return await apiRequest(`/api/admin/jobs/claims?status=${activeTab}`);
    },
  });

  // Fetch claim stats
  const { data: stats } = useQuery<any>({
    queryKey: ["/api/admin/jobs/claims/stats"],
    queryFn: async () => {
      return await apiRequest("/api/admin/jobs/claims/stats");
    },
  });

  // Resolve appeal mutation
  const resolveAppealMutation = useMutation({
    mutationFn: async ({ id, decision, adminNotes }: { id: number; decision: string; adminNotes: string }) => {
      return await apiRequest(`/api/admin/jobs/claims/appeals/${id}`, {
        method: "PATCH",
        data: { decision, adminNotes },
      });
    },
    onSuccess: () => {
      setShowAppealDialog(false);
      setSelectedAppeal(null);
      setAppealNotes("");
      toast({ title: "Appeal Resolved", description: "The appeal decision has been recorded." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs/claims"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs/claims/stats"] });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Failed", description: err.message });
    },
  });

  // Filter claims by search
  const filteredClaims = React.useMemo(() => {
    if (!searchQuery.trim()) return claims;
    const q = searchQuery.toLowerCase();
    return claims.filter((c: any) =>
      c.reportTitle?.toLowerCase().includes(q) ||
      c.claimantName?.toLowerCase().includes(q) ||
      c.claimantEmail?.toLowerCase().includes(q) ||
      String(c.id).includes(q)
    );
  }, [claims, searchQuery]);

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const statCards = [
    { label: "Total Claims", value: stats?.totalClaims ?? 0, icon: <FileText className="h-5 w-5" />, color: "text-foreground" },
    { label: "Pending", value: stats?.pendingClaims ?? 0, icon: <Clock className="h-5 w-5" />, color: "text-yellow-600" },
    { label: "Verified", value: stats?.verifiedClaims ?? 0, icon: <CheckCircle className="h-5 w-5" />, color: "text-green-600" },
    { label: "Rejected", value: stats?.rejectedClaims ?? 0, icon: <XCircle className="h-5 w-5" />, color: "text-red-600" },
    { label: "Resolved", value: stats?.resolvedClaims ?? 0, icon: <TrendingUp className="h-5 w-5" />, color: "text-purple-600" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 max-w-[1400px] mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Gavel className="h-6 w-6 text-primary" />
              Claims Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Review, manage, and resolve ownership claims across the platform.
            </p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label} className="bg-card border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className={stat.color}>{stat.icon}</span>
                </div>
                <p className="text-2xl font-bold mt-2">{stat.value}</p>
                <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs">Pending</TabsTrigger>
              <TabsTrigger value="verified" className="text-xs">Verified</TabsTrigger>
              <TabsTrigger value="rejected" className="text-xs">Rejected</TabsTrigger>
              <TabsTrigger value="needs_info" className="text-xs">Needs Info</TabsTrigger>
              <TabsTrigger value="appeals" className="text-xs">
                Appeals
                {stats?.pendingAppeals > 0 && (
                  <Badge variant="destructive" className="ml-1.5 h-5 px-1.5 text-[10px]">
                    {stats.pendingAppeals}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full sm:w-72 ml-auto">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search claims..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Claims Table */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {claimsLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredClaims.length === 0 ? (
              <div className="text-center p-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No claims found</p>
                <p className="text-sm mt-1">
                  {activeTab !== "all" ? "Try switching to a different status filter." : "No claims have been submitted yet."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-16 font-semibold">ID</TableHead>
                      <TableHead className="font-semibold">Item / Report</TableHead>
                      <TableHead className="font-semibold">Claimant</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Appeal</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="w-16 text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClaims.map((claim: any) => {
                      const sc = statusConfig[claim.status] || statusConfig.pending;
                      return (
                        <TableRow
                          key={claim.id}
                          className="cursor-pointer hover:bg-muted/40 transition-colors"
                          onClick={() => navigate(`/claims/${claim.id}`)}
                        >
                          <TableCell className="font-mono text-sm font-medium">
                            #{claim.id}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm line-clamp-1">
                                {claim.reportTitle || "Unknown Report"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Report #{claim.reportId} · {claim.reportLocation || "—"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{claim.claimantName || "—"}</p>
                              <p className="text-xs text-muted-foreground">{claim.claimantEmail || claim.claimantUsername}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`gap-1 text-xs ${sc.color}`}>
                              {sc.icon}
                              {sc.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {claim.appealStatus === "pending" ? (
                              <Badge variant="destructive" className="text-xs gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Pending
                              </Badge>
                            ) : claim.appealStatus ? (
                              <span className="text-xs text-muted-foreground capitalize">{claim.appealStatus}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(claim.createdAt)}
                          </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/claims/${claim.id}`); }}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {claim.appealStatus === "pending" && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedAppeal(claim);
                                      setShowAppealDialog(true);
                                    }}
                                  >
                                    <Gavel className="h-4 w-4 mr-2" />
                                    Resolve Appeal
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results count */}
        {!claimsLoading && filteredClaims.length > 0 && (
          <p className="text-xs text-muted-foreground text-right">
            Showing {filteredClaims.length} claim{filteredClaims.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Appeal Resolution Dialog */}
      <Dialog open={showAppealDialog} onOpenChange={setShowAppealDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5 text-primary" />
              Resolve Appeal — Claim #{selectedAppeal?.id}
            </DialogTitle>
            <DialogDescription>
              The claimant has appealed the rejection of their claim for "{selectedAppeal?.reportTitle}".
            </DialogDescription>
          </DialogHeader>

          {selectedAppeal?.appealReason && (
            <div className="bg-muted/50 border rounded-lg p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Claimant's Appeal Reason:</p>
              <p className="text-sm">{selectedAppeal.appealReason}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Admin Notes</label>
            <Textarea
              placeholder="Explain why you are approving or rejecting this appeal..."
              value={appealNotes}
              onChange={(e) => setAppealNotes(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAppealDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => resolveAppealMutation.mutate({
                id: selectedAppeal?.id,
                decision: "rejected",
                adminNotes: appealNotes,
              })}
              disabled={resolveAppealMutation.isPending}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Appeal
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => resolveAppealMutation.mutate({
                id: selectedAppeal?.id,
                decision: "approved",
                adminNotes: appealNotes,
              })}
              disabled={resolveAppealMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Appeal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
