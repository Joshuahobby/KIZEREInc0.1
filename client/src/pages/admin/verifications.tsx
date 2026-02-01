import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

export default function AdminVerifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
      const res = await apiRequest(`/api/verification/admin/${id}/review`, {
        method: "POST",
        data: { status, comment }
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verifications"] });
      toast({ title: `Request ${reviewAction}`, description: "Verification status updated." });
      setSelectedRequest(null);
      setReviewComment("");
      setReviewAction(null);
    },
    onError: () => {
      toast({ title: "Operation failed", variant: "destructive" });
    }
  });

  const handleReview = (status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !reviewComment) {
      toast({ title: "Comment required", description: "Please provide a reason for rejection.", variant: "destructive" });
      return;
    }
    setReviewAction(status);
    reviewMutation.mutate({ 
      id: selectedRequest.id, 
      status, 
      comment: reviewComment 
    });
  };

  if (isLoading) {
    return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Identity Verifications</h2>
        <Badge variant="outline" className="text-lg px-4 py-1">
          {requests?.length || 0} Pending
        </Badge>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Doc Type</TableHead>
              <TableHead>Submitted At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                  No pending verification requests.
                </TableCell>
              </TableRow>
            ) : (
              requests?.map((req: any) => (
                <TableRow key={req.id}>
                  <TableCell>
                    <div className="font-medium">{req.user.fullName}</div>
                    <div className="text-sm text-muted-foreground">{req.user.email}</div>
                  </TableCell>
                  <TableCell className="capitalize">{req.documentType?.replace('_', ' ')}</TableCell>
                  <TableCell>{format(new Date(req.submittedAt), "PPP")}</TableCell>
                  <TableCell>
                    <Dialog onOpenChange={(open) => !open && setSelectedRequest(null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedRequest(req)}>
                          <Eye className="h-4 w-4 mr-2" /> Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Review Verification Request</DialogTitle>
                          <DialogDescription>
                            Review ID document and selfie for {req.user.fullName}
                          </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
                          <div className="space-y-2">
                            <h4 className="font-medium flex items-center gap-2">
                              <FileText className="h-4 w-4" /> Document ({req.documentType})
                            </h4>
                            <div className="border rounded-lg overflow-hidden bg-black/5 aspect-video flex items-center justify-center">
                              {/* Use img tag for simplicity, handle basic interactions */}
                              <img 
                                src={req.documentUrl} 
                                alt="Document" 
                                className="object-contain max-h-64 w-full cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => window.open(req.documentUrl, '_blank')}
                              />
                            </div>
                            <a href={req.documentUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                              View Full Size <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-medium flex items-center gap-2">
                              <Camera className="h-4 w-4" /> Selfie
                            </h4>
                            <div className="border rounded-lg overflow-hidden bg-black/5 aspect-square max-h-64 flex items-center justify-center">
                              <img 
                                src={req.selfieUrl} 
                                alt="Selfie" 
                                className="object-cover h-full w-full cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => window.open(req.selfieUrl, '_blank')}
                              />
                            </div>
                             <a href={req.selfieUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                              View Full Size <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium mb-1 block">Review Notes (Optional/Reason for Rejection)</label>
                            <Textarea 
                              placeholder="Add notes..." 
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                            />
                          </div>
                        
                          <DialogFooter className="gap-2 sm:gap-0">
                            <Button 
                              variant="destructive" 
                              onClick={() => handleReview('rejected')}
                              disabled={reviewMutation.isPending}
                            >
                              {reviewMutation.isPending && reviewAction === 'rejected' ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-2" />}
                              Reject
                            </Button>
                            <Button 
                              variant="default"
                              className="bg-green-600 hover:bg-green-700" 
                              onClick={() => handleReview('approved')}
                              disabled={reviewMutation.isPending}
                            >
                              {reviewMutation.isPending && reviewAction === 'approved' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                              Approve
                            </Button>
                          </DialogFooter>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
