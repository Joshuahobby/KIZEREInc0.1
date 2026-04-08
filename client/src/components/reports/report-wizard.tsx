import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Laptop,
  Key,
  FileText,
  Sparkles,
  Package,
  CreditCard,
  Shield,
  Activity,
  Barcode,
  AlertTriangle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { BatchImageUpload } from "@/components/item-registration/batch-image-upload";
import { foundItemReportSchema, lostItemReportSchema, itemCategories, validateIdentifierForCategory } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useAuth } from "@/hooks/use-auth";

interface ReportWizardProps {
  type: "lost" | "found";
  onSubmit: (data: any, images: File[]) => void;
  isSubmitting: boolean;
  initialValues?: any;
}

const CATEGORY_ICONS: Record<string, any> = {
  "Phones": Smartphone,
  "Computers": Laptop,
  "Documents": FileText,
  "Keys": Key,
  "Electronics": Barcode,
  "Jewelry": Sparkles,
  "Accessories": Package,
  "Wallets": CreditCard,
  "Bags": Package,
  "Clothing": Shield,
  "Transportation": Activity,
  "Other": Package,
};

export function ReportWizard({ type, onSubmit, isSubmitting, initialValues }: ReportWizardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [images, setImages] = useState<File[]>([]);

  const baseSchema = type === "lost" ? lostItemReportSchema : foundItemReportSchema;
  const schema = baseSchema.extend({
    bountyAmount: z.coerce.number().min(0).optional()
  }).superRefine((data, ctx) => {
    const err = validateIdentifierForCategory(data.uniqueIdentifier, data.category);
    if (err) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: err, path: ["uniqueIdentifier"] });
    }
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      type,
      title: initialValues?.title || "",
      category: initialValues?.category || "Other",
      description: initialValues?.description || "",
      location: initialValues?.location || "",
      uniqueIdentifier: initialValues?.uniqueIdentifier || "",
      date: initialValues?.date || new Date().toISOString().split("T")[0],
      contactInfo: initialValues?.contactInfo || "",
      custodyLocation: initialValues?.custodyLocation || "",
      challengeQuestion: initialValues?.challengeQuestion || "",
      status: "Open",
      bountyAmount: initialValues?.bountyAmount || 0,
      imageUrls: initialValues?.imageUrls || [],
      itemId: initialValues?.itemId || undefined,
    } as any
  });

  const itemId = form.watch("itemId");
  const selectedCategory = form.watch("category");

  const IDENTIFIER_HINTS: Record<string, { label: string; placeholder: string; hint: string }> = {
    Phones: { label: "IMEI Number", placeholder: "e.g. 356938035643809", hint: "15-digit IMEI. Dial *#06# on the phone to reveal it." },
    Computers: { label: "Serial Number", placeholder: "e.g. C02Q7KHTGFWM", hint: "Found on the bottom of the device or in System Info." },
    Electronics: { label: "Serial Number", placeholder: "e.g. SN123456789", hint: "Usually on the back of the device or its original packaging." },
    Transportation: { label: "VIN / Plate Number", placeholder: "e.g. RAB 123A", hint: "Vehicle Identification Number or license plate." },
    Documents: { label: "Document Number", placeholder: "e.g. PC12345678", hint: "Passport, NIN, or other official document number." },
    Wallets: { label: "Identifier", placeholder: "e.g. brand + distinguishing feature", hint: "Any unique detail that helps identify this item." },
    Jewelry: { label: "Identifier", placeholder: "e.g. inscription or hallmark", hint: "Engraving, hallmark, or any unique marking." },
    Keys: { label: "Identifier", placeholder: "e.g. key tag or label", hint: "Tag number, label text, or any identifier on the keyring." },
  };

  const identifierMeta = IDENTIFIER_HINTS[selectedCategory] ?? {
    label: "Unique Identifier",
    placeholder: "e.g. serial number, tag, or any identifying code",
    hint: "Any serial number, tag, or code that uniquely identifies this item.",
  };

  const totalSteps = 2;

  const nextStep = async () => {
    let fieldsToValidate: string[] = [];
    if (step === 1) {
      fieldsToValidate = ["title", "category", "location", "date", "description"];
    }

    const isValid = await form.trigger(fieldsToValidate as any);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const handleFinalSubmit = (e?: React.BaseSyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (step !== totalSteps) {
      console.warn("[ReportWizard] Final submit called but not on final step:", step);
      return;
    }

    console.log("[ReportWizard] Final submit triggered, validating form...");
    form.handleSubmit(async (data) => {
      console.log("[ReportWizard] Form validation successful, data:", data);
      if (!user) {
        console.log("[ReportWizard] User not logged in, saving pending data to localStorage");
        localStorage.setItem('pending_report_wizard', JSON.stringify({ data, type }));
        window.location.href = `/auth?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
      }
      console.log("[ReportWizard] Calling onSubmit callback with images:", images.length);
      onSubmit(data, images);
    }, (errors) => {
      console.error("[ReportWizard] Form validation failed:", errors);
      
      // Auto-step back if error is on a previous step
      const step1Fields = ["title", "category", "location", "date", "description"];
      const hasStep1Errors = Object.keys(errors).some(key => step1Fields.includes(key));
      
      if (hasStep1Errors && (step as number) !== 1) {
        console.log("[ReportWizard] Validation error found in Step 1, moving back...");
        setStep(1);
      }
    })(e);
  };

  const prevStep = () => setStep(step - 1);

  return (
    <div className="space-y-4 py-0 px-4 pb-4">
      {/* Progress Steps */}
      <div className="flex items-center justify-end mb-2">
        <div className="flex gap-1.5">
          {[1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1 w-8 rounded-full transition-all duration-300",
                step === i ? (type === 'lost' ? "bg-red-500 w-12" : "bg-emerald-500 w-12") : "bg-muted dark:bg-zinc-800/50"
              )}
            />
          ))}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                {/* Bento Section 1: What, Where & When */}
                <div className="bg-muted/40 dark:bg-zinc-900/40 border border-border/50 dark:border-white/5 rounded-3xl p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-border/50 dark:border-white/5 pb-2">
                    <div className={cn(
                      "h-6 w-6 rounded-md flex items-center justify-center",
                      type === 'lost' ? "bg-red-500/10 text-red-600 dark:text-red-500" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500"
                    )}>
                      {type === 'lost' ? <AlertTriangle className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                    </div>
                    <h3 className="text-xs font-bold text-foreground dark:text-white tracking-wide">What, Where & When</h3>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-zinc-400">{t('report_wizard.item_name')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('report_wizard.item_name_placeholder')} className="h-14 rounded-2xl border-border/50 dark:border-white/5 bg-background/50 dark:bg-zinc-950/50 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-zinc-600 focus:border-primary/50 dark:focus:border-zinc-700 transition-all font-medium" {...field} />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-zinc-400">{t('report_wizard.select_category')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-14 rounded-2xl border-border/50 dark:border-white/5 bg-background/50 dark:bg-zinc-950/50 text-foreground dark:text-white focus:border-primary/50 dark:focus:border-zinc-700 transition-all font-medium">
                                <SelectValue placeholder={t('report_wizard.select_category')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl border-border/50 dark:border-white/10 bg-card dark:bg-zinc-900 text-foreground dark:text-white shadow-premium dark:shadow-2xl">
                              {itemCategories.map((c) => {
                                const Icon = CATEGORY_ICONS[c] || Package;
                                return (
                                  <SelectItem key={c} value={c} className="rounded-lg transition-colors py-2.5">
                                    <div className="flex items-center gap-2.5">
                                      <Icon className="h-4 w-4 text-muted-foreground dark:text-zinc-500" />
                                      <span>{t(`item_category_${c.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_')}`)}</span>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-zinc-400">{t('report_wizard.location')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('report_wizard.location_placeholder')} className="h-14 rounded-2xl border-border/50 dark:border-white/5 bg-background/50 dark:bg-zinc-950/50 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-zinc-600 focus:border-primary/50 dark:focus:border-zinc-700 transition-all font-medium" {...field} />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-zinc-400">{t('report_wizard.date')}</FormLabel>
                          <FormControl>
                            <Input type="date" className="h-14 rounded-2xl border-border/50 dark:border-white/5 bg-background/50 dark:bg-zinc-950/50 text-foreground dark:text-white focus:border-primary/50 dark:focus:border-zinc-700 transition-all [color-scheme:light] dark:[color-scheme:dark] font-medium" {...field} />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Bento Section 2: Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="bg-muted/40 dark:bg-zinc-900/40 border border-border/50 dark:border-white/5 rounded-3xl p-5 flex flex-col h-full space-y-1">
                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-zinc-400 block">{t('report_wizard.description')}</FormLabel>
                        <FormControl className="flex-1 mt-1">
                          <Textarea
                            placeholder={t('report_wizard.description_placeholder')}
                            className="min-h-[80px] rounded-2xl border-border/50 dark:border-white/5 bg-background/50 dark:bg-zinc-950/50 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-zinc-600 focus:border-primary/50 dark:focus:border-zinc-700 transition-all resize-none font-medium h-full"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] mt-1" />
                      </FormItem>
                    )}
                  />

                  {/* Bento Section 3: Images */}
                  <div className="bg-muted/40 dark:bg-zinc-900/40 border border-border/50 dark:border-white/5 rounded-3xl p-5 flex flex-col h-full space-y-1">
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-zinc-400 block">{t('report_wizard.images')}</FormLabel>
                    <div className="rounded-2xl border border-border/50 dark:border-white/5 bg-background/30 dark:bg-zinc-950/30 p-1 flex-1 mt-1">
                      <BatchImageUpload onImagesChange={setImages} maxFiles={3} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="contactInfo"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-zinc-400">{t('report_wizard.contact_details')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('report_wizard.contact_details_placeholder')} className="h-14 rounded-2xl border-border/50 dark:border-white/5 bg-background/50 dark:bg-zinc-950/50 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-zinc-600 focus:border-primary/50 dark:focus:border-zinc-700 transition-all font-medium" {...field} />
                      </FormControl>
                      <FormDescription className="text-[9px] text-muted-foreground dark:text-zinc-500">
                        {type === 'found' ? t('report_wizard.contact_hint_found') : t('report_wizard.contact_hint_lost')}
                      </FormDescription>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="uniqueIdentifier"
                  render={({ field }) => (
                    <FormItem className="bg-muted/40 dark:bg-zinc-900/40 border border-border/50 dark:border-white/5 rounded-3xl p-5 space-y-1">
                      <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-zinc-400">
                        {identifierMeta.label}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={identifierMeta.placeholder}
                          className="h-14 rounded-2xl border-border/50 dark:border-white/5 bg-background/50 dark:bg-zinc-950/50 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-zinc-600 focus:border-primary/50 dark:focus:border-zinc-700 transition-all font-medium font-mono"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-[9px] text-muted-foreground dark:text-zinc-500">
                        {identifierMeta.hint}
                      </FormDescription>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                {type === 'found' && (
                  <FormField
                    control={form.control}
                    name="challengeQuestion"
                    render={({ field }) => (
                      <FormItem className="bg-amber-500/5 border border-amber-500/20 dark:border-amber-500/10 p-5 rounded-3xl space-y-1">
                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500">{t('report_wizard.security_title')}</FormLabel>
                        <p className="text-[9px] text-amber-600/80 dark:text-amber-500/60 mb-2">{t('report_wizard.security_desc')}</p>
                        <FormControl>
                          <Input placeholder={t('report_wizard.security_placeholder')} className="h-14 rounded-2xl border-border/50 dark:border-white/5 bg-background/50 dark:bg-zinc-950/50 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-zinc-600 focus:border-primary/50 dark:focus:border-zinc-700 transition-all font-medium" {...field} />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                )}

                {type === 'lost' && (
                  <FormField
                    control={form.control}
                    name="bountyAmount"
                    render={({ field }) => (
                      <FormItem className="bg-emerald-500/5 border border-emerald-500/20 dark:border-emerald-500/10 p-5 rounded-3xl space-y-1">
                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">{t('report_wizard.reward_amount')}</FormLabel>
                        <p className="text-[9px] text-emerald-600/80 dark:text-emerald-500/60 mb-2">{t('report_wizard.reward_hint')}</p>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              className="h-14 rounded-2xl border-border/50 dark:border-white/5 bg-background/50 dark:bg-zinc-950/50 pl-4 pr-12 font-bold text-foreground dark:text-white focus:border-primary/50 dark:focus:border-zinc-700 transition-all font-medium"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-500/30">RWF</span>
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-4 pt-4 border-t border-border/50 dark:border-white/10 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              className="flex-1 rounded-2xl h-14 border-border/50 dark:border-white/10 hover:bg-muted dark:hover:bg-white/5 text-foreground dark:text-white font-bold transition-all"
              disabled={step === 1 || isSubmitting}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('report_wizard.go_back')}
            </Button>

            {step < totalSteps ? (
              <div className="flex justify-end w-full">
                <Button
                  type="button"
                  onClick={nextStep}
                  className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest bg-foreground text-background dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all w-full sm:w-auto shadow-premium"
                >
                  {t('report_wizard.next_step')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>) : (
              <Button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className={cn(
                  "h-14 rounded-2xl flex-[2] text-white font-black uppercase tracking-widest transition-all duration-300 shadow-premium hover:-translate-y-1",
                  type === 'lost'
                    ? "bg-red-600 hover:bg-red-500 border border-red-500/50"
                    : "bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/50"
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                <span>
                  {type === 'lost' 
                    ? (itemId ? t('report_wizard.submit_report') : t('report_wizard.pay_submit')) 
                    : t('report_wizard.submit_report')}
                </span>
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
