import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Check,
  Upload,
  Camera,
  Info,
  X,
  Image as ImageIcon,
  ArrowRight,
  ArrowLeft,
  Barcode,
  AlertCircle,
  Fingerprint,
  FileStack,
  QrCode,
  Activity,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Laptop,
  Key,
  FileText,
  ShieldCheck as Shield,
  CheckCircle,
  CreditCard,
  Eye,
  Sparkles,
  Package,
  ChevronDown
} from "lucide-react";

// UI Components
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Hooks & Libs
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { PaymentService } from "@/services/payment.service";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { PageLayout } from "@/components/layout/page-layout";

// Custom Registration Components
import { SmartIDRecognizer } from "@/components/item-registration/smart-id-recognizer";
import { BatchImageUpload } from "@/components/item-registration/batch-image-upload";
import { OwnershipChain, OwnershipDocument as OwnershipDoc } from "@/components/item-registration/ownership-chain";
import { QRCodeGenerator } from "@/components/item-registration/qr-code-generator";
import { ShareWhatsAppButton } from "@/components/ui/share-whatsapp-button";
import { VoiceHelper } from "@/components/ui/voice-helper";
import { PaymentTrust } from "@/components/ui/payment-trust";

// Schema & Constants
import { insertItemSchema } from "@shared/schema";

const CATEGORIES = [
  "Electronics",
  "Phones",
  "Computers",
  "Documents",
  "Jewelry",
  "Accessories",
  "Clothing",
  "Bags",
  "Keys",
  "Wallets",
  "Transportation",
  "Other"
];

const SUB_CATEGORIES: Record<string, string[]> = {
  Electronics: ["Camera", "Smartwatch", "Headphones", "Other"],
  Phones: ["Smartphone", "Tablet", "Feature Phone", "Other"],
  Computers: ["Laptop", "Desktop", "Monitor", "Other"],
  Documents: ["ID Card", "Passport", "Driver's License", "Certificate", "Other"],
  Jewelry: ["Ring", "Necklace", "Bracelet", "Watch", "Other"],
  Accessories: ["Watch", "Bag", "Wallet", "Glasses", "Other"],
  Clothing: ["Outerwear", "Formal", "Casual", "Sports", "Other"],
  Transportation: ["Bicycle", "Motorcycle", "Car", "Other"],
  Bags: ["Other"],
  Keys: ["Other"],
  Wallets: ["Other"],
  Other: ["Other"],
};

// Category visual definitions for the grid — always-visible gradients matching mockup
const CATEGORY_VISUALS: { id: string; icon: any; gradient: string }[] = [
  { id: "Phones", icon: Smartphone, gradient: "from-sky-400 to-blue-500" },
  { id: "Computers", icon: Laptop, gradient: "from-cyan-400 to-teal-500" },
  { id: "Documents", icon: FileText, gradient: "from-amber-400 to-orange-500" },
  { id: "Keys", icon: Key, gradient: "from-emerald-400 to-green-600" },
  { id: "Electronics", icon: Barcode, gradient: "from-violet-500 to-purple-500" },
  { id: "Jewelry", icon: Sparkles, gradient: "from-yellow-400 to-amber-500" },
  { id: "Accessories", icon: Package, gradient: "from-indigo-400 to-blue-600" },
  { id: "Wallets", icon: CreditCard, gradient: "from-slate-400 to-gray-600" },
  { id: "Bags", icon: Package, gradient: "from-pink-400 to-rose-500" },
  { id: "Clothing", icon: Shield, gradient: "from-lime-400 to-green-500" },
  { id: "Transportation", icon: Activity, gradient: "from-red-400 to-orange-500" },
  { id: "Other", icon: Package, gradient: "from-rose-400 to-pink-600" },
];

const formSchema = insertItemSchema.omit({ userId: true }).extend({
  subCategory: z.string().optional(),
  color: z.string().optional(),
  model: z.string().optional(),
  name: z.string().min(2, "Item name must be at least 2 characters"),
  uniqueIdentifier: z.string().min(3, "Identifier must be at least 3 characters"),
  description: z.string().optional().refine(val => !val || val.length >= 5, {
    message: "Description must be at least 5 characters if provided"
  }),
});

type ItemRegistrationValues = z.infer<typeof formSchema>;

// Steps config
const STEPS = [
  { key: "details", icon: FileText, label: "registration.steps.details" },
  { key: "photos", icon: ImageIcon, label: "registration.steps.photos" },
  { key: "review", icon: Eye, label: "registration.steps.review" },
];

export default function ItemRegistrationPage({ params }: { params?: { id?: string } }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // UI State
  const [currentStep, setCurrentStep] = useState(0);
  const [itemImages, setItemImages] = useState<File[]>([]);
  const [ownershipDocuments, setOwnershipDocuments] = useState<OwnershipDoc[]>([]);
  const [completion, setCompletion] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [registeredItemData, setRegisteredItemData] = useState<any>(null);

  const isEditMode = !!params?.id;
  const itemId = params?.id;
  const maxSteps = 3;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Form initialization
  const form = useForm<ItemRegistrationValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "" as any,
      subCategory: "",
      color: "",
      model: "",
      uniqueIdentifier: "",
      description: "",
      status: "Registered",
      imageUrls: [],
      details: {},
    },
    mode: "onChange",
  });

  const watchedName = useWatch({ control: form.control, name: "name" });
  const watchedCategory = useWatch({ control: form.control, name: "category" });
  const watchedIdentifier = useWatch({ control: form.control, name: "uniqueIdentifier" });
  const watchedDescription = useWatch({ control: form.control, name: "description" });

  // Fix persistent rogue "01/01/2020" date issue
  useEffect(() => {
    if (!isEditMode && !localStorage.getItem('itemRegistrationDraft')) {
      form.setValue("name", "");
    }
  }, [form, isEditMode]);

  const [existingImages, setExistingImages] = useState<string[]>([]);

  // Fetch item details if in edit mode
  const { data: existingItem, isLoading: isLoadingItem } = useQuery({
    queryKey: [`/api/items/${itemId}`],
    queryFn: () => apiRequest(`/api/items/${itemId}`),
    enabled: !!itemId
  });

  // Populate form when item data is loaded
  useEffect(() => {
    if (existingItem) {
      form.reset({
        name: existingItem.name,
        category: existingItem.category,
        subCategory: existingItem.details?.subCategory || "",
        uniqueIdentifier: existingItem.uniqueIdentifier,
        description: existingItem.description || "",
        status: existingItem.status,
        imageUrls: existingItem.imageUrls || [],
        details: existingItem.details || {},
      });
      setExistingImages(existingItem.imageUrls || []);

      if (existingItem.details?.ownershipDocuments && Array.isArray(existingItem.details.ownershipDocuments)) {
        try {
          const docs = existingItem.details.ownershipDocuments.map((doc: any, index: number) => ({
            id: `existing-${index}`,
            file: null,
            url: doc.url || doc,
            title: doc.title || "Existing Document",
            date: doc.date || "",
            description: doc.description || ""
          }));
          setOwnershipDocuments(docs);
        } catch (e) {
          console.error("Failed to parse existing ownership documents", e);
        }
      }
    }
  }, [existingItem, form]);

  const [hasDraft, setHasDraft] = useState(false);
  const [draftData, setDraftData] = useState<any>(null);

  // Check for draft on mount
  useEffect(() => {
    if (isEditMode) return;
    const savedDraft = localStorage.getItem('itemRegistrationDraft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setDraftData(parsed);
        setHasDraft(true);

        toast({
          title: "Saved Draft Found",
          description: "Would you like to resume your previous registration progress?",
          action: (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleResumeDraft(parsed);
                  setHasDraft(false);
                }}
                className="h-8 text-xs font-bold"
              >
                Resume
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  localStorage.removeItem('itemRegistrationDraft');
                  setHasDraft(false);
                  toast({
                    title: "Draft Cleared",
                    description: "Starting with a fresh registration form.",
                  });
                }}
                className="h-8 text-xs text-muted-foreground"
              >
                Clear
              </Button>
            </div>
          ),
          duration: 10000,
        });
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
  }, [isEditMode]);

  const handleResumeDraft = (data: any) => {
    // Filter out rogue date values that somehow got saved as the item name
    const datePattern = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/;
    Object.entries(data).forEach(([key, value]) => {
      if (key === "name" && typeof value === "string" && datePattern.test(value.trim())) return;
      if (value) form.setValue(key as any, value);
    });

    toast({
      title: "Draft Resumed",
      description: "Previous progress has been loaded successfully.",
    });
  };

  // Skip the old auto-load effect
  useEffect(() => {
    // We now handle this manually via the toast action above
  }, []);

  // Calculate completion
  useEffect(() => {
    let totalFields = 6;
    let completedFields = 0;
    if (watchedName) completedFields++;
    if (watchedCategory) completedFields++;
    if (watchedIdentifier) completedFields++;
    if (watchedDescription && watchedDescription.length >= 10) completedFields++;
    if (itemImages.length > 0 || existingImages.length > 0) completedFields++;
    if (ownershipDocuments.length > 0) completedFields++;
    setCompletion(Math.round((completedFields / totalFields) * 100));
  }, [watchedName, watchedCategory, watchedIdentifier, watchedDescription, itemImages, ownershipDocuments, existingImages]);

  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      if (form.formState.isDirty) {
        setAutoSaving(true);
        const values = form.getValues();
        localStorage.setItem('itemRegistrationDraft', JSON.stringify(values));
        setTimeout(() => setAutoSaving(false), 1000);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [watchedName, watchedCategory, watchedIdentifier, watchedDescription, form.formState.isDirty]);

  // Monitor form errors
  useEffect(() => {
    if (Object.keys(form.formState.errors).length > 0) {
      console.debug("[Registration] Form validation errors:", form.formState.errors);
    }
  }, [form.formState.errors]);

  const prevStep = (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const nextStep = (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (currentStep < maxSteps - 1) setCurrentStep(currentStep + 1);
  };

  // Manual save draft
  const saveDraft = () => {
    const values = form.getValues();
    localStorage.setItem('itemRegistrationDraft', JSON.stringify(values));
    setAutoSaving(true);
    setTimeout(() => setAutoSaving(false), 1500);
    toast({
      title: "Draft Saved",
      description: "Your registration progress has been saved locally.",
    });
  };

  // Step validation
  const canProceedStep0 = !!(watchedName && watchedCategory && watchedIdentifier);
  const canProceedStep1 = (itemImages.length >= 1 || existingImages.length >= 1);

  // OCR/Smart ID detection handler
  const handleIdentifierDetected = (value: string) => {
    form.setValue("uniqueIdentifier", value, { shouldValidate: true });
    toast({
      title: "ID Detected",
      description: `Detected unique identifier: ${value}`,
    });
  };

  const registerMutation = useMutation({
    mutationFn: async (data: ItemRegistrationValues) => {
      console.log("[Registration] Starting submission...", data);

      // 1. Upload new images
      let uploadedImageUrls: string[] = [];
      if (itemImages.length > 0) {
        const formData = new FormData();
        itemImages.forEach(file => formData.append('images', file));
        const { urls } = await apiRequest<{ urls: string[] }>('/api/upload/images', {
          method: 'POST',
          data: formData
        });
        uploadedImageUrls = urls;
      }

      const finalImageUrls = [...existingImages, ...uploadedImageUrls];

      // 2. Upload ownership documents
      let uploadedDocUrls: any[] = [];
      const newDocs = ownershipDocuments.filter(doc => doc.file !== null);
      const existingDocs = ownershipDocuments.filter(doc => doc.file === null).map(doc => ({
        url: doc.url,
        title: doc.title,
        date: doc.date,
        description: doc.description
      }));

      if (newDocs.length > 0) {
        const formData = new FormData();
        newDocs.forEach((doc, i) => {
          if (doc.file) {
            formData.append('documents', doc.file);
            formData.append(`documentInfo${i}`, JSON.stringify({
              title: doc.title,
              date: doc.date,
              description: doc.description
            }));
          }
        });
        const { documents } = await apiRequest<{ documents: any[] }>('/api/upload/documents', {
          method: 'POST',
          data: formData
        });
        uploadedDocUrls = documents;
      }

      const finalDocUrls = [...existingDocs, ...uploadedDocUrls];

      // 3. Register/Update Item
      const { subCategory, color, model, ...rootData } = data;
      const apiEndpoint = isEditMode && itemId ? `/api/items/${itemId}` : '/api/items';
      const method = isEditMode ? 'PUT' : 'POST';

      const itemResponse = await apiRequest<any>(apiEndpoint, {
        method,
        data: {
          ...rootData,
          imageUrls: finalImageUrls,
          details: {
            ...(data.details as any),
            subCategory,
            color,
            model,
            ownershipDocuments: finalDocUrls
          }
        }
      });

      // 4. Initialize Payment (Only new registrations)
      let paymentResponse: { paymentUrl: string | null } = { paymentUrl: null };
      if (!isEditMode) {
        paymentResponse = await PaymentService.initializePayment({
          type: "registration",
          itemId: itemResponse.id
        });
      }

      return { item: itemResponse, payment: paymentResponse };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      if (itemId) {
        queryClient.invalidateQueries({ queryKey: [`/api/items/${itemId}`] });
      }
      localStorage.removeItem('itemRegistrationDraft');

      toast({
        title: isEditMode ? "Success!" : "Item Registered",
        description: isEditMode ? "Item updated successfully." : "Redirecting to payment...",
        variant: "default",
        duration: 3000,
      });

      if (!isEditMode && data.payment.paymentUrl) {
        window.location.href = data.payment.paymentUrl;
      } else if (!isEditMode) {
        setRegisteredItemData(data.item);
        setShowSuccess(true);
      } else {
        setTimeout(() => {
          setLocation(`/items/${itemId}`);
        }, 500);
      }
    },
    onError: (error: Error) => {
      console.error("[Registration] Mutation error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register item. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: ItemRegistrationValues) => {
    registerMutation.mutate(data);
  };

  // ──────────────── LOADING STATE ────────────────
  if (isEditMode && isLoadingItem) {
    return (
      <PageLayout>
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </div>
            <p className="text-muted-foreground text-sm font-medium animate-pulse">Loading item details...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // ──────────────── SUCCESS SCREEN ────────────────
  if (showSuccess) {
    return (
      <PageLayout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center py-12 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="max-w-lg w-full mx-auto bg-background rounded-3xl border border-border/50 shadow-2xl overflow-hidden"
          >
            {/* Success Header */}
            <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 text-center text-primary-foreground">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Check className="h-10 w-10" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-1">{t("registration.success.title")}</h2>
              <p
                className="text-sm opacity-90 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: t("registration.success.congrats", { itemName: registeredItemData?.name })
                }}
              />
            </div>

            {/* QR Code */}
            <div className="p-8 space-y-6">
              <div className="text-center space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t("registration.success.label_title")}</p>
                <div className="bg-muted/30 p-6 rounded-2xl border border-dashed border-border/50 inline-block mx-auto">
                  <QRCodeGenerator
                    itemIdentifier={registeredItemData?.uniqueIdentifier}
                    itemName={registeredItemData?.name}
                    showHeader={false}
                    size={180}
                  />
                </div>
                <p className="text-xs text-muted-foreground italic">{t("registration.success.label_hint")}</p>
              </div>

              <div className="flex flex-col gap-3">
                <ShareWhatsAppButton
                  itemName={registeredItemData?.name || 'My Item'}
                  itemUrl={`${window.location.origin}/items/${registeredItemData?.id}`}
                  message={t("common.shareSuccessMessage", {
                    itemName: registeredItemData?.name || 'My Item',
                    itemUrl: `${window.location.origin}/items/${registeredItemData?.id}`
                  })}
                  className="h-12 rounded-2xl text-sm font-semibold w-full"
                  size="lg"
                />
                <Button
                  onClick={() => setLocation("/dashboard")}
                  className="h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/20"
                >
                  {t("registration.success.go_dashboard")}
                </Button>
                <p className="text-xs text-center text-muted-foreground opacity-60">{t("registration.success.footer")}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </PageLayout>
    );
  }

  // ──────────────── MAIN REGISTRATION FORM ────────────────
  return (
    <PageLayout
      title={isEditMode ? t("registration.editTitle") : t("registration.title")}
      defaultSidebarCollapsed={true}
    >
      <div className="min-h-[70vh] py-4 px-3 sm:py-6 sm:px-4">
        <div className="w-full max-w-6xl mx-auto">

          {/* Auto-save indicator (floating) */}
          {autoSaving && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed top-20 right-4 z-50 flex items-center gap-1.5 text-xs text-muted-foreground bg-background/90 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-1.5 shadow-sm"
            >
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>{t("registration.item_draft_saved")}</span>
            </motion.div>
          )}

          {/* ──── White Card Container ──── */}
          <div className="bg-background rounded-xl border border-border/50 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col">

            {/* ──── Header Bar ──── */}
            <div className="px-6 sm:px-10 py-5 border-b border-border/30 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-foreground tracking-tight">
                  {isEditMode ? t("registration.edit_title") : t("registration.title")}
                </h2>
                <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.15em] mt-1">
                  Global Security Database
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                <Shield className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wide">Secure Session Active</span>
              </div>
            </div>

            {/* ──── Content: 60/40 Split ──── */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

              {/* ──── LEFT: Form (60%) ──── */}
              <div className="lg:w-3/5 p-6 sm:p-10 overflow-y-auto lg:border-r border-border/30">
                <Form {...form}>
                  <form
                    id="item-registration-form"
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-8"
                  >
                    <AnimatePresence mode="wait">

                      {/* ━━━━━━━━━━━━━━━━ STEP 0: ITEM DETAILS ━━━━━━━━━━━━━━━━ */}
                      {currentStep === 0 && (
                        <motion.div
                          key="step-details"
                          initial={{ opacity: 0, x: -30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 30 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="space-y-8"
                        >
                          {/* Primary Item Name */}
                          <div className="space-y-5">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="h-9 w-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                <Info className="h-5 w-5" />
                              </div>
                              <div>
                                <h2 className="text-lg font-bold tracking-tight">{t("registration.main_details")}</h2>
                                <p className="text-sm text-muted-foreground">Basic information about your asset</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                              {/* Item Name */}
                              <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-semibold flex items-center gap-1.5">
                                      {t("registration.item_name")}
                                      <span className="text-primary text-xs">*</span>
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="text"
                                        autoComplete="off"
                                        placeholder={t("registration.item_name_placeholder")}
                                        className="h-12 bg-muted/5 border-border/60 focus:border-primary/50 rounded-xl text-sm font-medium"
                                        {...field}
                                        value={field.value || ""}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {/* Unique Identifier */}
                              <FormField
                                control={form.control}
                                name="uniqueIdentifier"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-semibold flex items-center justify-between">
                                      <span className="flex items-center gap-1.5">
                                        {t("registration.item_uuid")}
                                        <span className="text-primary text-xs">*</span>
                                      </span>
                                      <VoiceHelper text={t("registration.voice_uuid_hint")} />
                                    </FormLabel>
                                    <FormControl>
                                      <div className="relative group">
                                        <Input
                                          placeholder="e.g. 352849102938472"
                                          className="h-12 bg-muted/5 border-border/60 focus:border-primary/50 rounded-xl text-sm font-mono tracking-wide pr-24"
                                          {...field}
                                          disabled={isEditMode}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => (document.getElementById('smart-ai-trigger') as HTMLElement)?.click()}
                                          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-200 text-xs font-bold"
                                          title="Smart AI OCR"
                                        >
                                          <Camera className="h-3.5 w-3.5" />
                                          Smart AI
                                        </button>
                                        <div className="hidden">
                                          <SmartIDRecognizer onIdentifierSelected={handleIdentifierDetected} showHeader={false} />
                                        </div>
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          {/* Category Grid — 5-column square compact cards */}
                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name="category"
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex justify-between items-end">
                                    <FormLabel className="text-sm font-semibold text-foreground">Security Classification</FormLabel>
                                    <span className="text-[10px] text-muted-foreground italic">Select one category</span>
                                  </div>

                                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-3">
                                    {CATEGORY_VISUALS.map((cat) => {
                                      const isSelected = field.value === cat.id;
                                      return (
                                        <button
                                          key={cat.id}
                                          type="button"
                                          onClick={() => field.onChange(cat.id)}
                                          className={cn(
                                            "relative flex flex-col items-center justify-center gap-1.5 aspect-square rounded-xl transition-all duration-200 bg-gradient-to-br shadow-md",
                                            cat.gradient,
                                            isSelected
                                              ? "border-2 border-white ring-2 ring-primary/30 scale-[1.03]"
                                              : "hover:scale-105 active:scale-95"
                                          )}
                                        >
                                          <cat.icon className="h-6 w-6 text-white" />
                                          <span className="text-[10px] font-bold text-white">
                                            {t(`categories.${cat.id}`)}
                                          </span>

                                          {isSelected && (
                                            <motion.div
                                              initial={{ scale: 0 }}
                                              animate={{ scale: 1 }}
                                              className="absolute top-2 right-2 h-5 w-5 bg-white rounded-full flex items-center justify-center shadow-md"
                                            >
                                              <Check className="h-3 w-3 text-gray-800" />
                                            </motion.div>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Optional Fields */}
                          <div className="bg-background/60 backdrop-blur-xl border border-border/50 rounded-2xl shadow-sm overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setShowOptionalFields(!showOptionalFields)}
                              className="w-full flex items-center justify-between p-5 sm:p-6 hover:bg-muted/5 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-muted/20 rounded-lg flex items-center justify-center text-muted-foreground">
                                  <Info className="h-4 w-4" />
                                </div>
                                <div className="text-left">
                                  <p className="text-sm font-semibold">Additional Details</p>
                                  <p className="text-xs text-muted-foreground">Color, model, notes & markings</p>
                                </div>
                              </div>
                              <ChevronDown className={cn(
                                "h-4 w-4 text-muted-foreground transition-transform duration-300",
                                showOptionalFields && "rotate-180"
                              )} />
                            </button>

                            <AnimatePresence>
                              {showOptionalFields && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-4 border-t border-border/30 pt-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <FormField
                                        control={form.control}
                                        name="subCategory"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="text-sm font-medium text-muted-foreground">Detailed Type / Model</FormLabel>
                                            <FormControl>
                                              <Input
                                                placeholder="e.g. Galaxy S22, MacBook Pro"
                                                className="h-12 bg-muted/5 border-border/60 rounded-xl text-sm"
                                                {...field}
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      <FormField
                                        control={form.control}
                                        name="color"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="text-sm font-medium text-muted-foreground">Color</FormLabel>
                                            <FormControl>
                                              <Input
                                                placeholder="e.g. Midnight Black"
                                                className="h-12 bg-muted/5 border-border/60 rounded-xl text-sm"
                                                {...field}
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    </div>
                                    <FormField
                                      control={form.control}
                                      name="description"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-sm font-medium text-muted-foreground">Notes / Unique Markings</FormLabel>
                                          <FormControl>
                                            <Textarea
                                              placeholder="Describe any scratches, special features, or markings that could help identify this item..."
                                              className="min-h-[100px] bg-muted/5 border-border/60 rounded-xl text-sm resize-none"
                                              {...field}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                        </motion.div>
                      )}

                      {/* ━━━━━━━━━━━━━━━━ STEP 1: PHOTOS & PROOF ━━━━━━━━━━━━━━━━ */}
                      {currentStep === 1 && (
                        <motion.div
                          key="step-photos"
                          initial={{ opacity: 0, x: -30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 30 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="space-y-6"
                        >
                          {/* Item Photos */}
                          <div className="bg-background border border-border/40 rounded-2xl p-5 sm:p-7 shadow-sm space-y-5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                                  <ImageIcon className="h-4 w-4" />
                                </div>
                                <div>
                                  <h2 className="text-lg font-bold tracking-tight">{t("registration.item_images")}</h2>
                                  <p className="text-sm text-muted-foreground">Upload clear photos from different angles</p>
                                </div>
                              </div>
                              <Badge variant="secondary" className="text-xs font-medium">Min 2 photos</Badge>
                            </div>

                            {/* Existing images */}
                            {existingImages.length > 0 && (
                              <div className="p-4 bg-muted/10 rounded-xl">
                                <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{t("registration.item_existing_images")}</p>
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                  {existingImages.map((url, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-border/30">
                                      <img src={url} alt="Item" className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button
                                          type="button"
                                          variant="destructive"
                                          size="icon"
                                          className="h-7 w-7 rounded-lg"
                                          onClick={() => setExistingImages(prev => prev.filter((_, i) => i !== idx))}
                                        >
                                          <X className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <BatchImageUpload
                              onImagesChange={setItemImages}
                              maxFiles={5 - existingImages.length}
                              showHeader={false}
                              className="py-2"
                            />
                          </div>

                          {/* Ownership Documents */}
                          <div className="bg-background border border-border/40 rounded-2xl p-5 sm:p-7 shadow-sm space-y-5">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                                <FileStack className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h2 className="text-lg font-bold tracking-tight">{t("registration.item_ownership_proof")}</h2>
                                  <VoiceHelper text={t("registration.voice_ownership_hint")} />
                                </div>
                                <p className="text-sm text-muted-foreground">{t("registration.item_ownership_docs")}</p>
                              </div>
                            </div>

                            <OwnershipChain
                              onDocumentsChange={setOwnershipDocuments}
                              initialDocuments={ownershipDocuments}
                              showHeader={false}
                            />
                          </div>


                        </motion.div>
                      )}

                      {/* ━━━━━━━━━━━━━━━━ STEP 2: REVIEW & PAY ━━━━━━━━━━━━━━━━ */}
                      {currentStep === 2 && (
                        <motion.div
                          key="step-review"
                          initial={{ opacity: 0, x: -30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 30 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="space-y-6"
                        >
                          {/* Review Summary */}
                          <div className="bg-background/60 backdrop-blur-xl border border-border/50 rounded-2xl p-5 sm:p-7 shadow-sm space-y-6">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 bg-violet-500/10 rounded-xl flex items-center justify-center text-violet-500">
                                <Eye className="h-4 w-4" />
                              </div>
                              <div>
                                <h2 className="text-lg font-bold tracking-tight">{t("registration.review.summary_title")}</h2>
                                <p className="text-sm text-muted-foreground">Review your details before submitting</p>
                              </div>
                            </div>

                            <div className="space-y-4">
                              {/* Item Name */}
                              <div className="flex items-start justify-between p-4 bg-muted/10 rounded-xl">
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t("registration.item_name")}</p>
                                  <p className="text-base font-bold">{watchedName || "—"}</p>
                                </div>
                                <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentStep(0)} className="text-xs text-primary">
                                  Edit
                                </Button>
                              </div>

                              {/* Category */}
                              <div className="flex items-start justify-between p-4 bg-muted/10 rounded-xl">
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t("registration.fields.category")}</p>
                                  <div className="flex items-center gap-2">
                                    {watchedCategory && (() => {
                                      const catVis = CATEGORY_VISUALS.find(c => c.id === watchedCategory);
                                      if (!catVis) return <p className="text-base font-bold">{watchedCategory}</p>;
                                      const CatIcon = catVis.icon;
                                      return (
                                        <div className="flex items-center gap-2">
                                          <div className={cn("h-7 w-7 rounded-lg bg-gradient-to-br flex items-center justify-center", catVis.gradient)}>
                                            <CatIcon className="h-3.5 w-3.5 text-white" />
                                          </div>
                                          <span className="text-base font-bold">{t(`categories.${watchedCategory}`)}</span>
                                        </div>
                                      );
                                    })()}
                                    {!watchedCategory && <p className="text-base font-bold text-muted-foreground">—</p>}
                                  </div>
                                </div>
                                <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentStep(0)} className="text-xs text-primary">
                                  Edit
                                </Button>
                              </div>

                              {/* Identifier */}
                              <div className="flex items-start justify-between p-4 bg-muted/10 rounded-xl">
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t("registration.item_uuid")}</p>
                                  <p className="text-base font-bold font-mono tracking-wider">{watchedIdentifier || "—"}</p>
                                </div>
                                {!isEditMode && (
                                  <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentStep(0)} className="text-xs text-primary">
                                    Edit
                                  </Button>
                                )}
                              </div>

                              {/* Photos */}
                              <div className="flex items-start justify-between p-4 bg-muted/10 rounded-xl">
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t("registration.item_images")}</p>
                                  <div className="flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                      {existingImages.slice(0, 3).map((url, idx) => (
                                        <div key={`ex-${idx}`} className="h-10 w-10 rounded-lg border-2 border-background overflow-hidden">
                                          <img src={url} alt="" className="h-full w-full object-cover" />
                                        </div>
                                      ))}
                                      {itemImages.slice(0, 3 - existingImages.length).map((file, idx) => (
                                        <div key={`new-${idx}`} className="h-10 w-10 rounded-lg border-2 border-background overflow-hidden bg-muted flex items-center justify-center">
                                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                      ))}
                                    </div>
                                    <span className="text-sm font-medium">{existingImages.length + itemImages.length} photo(s)</span>
                                  </div>
                                </div>
                                <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentStep(1)} className="text-xs text-primary">
                                  Edit
                                </Button>
                              </div>

                              {/* Documents */}
                              {ownershipDocuments.length > 0 && (
                                <div className="flex items-start justify-between p-4 bg-muted/10 rounded-xl">
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t("registration.item_ownership_proof")}</p>
                                    <p className="text-sm font-medium">{ownershipDocuments.length} document(s) attached</p>
                                  </div>
                                  <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentStep(1)} className="text-xs text-primary">
                                    Edit
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Payment Card */}
                          {!isEditMode && (
                            <div className="bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border border-primary/20 rounded-2xl p-5 sm:p-7 shadow-sm space-y-5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                    <CreditCard className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <h3 className="text-base font-bold">{t("registration.review.protection_fee")}</h3>
                                    <p className="text-xs text-muted-foreground">{t("registration.item_fee_description")}</p>
                                  </div>
                                </div>
                                <span className="text-2xl font-black tracking-tight">2,000 <span className="text-sm font-semibold text-muted-foreground">RWF</span></span>
                              </div>

                              <div className="flex items-center gap-3 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                                <p className="text-xs text-muted-foreground leading-relaxed">{t("registration.review.lifetime_badge")}</p>
                              </div>

                              <PaymentTrust className="py-1" showText={false} />
                            </div>
                          )}

                        </motion.div>
                      )}

                    </AnimatePresence>
                  </form>
                </Form>
              </div>
              <div className="hidden lg:flex lg:w-2/5 bg-slate-50/50 p-8 flex-col border-l border-border/30">
                <h3 className="text-sm font-bold text-foreground mb-6 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#0db9f2]" />
                  Asset Lifecycle Visualizer
                </h3>
                <div className="relative flex-1 py-4">
                  <div className="space-y-10 relative">
                    <div className="absolute left-6 top-6 bottom-6 w-0.5 z-0 dashed-progress-line" />
                    <div className="flex items-start gap-5 relative z-10">
                      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg", currentStep >= 0 ? "bg-[#0db9f2] text-white ring-4 ring-[#0db9f2]/10" : "bg-slate-200 text-slate-400")}>
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1 pt-1">
                        <h4 className={cn("text-xs font-bold uppercase tracking-wider", currentStep >= 0 ? "text-[#0db9f2]" : "text-slate-800")}>Step 01: Registered</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-normal">Your asset's metadata is hashed and prepared for secure timestamping.</p>
                        {currentStep === 0 && <div className="mt-2 flex items-center text-[10px] font-bold text-[#0db9f2]"><span className="animate-pulse mr-1.5">●</span> IN PROGRESS</div>}
                        {currentStep > 0 && <div className="mt-2 flex items-center text-[10px] font-bold text-emerald-500"><Check className="h-3 w-3 mr-1" /> COMPLETE</div>}
                      </div>
                    </div>
                    <div className={cn("flex items-start gap-5 relative z-10", currentStep < 1 && "opacity-50")}>
                      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", currentStep >= 1 ? "bg-[#0db9f2] text-white shadow-lg ring-4 ring-[#0db9f2]/10" : "bg-slate-200 text-slate-400")}>
                        <Shield className="h-5 w-5" />
                      </div>
                      <div className="flex-1 pt-1">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Step 02: Protected</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-normal">Photographic evidence and purchase proof are encrypted with your private key.</p>
                        {currentStep === 1 && <div className="mt-2 flex items-center text-[10px] font-bold text-[#0db9f2]"><span className="animate-pulse mr-1.5">●</span> IN PROGRESS</div>}
                        {currentStep > 1 && <div className="mt-2 flex items-center text-[10px] font-bold text-emerald-500"><Check className="h-3 w-3 mr-1" /> COMPLETE</div>}
                      </div>
                    </div>
                    <div className={cn("flex items-start gap-5 relative z-10", currentStep < 2 && "opacity-50")}>
                      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", currentStep >= 2 ? "bg-[#0db9f2] text-white shadow-lg ring-4 ring-[#0db9f2]/10" : "bg-slate-200 text-slate-400")}>
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <div className="flex-1 pt-1">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Step 03: Verified</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-normal">KIZERE Certificate of Authenticity is issued for insurance and recovery.</p>
                        {currentStep === 2 && <div className="mt-2 flex items-center text-[10px] font-bold text-[#0db9f2]"><span className="animate-pulse mr-1.5">●</span> IN PROGRESS</div>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 pt-4">
                    <div className="bg-background p-4 rounded-xl border border-border/50 shadow-sm">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="p-1.5 bg-[#0db9f2]/10 rounded-lg"><Shield className="h-4 w-4 text-[#0db9f2]" /></div>
                        <span className="text-xs font-bold text-foreground uppercase tracking-tight">Why Unique IDs Matter?</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed italic">"Providing a unique identifier is the single most effective way to prove ownership if your item is recovered by law enforcement."</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ──── Footer Bar ──── */}
            <footer className="px-6 sm:px-10 py-4 border-t border-border/30 flex items-center justify-between bg-background">
              <div className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider">
                <span className="block mb-1">Progress</span>
                <div className="w-28 h-1.5 bg-muted/20 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-[#0db9f2] rounded-full" initial={{ width: 0 }} animate={{ width: `${completion}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
                </div>
              </div>
              <div className="hidden lg:flex items-center gap-3">
                {currentStep > 0 && (
                  <Button type="button" variant="ghost" onClick={prevStep} className="h-12 px-5 rounded-xl text-sm font-semibold">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                )}
                <button type="button" onClick={saveDraft} className="text-muted-foreground hover:text-foreground font-bold text-xs uppercase tracking-widest px-4 transition-colors">Save Draft</button>
                {currentStep < maxSteps - 1 ? (
                  <Button type="button" onClick={nextStep} disabled={currentStep === 0 ? !canProceedStep0 : !canProceedStep1} className="h-12 px-8 rounded-xl text-sm font-bold bg-[#0db9f2] hover:bg-[#0a94c2] text-white shadow-lg shadow-[#0db9f2]/20 transition-all group">
                    Continue to Step {currentStep + 2}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                ) : (
                  <Button type="submit" form="item-registration-form" disabled={completion < 30 || registerMutation.isPending} className="h-12 px-8 rounded-xl text-sm font-bold bg-[#0db9f2] hover:bg-[#0a94c2] text-white shadow-lg shadow-[#0db9f2]/20 transition-all">
                    {registerMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <>{isEditMode ? t("common.saveChanges") : t("common.complete_registration")}<ArrowRight className="ml-2 h-4 w-4" /></>}
                  </Button>
                )}
              </div>
            </footer>
          </div>
        </div>
      </div>

      {/* ──── Floating Mobile Action Bar ──── */}
      {isMounted && !showSuccess && typeof document !== 'undefined' && createPortal(
        <div className="lg:hidden fixed bottom-6 left-4 right-4 z-[100]">
          <div className="bg-background/90 backdrop-blur-2xl p-2.5 rounded-2xl border border-border/30 shadow-2xl flex items-center gap-2 max-w-md mx-auto">
            {currentStep > 0 && (
              <Button type="button" variant="outline" size="icon" onClick={prevStep} className="rounded-xl h-12 w-12 shrink-0 border-border/30">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}

            {currentStep < maxSteps - 1 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={currentStep === 0 ? !canProceedStep0 : !canProceedStep1}
                className="flex-1 h-12 rounded-xl text-sm font-bold shadow-lg shadow-primary/20"
              >
                Next Step
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                form="item-registration-form"
                disabled={completion < 30 || registerMutation.isPending}
                className="flex-1 h-12 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 bg-primary flex items-center justify-between px-5"
              >
                <div className="flex flex-col items-start leading-none gap-0.5">
                  {!isEditMode && <span className="text-[9px] opacity-70">2,000 RWF</span>}
                  <span>{isEditMode ? t("common.saveChanges") : t("common.finish")}</span>
                </div>
                {registerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>,
        document.body
      )}
    </PageLayout>
  );
}
