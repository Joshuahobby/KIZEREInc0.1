import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Check,
  MapPin,
  Calendar,
  Info,
  ArrowRight,
  ArrowLeft,
  Camera,
  AlertTriangle,
  Receipt,
  ShieldCheck,
  Banknote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BatchImageUpload } from "@/components/item-registration/batch-image-upload";
import { foundItemReportSchema, lostItemReportSchema, itemCategories } from "@shared/schema";
import { cn } from "@/lib/utils";
import { OCRScanner } from "./ocr-scanner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "@/lib/i18n/useTranslation";

import { useAuth } from "@/hooks/use-auth";

interface ReportWizardProps {
  type: "lost" | "found";
  onSubmit: (data: any, images: File[]) => void;
  isSubmitting: boolean;
}

export function ReportWizard({ type, onSubmit, isSubmitting }: ReportWizardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [images, setImages] = useState<File[]>([]);

  // Extend schema for bounty if type is lost
  const baseSchema = type === "lost" ? lostItemReportSchema : foundItemReportSchema;
  const schema = baseSchema.extend({
    bountyAmount: z.coerce.number().min(0).optional()
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      type,
      title: "",
      category: "Other",
      description: "",
      location: "",
      uniqueIdentifier: "",
      date: new Date().toISOString().split("T")[0],
      contactInfo: "",
      custodyLocation: "",
      challengeQuestion: "",
      status: "Open",
      bountyAmount: 0,
      imageUrls: []
    } as any
  });

  // Debug: Log form errors to console
  useEffect(() => {
    if (Object.keys(form.formState.errors).length > 0) {
      console.log("DEBUG: ReportWizard form errors:", form.formState.errors);
    }
  }, [form.formState.errors]);

  const totalSteps = 2;
  const progress = (step / totalSteps) * 100;

  const nextStep = async () => {
    let fieldsToValidate: string[] = [];
    if (step === 1) {
      fieldsToValidate = [
        "title",
        "category",
        "description",
        "uniqueIdentifier",
        "location",
        "date",
        "custodyLocation"
      ].filter(Boolean);
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
      return;
    }

    form.handleSubmit(async (data) => {
      if (!user) {
        // Option 2: Save state and redirect to login
        localStorage.setItem('pending_report_wizard', JSON.stringify({ data, type }));
        // Redirect with returnUrl
        window.location.href = `/auth?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
      }
      onSubmit(data, images);
    })(e);
  };

  const prevStep = () => setStep(step - 1);

  return (
    <Card className="border-none shadow-none bg-transparent overflow-visible">
      {/* Progress Section with Glassmorphism */}
      <div className="mb-10 relative px-1">
        <div className="flex justify-between items-end mb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
              {t('report_wizard.step', { current: step, total: totalSteps })}
            </span>
            <h2 className="text-2xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              {step === 1 ? t('report_wizard.step_1_title') : t('report_wizard.step_2_title')}
            </h2>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-2xl font-black text-primary drop-shadow-sm">
              {Math.round(progress)}%
            </span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {t('report_wizard.complete', { percentage: Math.round(progress) })}
            </span>
          </div>
        </div>

        <div className="h-3 w-full bg-muted/30 backdrop-blur-sm rounded-full overflow-hidden border border-border/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 50, damping: 20 }}
            className="h-full bg-gradient-to-r from-primary via-primary to-primary/80 relative"
          >
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer" />
          </motion.div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="grid gap-6">
                  {/* Category & Title Section */}
                  <div className="group space-y-5 p-6 rounded-[2rem] bg-background/40 backdrop-blur-xl border border-border/50 shadow-sm transition-all hover:shadow-md hover:bg-background/50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                        <Info className="h-5 w-5" />
                      </div>
                      <h3 className="font-bold text-lg">{t('report_wizard.basic_info')}</h3>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                              {t('filters.category')}
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12 bg-background/50 border-border/40 rounded-xl focus:ring-primary/20 transition-all">
                                  <SelectValue placeholder={t('report_wizard.select_category')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-xl border-border/40 backdrop-blur-xl">
                                {itemCategories.map((c) => (
                                  <SelectItem key={c} value={c} className="rounded-lg m-1">
                                    {t(`item_category_${c.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_')}`)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                              {t('report_wizard.item_name')}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t('report_wizard.item_name_placeholder')}
                                className="h-12 bg-background/50 border-border/40 rounded-xl focus:ring-primary/20 transition-all"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Location & Time Section */}
                  <div className="group space-y-5 p-6 rounded-[2rem] bg-background/40 backdrop-blur-xl border border-border/50 shadow-sm transition-all hover:shadow-md hover:bg-background/50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <h3 className="font-bold text-lg">{t('report_wizard.location_time')}</h3>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                              {t('filters.location')}
                            </FormLabel>
                            <FormControl>
                              <div className="relative group/input">
                                <Input
                                  placeholder={t('report_wizard.location_placeholder')}
                                  className="h-12 pl-10 bg-background/50 border-border/40 rounded-xl focus:ring-primary/20 transition-all"
                                  {...field}
                                />
                                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-hover/input:text-primary transition-colors" />
                              </div>
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                              {t('report_wizard.date')}
                            </FormLabel>
                            <FormControl>
                              <div className="relative group/input">
                                <Input
                                  type="date"
                                  className="h-12 pl-10 bg-background/50 border-border/40 rounded-xl focus:ring-primary/20 transition-all [color-scheme:dark]"
                                  {...field}
                                />
                                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-hover/input:text-primary transition-colors" />
                              </div>
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                    </div>

                    {type === 'found' && (
                      <FormField
                        control={form.control}
                        name="custodyLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                              {t('report_wizard.custody')}
                            </FormLabel>
                            <FormControl>
                              <div className="relative group/input">
                                <Input
                                  placeholder={t('report_wizard.custody_placeholder')}
                                  className="h-12 pl-10 bg-background/50 border-border/40 rounded-xl focus:ring-primary/20 transition-all"
                                  {...field}
                                />
                                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-hover/input:text-primary transition-colors" />
                              </div>
                            </FormControl>
                            <FormDescription className="text-[10px] ml-1 opacity-70">
                              {t('report_wizard.custody_hint')}
                            </FormDescription>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Description & ID Section */}
                  <div className="group space-y-5 p-6 rounded-[2rem] bg-background/40 backdrop-blur-xl border border-border/50 shadow-sm transition-all hover:shadow-md hover:bg-background/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                          <Check className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-lg">{t('common.description')}</h3>
                      </div>
                      <OCRScanner
                        image={images[0] || null}
                        onScanComplete={(data) => {
                          if (data.uniqueIdentifier) form.setValue('uniqueIdentifier', data.uniqueIdentifier);
                          if (data.title && !form.getValues('title')) form.setValue('title', data.title);
                        }}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="uniqueIdentifier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                            {t('report_wizard.unique_id')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('report_wizard.unique_id_placeholder')}
                              className="h-12 bg-background/50 border-border/40 rounded-xl focus:ring-primary/20 transition-all"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-[10px] ml-1 opacity-70">
                            {t('report_wizard.unique_id_hint')}
                          </FormDescription>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                            {t('common.description')}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t('report_wizard.description_placeholder')}
                              className="min-h-[120px] bg-background/50 border-border/40 rounded-xl focus:ring-primary/20 transition-all resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />

                    <div className="pt-2">
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-3 block">
                        {t('report_wizard.images')}
                      </FormLabel>
                      <BatchImageUpload onImagesChange={setImages} maxFiles={3} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="grid gap-6">
                  {/* Contact Information Section */}
                  <div className="group space-y-5 p-7 rounded-[2rem] bg-background/40 backdrop-blur-xl border border-border/50 shadow-sm transition-all hover:shadow-md hover:bg-background/50">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
                        <Info className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-xl tracking-tight">{t('report_wizard.contact_info')}</h3>
                        <p className="text-xs text-muted-foreground/80 font-medium">{t('report_wizard.contact_info_desc')}</p>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="contactInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                            {t('report_wizard.contact_details')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('report_wizard.contact_details_placeholder')}
                              className="h-14 bg-background/50 border-border/40 rounded-2xl focus:ring-primary/25 transition-all text-base px-5 shadow-sm"
                              {...field}
                            />
                          </FormControl>
                          <div className="mt-3 p-3 bg-primary/5 rounded-xl border border-primary/10 flex gap-3 text-xs text-primary/80 font-medium">
                            <ShieldCheck className="h-4 w-4 shrink-0" />
                            <span>
                              {type === 'found'
                                ? t('report_wizard.contact_hint_found')
                                : t('report_wizard.contact_hint_lost')}
                            </span>
                          </div>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />

                    {type === 'found' && (
                      <FormField
                        control={form.control}
                        name="challengeQuestion"
                        render={({ field }) => (
                          <FormItem className="p-6 bg-amber-500/5 backdrop-blur-sm border border-amber-500/20 rounded-[1.5rem] mt-6 relative overflow-hidden group/challenge">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover/challenge:opacity-[0.07] transition-opacity">
                              <ShieldCheck className="h-24 w-24 -mr-8 -mt-8" />
                            </div>
                            <FormLabel className="text-amber-800 dark:text-amber-400 font-black flex items-center gap-2 text-base mb-1">
                              <ShieldCheck className="h-5 w-5" />
                              {t('report_wizard.security_title')}
                            </FormLabel>
                            <p className="text-amber-700/80 dark:text-amber-400/70 text-xs mb-4 font-medium leading-relaxed">
                              {t('report_wizard.security_desc')}
                            </p>
                            <FormControl>
                              <Input
                                placeholder={t('report_wizard.security_placeholder')}
                                className="h-12 bg-background/80 border-amber-500/20 rounded-xl focus:ring-amber-500/30 transition-all shadow-inner"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Bounty Section (Lost Only) */}
                  {type === 'lost' && (
                    <div className="group space-y-6 p-7 rounded-[2rem] bg-emerald-500/5 backdrop-blur-xl border border-emerald-500/20 shadow-sm transition-all hover:shadow-md">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-inner">
                          <Banknote className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-black text-xl tracking-tight text-emerald-800 dark:text-emerald-400">{t('report_wizard.bounty_title')}</h3>
                          <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70 font-medium">{t('report_wizard.bounty_desc')}</p>
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="bountyAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-emerald-700 ml-1">
                              {t('report_wizard.reward_amount')}
                            </FormLabel>
                            <FormControl>
                              <div className="relative group/reward">
                                <Input
                                  type="number"
                                  placeholder="e.g. 5000"
                                  className="h-16 pl-6 pr-16 bg-background/80 border-emerald-500/20 rounded-2xl focus:ring-emerald-500/25 transition-all text-xl font-black text-emerald-800 shadow-inner"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-emerald-600/50 group-hover/reward:text-emerald-600 transition-colors">RWF</span>
                              </div>
                            </FormControl>
                            <FormDescription className="text-[10px] ml-1 text-emerald-600/80 font-medium">{t('report_wizard.reward_hint')}</FormDescription>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />

                      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-3">
                        <div className="flex gap-4 items-start">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5">
                            <Info className="h-4 w-4 shrink-0" />
                          </div>
                          <div className="space-y-1.5 flex-1">
                            <p className="text-[11px] text-foreground leading-relaxed">
                              {t('report_wizard.payment_info')}
                              {t('report_wizard.bounty_escrow').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}
                            </p>
                            {form.getValues('bountyAmount') > 0 && (
                              <div className="flex items-center justify-between pt-2 mt-2 border-t border-primary/10">
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('report_wizard.total_payment', { amount: '' }).split('{{')[0].trim()}</span>
                                <span className="text-xl font-black text-primary drop-shadow-sm">
                                  {(1000 + (form.getValues('bountyAmount') || 0)).toLocaleString()} RWF
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex flex-col gap-6 pt-10 mt-4 relative">
            {/* Error Message Tooltip-style */}
            <AnimatePresence>
              {Object.keys(form.formState.errors).length > 0 && step === totalSteps && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="p-5 bg-red-500/5 backdrop-blur-md border border-red-500/20 rounded-2xl text-[11px] text-red-600 space-y-3 shadow-xl shadow-red-500/5"
                >
                  <div className="flex items-center gap-2 font-black uppercase tracking-widest mb-1 text-[10px]">
                    <AlertTriangle className="h-4 w-4" />
                    {t('report_wizard.fix_errors')}
                  </div>
                  <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 list-none pl-0">
                    {Object.entries(form.formState.errors).map(([field, error]: [string, any]) => (
                      <li key={field} className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                        <span><span className="font-black opacity-80">{field.replace(/([A-Z])/g, ' $1')}:</span> {error.message}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between items-center w-full gap-4">
              <Button
                type="button"
                variant="ghost"
                className="h-14 px-8 rounded-2xl font-bold bg-muted/30 hover:bg-muted/50 text-foreground transition-all flex-1 sm:flex-initial"
                onClick={prevStep}
                disabled={step === 1 || isSubmitting}
              >
                <ArrowLeft className="mr-3 h-5 w-5" />
                {t('common.back')}
              </Button>

              {step < totalSteps ? (
                <Button
                  key="next-step-btn"
                  type="button"
                  className="h-14 px-10 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/25 bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all flex-1 sm:flex-initial"
                  onClick={nextStep}
                >
                  {t('report_wizard.next_step')}
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
              ) : (
                <Button
                  key="submit-report-btn"
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className={cn(
                    "h-14 px-12 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex-1 sm:flex-initial",
                    type === 'lost'
                      ? "bg-gradient-to-br from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-red-500/30"
                      : "bg-gradient-to-br from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-500/30"
                  )}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>{t('report_wizard.submitting')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span>{type === 'lost' ? t('report_wizard.pay_submit') : t('report_wizard.submit_report')}</span>
                      {type === 'lost' ? <Receipt className="h-5 w-5" /> : <Check className="h-5 w-5" />}
                    </div>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </Card>
  );
}
