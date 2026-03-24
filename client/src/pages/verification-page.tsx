import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Upload, CheckCircle2, XCircle, AlertCircle,
  ShieldCheck, FileText, Camera, Shield, ArrowRight, ArrowLeft,
  Lock, Sparkles, Check, Scan, Info
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
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import Tesseract from 'tesseract.js';
import confetti from 'canvas-confetti';
import { useLanguage } from "@/lib/i18n/LanguageContext";

const verificationSchema = z.object({
  documentType: z.enum(['nid', 'passport', 'drivers_license'], {
    required_error: "Please select a document type",
  }),
  consentGiven: z.boolean().refine(val => val === true, {
    message: "You must consent to processing your ID and selfie",
  }),
});

type VerificationFormData = z.infer<typeof verificationSchema>;

export default function VerificationPage() {
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<{ detectedName?: string, confidence: number } | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [docTypeValidated, setDocTypeValidated] = useState<boolean>(false);
  const [nameValidated, setNameValidated] = useState<boolean>(false);
  const [isSelfieOcrProcessing, setIsSelfieOcrProcessing] = useState(false);
  const [selfieValidated, setSelfieValidated] = useState<boolean>(false);

  const { data: status, isLoading: isLoadingStatus } = useQuery({
    queryKey: ["/api/verification/status"],
  }) as { data: { status: string, adminComment?: string } | undefined, isLoading: boolean };

  const { data: livenessData } = useQuery({
    queryKey: ["/api/verification/liveness-code"],
    enabled: !!status && status.status !== 'approved' && status.status !== 'pending'
  }) as { data: { code: string } | undefined };

  const form = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      documentType: 'nid',
      consentGiven: false,
    }
  });

  // OCR Processing
  useEffect(() => {
    if (documentFile && step === 1) {
      processDocumentOCR(documentFile);
    }
  }, [documentFile, step]);

  useEffect(() => {
    if (selfieFile && step === 1) {
      processSelfieOCR(selfieFile);
    }
  }, [selfieFile, step]);

  const processDocumentOCR = async (file: File) => {
    setIsOcrProcessing(true);
    setOcrError(null);
    setOcrResult(null);
    setDocTypeValidated(false);
    setNameValidated(false);
    
    try {
      const result = await Tesseract.recognize(file, 'eng');
      
      const text = result.data.text;
      const confidence = result.data.confidence;
      const normalizedText = text.toLowerCase();
      
      // 1. Document Type Validation
      const docType = form.getValues('documentType');
      const docKeywords: Record<string, string[]> = {
        nid: ["republic of rwanda", "indangamuntu", "national id", "rwanda", "id card"],
        passport: ["passport", "repubulika", "rwanda", "travel document"],
        drivers_license: ["permis", "conduire", "driving", "license", "rwanda"]
      };

      const keywords = docKeywords[docType] || [];
      const foundKeywords = keywords.filter(k => normalizedText.includes(k.toLowerCase()));
      const isDocTypeMatch = foundKeywords.length >= (docType === 'nid' ? 2 : 1);
      
      setDocTypeValidated(isDocTypeMatch);

      // 2. Name Matching
      const userFullName = user?.fullName?.toLowerCase() || '';
      const userNameParts = userFullName.split(/\s+/).filter(part => part.length > 2);
      
      const matchedParts = userNameParts.filter(part => 
        normalizedText.includes(part)
      );

      const isNameMatch = matchedParts.length >= Math.min(2, userNameParts.length);
      setNameValidated(isNameMatch);

      setOcrResult({
        detectedName: isNameMatch ? matchedParts.join(' ') : undefined,
        confidence
      });
      
      if (!isDocTypeMatch) {
         setOcrError(`The uploaded image does not appear to be a valid ${docType === 'nid' ? 'National ID' : docType === 'passport' ? 'Passport' : 'Driver\'s License'}. Please check the document type and try again.`);
      } else if (!isNameMatch && confidence > 40) {
        setOcrError(t('ocr.kyc_mismatch_desc') || "The name on the ID doesn't seem to match your profile name perfectly. Please ensure the photo is clear and contains your full name.");
      } else if (confidence < 40) {
        setOcrError(t('ocr.kyc_low_conf_desc') || "The text is hard to read. A clear photo is required for security verification.");
      }
    } catch (err) {
      console.error("OCR Error:", err);
      setOcrError("Failed to process document. Please ensure the image is a valid JPG/PNG and try again.");
    } finally {
      setIsOcrProcessing(false);
    }
  };

  const processSelfieOCR = async (file: File) => {
    setIsSelfieOcrProcessing(true);
    setOcrError(null);
    setSelfieValidated(false);
    
    try {
      const result = await Tesseract.recognize(file, 'eng');
      const normalizedText = result.data.text.toLowerCase();
      const confidence = result.data.confidence;

      // Cross-validation: Look for user's name or doc type keywords in the selfie
      const userFullName = user?.fullName?.toLowerCase() || '';
      const userNameParts = userFullName.split(/\s+/).filter(part => part.length > 2);
      
      const matchedParts = userNameParts.filter(part => 
        normalizedText.includes(part)
      );

      const docType = form.getValues('documentType');
      const docKeywords: Record<string, string[]> = {
        nid: ["republic", "rwanda", "id", "national"],
        passport: ["passport", "repubulika", "rwanda"],
        drivers_license: ["permis", "conduire", "driving", "license"]
      };

      const keywords = docKeywords[docType] || [];
      const foundKeywords = keywords.filter(k => normalizedText.includes(k.toLowerCase()));

      // Selfie validation is more lenient because it's further away
      const isMatch = matchedParts.length >= 1 || foundKeywords.length >= 1;
      setSelfieValidated(isMatch);

      if (!isMatch && confidence > 30) {
        setOcrError("We couldn't clearly see your ID in the selfie. Please ensure you are holding it next to your face and the photo is clear.");
      }
    } catch (err) {
      console.error("Selfie OCR Error:", err);
    } finally {
      setIsSelfieOcrProcessing(false);
    }
  };

  const downloadVerificationCard = () => {
    if (!livenessData?.code) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#0f172a'; // Slate 900
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Border
    ctx.strokeStyle = '#3b82f6'; // Blue 500
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Title
    ctx.fillStyle = '#f8fafc'; // Slate 50
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('KIZERE IDENTITY VERIFICATION', canvas.width / 2, 80);

    // Name
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#94a3b8'; // Slate 400
    ctx.fillText(user?.fullName || 'Verification Subject', canvas.width / 2, 130);

    // Code Label
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('VERIFICATION CODE', canvas.width / 2, 200);

    // Code
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 80px monospace';
    ctx.fillText(livenessData.code, canvas.width / 2, 280);

    // Date
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`Generated: ${new Date().toLocaleString()}`, canvas.width / 2, 340);

    // KIZERE Branding
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#3b82f6';
    ctx.fillText('OFFICIAL KIZERE DIGITAL IDENTITY BACKUP', canvas.width / 2, 365);

    // Footer
    ctx.font = 'italic 10px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('This document is for identity verification purposes only within the KIZERE ecosystem.', canvas.width / 2, 385);

    const link = document.createElement('a');
    link.download = `KIZERE-ID-Backup-${user?.username || 'user'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    toast({
      title: "Digital ID Backup Ready",
      description: "Hold this card clearly visible in your selfie for manual verification.",
    });
  };

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
    formData.append("consentGiven", data.consentGiven.toString());
    formData.append("document", documentFile);
    formData.append("selfie", selfieFile);
    if (livenessData?.code) {
      formData.append("livenessCode", livenessData.code);
    }

    try {
      await apiRequest("/api/verification", {
        method: "POST",
        data: formData,
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/verification/status"] });
      await refreshUser();
      
      // Celebration!
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#3b82f6', '#10b981']
      });

      setStep(2); // Success step

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
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium animate-pulse">Initializing Security Layers...</p>
        </div>
      </div>
    );
  }

  const currentStatus = status?.status;

  if (currentStatus === 'pending') {
    return (
      <div className="container max-w-lg py-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-primary blur opacity-25 rounded-3xl"></div>
          <Card className="relative text-center p-8 rounded-3xl border-white/10 glass">
            <div className="mx-auto w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 relative">
              <div className="absolute inset-0 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60 tracking-tight">Analysis in Progress</h2>
            <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
              Your security protocol is currently being reviewed by our compliance team. This typically takes less than 24 hours.
            </p>
            <div className="space-y-3">
              <Button className="w-full py-6 rounded-xl hover:scale-[1.02] transition-transform" onClick={() => navigate("/dashboard")}>
                Return to Command Center
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (currentStatus === 'approved') {
    return (
      <div className="container max-w-lg py-20 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
           <div className="mx-auto w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center relative shadow-[0_0_40px_rgba(34,197,94,0.2)]">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <ShieldCheck className="h-12 w-12 text-green-500" />
            </motion.div>
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-foreground tracking-tighter">TRUST ESTABLISHED</h2>
            <p className="text-xl text-muted-foreground max-w-sm mx-auto">
              Your identity has been fully verified. You now hold premium status across the platform.
            </p>
          </div>
          <Button 
            className="px-10 py-6 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-1 bg-primary" 
            onClick={() => navigate("/dashboard")}
          >
            Enter Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  const progressValue = (step / 2) * 100;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center py-10 px-4">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.02] pointer-events-none"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 blur-[120px] rounded-full"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-lg relative z-10">
        <div className="mb-6 space-y-3 px-2">
            <div className="flex justify-between items-end mb-1">
               <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary opacity-80">Verification Progress</h3>
                  <p className="text-xl font-bold tracking-tight text-foreground">Identity Confirmation</p>
               </div>
               <span className="text-xs font-medium text-muted-foreground opacity-50 uppercase tracking-tighter">Step {step + 1} of 2</span>
            </div>
            <Progress value={step === 0 ? 50 : 100} className="h-1.5 rounded-full bg-white/5 border border-white/10" />
        </div>

        <Card className="border-white/10 glass rounded-3xl shadow-xl overflow-hidden min-h-[450px] flex flex-col">
          <CardContent className="pt-8 flex-1 flex flex-col">
            {/* Rejection Alert */}
            {status?.adminComment && status.status === 'rejected' && step === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex gap-3 items-start"
              >
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-destructive uppercase tracking-tight">Previous Attempt Rejected</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Reason: <span className="text-foreground font-medium">{status.adminComment}</span>
                  </p>
                </div>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="step0"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6 flex-1 flex flex-col justify-center"
                >
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Select Identity Document</h2>
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
                      Please choose the type of identification you would like to use for verification.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { id: 'nid', name: 'National ID', icon: Shield, desc: 'Government-issued ID card' },
                      { id: 'passport', name: 'Passport', icon: Sparkles, desc: 'International travel document' },
                      { id: 'drivers_license', name: 'Driver\'s License', icon: FileText, desc: 'Official driving permit' }
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => form.setValue('documentType', type.id as any)}
                        title={`Select ${type.name}`}
                        aria-label={`Select ${type.name}`}
                        className={cn(
                          "w-full p-4 text-left rounded-2xl border transition-all flex items-center gap-4 relative group",
                          form.watch('documentType') === type.id 
                            ? "bg-primary/5 border-primary shadow-sm" 
                            : "bg-white/[0.02] border-white/10 hover:border-white/20"
                        )}
                      >
                         <div className={cn(
                           "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                           form.watch('documentType') === type.id ? "bg-primary text-white" : "bg-white/5 text-muted-foreground"
                         )}>
                            <type.icon className="h-5 w-5" />
                         </div>
                         <div className="flex-1">
                            <p className="font-bold text-base">{type.name}</p>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter opacity-70">{type.desc}</p>
                         </div>
                         <div className={cn(
                           "h-5 w-5 rounded-full border flex items-center justify-center transition-all",
                           form.watch('documentType') === type.id ? "border-primary bg-primary text-white" : "border-white/20"
                         )}>
                            {form.watch('documentType') === type.id && <Check className="h-3 w-3" />}
                         </div>
                      </button>
                    ))}
                  </div>

                  <div className="pt-4 flex items-center gap-4 justify-center opacity-40">
                      <div className="flex items-center gap-1.5"><Lock className="h-3 w-3" /><span className="text-[9px] font-bold tracking-widest uppercase">Secure</span></div>
                      <div className="flex items-center gap-1.5"><Shield className="h-3 w-3" /><span className="text-[9px] font-bold tracking-widest uppercase">Verified</span></div>
                  </div>

                  <div className="pt-2">
                     <Button className="w-full py-6 text-base font-bold rounded-xl group" onClick={() => setStep(1)}>
                       Continue to Upload
                       <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                     </Button>
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="step1"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-5 flex-1"
                >
                  <div className="space-y-1 text-center">
                    <h2 className="text-2xl font-bold tracking-tight">Upload & Confirm</h2>
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                      Documents for {form.watch('documentType').replace('_', ' ')}
                    </p>
                  </div>

                  <div className="relative group">
                     <div className="relative bg-primary/5 border border-primary/20 rounded-2xl p-5 text-center space-y-2 overflow-hidden">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Scan className="h-4 w-4 text-primary" />
                          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Live Identity Verification</p>
                        </div>
                        <p className="text-xl font-bold tracking-tight text-foreground leading-tight">
                          Hold your {form.watch('documentType').replace('_', ' ')} next to your face
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium px-4 leading-tight opacity-80 pt-1">
                          Ensure both your face and ID details are clearly visible in the photo.
                        </p>
                        <div className="pt-2">
                           <Button 
                             variant="outline" 
                             size="sm" 
                             className="bg-white/5 border-white/10 hover:bg-white/10 text-[9px] h-7 rounded-lg opacity-60"
                             onClick={downloadVerificationCard}
                           >
                              Download Digital ID Backup
                           </Button>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                     {/* Upload 1: Document */}
                     <div className="relative group/card">
                        <input
                          type="file"
                          accept="image/*"
                          title="Upload ID Document"
                          aria-label="Upload ID Document"
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                          disabled={isOcrProcessing || isSubmitting}
                        />
                        <div className={cn(
                          "h-48 border border-dashed rounded-2xl flex flex-col items-center justify-center p-5 transition-all relative overflow-hidden",
                          documentFile ? "border-primary bg-primary/5" : "border-white/10 bg-white/5 hover:border-white/20"
                        )}>
                           {/* OCR Scanning Animation Overlay */}
                           {isOcrProcessing && (
                             <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                                <motion.div 
                                  className="w-full h-1 bg-primary/50 absolute top-0"
                                  animate={{ top: ['0%', '100%', '0%'] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                />
                                <Scan className="h-8 w-8 text-primary animate-pulse mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Scanning Data...</p>
                             </div>
                           )}

                           {documentFile ? (
                             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center">
                                <CheckCircle2 className="h-8 w-8 text-primary mb-2" />
                                <p className="text-xs font-bold leading-tight">Document Ready</p>
                                <p className="text-[9px] text-muted-foreground truncate max-w-[120px] mt-1">{documentFile.name}</p>
                                
                                {ocrResult && (
                                  <motion.div 
                                    initial={{ y: 5, opacity: 0 }} 
                                    animate={{ y: 0, opacity: 1 }}
                                    className="mt-3 flex flex-col gap-1.5 w-full items-center"
                                  >
                                     <div className={cn(
                                       "py-1 px-3 rounded-full border flex items-center gap-2",
                                       docTypeValidated 
                                         ? "bg-emerald-500/10 border-emerald-500/20" 
                                         : "bg-amber-500/10 border-amber-500/20"
                                     )}>
                                       {docTypeValidated ? <Check className="h-3 w-3 text-emerald-500" /> : <AlertCircle className="h-3 w-3 text-amber-500" />}
                                       <span className={cn(
                                         "text-[9px] font-bold uppercase tracking-tighter",
                                         docTypeValidated ? "text-emerald-500" : "text-amber-500"
                                       )}>
                                         {docTypeValidated ? "ID Type Recognized" : "Doc Type Unclear"}
                                       </span>
                                     </div>
                                     
                                     <div className={cn(
                                       "py-1 px-3 rounded-full border flex items-center gap-2",
                                       nameValidated 
                                         ? "bg-emerald-500/10 border-emerald-500/20" 
                                         : "bg-amber-500/10 border-amber-500/20"
                                     )}>
                                       {nameValidated ? <Check className="h-3 w-3 text-emerald-500" /> : <Shield className="h-3 w-3 text-amber-500" />}
                                       <span className={cn(
                                         "text-[9px] font-bold uppercase tracking-tighter",
                                         nameValidated ? "text-emerald-500" : "text-amber-500"
                                       )}>
                                         {nameValidated ? "Name Matches Profile" : "Name Verification Pending"}
                                       </span>
                                     </div>
                                  </motion.div>
                                )}
                             </motion.div>
                           ) : (
                             <>
                               <div className="h-10 w-10 rounded-lg bg-white/10 text-muted-foreground flex items-center justify-center mb-2">
                                  <FileText className="h-5 w-5" />
                               </div>
                               <p className="text-xs font-bold">Upload ID</p>
                               <p className="text-[9px] text-muted-foreground mt-1 uppercase tracking-tighter opacity-60">Front View</p>
                             </>
                           )}
                        </div>
                     </div>

                     {/* Upload 2: Selfie */}
                     <div className="relative group/card">
                        <input
                          type="file"
                          accept="image/*"
                          title="Upload Selfie with ID"
                          aria-label="Upload Selfie with ID"
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                          disabled={isSubmitting || isSelfieOcrProcessing}
                        />
                        <div className={cn(
                          "h-48 border border-dashed rounded-2xl flex flex-col items-center justify-center p-5 transition-all relative overflow-hidden",
                          selfieFile ? "border-primary bg-primary/5" : "border-white/10 bg-white/5 hover:border-white/20"
                        )}>
                           {/* Selfie OCR Scanning Animation */}
                           {isSelfieOcrProcessing && (
                             <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                                <motion.div 
                                  className="w-full h-1 bg-primary/50 absolute top-0"
                                  animate={{ top: ['0%', '100%', '0%'] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                />
                                <Camera className="h-8 w-8 text-primary animate-pulse mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Matching ID...</p>
                             </div>
                           )}

                           {selfieFile ? (
                             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center">
                                <CheckCircle2 className="h-8 w-8 text-primary mb-2" />
                                <p className="text-xs font-bold leading-tight">Selfie Ready</p>
                                <p className="text-[9px] text-muted-foreground truncate max-w-[120px] mt-1">{selfieFile.name}</p>
                                
                                {selfieValidated && (
                                  <div className="mt-3 py-1 px-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">ID Detected</span>
                                  </div>
                                )}
                             </motion.div>
                           ) : (
                             <>
                               <div className="h-10 w-10 rounded-lg bg-white/10 text-muted-foreground flex items-center justify-center mb-2">
                                  <Camera className="h-5 w-5" />
                                </div>
                               <p className="text-xs font-bold">Selfie + ID</p>
                               <p className="text-[9px] text-muted-foreground mt-1 uppercase tracking-tighter opacity-60">Hold ID by face</p>
                             </>
                           )}
                        </div>
                     </div>
                  </div>

                  <AnimatePresence>
                    {ocrError && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 rounded-2xl py-3">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle className="text-xs font-bold uppercase tracking-tight">Consistency Check</AlertTitle>
                          <AlertDescription className="text-[10px] leading-relaxed opacity-90">
                            {ocrError} Please ensure your document is well-lit and the name is legible.
                          </AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="pt-2 px-1 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="verification-consent"
                      title="Consent to ID and biometric processing"
                      className="mt-1 h-4 w-4 rounded border-white/20 bg-background accent-primary"
                      checked={form.watch('consentGiven')}
                      onChange={(e) => form.setValue('consentGiven', e.target.checked)}
                    />
                    <label htmlFor="verification-consent" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                      I explicitly consent to KIZERE processing my government-issued ID and selfie for identity verification purposes in accordance with Rwanda Law No. 058/2021.
                    </label>
                  </div>

                  {form.formState.errors.consentGiven && (
                    <p className="text-[10px] text-destructive px-1">{form.formState.errors.consentGiven.message}</p>
                  )}

                  <div className="flex gap-3 pt-3">
                     <button 
                       className="py-5 rounded-xl px-5 bg-white/5 text-muted-foreground hover:bg-white/10 transition-colors" 
                       onClick={() => setStep(0)}
                       title="Change ID Type"
                       aria-label="Change ID Type"
                     >
                       <ArrowLeft className="h-4 w-4" />
                     </button>
                      <Button 
                        className="flex-1 py-5 text-base font-bold rounded-xl group bg-primary transition-all overflow-hidden" 
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={!documentFile || !selfieFile || isSubmitting || !form.watch('consentGiven') || !docTypeValidated || !nameValidated || !selfieValidated}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="font-bold tracking-tight uppercase text-sm">Uploading...</span>
                          </div>
                        ) : (!docTypeValidated || !nameValidated || !selfieValidated) ? (
                          <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            <span className="font-bold tracking-tight uppercase text-sm">Verification Locked</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" />
                            <span className="font-bold tracking-tight uppercase text-sm">Complete Verification</span>
                          </div>
                        )}
                      </Button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                 <motion.div
                  key="step2"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-8 flex-1 flex flex-col justify-center text-center py-6"
                >
                  <div className="relative mx-auto w-24 h-24">
                     <div className="absolute inset-0 bg-green-500/10 blur-2xl rounded-full"></div>
                     <div className="relative h-full w-full bg-green-500/5 border-2 border-green-500/20 rounded-full flex items-center justify-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", damping: 15, stiffness: 150 }}
                        >
                          <ShieldCheck className="h-12 w-12 text-green-500" />
                        </motion.div>
                     </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Verification Submitted</h2>
                    <p className="text-muted-foreground text-sm font-medium max-w-xs mx-auto">
                      Your documents have been securely uploaded. We will review your application shortly.
                    </p>
                  </div>
                  <div className="pt-4">
                     <Button className="w-full py-6 text-lg font-bold rounded-xl" onClick={() => navigate("/dashboard")}>
                       Return to Dashboard
                     </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
        
        {step < 2 && (
          <p className="mt-6 text-center text-[10px] text-muted-foreground/40 font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2">
             <Lock className="h-3 w-3" />
             Secure Identity Verification System
          </p>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 10%; }
          100% { top: 90%; }
        }
      `}</style>
    </div>
  );
}
