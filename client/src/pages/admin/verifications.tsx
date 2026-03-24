import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { AuthWall } from "@/components/ui/auth-wall";
import { PageLayout } from "@/components/layout/page-layout";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X, ExternalLink, Eye, FileText, Camera } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import React from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function AdminVerifications() {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const { toast } = useToast();

  if (!user && !isLoadingAuth) {
    return (
      <PageLayout>
        <div className="container max-w-7xl mx-auto py-20 flex items-center justify-center">
          <AuthWall returnUrl="/admin/verifications" />
        </div>
      </PageLayout>
    );
  }
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected' | null>(null);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["/api/admin/verifications"],
    queryFn: async () => {
      const res = await apiRequest("/api/verification/admin/list");
      return res;
    }
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, comment }: { id: number, status: string, comment: string }) => {
      const res = await apiRequest(`/api/admin/verification-requests/${id}`, {
        method: "PATCH",
        data: { status, adminComment: comment }
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verifications"] });
      toast({ title: t('common.success'), description: t('claims.update_success') });
      setSelectedRequest(null);
      setReviewComment("");
      setReviewAction(null);
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    }
  });

  const handleReview = (status: 'approved' | 'rejected') => {
    if (status === 'rejected' && (!reviewComment || reviewComment.trim().length < 5)) {
      toast({ 
        title: t('common.error'), 
        description: "Please provide a detailed reason for rejection.", 
        variant: "destructive" 
      });
      return;
    }
    setReviewAction(status);
    reviewMutation.mutate({
      id: selectedRequest.id,
      status,
      comment: reviewComment
    });
  };

  const REJECTION_REASONS = [
    { label: "Blurry/Unreadable Image", value: "The uploaded image is too blurry or low quality to verify. Please upload a clear photo." },
    { label: "Document Expired", value: "The document provided has expired. Please upload a valid, current ID." },
    { label: "Name Mismatch", value: "The name on the document does not match your profile name. Please ensure they are consistent." },
    { label: "Wrong Document Type", value: "The uploaded document does not match the type selected (e.g., Passport vs ID)." },
    { label: "Selfie/Code Mismatch", value: "The selfie or the liveness code is incorrect or not visible." }
  ];

  if (isLoading) {
    return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">{t('dashboard.admin.identityVerifications')}</h2>
            <p className="text-muted-foreground">Review and validate user identity documents to maintain platform trust.</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-1 bg-primary/5 text-primary border-primary/20">
            {requests?.length || 0} {t('dashboard.admin.pendingVerifications')}
          </Badge>
        </div>

        <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold">{t('dashboard.table.user')}</TableHead>
                <TableHead className="font-bold text-center">{t('dashboard.table.docType')}</TableHead>
                <TableHead className="font-bold">{t('dashboard.table.submitted')}</TableHead>
                <TableHead className="font-bold text-right">{t('dashboard.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Check className="h-10 w-10 text-green-500/50" />
                      <p className="font-medium text-lg">{t('dashboard.admin.noPendingVerifications')}</p>
                      <p className="text-sm">All users are currently up to date.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                requests?.map((req: any) => (
                  <TableRow key={req.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {req.user.fullName?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-base">{req.user.fullName}</div>
                          <div className="text-xs text-muted-foreground font-mono">{req.user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="capitalize px-3">
                        {req.documentType?.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(req.submittedAt), "MMM d, yyyy")}
                      <div className="text-xs">{format(new Date(req.submittedAt), "HH:mm")}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog open={selectedRequest?.id === req.id} onOpenChange={(open) => !open && setSelectedRequest(null)}>
                        <DialogTrigger asChild>
                          <Button variant="default" size="sm" onClick={() => setSelectedRequest(req)} className="bg-primary hover:bg-primary/90">
                            <Eye className="h-4 w-4 mr-2" /> Speed Review
                          </Button>
                        </DialogTrigger>
                        {selectedRequest?.id === req.id && (
                          <DialogContent 
                            className="max-w-6xl max-h-[95vh] flex flex-col p-0 overflow-hidden"
                            aria-describedby="verification-review-description"
                          >
                            <div className="p-6 border-b bg-muted/30">
                              <DialogHeader>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <DialogTitle className="text-2xl">{t('dashboard.admin.verificationReview')}</DialogTitle>
                                    <DialogDescription id="verification-review-description" className="mt-1">
                                      Reviewing documents for <span className="font-bold text-foreground">{req.user.fullName}</span>
                                    </DialogDescription>
                                  </div>
                                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">
                                    {req.documentType?.toUpperCase()}
                                  </Badge>
                                </div>
                              </DialogHeader>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 bg-muted/5">
                              {/* Speed Review Side-by-Side */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-sm tracking-tight flex items-center gap-2 uppercase text-muted-foreground">
                                      <FileText className="h-4 w-4" /> Identity Document
                                    </h4>
                                    <Badge variant="outline" className="bg-background">Front View</Badge>
                                  </div>
                                  <div className="group relative border-2 border-dashed rounded-xl overflow-hidden bg-black/5 aspect-[1.6/1] flex items-center justify-center ring-offset-background transition-all hover:ring-2 hover:ring-primary/20">
                                    <img
                                      src={req.documentUrl}
                                      alt="Document"
                                      width={600}
                                      height={375}
                                      loading="lazy"
                                      decoding="async"
                                      className="object-contain h-full w-full cursor-zoom-in group-hover:scale-[1.02] transition-transform"
                                      onClick={() => window.open(req.documentUrl, '_blank')}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-sm tracking-tight flex items-center gap-2 uppercase text-muted-foreground">
                                      <Camera className="h-4 w-4" /> Face Verification
                                    </h4>
                                    <Badge variant="outline" className="bg-background">Liveness Check</Badge>
                                  </div>
                                  <div className="group relative border-2 border-dashed rounded-xl overflow-hidden bg-black/5 aspect-[1.6/1] flex items-center justify-center ring-offset-background transition-all hover:ring-2 hover:ring-primary/20">
                                    <img
                                      src={req.selfieUrl}
                                      alt="Selfie"
                                      width={600}
                                      height={375}
                                      loading="lazy"
                                      decoding="async"
                                      className="object-contain h-full w-full cursor-zoom-in group-hover:scale-[1.02] transition-transform"
                                      onClick={() => window.open(req.selfieUrl, '_blank')}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* User Info Recap */}
                                <div className="lg:col-span-1 space-y-4">
                                  <div className="p-4 rounded-xl border bg-card/50 space-y-3">
                                    <h5 className="font-bold text-xs uppercase text-muted-foreground">User Information</h5>
                                    <div className="space-y-2">
                                      <div>
                                        <div className="text-[10px] text-muted-foreground uppercase font-bold">Full Name</div>
                                        <div className="text-sm font-medium">{req.user.fullName}</div>
                                      </div>
                                      <div>
                                        <div className="text-[10px] text-muted-foreground uppercase font-bold">Username</div>
                                        <div className="text-sm font-medium">@{req.user.username}</div>
                                      </div>
                                      <div>
                                        <div className="text-[10px] text-muted-foreground uppercase font-bold">Liveness Code</div>
                                        <div className="text-sm font-mono bg-muted px-2 py-0.5 rounded inline-block">
                                          {req.livenessCode || "N/A"}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-col gap-2">
                                    <h5 className="font-bold text-xs uppercase text-muted-foreground px-1">Quick Rejection Reasons</h5>
                                    <div className="grid grid-cols-1 gap-1.5">
                                      {REJECTION_REASONS.map((reason) => (
                                        <Button 
                                          key={reason.label}
                                          variant="outline" 
                                          size="sm" 
                                          className="justify-start text-xs h-auto py-2 px-3 text-left leading-tight hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30"
                                          onClick={() => setReviewComment(reason.value)}
                                        >
                                          {reason.label}
                                        </Button>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Review Area */}
                                <div className="lg:col-span-2 space-y-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-bold uppercase text-muted-foreground flex items-center justify-between">
                                      Final Review Feedback
                                      <span className="text-[10px] font-normal lowercase italic">Mandatory for rejections</span>
                                    </label>
                                    <Textarea
                                      placeholder="Explain the decision to the user. This message will be sent via email..."
                                      className="min-h-[120px] rounded-xl focus-visible:ring-primary/20"
                                      value={reviewComment}
                                      onChange={(e) => setReviewComment(e.target.value)}
                                    />
                                  </div>

                                  <div className="flex gap-3 pt-2">
                                    <Button
                                      variant="outline"
                                      size="lg"
                                      className="flex-1 rounded-xl h-12 border-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm"
                                      onClick={() => handleReview('rejected')}
                                      disabled={reviewMutation.isPending}
                                    >
                                      {reviewMutation.isPending && reviewAction === 'rejected' ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-2" />}
                                      Final Reject
                                    </Button>
                                    <Button
                                      variant="default"
                                      size="lg"
                                      className="flex-[2] rounded-xl h-12 bg-green-600 hover:bg-green-700 transition-all shadow-md active:scale-[0.98]"
                                      onClick={() => handleReview('approved')}
                                      disabled={reviewMutation.isPending}
                                    >
                                      {reviewMutation.isPending && reviewAction === 'approved' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                                      Verify Identity
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        )}
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageLayout>
  );
}
