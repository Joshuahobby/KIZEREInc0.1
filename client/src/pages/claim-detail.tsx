import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
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
  Image as ImageIcon
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Type for the special claim response
interface ClaimDetail {
  id: number;
  userId: number;
  reportId: number;
  description: string;
  imageUrls: string[] | null;
  status: 'pending' | 'verified' | 'rejected' | 'resolved';
  finderNotes: string | null;
  createdAt: string;
  updatedAt: string | null;
  verifiedAt: string | null;
  reportTitle: string;
  reportType: string;
  claimantName: string;
  claimantEmail: string;
}

export default function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Dialog states
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showAppealDialog, setShowAppealDialog] = useState(false);
  const [notes, setNotes] = useState("");
  const [appealReason, setAppealReason] = useState("");

  // Fetch claim logic
  const { data: claim, isLoading, error } = useQuery<ClaimDetail>({
    queryKey: [`/api/claims/${id}`],
    enabled: !!id,
  });

  // Fetch report logic (to check ownership/role precisely)
  const { data: report } = useQuery<Report>({
    queryKey: [`/api/reports/${claim?.reportId}`],
    enabled: !!claim?.reportId,
  });

  // Verification Mutation
  const verifyMutation = useMutation({
    mutationFn: async (status: 'verified' | 'rejected') => {
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
      toast({ 
        title: status === 'verified' ? "Claim Verified" : "Claim Rejected", 
        description: `Successfully ${status === 'verified' ? 'verified' : 'rejected'} the claim.`
      });
      queryClient.invalidateQueries({ queryKey: [`/api/claims/${id}`] });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Action Failed", description: err.message });
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
      toast({ title: "Appeal Submitted", description: "An admin will review your case." });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Appeal Failed", description: err.message });
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

  if (error || !claim) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center p-8 text-center py-20">
          <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Claim Not Found</h1>
          <p className="text-neutral-500 mb-6">The claim you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </PageLayout>
    );
  }

  const isFinder = report?.userId === user?.id;
  const isClaimant = claim.userId === user?.id;
  const isAdmin = user?.role === 'Admin' || user?.role === 'Moderator';
  const showActions = (isFinder || isAdmin) && claim.status === 'pending';

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
            Back to Report
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column: Claim Info */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">Claim Details</CardTitle>
                      <CardDescription>
                        Claim for: <span className="font-medium text-neutral-900">{claim.reportTitle}</span>
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={claim.status === 'verified' ? 'default' : claim.status === 'rejected' ? 'destructive' : 'outline'}
                      className="capitalize"
                    >
                      {claim.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-medium text-neutral-900 mb-2">Description of Item/Proof</h3>
                    <p className="text-neutral-600 whitespace-pre-wrap">{claim.description}</p>
                  </div>

                  {claim.imageUrls && claim.imageUrls.length > 0 && (
                    <div>
                      <h3 className="font-medium text-neutral-900 mb-2">Proof Images</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {claim.imageUrls.map((url, i) => (
                           <div key={i} className="aspect-video relative rounded-lg overflow-hidden border bg-neutral-100">
                             <img src={url} alt={`Proof ${i+1}`} className="object-cover w-full h-full" />
                           </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Finder Notes (if verified/rejected) */}
                  {claim.finderNotes && (
                    <div className="bg-neutral-100 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2 text-neutral-900 font-medium">
                        <MessageSquare className="h-4 w-4" />
                        <span>Notes from Finder</span>
                      </div>
                      <p className="text-neutral-700">{claim.finderNotes}</p>
                    </div>
                  )}
                </CardContent>
                
                {/* Actions for Finder/Admin */}
                {showActions && (
                  <CardFooter className="flex justify-end gap-3 border-t bg-neutral-50/50 p-4">
                    <Button 
                      variant="outline" 
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => setShowRejectDialog(true)}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject Claim
                    </Button>
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => setShowVerifyDialog(true)}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Verify Claim
                    </Button>
                  </CardFooter>
                )}

                {/* Appeal Action for Claimant */}
                {isClaimant && claim.status === 'rejected' && (
                  <CardFooter className="bg-neutral-50 border-t p-4 flex justify-between items-center">
                    <p className="text-sm text-neutral-600">Believe this rejection was a mistake?</p>
                    <Button 
                      variant="outline"
                      onClick={() => setShowAppealDialog(true)}
                    >
                      Appeal Decision
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
                       Claimant Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <div>
                       <span className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Name</span>
                       <p className="font-medium">{claim.claimantName}</p>
                     </div>
                     <div>
                       <span className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Email</span>
                       <p className="font-medium text-sm">{claim.claimantEmail}</p>
                     </div>
                     <div className="pt-2">
                        <div className="bg-blue-50 border border-blue-100 p-3 rounded text-xs text-blue-800">
                          Verify the proof images and description carefully before approving. Once verified, your contact info will be shared with them.
                        </div>
                     </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
        </div>

      {/* Verify Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Claim</DialogTitle>
            <DialogDescription>
              Are you sure you want to verify this claim? This will mark the item as FOUND by this user and share your contact information with them.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="verify-notes">Optional Notes for Claimant</Label>
            <Textarea 
              id="verify-notes" 
              placeholder="Add any instructions on how to meet up..." 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerifyDialog(false)}>Cancel</Button>
            <Button 
              className="bg-green-600 hover:bg-green-700" 
              onClick={() => verifyMutation.mutate('verified')}
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending ? "Processing..." : "Confirm Verification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Claim</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this claim. The claimant will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reject-notes">Reason for Rejection *</Label>
            <Textarea 
              id="reject-notes" 
              placeholder="Explain why the proof was insufficient..." 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button 
              variant="destructive"
              onClick={() => verifyMutation.mutate('rejected')}
              disabled={verifyMutation.isPending || notes.length < 5}
            >
              {verifyMutation.isPending ? "Processing..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Appeal Dialog */}
      <Dialog open={showAppealDialog} onOpenChange={setShowAppealDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appeal Claim Decision</DialogTitle>
            <DialogDescription>
              Submit an appeal to the administration team.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="appeal-reason">Reason for Appeal *</Label>
            <Textarea 
              id="appeal-reason" 
              placeholder="Explain why this decision is incorrect..." 
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAppealDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => appealMutation.mutate()}
              disabled={appealMutation.isPending || appealReason.length < 20}
            >
              {appealMutation.isPending ? "Submitting..." : "Submit Appeal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
