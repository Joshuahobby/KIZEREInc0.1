import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { z } from "zod";
import {
  Loader2, Upload, CheckCircle2, XCircle, AlertCircle,
  ShieldCheck, FileText, Camera
} from "lucide-react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const verificationSchema = z.object({
  documentType: z.enum(['nid', 'passport', 'drivers_license'], {
    required_error: "Please select a document type",
  }),
});

type VerificationFormData = z.infer<typeof verificationSchema>;

export default function VerificationPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: status, isLoading: isLoadingStatus } = useQuery({
    queryKey: ["/api/verification/status"],
  }) as { data: { status: string, adminComment?: string } | undefined, isLoading: boolean };

  const form = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
  });

  const onSubmit = async (data: VerificationFormData) => {
    if (!documentFile || !selfieFile) {
      toast({
        title: "Missing files",
        description: "Please upload both your ID document and a selfie.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("documentType", data.documentType);
    formData.append("document", documentFile);
    formData.append("selfie", selfieFile);

    try {
      await apiRequest("/api/verification", {
        method: "POST",
        data: formData,
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/verification/status"] });

      toast({
        title: "Verification Submitted",
        description: "Your documents have been received and are under review.",
      });
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingStatus) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentStatus = status?.status;

  if (currentStatus === 'pending') {
    return (
      <div className="container max-w-lg py-10">
        <Card className="text-center p-6">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Verification In Progress</h2>
          <p className="text-muted-foreground mb-6">
            Your verification request is currently pending review. We will notify you once an admin has reviewed your documents.
          </p>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  if (currentStatus === 'approved') {
    return (
      <div className="container max-w-lg py-10">
        <Card className="text-center p-6 border-green-200 bg-green-50 dark:bg-green-900/10">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-green-800 dark:text-green-300">You are Verified!</h2>
          <p className="text-green-700 dark:text-green-400 mb-6">
            Your identity has been successfully verified. You now have full access to verified features.
          </p>
          <Button onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Identity Verification</CardTitle>
          <CardDescription>
            To ensure the safety of our platform, we require users to verify their identity.
            Please upload a valid government-issued ID and a selfie.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentStatus === 'rejected' && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Verification Rejected</AlertTitle>
              <AlertDescription>
                Your previous request was rejected: {status?.adminComment || "Please upload clearer documents."}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="documentType">Document Type</Label>
                <Select
                  onValueChange={(val) => form.setValue("documentType", val as any)}
                  defaultValue={form.getValues("documentType")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ID Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nid">National ID</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="drivers_license">Driver's License</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.documentType && (
                  <p className="text-sm text-red-500">{form.formState.errors.documentType.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*"
                    aria-label="Upload ID Document"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                  />
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-medium">Upload Document</span>
                    {documentFile ? (
                      <Badge variant="outline" className="text-green-600 bg-green-50">
                        {documentFile.name}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Click to upload</span>
                    )}
                  </div>
                </div>

                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*"
                    aria-label="Upload Selfie"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                  />
                  <div className="flex flex-col items-center gap-2">
                    <Camera className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-medium">Upload Selfie</span>
                    {selfieFile ? (
                      <Badge variant="outline" className="text-green-600 bg-green-50">
                        {selfieFile.name}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Click to upload</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Verification Request"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
