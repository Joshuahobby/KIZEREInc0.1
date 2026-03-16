import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  ExternalLink,
  Upload
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface VerificationDocument {
  id: number;
  userId: number;
  documentType: string;
  status: string;
  documentUrl: string;
  selfieUrl: string;
  livenessCode?: string;
  adminComment?: string;
  reviewedBy?: number;
  submittedAt: string;
  reviewedAt?: string;
}

interface UserVerificationDocumentsProps {
  userId: number;
}

export function UserVerificationDocuments({ userId }: UserVerificationDocumentsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for document review dialog
  const [selectedDocument, setSelectedDocument] = useState<VerificationDocument | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<string>("");
  const [reviewNotes, setReviewNotes] = useState<string>("");

  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/admin/users/${userId}/verification-requests`],
    queryFn: () => apiRequest(`/api/admin/users/${userId}/verification-requests`),
  });

  // Update verification request status mutation
  const updateVerificationMutation = useMutation({
    mutationFn: (vars: { requestId: number; status: string; adminComment: string }) => {
      return apiRequest(`/api/admin/verification-requests/${vars.requestId}`, {
        method: 'PATCH',
        data: {
          status: vars.status,
          adminComment: vars.adminComment,
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "Verification request updated",
        description: "The verification request has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}/verification-requests`] });
      setShowReviewDialog(false);
      setSelectedDocument(null);
      setReviewStatus("");
      setReviewNotes("");
    },
    onError: (error) => {
      toast({
        title: "Failed to update verification request",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Handle document review form submission
  const handleReviewSubmit = () => {
    if (!selectedDocument || !reviewStatus) {
      toast({
        title: "Validation error",
        description: "Please select a status",
        variant: "destructive",
      });
      return;
    }

    updateVerificationMutation.mutate({
      requestId: selectedDocument.id,
      status: reviewStatus,
      adminComment: reviewNotes,
    });
  };

  // Helper to get status badge variant
  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case 'verified':
      case 'approved':
        return "default";
      case 'pending':
      case 'in_review':
        return "secondary";
      case 'rejected':
        return "destructive";
      default:
        return "outline";
    }
  };

  // Helper to get status icon
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'in_review':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Handle open review dialog
  const openReviewDialog = (document: VerificationDocument) => {
    setSelectedDocument(document);
    setReviewStatus(document.status);
    setReviewNotes(document.adminComment || "");
    setShowReviewDialog(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Verification Documents</h3>
        {[1, 2].map(i => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/15 p-4 text-center">
        <AlertTriangle className="mx-auto h-6 w-6 text-destructive" />
        <p className="mt-2 text-sm text-destructive">Failed to load verification documents</p>
      </div>
    );
  }

  const documents: VerificationDocument[] = data || [];

  if (documents.length === 0) {
    return (
      <div className="text-center py-4 space-y-2">
        <FileText className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No verification documents submitted</p>
        <Button variant="outline" size="sm" className="mt-2">
          <Upload className="mr-2 h-4 w-4" />
          Request Documents
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Verification Documents</h3>
      
      <div className="space-y-4">
        {documents.map((document) => {
          const submittedTimeInfo = formatTimestamp(document.submittedAt);
          
          return (
            <div key={document.id} className="border rounded-md p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(document.status)}
                  <span className="font-medium">
                    {document.documentType.replace(/_/g, ' ')}
                  </span>
                  <Badge variant={getStatusBadgeVariant(document.status)}>
                    {document.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
                
                <time className="text-xs text-muted-foreground" title={submittedTimeInfo.full}>
                  Submitted {submittedTimeInfo.relative}
                </time>
              </div>

              {document.livenessCode && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900 w-fit">
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase">Liveness Code:</span>
                  <span className="font-mono text-sm font-bold text-blue-800 dark:text-blue-200">{document.livenessCode}</span>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">ID Document</span>
                  <a 
                    href={document.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-2 rounded-lg border bg-card hover:bg-accent transition-colors text-sm text-blue-600 font-medium"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View ID Document
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Selfie / Liveness</span>
                  <a 
                    href={document.selfieUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-2 rounded-lg border bg-card hover:bg-accent transition-colors text-sm text-blue-600 font-medium"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    View Selfie
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                </div>
              </div>
              
              {document.adminComment && (
                <div className="text-sm bg-muted/50 p-2 rounded-md">
                  <p className="text-muted-foreground font-medium text-xs uppercase mb-1">Admin Notes</p>
                  <p className="text-muted-foreground">{document.adminComment}</p>
                </div>
              )}
              
              {document.reviewedAt && (
                <div className="text-xs text-muted-foreground">
                  Reviewed on {format(new Date(document.reviewedAt), 'PP')}
                </div>
              )}
              
              <div className="flex justify-end mt-2">
                <Button 
                  size="sm"
                  variant={document.status === 'pending' ? 'default' : 'outline'}
                  onClick={() => openReviewDialog(document)}
                >
                  {document.status === 'pending' ? 'Review' : 'Update Status'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Document Review Dialog */}
      {selectedDocument && (
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Review Verification Document</DialogTitle>
              <DialogDescription>
                Update the status of this verification request
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Document Type</label>
                  <p className="text-sm font-medium">{selectedDocument.documentType.replace(/_/g, ' ')}</p>
                </div>
                {selectedDocument.livenessCode && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Expected Code</label>
                    <p className="text-sm font-mono font-bold text-blue-600">{selectedDocument.livenessCode}</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={reviewStatus}
                  onValueChange={setReviewStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Internal Notes / Feedback</label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Explain why approved or rejected..."
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowReviewDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleReviewSubmit}
                disabled={updateVerificationMutation.isPending}
              >
                {updateVerificationMutation.isPending ? "Updating..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Helper function to format the timestamp
function formatTimestamp(timestamp: string) {
  try {
    const date = new Date(timestamp);
    return {
      relative: formatDistanceToNow(date, { addSuffix: true }),
      full: format(date, 'PPpp')
    };
  } catch (e) {
    return { relative: 'Unknown date', full: 'Invalid date' };
  }
}