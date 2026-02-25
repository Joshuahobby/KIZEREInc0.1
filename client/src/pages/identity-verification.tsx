import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PageLayout } from "@/components/layout/index";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Upload,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  CreditCard,
  UserCheck,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { VerificationRequest } from "@shared/schema";

const DOCUMENT_TYPES = [
  { value: "NationalID", labelKey: "item_subcategory_id_card", icon: CreditCard },
  { value: "Passport", labelKey: "item_subcategory_passport", icon: ShieldCheck },
  { value: "DriversLicense", labelKey: "item_subcategory_driver_license", icon: CreditCard },
  { value: "Other", labelKey: "ownership_other", icon: FileText }
];

export default function IdentityVerificationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [selectedType, setSelectedType] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState("");

  const { data: requests, isLoading: isLoadingRequests } = useQuery<VerificationRequest[]>({
    queryKey: ["/api/me/verification-requests"],
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'], 'application/pdf': ['.pdf'] },
    maxFiles: 3,
    onDrop: (acceptedFiles) => {
      setUploadedFiles(prev => [...prev, ...acceptedFiles].slice(0, 3));
    }
  });

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedType || uploadedFiles.length === 0) {
        throw new Error("Please select a document type and upload at least one file.");
      }

      // 1. Upload files
      const formData = new FormData();
      uploadedFiles.forEach(file => formData.append('documents', file));

      const uploadRes = await apiRequest<{ documents: any[] }>('/api/upload/documents', { method: 'POST', data: formData });
      const documentUrls = uploadRes.documents.map((d: any) => d.url);

      // 2. Submit request
      return apiRequest('/api/me/verification-requests', {
        method: 'POST',
        data: {
          type: selectedType,
          documentUrls,
          notes
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/verification-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setUploadedFiles([]);
      setSelectedType("");
      setNotes("");
      toast({
        title: t('success'),
        description: t('verification_in_progress_desc'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('error'),
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> {t('ownership_verified')}</Badge>;
      case 'pending': return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> {t('ownership_pending')}</Badge>;
      case 'rejected': return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> {t('ownership_rejected')}</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const activeRequest = requests?.find((r) => r.status === 'pending' || r.status === 'in_review');

  return (
    <PageLayout>
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900 flex items-center">
                <UserCheck className="mr-3 h-8 w-8 text-sky-600" />
                {t('verification_title')}
              </h1>
              <p className="text-neutral-500 mt-2">
                {t('verification_subtitle')}
              </p>
            </div>
            {user?.verificationStatus === 'approved' && (
              <Badge className="bg-green-500 text-sm px-4 py-1">
                <ShieldCheck className="h-4 w-4 mr-2" />
                {t('verification_status_verified')}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              {activeRequest ? (
                <Alert className="bg-sky-50 border-sky-200">
                  <Clock className="h-4 w-4 text-sky-600" />
                  <AlertTitle className="text-sky-800">{t('verification_in_progress_title')}</AlertTitle>
                  <AlertDescription className="text-sky-700">
                    {t('verification_in_progress_desc')}
                  </AlertDescription>
                </Alert>
              ) : user?.verificationStatus === 'approved' ? (
                <Card className="border-green-100 bg-green-50/30">
                  <CardContent className="pt-6 text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-800">{t('verification_complete_title')}</h3>
                      <p className="text-green-700">{t('verification_complete_desc')}</p>
                    </div>
                    <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-100" onClick={() => setSelectedType("")}>
                      {t('verification_submit_new')}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-neutral-200 shadow-sm overflow-hidden">
                  <CardHeader className="bg-neutral-50 border-b">
                    <CardTitle className="text-lg">{t('verification_submit_title')}</CardTitle>
                    <CardDescription>{t('verification_submit_desc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {DOCUMENT_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.value}
                            onClick={() => setSelectedType(type.value)}
                            className={cn(
                              "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all",
                              selectedType === type.value
                                ? "border-sky-500 bg-sky-50/50 text-sky-700 scale-[1.02]"
                                : "border-neutral-100 bg-white hover:border-neutral-200 text-neutral-500"
                            )}
                          >
                            <Icon className={cn("h-6 w-6 mb-2", selectedType === type.value ? "text-sky-600" : "text-neutral-400")} />
                            <span className="text-[10px] font-bold text-center leading-tight">{t(type.labelKey)}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-neutral-700">{t('verification_upload_label')}</label>
                      <div
                        {...getRootProps()}
                        className={cn(
                          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                          isDragActive ? "border-sky-500 bg-sky-50" : "border-neutral-200 hover:border-sky-300"
                        )}
                      >
                        <input {...getInputProps()} />
                        <Upload className="h-10 w-10 mx-auto text-neutral-300 mb-3" />
                        <p className="text-sm text-neutral-600 font-medium">{t('item_drag_documents')}</p>
                        <p className="text-xs text-neutral-400 mt-1">PNG, JPG, PDF up to 10MB</p>
                      </div>

                      <AnimatePresence>
                        {uploadedFiles.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2"
                          >
                            {uploadedFiles.map((file, i) => (
                              <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border">
                                <div className="flex items-center space-x-3">
                                  <FileText className="h-4 w-4 text-sky-500" />
                                  <span className="text-xs font-medium truncate max-w-[200px]">{file.name}</span>
                                </div>
                                <button
                                  onClick={() => removeFile(i)}
                                  className="text-neutral-400 hover:text-red-500 p-1"
                                  aria-label={`Remove ${file.name}`}
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <Button
                      className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-lg"
                      disabled={!selectedType || uploadedFiles.length === 0 || submitMutation.isPending}
                      onClick={() => submitMutation.mutate()}
                    >
                      {submitMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          {t('common.processing')}
                        </>
                      ) : (
                        t('submit')
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card className="border-neutral-200">
                <CardHeader>
                  <CardTitle className="text-md">{t('verification_why_title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-neutral-600 px-6 pb-6">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
                    <p><strong>{t('verification_trust_title')}:</strong> {t('verification_trust_desc')}</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
                    <p><strong>{t('verification_premium_title')}:</strong> {t('verification_premium_desc')}</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
                    <p><strong>{t('verification_security_title')}:</strong> {t('verification_security_desc')}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-neutral-200 bg-neutral-50/50">
                <CardHeader>
                  <CardTitle className="text-md">{t('verification_history_title')}</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 mt-0">
                  {isLoadingRequests ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-neutral-300" />
                    </div>
                  ) : (requests?.length ?? 0) > 0 ? (
                    <div className="space-y-3">
                      {requests?.map((req) => (
                        <div key={req.id} className="flex flex-col p-3 bg-white rounded-lg border shadow-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold">{req.documentType}</span>
                            {getStatusBadge(req.status)}
                          </div>
                          <span className="text-[10px] text-neutral-400">{new Date(req.submittedAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-400 text-center py-4 italic">{t('verification_no_history')}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
