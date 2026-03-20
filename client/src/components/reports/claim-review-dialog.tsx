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
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ClaimReviewDialogProps {
  claim: Claim | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ClaimReviewDialog({ claim, isOpen, onClose }: ClaimReviewDialogProps) {
  const { t } = useLanguage();
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
      toast({ title: t("claims.update_success") });
      queryClient.invalidateQueries({ queryKey: ["/api/claims/received"] });
      onClose();
    },
    onError: (e: Error) => {
      toast({
        title: t("claims.update_error"),
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
          <DialogTitle className="text-xl font-bold">{t("claims.review_title")}</DialogTitle>
          <DialogDescription>
            {t("claims.review_desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{t("claims.proof_of_ownership")}</h4>
            <div className="p-4 bg-neutral-50 dark:bg-zinc-900/50 rounded-xl border border-neutral-100 dark:border-white/10 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              {claim.description}
            </div>
          </div>

          {claim.imageUrls && claim.imageUrls.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{t("claims.evidence_images")}</h4>
              <div className="grid grid-cols-2 gap-3">
                {claim.imageUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    className="rounded-lg border h-32 w-full object-cover shadow-sm"
                    alt={t("claims.claim_evidence_alt")}
                    width={300}
                    height={128}
                    loading="lazy"
                    decoding="async"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t dark:border-white/10">
          <Button
            variant="outline"
            className="flex-1 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-300"
            disabled={verifyMutation.isPending}
            onClick={() => verifyMutation.mutate({
              status: 'rejected',
              notes: t("claims.reject_notes_default")
            })}
          >
            <XCircle className="mr-2 h-4 w-4" />
            {t("claims.reject_claim")}
          </Button>
          <Button
            className="flex-1 bg-green-600 dark:bg-emerald-600 hover:bg-green-700 dark:hover:bg-emerald-700 shadow-md shadow-green-100 dark:shadow-none text-white"
            disabled={verifyMutation.isPending || claim.status !== 'pending'}
            onClick={() => verifyMutation.mutate({
              status: 'accepted',
              notes: t("claims.accept_notes_default")
            })}
          >
            {verifyMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            {t("claims.confirm_ownership")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
