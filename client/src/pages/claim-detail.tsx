import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  status: 'pending' | 'verified' | 'rejected' | 'resolved';
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
  const { user } = useAuth();
  const { toast } = useToast();

  // Dialog states
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showAppealDialog, setShowAppealDialog] = useState(false);
  const [notes, setNotes] = useState("");
  const [appealReason, setAppealReason] = useState("");
  const [showHandoverDialog, setShowHandoverDialog] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);

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
        title: "Handover Confirmed",
        description: hasBounty
          ? "The item has been successfully returned! Bounty payout initiated."
          : "The item has been successfully returned!"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/claims/${id}`] });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Handover Failed", description: "Invalid OTP. Please try again." });
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
      toast({ variant: "destructive", title: "Chat Error", description: err.message });
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

                  {report?.bountyAmount && Number(report.bountyAmount) > 0 && (
                    <div className="p-4 bg-green-50 border border-green-100 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-full">
                          <Banknote className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-900">Bounty Reward</p>
                          <p className="text-lg font-bold text-green-700">
                            {Number(report.bountyAmount).toLocaleString()} RWF
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-white text-green-700 border-green-200">
                        {report.bountyStatus === 'released' ? 'Paid Out' : 'Escrowed'}
                      </Badge>
                    </div>
                  )}

                  <div>
                    <h3 className="font-medium text-neutral-900 mb-2">Description of Item/Proof</h3>
                    <p className="text-neutral-600 whitespace-pre-wrap">{claim.description}</p>
                  </div>

                  {claim.verificationAnswer && (
                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg">
                      <div className="flex items-center gap-2 mb-2 text-primary font-bold">
                        <ShieldCheck className="h-4 w-4" />
                        <span>Verification Answer</span>
                      </div>
                      <p className="text-neutral-700 italic">"{claim.verificationAnswer}"</p>
                    </div>
                  )}

                  {claim.imageUrls && claim.imageUrls.length > 0 && (
                    <div>
                      <h3 className="font-medium text-neutral-900 mb-2">Proof Images</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {claim.imageUrls.map((url, i) => (
                          <div key={i} className="aspect-video relative rounded-lg overflow-hidden border bg-neutral-100">
                            <img src={url} alt={`Proof ${i + 1}`} className="object-cover w-full h-full" />
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

                  {/* Appeal Status Section */}
                  {claim.appealStatus && (
                    <div className={`p-4 rounded-lg border ${claim.appealStatus === 'approved' ? 'bg-green-50 border-green-100' :
                      claim.appealStatus === 'rejected' ? 'bg-red-50 border-red-100' :
                        'bg-amber-50 border-amber-100'
                      }`}>
                      <div className="flex items-center gap-2 mb-2 font-semibold text-neutral-900">
                        <AlertTriangle className={`h-4 w-4 ${claim.appealStatus === 'approved' ? 'text-green-600' :
                          claim.appealStatus === 'rejected' ? 'text-red-600' :
                            'text-amber-600'
                          }`} />
                        <span>Claim Appeal: {claim.appealStatus.charAt(0).toUpperCase() + claim.appealStatus.slice(1)}</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-neutral-500 font-medium">Your Reason:</span> {claim.appealReason}</p>
                        {claim.appealAdminNotes && (
                          <div className="pt-2 border-t border-neutral-200/50 mt-2">
                            <p><span className="text-neutral-500 font-medium">Admin Decision:</span> {claim.appealAdminNotes}</p>
                            {claim.appealResolvedAt && (
                              <p className="text-[10px] text-neutral-400 mt-1">
                                Resolved on {format(new Date(claim.appealResolvedAt), 'MMM d, yyyy HH:mm')}
                              </p>
                            )}
                          </div>
                        )}
                        {claim.appealStatus === 'pending' && (
                          <p className="text-amber-700 italic text-xs">An administrator is currently reviewing your appeal.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Secure Handover OTP (For Claimant) */}
                  {isClaimant && claim.status === 'verified' && claim.handoverOtp && (
                    <div className="p-6 mt-6 bg-green-50 border-2 border-dashed border-green-200 rounded-xl text-center">
                      <ShieldCheck className="h-10 w-10 text-green-600 mx-auto mb-3" />
                      <h3 className="text-lg font-bold text-green-900 mb-1">Secure Handover Code</h3>
                      <p className="text-sm text-green-700 mb-4">When meeting the finder, provide them with this 6-digit code to finalize the return.</p>
                      <div className="bg-white rounded-lg py-4 px-8 border border-green-100 inline-block shadow-sm">
                        <span className="text-4xl font-black tracking-[0.5em] text-neutral-900">{claim.handoverOtp}</span>
                      </div>
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

                {/* Secure Handover Flow (For Finder) */}
                {isFinder && claim.status === 'verified' && (
                  <CardFooter className="flex justify-between items-center border-t bg-amber-50/50 p-4">
                    <div className="flex items-center gap-2 text-amber-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">Ready for handover?</span>
                    </div>
                    <Button
                      className="bg-amber-600 hover:bg-amber-700"
                      onClick={() => setShowHandoverDialog(true)}
                    >
                      Process Handover
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
                title={`Chat: ${claim.reportTitle}`}
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

      {/* Handover Dialog */}
      <Dialog open={showHandoverDialog} onOpenChange={setShowHandoverDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Secure Handover</DialogTitle>
            <DialogDescription>
              Enter the 6-digit OTP provided by the claimant to confirm you have handed over the item.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center gap-4">
            <Label htmlFor="otp">6-Digit Handover Code</Label>
            <Input
              id="otp"
              className="text-center text-2xl font-black tracking-[0.5em] h-14"
              placeholder="000000"
              maxLength={6}
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value)}
            />
            <p className="text-xs text-neutral-500 text-center">
              By confirming, you agree that the item has been safely returned to its rightful owner.
            </p>
            {report?.bountyAmount && Number(report.bountyAmount) > 0 && (
              <div className="bg-green-50 p-2 rounded text-xs text-green-700 text-center w-full">
                <strong>Bounty Note:</strong> Verifying this code will strictly release the {Number(report.bountyAmount).toLocaleString()} RWF reward to you.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHandoverDialog(false)}>Cancel</Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => handoverMutation.mutate(otpValue)}
              disabled={handoverMutation.isPending || otpValue.length !== 6}
            >
              {handoverMutation.isPending ? "Confirming..." : "Finalize Handover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
