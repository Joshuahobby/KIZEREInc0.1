import { useState, CSSProperties } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { PageLayout } from "@/components/layout/page-layout";
import ReactGA from "react-ga4";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ClaimForm } from "@/components/reports/claim-form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { AuthWall } from "@/components/ui/auth-wall";
import { PaymentButton } from "@/components/payment/payment-button";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Report, Claim } from "@shared/schema";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Tag as TagIcon,
  User,
  Phone,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Image as ImageIcon,
  ShieldCheck,
  Star,
  ShieldAlert,
  ArrowRight,
  Lock
} from "lucide-react";

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user, isLoading: isLoadingAuth } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [showAppealDialog, setShowAppealDialog] = useState(false);
  const [showMarkFoundDialog, setShowMarkFoundDialog] = useState(false);
  const [appealReason, setAppealReason] = useState("");

  const { data: report, isLoading, error } = useQuery<Report & { privacyProtected?: boolean }>({
    queryKey: [`/api/reports/${id}`],
    enabled: !!id && !!user,
  });

  if (!user && !isLoadingAuth) {
    return (
      <PageLayout>
        <div className="container max-w-7xl mx-auto py-20 flex items-center justify-center">
          <AuthWall returnUrl={`/report/${id}`} />
        </div>
      </PageLayout>
    );
  }

  // Extended type for report matches
  interface ReportMatch extends Report {
    matchScore?: number;
  }

  const { data: matches } = useQuery<ReportMatch[]>({
    queryKey: [`/api/reports/matches/${id}`],
    enabled: !!id && !!report && user?.id === report.userId,
  });

  // Fetch claims if user is owner
  const { data: claims } = useQuery<Claim[]>({
    queryKey: [`/api/claims/report/${id}`],
    enabled: !!id && !!report && user?.id === report.userId,
  });

  // Check if I have already claimed this (if not owner)
  const { data: myClaims } = useQuery<Claim[]>({
    queryKey: ['/api/claims/my-claims'],
    enabled: !!user && !!report && user.id !== report.userId,
  });

  const myClaim = myClaims?.find(c => c.reportId === parseInt(id!));

  const submitAppealMutation = useMutation({
    mutationFn: async () => {
      if (!myClaim) return;
      await apiRequest(`/api/claims/${myClaim.id}/appeal`, { method: 'POST', data: { reason: appealReason } });
    },
    onSuccess: () => {
      setShowAppealDialog(false);
      setAppealReason("");
      toast({ title: t('report_detail.appealSubmittedSuccess'), description: t('report_detail.appealReviewDetails') });
      queryClient.invalidateQueries({ queryKey: ['/api/claims/my-claims'] });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: t('report_detail.appealFailed'), description: err.message });
    }
  });

  const markAsFoundMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/reports/${id}/mark-found`, { method: 'POST' });
    },
    onSuccess: () => {
      toast({ title: t('report_detail.reportUpdated'), description: t('report_detail.reportMarkedFound') });
      queryClient.invalidateQueries({ queryKey: [`/api/reports/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      setShowMarkFoundDialog(false);
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: t('report_detail.updateFailed'), description: err.message });
    }
  });

  if (!user && !isLoadingAuth) {
    return (
      <PageLayout>
        <AuthWall returnUrl={`/report/${id}`} />
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

  if (error || !report) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center p-8 text-center py-20">
          <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">{t('report_detail.reportNotFoundTitle')}</h1>
          <p className="text-muted-foreground mb-6">{t('report_detail.reportNotFoundDesc')}</p>
          <Button onClick={() => navigate('/search')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('report_detail.backToLostFound')}
          </Button>
        </div>
      </PageLayout>
    );
  }

  const isOwner = user?.id === report.userId;
  const isFoundReport = report.type === 'found';

  return (
    <PageLayout>
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate('/search')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lost & Found
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Images */}
            <div className="space-y-4">
              {report.imageUrls && report.imageUrls.length > 0 ? (
                <div className="grid gap-4">
                  {report.imageUrls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`${report.title} - Image ${i + 1}`}
                      width={800}
                      height={256}
                      loading={i === 0 ? "eager" : "lazy"}
                      decoding="async"
                      className="rounded-xl w-full h-64 object-cover shadow-lg border"
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-muted rounded-xl h-64 flex items-center justify-center">
                  <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}
            </div>

            {/* Right Column - Details */}
            <div className="space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge
                    variant={report.type === 'lost' ? 'destructive' : 'default'}
                    className={report.type === 'found' ? 'bg-green-600' : ''}
                  >
                    {report.type === 'lost' ? t('common.lost') : t('common.found')}
                  </Badge>
                  <Badge variant="outline">{t(`status.${report.status.toLowerCase()}`, report.status)}</Badge>
                  {report.isFeatured && (
                    <Badge className="bg-amber-400 text-amber-950 border-amber-300 gap-1 flex items-center hover:bg-amber-400">
                      <Star className="h-3 w-3 fill-current" />
                      {t('searchPage.featured')}
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-foreground">{report.title}</h1>
                {report.receiptNumber && (
                  <p className="text-sm text-muted-foreground mt-1 font-mono">
                    {t('report_detail.receipt', { receiptNumber: report.receiptNumber })}
                  </p>
                )}

                {report.status === 'Expired' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                    <div className="flex items-center gap-2 text-amber-800 mb-2">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-semibold">{t('report_detail.expiredTitle')}</span>
                    </div>
                    <p className="text-sm text-amber-700 mb-3">
                      {t('report_detail.expiredDesc')}
                      {isOwner ? t('report_detail.expiredDescOwner') : ""}
                    </p>
                    {isOwner && (
                      <Button
                        variant="outline"
                        className="bg-white border-amber-300 text-amber-900 hover:bg-amber-100"
                        onClick={async () => {
                          try {
                            await apiRequest(`/api/reports/${report.id}/renew`, { method: 'POST' });
                            toast({ title: t('report_detail.renewSuccess') });
                            queryClient.invalidateQueries({ queryKey: [`/api/reports/${id}`] });
                          } catch (e) {
                            toast({ variant: "destructive", title: t('report_detail.renewFailed') });
                          }
                        }}
                      >
                        {t('report_detail.renewReport')}
                      </Button>
                    )}
                  </div>
                )}

                {isOwner && report.paymentStatus === 'pending' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mt-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-blue-700" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-blue-900 mb-1">Payment Required</h3>
                        <p className="text-sm text-blue-700 mb-4 leading-relaxed">
                          Your report is currently <strong>private</strong> and not visible in the public directory. 
                          Complete the payment to activate it and start receiving potential matches.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <PaymentButton
                            paymentType="lost_report"
                            reportId={report.id}
                            onPaymentSuccess={() => {
                              toast({
                                title: "Payment Successful",
                                description: "Your report is now public!",
                              });
                              queryClient.invalidateQueries({ queryKey: [`/api/reports/${id}`] });
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6"
                          >
                            Pay & Activate Report
                          </PaymentButton>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Privacy Banner for Guests */}
                {!isOwner && report.privacyProtected && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mt-4 flex gap-3">
                    <div className="bg-orange-100 p-2 rounded-lg h-fit">
                      <Lock className="h-5 w-5 text-orange-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-orange-900 text-sm">{t('searchPage.privacyProtected')}</h3>
                      <p className="text-xs text-orange-700 leading-relaxed mt-0.5">
                        {t('searchPage.privacyHintLong')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Featured Upgrade for Owners */}
                {isOwner && !report.isFeatured && report.status === 'Open' && report.paymentStatus === 'successful' && (
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 rounded-xl p-5 mt-4 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Star className="h-16 w-16 text-amber-600" />
                    </div>
                    <div className="flex items-start gap-4 relative z-10">
                      <div className="bg-amber-200 p-2.5 rounded-xl shadow-inner">
                        <Star className="h-6 w-6 text-amber-700 fill-amber-700" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-black text-amber-900 mb-1 tracking-tight">Boost This Report</h3>
                        <p className="text-sm text-amber-800 mb-4 leading-relaxed font-medium">
                          Get <strong>10x more visibility</strong> by featuring your report at the top of search results.
                        </p>
                        <PaymentButton
                          paymentType="featured_upgrade"
                          reportId={report.id}
                          onPaymentSuccess={() => {
                            toast({
                              title: "Upgrade Successful!",
                              description: "Your report is now featured!",
                            });
                            queryClient.invalidateQueries({ queryKey: [`/api/reports/${id}`] });
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-black px-6 shadow-lg shadow-amber-500/20"
                        >
                          Upgrade to Featured {t('common.brandName')}
                        </PaymentButton>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Info Cards */}
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{t('report_detail.dateLabel')}</span>
                    <span className="font-medium text-foreground">{format(new Date(report.date), 'MMMM d, yyyy')}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{t('report_detail.locationLabel')}</span>
                    <span className="font-medium text-foreground">{report.location}</span>
                  </div>

                  {report.category && (
                    <div className="flex items-center gap-3 text-sm">
                      <TagIcon className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{t('report_detail.categoryLabel')}</span>
                      <span className="font-medium text-foreground">{t(`categories.${report.category.toLowerCase().replace(/[\s&]/g, '')}`, report.category)}</span>
                    </div>
                  )}

                  {report.custodyLocation && (
                    <div className="flex items-center gap-3 text-sm">
                      <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{t('report_detail.heldAtLabel')}</span>
                      <span className="font-medium text-foreground">{report.custodyLocation}</span>
                    </div>
                  )}

                  {report.type === 'lost' && report.contactInfo && (
                    <div className="flex items-start gap-3 text-sm">
                      <Phone className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{t('report_detail.contactLabel')}</span>
                      {report.contactInfo.startsWith('[') ? (
                        <div className="flex flex-col">
                          <span className="text-muted-foreground/60 italic">{t('report_detail.contactHidden')}</span>
                          <span className="text-xs text-muted-foreground/80 mt-1">
                            {isOwner
                              ? t('report_detail.contactHiddenOwner')
                              : t('report_detail.contactHiddenFinder')}
                          </span>
                        </div>
                      ) : (
                        <span className="font-medium text-foreground">{report.contactInfo}</span>
                      )}
                    </div>
                  )}

                  {/* Finder Reputation (Phase 2) */}
                  {(report as any).finderReputation && (
                    <div className="pt-2">
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-foreground/90">{t('report_detail.finderReputation')}</span>
                            {(report as any).finderReputation.isTrusted && (
                              <Badge className="h-4 px-1 bg-blue-500 text-[10px] hover:bg-blue-600">
                                <ShieldCheck className="h-2.5 w-2.5 mr-0.5" />
                                {t('report_detail.trusted')}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span>{t('report_detail.score', { score: (report as any).finderReputation.reputationScore })}</span>
                            <span>•</span>
                            <span>{t('report_detail.itemsReturnedCount', { count: (report as any).finderReputation.itemsReturnedCount })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-foreground mb-2">{t('report_detail.descriptionLabel')}</h3>
                  <p className="text-muted-foreground leading-relaxed">{report.description}</p>
                </CardContent>
              </Card>

              {/* Potential Matches */}
              {isOwner && matches && matches.length > 0 && (
                <Card className="border-purple-500/20 bg-purple-500/10">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-purple-600" />
                      <CardTitle className="text-purple-600 dark:text-purple-300">{t('report_detail.potentialMatchesFound')}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-purple-600 dark:text-purple-400">
                      {t('report_detail.potentialMatchesDesc', { count: matches.length })}
                    </p>
                    <div className="space-y-3">
                      {matches.map((match) => (
                        <div
                          key={match.id}
                          className="bg-background p-3 rounded-lg border border-purple-500/20 shadow-sm cursor-pointer hover:bg-purple-500/5 transition-colors"
                          onClick={() => navigate(`/reports/${match.id}`)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-purple-600 dark:text-purple-300">{match.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{match.description}</p>
                            </div>
                            <Badge variant="outline" className="text-purple-600 border-purple-200 text-xs">
                              {match.type === 'lost' ? t('dashboard.stats.totalLost') : t('dashboard.stats.totalFound')}
                            </Badge>
                          </div>
                          {match.matchScore && (
                            <div className="mt-2 flex items-center gap-1">
                              <Progress
                                value={match.matchScore}
                                className="h-1.5 flex-1 bg-muted"
                                indicatorClassName="bg-purple-500"
                              />
                              <span className="text-xs font-mono text-purple-500">{match.matchScore}%</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* My Claim Status */}
              {!isOwner && myClaim && (
                <Card className="border-blue-500/20 bg-blue-500/10">
                  <CardHeader>
                    <CardTitle className="text-blue-600 dark:text-blue-300">{t('report_detail.yourClaimStatus')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-blue-600 dark:text-blue-400 capitalize">{t('report_detail.statusLabel', { status: myClaim.status })}</span>
                      <Badge variant={myClaim.status === 'verified' ? 'default' : 'secondary'}>
                        {t(`status.${myClaim.status.toLowerCase()}`, myClaim.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-blue-500 mt-2">
                      {myClaim.status === 'verified'
                        ? t('report_detail.statusVerifiedMsg')
                        : myClaim.status === 'rejected'
                          ? t('report_detail.statusRejectedMsg')
                          : t('report_detail.statusPendingMsg')}
                    </p>

                    <div className="flex gap-2 mt-3">
                      {myClaim.status === 'rejected' && (
                        <Button
                          variant="outline"
                          className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => setShowAppealDialog(true)}
                        >
                          {t('report_detail.appealDecision')}
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => navigate(`/claims/${myClaim.id}`)}
                      >
                        {t('report_detail.viewFullClaim')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Claims Received (Owner View) */}
              {isOwner && claims && claims.length > 0 && (
                <Card className="border-green-500/20 bg-green-500/10">
                  <CardHeader>
                    <CardTitle className="text-green-600 dark:text-green-300">{t('report_detail.claimsReceived')}</CardTitle>
                    <CardDescription>{t('report_detail.claimsReceivedDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {claims.map(claim => (
                      <div key={claim.id} className="bg-background p-4 rounded-lg border border-green-500/20 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-green-600 dark:text-green-400">{t('report_detail.claimant', { id: claim.userId })}</span>
                          <Badge variant={claim.status === 'verified' ? 'default' : 'outline'}>{t(`status.${claim.status.toLowerCase()}`, claim.status)}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{claim.description}</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/claims/${claim.id}`)}>
                            {t('report_detail.viewDetails')}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* File Claim Action */}
              {!isOwner && isFoundReport && report.status === 'Open' && !myClaim && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="p-5">
                    {!showClaimForm ? (
                      <div className="text-center">
                        <ShieldCheck className="h-10 w-10 text-primary mx-auto mb-3" />
                        <h3 className="font-semibold text-foreground mb-2">{t('report_detail.isThisYourItem')}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {t('report_detail.isThisYourItemDesc')}
                        </p>
                        <Button onClick={() => setShowClaimForm(true)} className="w-full">
                          {t('report_detail.fileOwnershipClaim')}
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-foreground">{t('report_detail.claimFormTitle')}</h3>
                          <Button variant="ghost" size="sm" onClick={() => setShowClaimForm(false)}>
                            {t('report_detail.cancel')}
                          </Button>
                        </div>
                        <ClaimForm
                          reportId={report.id}
                          challengeQuestion={report.challengeQuestion}
                          onSuccess={() => {
                            setShowClaimForm(false);
                            toast({ 
                              title: t('report_detail.claimSubmittedSuccess'),
                              description: t('claims.success_desc')
                            });
                            
                            // Track successful claim submission
                            ReactGA.event("claim_submitted", {
                              report_id: String(report.id),
                              report_type: report.type
                            });

                            queryClient.invalidateQueries({ queryKey: [`/api/reports/${id}`] });
                            queryClient.invalidateQueries({ queryKey: ['/api/claims/my-claims'] });
                            // Navigate to My Items to show the pending claim
                            navigate('/my-items');
                          }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {isOwner && (
                <Card className="border-blue-500/20 bg-blue-500/10">
                  <CardContent className="p-5 text-center">
                    <User className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-blue-500">{t('report_detail.youSubmittedReport')}</p>
                    {report.type === 'lost' && (report.status === 'Open' || report.status === 'In_Progress') && (
                      <Button
                        className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => setShowMarkFoundDialog(true)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {t('report_detail.markAsFound')}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showMarkFoundDialog} onOpenChange={setShowMarkFoundDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('report_detail.markAsFoundDialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('report_detail.markAsFoundDialogDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('report_detail.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                markAsFoundMutation.mutate();
              }}
              className="bg-green-600 hover:bg-green-700"
              disabled={markAsFoundMutation.isPending}
            >
              {markAsFoundMutation.isPending ? t('report_detail.updating') : t('report_detail.confirmFound')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showAppealDialog} onOpenChange={setShowAppealDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('report_detail.appealDialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('report_detail.appealDialogDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">{t('report_detail.reasonForAppeal')}</Label>
              <Textarea
                id="reason"
                placeholder={t('report_detail.reasonPlaceholder')}
                className="min-h-[100px]"
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAppealDialog(false)}>{t('report_detail.cancel')}</Button>
            <Button
              onClick={() => submitAppealMutation.mutate()}
              disabled={appealReason.length < 20 || submitAppealMutation.isPending}
            >
              {submitAppealMutation.isPending ? t('report_detail.submitting') : t('report_detail.submitAppeal')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}

