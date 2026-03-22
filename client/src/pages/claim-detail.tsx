import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { PageLayout } from "@/components/layout/page-layout";
import { AuthWall } from "@/components/ui/auth-wall";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Report } from "@shared/schema";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  User as UserIcon,
  MessageSquare,
  Image as ImageIcon,
  Banknote
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChatWindow } from "@/components/chat/chat-window";
import { AnimatePresence } from "framer-motion";

// Type for the special claim response
interface ClaimDetail {
  id: number;
  userId: number;
  reportId: number;
  description: string;
  imageUrls: string[] | null;
  status: 'pending' | 'verified' | 'rejected' | 'resolved' | 'needs_info' | 'withdrawn';
  finderNotes: string | null;
  createdAt: string;
  updatedAt: string | null;
  verifiedAt: string | null;
  reportTitle: string;
  reportType: string;
  claimantName: string;
  claimantEmail: string;
  verificationAnswer: string | null;
  handoverOtp: string | null;
  handedOverAt: string | null;
  appealStatus?: 'pending' | 'approved' | 'rejected';
  appealReason?: string;
  appealAdminNotes?: string;
  appealResolvedAt?: string;
}

export default function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user, isLoading: isLoadingAuth } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Dialog states
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showAppealDialog, setShowAppealDialog] = useState(false);
  const [notes, setNotes] = useState("");
  const [appealReason, setAppealReason] = useState("");
  const [showHandoverDialog, setShowHandoverDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [showRequestInfoDialog, setShowRequestInfoDialog] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);

  // Fetch claim logic
  const { data: claim, isLoading, error } = useQuery<ClaimDetail>({
    queryKey: [`/api/claims/${id}`],
    enabled: !!id && !!user,
  });

  // Fetch report logic (to check ownership/role precisely)
  const { data: report } = useQuery<Report>({
    queryKey: [`/api/reports/${claim?.reportId}`],
    enabled: !!claim?.reportId,
  });

  // Verification Mutation
  const verifyMutation = useMutation({
    mutationFn: async (status: 'verified' | 'rejected' | 'needs_info') => {
      await apiRequest(`/api/claims/${id}/verify`, {
        method: 'PATCH',
        data: {
          status,
          finderNotes: notes
        }
      });
    },
    onSuccess: (_, status) => {
      setShowVerifyDialog(false);
      setShowRejectDialog(false);
      setNotes("");
      
      const actionTitle = status === 'verified' ? t('claim_detail.actionVerified') : status === 'rejected' ? t('claim_detail.actionRejected') : t('claim_detail.actionInfoRequested');
      const actionDesc = status === 'verified' ? t('claim_detail.actionVerify') : status === 'rejected' ? t('claim_detail.actionReject') : t('claim_detail.actionRequestInfo');
      
      toast({
        title: actionTitle,
        description: t('claim_detail.toastActionSuccess', { action: actionDesc })
      });
      queryClient.invalidateQueries({ queryKey: [`/api/claims/${id}`] });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: t('claim_detail.toastActionFailed'), description: err.message });
    }
  });

  // Withdraw Mutation
  const withdrawMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/claims/${id}/withdraw`, { method: 'POST' });
    },
    onSuccess: () => {
      setShowWithdrawDialog(false);
      toast({ title: t('claim_detail.toastWithdrawnTitle'), description: t('claim_detail.toastWithdrawnDesc') });
      queryClient.invalidateQueries({ queryKey: [`/api/claims/${id}`] });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: t('claim_detail.toastWithdrawFailed'), description: err.message });
    }
  });

  // Request Info Mutation (Claimant providing additional info)
  const provideInfoMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/claims/${id}/request-info`, {
        method: 'PATCH',
        data: { additionalDescription: additionalInfo }
      });
    },
    onSuccess: () => {
      setShowRequestInfoDialog(false);
      setAdditionalInfo("");
      toast({ title: t('claim_detail.toastInfoUpdatedTitle'), description: t('claim_detail.toastInfoUpdatedDesc') });
      queryClient.invalidateQueries({ queryKey: [`/api/claims/${id}`] });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: t('claim_detail.toastInfoUpdateFailed'), description: err.message });
    }
  });

  // Appeal Mutation
  const appealMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/claims/${id}/appeal`, { method: 'POST', data: { reason: appealReason } });
    },
    onSuccess: () => {
      setShowAppealDialog(false);
      setAppealReason("");
      toast({ 
        title: t('report_detail.appealSubmittedSuccess'), 
        description: t('report_detail.appealReviewDetails') 
      });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: t('claim_detail.toastAppealFailed'), description: err.message });
    }
  });

  // Handover Mutation
  const handoverMutation = useMutation({
    mutationFn: async (otp: string) => {
      await apiRequest(`/api/claims/${id}/handover`, {
        method: 'POST',
        data: { otp }
      });
    },
    onSuccess: () => {
      setShowHandoverDialog(false);
      setOtpValue("");
      const hasBounty = report?.bountyAmount && Number(report.bountyAmount) > 0;
      toast({
        title: t('claim_detail.toastHandoverConfirmed'),
        description: hasBounty
          ? t('claim_detail.toastHandoverBounty')
          : t('claim_detail.toastHandoverSuccess')
      });
      queryClient.invalidateQueries({ queryKey: [`/api/claims/${id}`] });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: t('claim_detail.toastHandoverFailed'), description: t('claim_detail.toastHandoverFailedDesc') });
    }
  });

  // Chat Initialization Mutation
  const initializeChatMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest<{ id: number }>("/api/chats/initialize", {
        method: 'POST',
        data: { claimId: id }
      });
      return res;
    },
    onSuccess: (data) => {
      setActiveChatId(data.id);
      setShowChat(true);
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: t('claim_detail.toastChatError'), description: err.message });
    }
  });

  if (!user && !isLoadingAuth) {
    return (
      <PageLayout>
        <div className="container max-w-7xl mx-auto py-20 flex items-center justify-center">
          <AuthWall returnUrl={`/claim/${id}`} />
        </div>
      </PageLayout>
    );
  }

  if (isLoading || isLoadingAuth) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  if (error || !claim) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center p-8 text-center py-20">
          <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">{t('claim_detail.notFoundTitle')}</h1>
          <p className="text-muted-foreground mb-6">{t('claim_detail.notFoundDesc')}</p>
          <Button onClick={() => navigate('/dashboard')}>{t('claim_detail.backToDashboard')}</Button>
        </div>
      </PageLayout>
    );
  }

  const isFinder = report?.userId === user?.id;
  const isClaimant = claim.userId === user?.id;
  const isAdmin = user?.role === 'Admin' || user?.role === 'Moderator';
  const showFinderActions = (isFinder || isAdmin) && (claim.status === 'pending' || claim.status === 'needs_info');
  const showClaimantActions = isClaimant && (claim.status === 'pending' || claim.status === 'needs_info');

  // Timeline Step calculation
  const getTimelineStep = () => {
    if (claim.status === 'withdrawn') return -1;
    if (claim.status === 'rejected') return 2; // Failed at step 2
    if (claim.status === 'pending') return 1;
    if (claim.status === 'needs_info') return 1;
    if (claim.status === 'verified') return 3;
    if (claim.status === 'resolved') return 4;
    return 1;
  };
  const currentStep = getTimelineStep();

  // Next Steps text helper
  const getNextSteps = () => {
    if (isClaimant) {
      if (claim.status === 'withdrawn') return t('claim_detail.claimantNextStepsWithdrawn');
      if (claim.status === 'pending') return t('claim_detail.claimantNextStepsPending');
      if (claim.status === 'needs_info') return t('claim_detail.claimantNextStepsNeedsInfo');
      if (claim.status === 'verified') return t('claim_detail.claimantNextStepsVerified');
      if (claim.status === 'rejected' && claim.appealStatus === 'pending') return t('claim_detail.claimantNextStepsRejectedAppeal');
      if (claim.status === 'rejected') return t('claim_detail.claimantNextStepsRejected');
      if (claim.status === 'resolved') return t('claim_detail.claimantNextStepsResolved');
    } else if (isFinder || isAdmin) {
      if (claim.status === 'withdrawn') return t('claim_detail.finderNextStepsWithdrawn');
      if (claim.status === 'pending') return t('claim_detail.finderNextStepsPending');
      if (claim.status === 'needs_info') return t('claim_detail.finderNextStepsNeedsInfo');
      if (claim.status === 'verified') return t('claim_detail.finderNextStepsVerified');
      if (claim.status === 'rejected') return t('claim_detail.finderNextStepsRejected');
      if (claim.status === 'resolved') return t('claim_detail.finderNextStepsResolved');
    }
    return t('claim_detail.statusUnknown');
  };

  return (
    <PageLayout>
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            onClick={() => navigate(report ? `/reports/${report.id}` : '/dashboard')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('claim_detail.backToReport')}
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column: Claim Info */}
            <div className="md:col-span-2 space-y-6">

              {/* Status Timeline */}
              {claim.status !== 'withdrawn' ? (
                <div className="bg-card border rounded-lg p-6 flex flex-col items-center sm:flex-row sm:justify-between relative mb-6">
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -z-10 hidden sm:block transform -translate-y-1/2 rounded-full px-12" />
                  
                  {/* Step 1 */}
                  <div className="flex flex-col items-center gap-2 bg-card relative z-10 px-4">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      1
                    </div>
                    <span className="text-xs font-medium text-center">{t('claim_detail.submitted')}</span>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col items-center gap-2 bg-card relative z-10 px-4 mt-4 sm:mt-0">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      claim.status === 'rejected' ? 'bg-red-500 text-white' :
                      currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {claim.status === 'rejected' ? <XCircle className="h-4 w-4" /> : '2'}
                    </div>
                    <span className="text-xs font-medium text-center">
                      {claim.status === 'rejected' ? t('claim_detail.rejected') : claim.status === 'needs_info' ? t('claim_detail.needsInfo') : t('claim_detail.underReview')}
                    </span>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col items-center gap-2 bg-card relative z-10 px-4 mt-4 sm:mt-0">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${currentStep >= 3 ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                      3
                    </div>
                    <span className="text-xs font-medium text-center">{t('claim_detail.approved')}</span>
                  </div>

                  {/* Step 4 */}
                  <div className="flex flex-col items-center gap-2 bg-card relative z-10 px-4 mt-4 sm:mt-0">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${currentStep >= 4 ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-medium text-center">{t('claim_detail.handedOver')}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 p-4 rounded-lg flex items-center justify-center gap-2 font-medium mb-6">
                  <XCircle className="h-5 w-5" />
                  {t('claim_detail.withdrawnDesc')}
                </div>
              )}

              {/* Next Steps Card */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-5 flex gap-4">
                <AlertTriangle className="h-6 w-6 text-primary shrink-0" />
                <div>
                  <h3 className="font-bold text-foreground mb-1">{t('claim_detail.nextSteps')}</h3>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">{getNextSteps()}</p>
                  
                  {/* Action buttons inside Next Steps for Claimant */}
                  {showClaimantActions && claim.status === 'needs_info' && (
                    <Button size="sm" className="mt-4 bg-primary text-primary-foreground" onClick={() => setShowRequestInfoDialog(true)}>
                      {t('claim_detail.provideInfo')}
                    </Button>
                  )}
                  {showClaimantActions && claim.status === 'pending' && (
                    <Button size="sm" variant="outline" className="mt-4 text-red-600 border-red-200 hover:bg-red-50" onClick={() => setShowWithdrawDialog(true)}>
                      {t('claim_detail.withdrawClaim')}
                    </Button>
                  )}
                </div>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{t('claim_detail.claimDetails')}</CardTitle>
                      <CardDescription>
                        {t('claim_detail.claimFor')} <span className="font-medium text-foreground">{claim.reportTitle}</span>
                      </CardDescription>
                    </div>
                    <Badge
                      variant={claim.status === 'verified' ? 'default' : claim.status === 'rejected' ? 'destructive' : 'outline'}
                      className="capitalize"
                    >
                      {t(`claim_detail.${claim.status}`)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">

                  {report?.bountyAmount && Number(report.bountyAmount) > 0 && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="bg-green-500/20 p-2 rounded-full">
                          <Banknote className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-600 dark:text-green-400">{t('claim_detail.bounty')}</p>
                          <p className="text-lg font-bold text-green-600 dark:text-green-500">
                            {Number(report.bountyAmount).toLocaleString()} RWF
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-background text-green-600 dark:text-green-400 border-green-500/30">
                        {report.bountyStatus === 'released' ? t('claim_detail.paidOut') : t('claim_detail.escrowed')}
                      </Badge>
                    </div>
                  )}

                  <div>
                    <h3 className="font-medium text-foreground mb-2">{t('claim_detail.descriptionProof')}</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{claim.description}</p>
                  </div>

                  {claim.verificationAnswer && (
                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg">
                      <div className="flex items-center gap-2 mb-2 text-primary font-bold">
                        <ShieldCheck className="h-4 w-4" />
                        <span>{t('claim_detail.verificationAnswer')}</span>
                      </div>
                      <p className="text-foreground/80 italic">"{claim.verificationAnswer}"</p>
                    </div>
                  )}

                  {claim.imageUrls && claim.imageUrls.length > 0 && (
                    <div>
                      <h3 className="font-medium text-foreground mb-2">{t('claim_detail.proofImages')}</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {claim.imageUrls.map((url, i) => (
                          <div key={i} className="aspect-video relative rounded-lg overflow-hidden border bg-muted">
                            <img src={url} alt={`Proof ${i + 1}`} width={400} height={225} loading="lazy" decoding="async" className="object-cover w-full h-full" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Finder Notes (if verified/rejected) */}
                  {claim.finderNotes && (
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2 text-foreground font-medium">
                        <MessageSquare className="h-4 w-4" />
                        <span>{t('claim_detail.notesFromFinder')}</span>
                      </div>
                      <p className="text-muted-foreground">{claim.finderNotes}</p>
                    </div>
                  )}

                  {/* Appeal Status Section */}
                  {claim.appealStatus && (
                    <div className={`p-4 rounded-lg border ${claim.appealStatus === 'approved' ? 'bg-green-500/10 border-green-500/20' :
                      claim.appealStatus === 'rejected' ? 'bg-red-500/10 border-red-500/20' :
                        'bg-amber-500/10 border-amber-500/20'
                      }`}>
                      <div className="flex items-center gap-2 mb-2 font-semibold text-foreground">
                        <AlertTriangle className={`h-4 w-4 ${claim.appealStatus === 'approved' ? 'text-green-600' :
                          claim.appealStatus === 'rejected' ? 'text-red-600' :
                            'text-amber-600'
                          }`} />
                        <span>{t('claim_detail.claimAppeal')} {t(`claim_detail.appeal_${claim.appealStatus}`)}</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground font-medium">{t('claim_detail.yourReason')}</span> {claim.appealReason}</p>
                        {claim.appealAdminNotes && (
                          <div className="pt-2 border-t border-border/50 mt-2">
                            <p><span className="text-muted-foreground font-medium">{t('claim_detail.adminDecision')}</span> {claim.appealAdminNotes}</p>
                            {claim.appealResolvedAt && (
                              <p className="text-[10px] text-muted-foreground/60 mt-1">
                                {t('claim_detail.appealResolvedOn', { date: format(new Date(claim.appealResolvedAt), 'MMM d, yyyy HH:mm') })}
                              </p>
                            )}
                          </div>
                        )}
                        {claim.appealStatus === 'pending' && (
                          <p className="text-amber-700 italic text-xs">{t('claim_detail.adminReviewing')}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Secure Handover OTP (For Claimant) */}
                  {isClaimant && claim.status === 'verified' && claim.handoverOtp && (
                    <div className="p-6 mt-6 bg-green-500/5 border-2 border-dashed border-green-500/20 rounded-xl text-center">
                      <ShieldCheck className="h-10 w-10 text-green-600 dark:text-green-500 mx-auto mb-3" />
                      <h3 className="text-lg font-bold text-green-600 dark:text-green-400 mb-1">{t('claim_detail.secureHandoverCode')}</h3>
                      <p className="text-sm text-green-600 dark:text-green-500/80 mb-4">{t('claim_detail.handoverCodeDesc')}</p>
                      <div className="bg-background rounded-lg py-4 px-8 border border-green-500/20 inline-block shadow-sm">
                        <span className="text-4xl font-black tracking-[0.5em] text-foreground">{claim.handoverOtp}</span>
                      </div>
                    </div>
                  )}
                </CardContent>

                {/* Actions for Finder/Admin */}
                {showFinderActions && (
                  <CardFooter className="flex flex-wrap justify-end gap-3 border-t bg-muted/30 p-4">
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => setShowRejectDialog(true)}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      {t('claim_detail.reject')}
                    </Button>
                    {claim.status === 'pending' && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setNotes("");
                          verifyMutation.mutate('needs_info');
                        }}
                        disabled={verifyMutation.isPending}
                      >
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        {t('claim_detail.requestMoreInfo')}
                      </Button>
                    )}
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => setShowVerifyDialog(true)}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {t('claim_detail.verifyProof')}
                    </Button>
                  </CardFooter>
                )}

                {/* Secure Handover Flow (For Finder) */}
                {isFinder && claim.status === 'verified' && (
                  <CardFooter className="flex justify-between items-center border-t bg-amber-500/5 p-4">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">{t('claim_detail.readyForHandover')}</span>
                    </div>
                    <Button
                      className="bg-amber-600 hover:bg-amber-700"
                      onClick={() => setShowHandoverDialog(true)}
                    >
                      {t('claim_detail.processHandover')}
                    </Button>
                  </CardFooter>
                )}

                {/* Appeal Action for Claimant */}
                {isClaimant && claim.status === 'rejected' && (
                  <CardFooter className="bg-muted/50 border-t p-4 flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">{t('claim_detail.rejectionMistake')}</p>
                    <Button
                      variant="outline"
                      onClick={() => setShowAppealDialog(true)}
                    >
                      {t('claim_detail.appealDecision')}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </div>

            {/* Right Column: User Info (For Finder) */}
            <div className="space-y-6">
              {(isFinder || isAdmin) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserIcon className="h-5 w-5" />
                      {t('claim_detail.claimantInfo')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t('claim_detail.name')}</span>
                      <p className="font-medium">{claim.claimantName}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t('claim_detail.email')}</span>
                      <p className="font-medium text-sm">{claim.claimantEmail}</p>
                    </div>
                    <div className="pt-2">
                      <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded text-xs text-blue-600 dark:text-blue-400">
                        {t('claim_detail.verifyInstructions')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Chat Toggle Button (Floating) */}
        {!showChat && claim.status !== 'pending' && (
          <Button
            onClick={() => initializeChatMutation.mutate()}
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-40 hover:scale-110 transition-transform ring-4 ring-white"
            disabled={initializeChatMutation.isPending}
          >
            {initializeChatMutation.isPending ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <MessageSquare className="h-6 w-6" />
            )}
          </Button>
        )}

        {/* Floating Chat Window */}
        <AnimatePresence>
          {showChat && activeChatId && (
            <div className="fixed bottom-6 right-6 z-50 w-full max-w-[400px]">
              <ChatWindow
                chatId={activeChatId}
                title={t('claim_detail.chatWithTitle', { title: claim.reportTitle })}
                onClose={() => setShowChat(false)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Verify Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('claim_detail.verifyDialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('claim_detail.verifyDialogDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="verify-notes">{t('claim_detail.verifyNotesLabel')}</Label>
            <Textarea
              id="verify-notes"
              placeholder={t('claim_detail.verifyNotesPlaceholder')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerifyDialog(false)}>{t('common.cancel')}</Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => verifyMutation.mutate('verified')}
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending ? t('claim_detail.processing') : t('claim_detail.confirmVerification')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('claim_detail.rejectDialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('claim_detail.rejectDialogDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reject-notes">{t('claim_detail.rejectNotesLabel')}</Label>
            <Textarea
              id="reject-notes"
              placeholder={t('claim_detail.rejectNotesPlaceholder')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>{t('common.cancel')}</Button>
            <Button
              variant="destructive"
              onClick={() => verifyMutation.mutate('rejected')}
              disabled={verifyMutation.isPending || notes.length < 5}
            >
              {verifyMutation.isPending ? t('claim_detail.processing') : t('claim_detail.confirmRejection')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('claim_detail.withdrawDialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('claim_detail.withdrawDialogDesc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>{t('common.cancel')}</Button>
            <Button
              variant="destructive"
              onClick={() => withdrawMutation.mutate()}
              disabled={withdrawMutation.isPending}
            >
              {withdrawMutation.isPending ? t('claim_detail.withdrawing') : t('claim_detail.withdrawClaim')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Info Dialog (Claimant side) */}
      <Dialog open={showRequestInfoDialog} onOpenChange={setShowRequestInfoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('claim_detail.provideInfoDialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('claim_detail.provideInfoDialogDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="additional-info">{t('claim_detail.additionalInfoLabel')}</Label>
              <Textarea
                id="additional-info"
                placeholder={t('claim_detail.additionalInfoPlaceholder')}
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t('claim_detail.additionalInfoFuture')}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestInfoDialog(false)}>{t('common.cancel')}</Button>
            <Button
              onClick={() => provideInfoMutation.mutate()}
              disabled={provideInfoMutation.isPending || additionalInfo.length < 10}
            >
              {provideInfoMutation.isPending ? t('claim_detail.submitting') : t('claim_detail.submitInfo')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appeal Dialog */}
      <Dialog open={showAppealDialog} onOpenChange={setShowAppealDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('claim_detail.appealDialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('claim_detail.appealDialogDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="appeal-reason">{t('claim_detail.appealReasonLabel')}</Label>
            <Textarea
              id="appeal-reason"
              placeholder={t('claim_detail.appealReasonPlaceholder')}
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAppealDialog(false)}>{t('common.cancel')}</Button>
            <Button
              onClick={() => appealMutation.mutate()}
              disabled={appealMutation.isPending || appealReason.length < 20}
            >
              {appealMutation.isPending ? t('claim_detail.submitting') : t('claim_detail.submitAppeal')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Handover Dialog */}
      <Dialog open={showHandoverDialog} onOpenChange={setShowHandoverDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('claim_detail.handoverDialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('claim_detail.handoverDialogDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center gap-4">
            <Label htmlFor="otp">{t('claim_detail.otpLabel')}</Label>
            <Input
              id="otp"
              className="text-center text-2xl font-black tracking-[0.5em] h-14"
              placeholder="000000"
              maxLength={6}
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value)}
            />
            <p className="text-xs text-muted-foreground text-center">
              {t('claim_detail.handoverAgreement')}
            </p>
            {report?.bountyAmount && Number(report.bountyAmount) > 0 && (
              <div className="bg-green-500/10 p-2 rounded text-xs text-green-600 dark:text-green-400 text-center w-full">
                <strong>{t('claim_detail.bountyNote')}</strong> {t('claim_detail.bountyNoteDesc', { amount: Number(report.bountyAmount).toLocaleString() })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHandoverDialog(false)}>{t('common.cancel')}</Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => handoverMutation.mutate(otpValue)}
              disabled={handoverMutation.isPending || otpValue.length !== 6}
            >
              {handoverMutation.isPending ? t('claim_detail.confirming') : t('claim_detail.finalizeHandover')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
