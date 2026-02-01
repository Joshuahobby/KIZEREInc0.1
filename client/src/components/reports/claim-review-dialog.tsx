import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Claim } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface ClaimReviewDialogProps {
  claim: Claim | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ClaimReviewDialog({ claim, isOpen, onClose }: ClaimReviewDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const verifyMutation = useMutation({
    mutationFn: async ({ status, notes }: { status: string, notes?: string }) => {
      return await apiRequest(`/api/claims/${claim?.id}/verify`, {
        method: "POST",
        data: { status, notes }
      });
    },
    onSuccess: () => {
      toast({ title: "Claim updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/claims/received"] });
      onClose();
    },
    onError: (e: Error) => {
      toast({ 
        title: "Verification failed", 
        description: e.message, 
        variant: "destructive" 
      });
    }
  });

  if (!claim) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Review Ownership Claim</DialogTitle>
          <DialogDescription>
            Review the proof provided below to confirm if this item belongs to the claimant.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Proof of Ownership</h4>
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 text-sm leading-relaxed text-neutral-700">
              {claim.description}
            </div>
          </div>

          {claim.imageUrls && claim.imageUrls.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Evidence Images</h4>
              <div className="grid grid-cols-2 gap-3">
                {claim.imageUrls.map((url, i) => (
                  <img 
                    key={i} 
                    src={url} 
                    className="rounded-lg border h-32 w-full object-cover shadow-sm" 
                    alt="Claim evidence"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            className="flex-1 text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700"
            disabled={verifyMutation.isPending}
            onClick={() => verifyMutation.mutate({ 
              status: 'rejected', 
              notes: 'The provided information was insufficient or incorrect.' 
            })}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Reject Claim
          </Button>
          <Button 
            className="flex-1 bg-green-600 hover:bg-green-700 shadow-md shadow-green-100"
            disabled={verifyMutation.isPending || claim.status !== 'pending'}
            onClick={() => verifyMutation.mutate({ 
              status: 'accepted', 
              notes: 'Claim verified by finder.' 
            })}
          >
            {verifyMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Confirm Ownership
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
