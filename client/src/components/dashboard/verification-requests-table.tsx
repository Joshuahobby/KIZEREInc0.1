import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Eye, ShieldCheck, User as UserIcon } from "lucide-react";
import { VerificationRequest, User } from "@shared/schema";
import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type RequestWithUser = VerificationRequest & { user: User };

export function VerificationRequestsTable() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [selectedRequest, setSelectedRequest] = useState<RequestWithUser | null>(null);
  const [reviewComment, setReviewComment] = useState("");

  const { data: requests, isLoading } = useQuery<RequestWithUser[]>({
    queryKey: ["/api/verification/admin/list"],
  });

  const mutation = useMutation({
    mutationFn: async ({ id, status, comment }: { id: number; status: string; comment?: string }) => {
      const res = await apiRequest(`/api/verification/admin/${id}/review`, {
        method: "POST",
        data: { status, comment }
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/verification/admin/list"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setSelectedRequest(null);
      setReviewComment("");
      toast({
        title: "Verification Updated",
        description: "The verification request has been processed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Review Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <CardTitle>{t('dashboard.admin.identityVerifications')}</CardTitle>
        </div>
        <CardDescription>{t('dashboard.admin.verificationsDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {!requests || requests.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground italic">{t('dashboard.admin.noPendingVerifications')}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('dashboard.table.user')}</TableHead>
                <TableHead>{t('dashboard.table.docType')}</TableHead>
                <TableHead>{t('dashboard.table.submitted')}</TableHead>
                <TableHead>{t('dashboard.table.status')}</TableHead>
                <TableHead className="text-right">{t('dashboard.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{request.user.fullName}</span>
                        <span className="text-xs text-muted-foreground">{request.user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {request.documentType.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {format(new Date(request.submittedAt), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedRequest(request);
                            setReviewComment("");
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" /> {t('dashboard.table.view')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{t('dashboard.admin.verificationReview')}: {request.user.fullName}</DialogTitle>
                          <DialogDescription>
                            {t('dashboard.admin.verificationReviewDesc')}
                          </DialogDescription>
                        </DialogHeader>

                        <div className="grid md:grid-cols-2 gap-6 my-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold">Selfie Analysis</h4>
                              {request.livenessCode && (
                                <Badge variant="secondary" className="font-mono text-xs">
                                  Liveness Code: <span className="text-primary font-bold ml-1">{request.livenessCode}</span>
                                </Badge>
                              )}
                            </div>
                            <div className="aspect-[4/3] relative rounded-lg overflow-hidden border bg-muted">
                              <img
                                src={request.selfieUrl}
                                alt="Selfie"
                                className="object-contain w-full h-full"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Document: {request.documentType.toUpperCase()}</h4>
                            <div className="aspect-[4/3] relative rounded-lg overflow-hidden border bg-muted">
                              <img
                                src={request.documentUrl}
                                alt="Identity Document"
                                className="object-contain w-full h-full"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4 py-4 border-t">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Review Comment (Internal/User visible)</label>
                            <Textarea
                              placeholder="Reason for approval or rejection..."
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                            />
                          </div>
                        </div>

                        <DialogFooter className="flex-col sm:flex-row gap-2">
                          <Button
                            variant="destructive"
                            className="flex-1"
                            disabled={mutation.isPending}
                            onClick={() => mutation.mutate({
                              id: request.id,
                              status: 'rejected',
                              comment: reviewComment
                            })}
                          >
                            <XCircle className="h-4 w-4 mr-2" /> {t('dashboard.table.reject')}
                          </Button>
                          <Button
                            className="flex-1"
                            disabled={mutation.isPending}
                            onClick={() => mutation.mutate({
                              id: request.id,
                              status: 'approved',
                              comment: reviewComment
                            })}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" /> {t('dashboard.table.approve')}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
