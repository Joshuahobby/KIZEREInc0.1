import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, ShieldCheck, User as UserIcon, Calendar, FileText } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { VerificationRequest, User } from "@shared/schema";
import { format } from "date-fns";

interface UserVerificationDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserVerificationDialog({ user, open, onOpenChange }: UserVerificationDialogProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [reviewComment, setReviewComment] = useState("");

  const { data: request, isLoading } = useQuery<VerificationRequest>({
    queryKey: [`/api/admin/verification-requests/user/${user?.id}`],
    enabled: !!user && open,
  });

  const mutation = useMutation({
    mutationFn: async ({ status, comment }: { status: 'approved' | 'rejected', comment?: string }) => {
      if (!request) return;
      const res = await apiRequest(`/api/admin/verification-requests/${request.id}`, {
        method: "PATCH",
        data: { status, adminComment: comment }
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/verification-requests/user/${user?.id}`] });
      toast({
        title: t('common.success'),
        description: "User verification status updated successfully.",
      });
      onOpenChange(false);
      setReviewComment("");
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{t('dashboard.admin.verificationReview')}</DialogTitle>
              <DialogDescription>
                Review identity documents for <span className="font-semibold text-foreground">{user?.fullName || user?.username}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading verification documents...</p>
          </div>
        ) : !request ? (
          <div className="py-12 text-center text-muted-foreground">
            <p>No pending verification request found for this user.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Selfie Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <UserIcon className="h-4 w-4 text-primary" />
                    Selfie Analysis
                  </div>
                  {request.livenessCode && (
                    <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0 h-5">
                      Code: <span className="text-primary font-bold ml-1">{request.livenessCode}</span>
                    </Badge>
                  )}
                </div>
                <div className="aspect-[4/3] relative rounded-xl overflow-hidden border-2 bg-muted/50 group">
                  <img
                    src={request.selfieUrl}
                    alt="Selfie"
                    className="object-contain w-full h-full transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                </div>
              </div>

              {/* Document Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary capitalize">
                    <FileText className="h-4 w-4" />
                    {request.documentType.replace('_', ' ')}
                  </div>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                    Original ID
                  </Badge>
                </div>
                <div className="aspect-[4/3] relative rounded-xl overflow-hidden border-2 bg-muted/50 group">
                  <img
                    src={request.documentUrl}
                    alt="Identity Document"
                    className="object-contain w-full h-full transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                </div>
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-xl space-y-4 border border-border/50">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Submitted: {format(new Date(request.submittedAt), 'PPP p')}
                </div>
                <Badge variant={request.status === 'pending' ? 'secondary' : 'default'} className="capitalize">
                  {request.status}
                </Badge>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  Review Internal Comment
                  <span className="text-[10px] font-normal text-muted-foreground italic">(Visible to user if rejected)</span>
                </label>
                <Textarea
                  placeholder="Provide context for approval or reasons for rejection..."
                  className="min-h-[100px] resize-none focus:ring-1"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="flex gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="flex-1 h-12 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate({
                  status: 'rejected',
                  comment: reviewComment
                })}
              >
                <XCircle className="h-4 w-4 mr-2" /> Reject Verification
              </Button>
              <Button
                className="flex-1 h-12 shadow-md shadow-primary/20"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate({
                  status: 'approved',
                  comment: reviewComment
                })}
              >
                <CheckCircle className="h-4 w-4 mr-2" /> Approve & Verify
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
