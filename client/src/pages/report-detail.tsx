import { useState, CSSProperties } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { PageLayout } from "@/components/layout/page-layout";
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
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Report, Claim } from "@shared/schema";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Tag,
  User,
  Phone,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Image as ImageIcon,
  ShieldCheck
} from "lucide-react";

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [showAppealDialog, setShowAppealDialog] = useState(false);
  const [showMarkFoundDialog, setShowMarkFoundDialog] = useState(false);
  const [appealReason, setAppealReason] = useState("");

  const { data: report, isLoading, error } = useQuery<Report>({
    queryKey: [`/api/reports/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/reports/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch report');
      return res.json();
    },
    enabled: !!id,
  });

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
    queryKey: ['/api/claims'],
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
      toast({ title: "Appeal submitted successfully", description: "An admin will review your case." });
      queryClient.invalidateQueries({ queryKey: ['/api/claims'] });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Failed to submit appeal", description: err.message });
    }
  });

  const markAsFoundMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/reports/${id}/mark-found`, { method: 'POST' });
    },
    onSuccess: () => {
      toast({ title: "Report updated", description: "Your item has been marked as found." });
      queryClient.invalidateQueries({ queryKey: [`/api/reports/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      setShowMarkFoundDialog(false);
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Failed to update report", description: err.message });
    }
  });

  if (isLoading) {
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
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Report Not Found</h1>
          <p className="text-neutral-500 mb-6">The report you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/lost-found')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lost & Found
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
            onClick={() => navigate('/lost-found')}
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
                      className="rounded-xl w-full h-64 object-cover shadow-lg border"
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-neutral-100 rounded-xl h-64 flex items-center justify-center">
                  <ImageIcon className="h-16 w-16 text-neutral-300" />
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
                    {report.type === 'lost' ? 'Lost' : 'Found'}
                  </Badge>
                  <Badge variant="outline">{report.status}</Badge>
                </div>
                <h1 className="text-3xl font-bold text-neutral-900">{report.title}</h1>
                {report.receiptNumber && (
                  <p className="text-sm text-neutral-500 mt-1 font-mono">
                    Receipt: {report.receiptNumber}
                  </p>
                )}

                {report.status === 'Expired' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                    <div className="flex items-center gap-2 text-amber-800 mb-2">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-semibold">This report has expired</span>
                    </div>
                    <p className="text-sm text-amber-700 mb-3">
                      Expired reports are no longer visible in public searches.
                      {isOwner ? " You can renew this report to make it active again." : ""}
                    </p>
                    {isOwner && (
                      <Button
                        variant="outline"
                        className="bg-white border-amber-300 text-amber-900 hover:bg-amber-100"
                        onClick={async () => {
                          try {
                            await apiRequest(`/api/reports/${report.id}/renew`, { method: 'POST' });
                            toast({ title: "Report renewed successfully" });
                            queryClient.invalidateQueries({ queryKey: [`/api/reports/${id}`] });
                          } catch (e) {
                            toast({ variant: "destructive", title: "Failed to renew report" });
                          }
                        }}
                      >
                        Renew Report (30 Days)
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Info Cards */}
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-neutral-600">Date:</span>
                    <span className="font-medium">{format(new Date(report.date), 'MMMM d, yyyy')}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-neutral-600">Location:</span>
                    <span className="font-medium">{report.location}</span>
                  </div>

                  {report.category && (
                    <div className="flex items-center gap-3 text-sm">
                      <Tag className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-neutral-600">Category:</span>
                      <span className="font-medium">{report.category}</span>
                    </div>
                  )}

                  {report.type === 'lost' && report.contactInfo && (
                    <div className="flex items-start gap-3 text-sm">
                      <Phone className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-neutral-600">Contact:</span>
                      {report.contactInfo.startsWith('[') ? (
                        <div className="flex flex-col">
                          <span className="text-neutral-400 italic">Contact info hidden</span>
                          <span className="text-xs text-neutral-500 mt-1">
                            {isOwner
                              ? "Visible to you and verified claimants."
                              : "Submit a claim and get verified to see contact details."}
                          </span>
                        </div>
                      ) : (
                        <span className="font-medium">{report.contactInfo}</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-neutral-900 mb-2">Description</h3>
                  <p className="text-neutral-600 leading-relaxed">{report.description}</p>
                </CardContent>
              </Card>

              {/* Potential Matches */}
              {isOwner && matches && matches.length > 0 && (
                <Card className="border-purple-200 bg-purple-50">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-purple-600" />
                      <CardTitle className="text-purple-900">Potential Matches Found</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-purple-700">
                      We found {matches.length} item(s) that might match your report.
                    </p>
                    <div className="space-y-3">
                      {matches.map((match) => (
                        <div
                          key={match.id}
                          className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm cursor-pointer hover:bg-purple-50 transition-colors"
                          onClick={() => navigate(`/reports/${match.id}`)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-purple-900">{match.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{match.description}</p>
                            </div>
                            <Badge variant="outline" className="text-purple-600 border-purple-200 text-xs">
                              {match.type === 'lost' ? 'Lost' : 'Found'}
                            </Badge>
                          </div>
                          {match.matchScore && (
                            <div className="mt-2 flex items-center gap-1">
                              <Progress
                                value={match.matchScore}
                                className="h-1.5 flex-1 bg-neutral-100"
                                indicatorClassName="bg-purple-500"
                              />
                              <span className="text-xs font-mono text-purple-700">{match.matchScore}%</span>
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
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-blue-900">Your Claim Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-blue-800 capitalize">Status: {myClaim.status}</span>
                      <Badge variant={myClaim.status === 'verified' ? 'default' : 'secondary'}>
                        {myClaim.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-blue-700 mt-2">
                      {myClaim.status === 'verified'
                        ? "Congratulations! Your claim has been verified. You can now see the contact info above."
                        : myClaim.status === 'rejected'
                          ? "Your claim was rejected by the finder."
                          : "Your claim is currently under review by the finder."}
                    </p>

                    <div className="flex gap-2 mt-3">
                      {myClaim.status === 'rejected' && (
                        <Button
                          variant="outline"
                          className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => setShowAppealDialog(true)}
                        >
                          Appeal Decision
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => navigate(`/claims/${myClaim.id}`)}
                      >
                        View Full Claim
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Claims Received (Owner View) */}
              {isOwner && claims && claims.length > 0 && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-green-900">Claims Received</CardTitle>
                    <CardDescription>Review claims from users who believe this is their item.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {claims.map(claim => (
                      <div key={claim.id} className="bg-white p-4 rounded-lg border border-green-100 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-green-900">Claimant #{claim.userId}</span>
                          <Badge variant={claim.status === 'verified' ? 'default' : 'outline'}>{claim.status}</Badge>
                        </div>
                        <p className="text-sm text-neutral-600 mb-3 line-clamp-2">{claim.description}</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/claims/${claim.id}`)}>
                            View Details
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
                        <h3 className="font-semibold text-neutral-900 mb-2">Is this your item?</h3>
                        <p className="text-sm text-neutral-600 mb-4">
                          If you believe this item belongs to you, file a claim with proof of ownership.
                        </p>
                        <Button onClick={() => setShowClaimForm(true)} className="w-full">
                          File Ownership Claim
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-neutral-900">Claim Form</h3>
                          <Button variant="ghost" size="sm" onClick={() => setShowClaimForm(false)}>
                            Cancel
                          </Button>
                        </div>
                        <ClaimForm
                          reportId={report.id}
                          onSuccess={() => {
                            setShowClaimForm(false);
                            toast({ title: "Claim submitted successfully!" });
                            queryClient.invalidateQueries({ queryKey: [`/api/reports/${id}`] });
                            queryClient.invalidateQueries({ queryKey: ['/api/claims'] });
                          }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {isOwner && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-5 text-center">
                    <User className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-blue-700">You submitted this report</p>
                    {report.type === 'lost' && (report.status === 'Open' || report.status === 'In_Progress') && (
                      <Button
                        className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => setShowMarkFoundDialog(true)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Found
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
            <AlertDialogTitle>Mark your item as found?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark your lost report as resolved. If this report is linked to one of your registered items, its status will be updated to "Recovered".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                markAsFoundMutation.mutate();
              }}
              className="bg-green-600 hover:bg-green-700"
              disabled={markAsFoundMutation.isPending}
            >
              {markAsFoundMutation.isPending ? "Updating..." : "Confirm Found"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showAppealDialog} onOpenChange={setShowAppealDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appeal Claim Decision</DialogTitle>
            <DialogDescription>
              If you believe your claim was wrongly rejected, you can submit an appeal to our administration team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Appeal</Label>
              <Textarea
                id="reason"
                placeholder="Please explain why this item belongs to you and provide any additional details..."
                className="min-h-[100px]"
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAppealDialog(false)}>Cancel</Button>
            <Button
              onClick={() => submitAppealMutation.mutate()}
              disabled={appealReason.length < 20 || submitAppealMutation.isPending}
            >
              {submitAppealMutation.isPending ? "Submitting..." : "Submit Appeal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
