import * as React from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Globe,
    ArrowRight,
    CheckCircle2,
    Mail,
    Phone,
    Paperclip
} from "lucide-react";

export function GlobalNotice() {
    const [location] = useLocation();
    const { t } = useLanguage();
    const [showRecruitmentDialog, setShowRecruitmentDialog] = React.useState(false);
    const [isDismissed, setIsDismissed] = React.useState(false);

    React.useEffect(() => {
        if (typeof window !== "undefined") {
            const dismissed = localStorage.getItem("hide-recruitment") === "true";
            setIsDismissed(dismissed);
        }
    }, []);
    const [recruitmentStep, setRecruitmentStep] = React.useState<'info' | 'form'>('info');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isSuccess, setIsSuccess] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [formData, setFormData] = React.useState({
        name: "",
        email: "",
        phone: "",
        targetLanguage: "Kinyarwanda",
        sampleTranslation: ""
    });
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

    // Hide on auth page and any other pages where it doesn't make sense
    const hiddenRoutes = ["/auth"];
    if (hiddenRoutes.includes(location) || isDismissed) {
        return null;
    }

    const handleRecruitmentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const body = new FormData();
            body.append('name', formData.name);
            body.append('email', formData.email);
            body.append('phone', formData.phone);
            body.append('targetLanguage', formData.targetLanguage);
            body.append('sampleTranslation', formData.sampleTranslation);
            if (selectedFile) {
                body.append('file', selectedFile);
            }
            const res = await fetch("/api/recruitment/apply", {
                method: "POST",
                body
            });
            if (res.ok) {
                setIsSuccess(true);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetRecruitmentDialog = () => {
        setRecruitmentStep('info');
        setIsSuccess(false);
        setFormData({ name: "", email: "", phone: "", targetLanguage: "Kinyarwanda", sampleTranslation: "" });
        setSelectedFile(null);
    };

    return (
        <>
            <div className="bg-primary/10 border-b border-primary/20 py-2.5 px-4 relative z-50">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm text-center">
                    <div className="flex items-center justify-center gap-2">
                        <Globe className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-medium text-foreground">
                            {t('landing.recruitment.notice') || "We are hiring! We're looking for translators to help us expand KIZERE to more languages."}
                        </span>
                    </div>
                    <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-primary hover:text-primary/80 font-bold underline-offset-4 shrink-0"
                        onClick={() => setShowRecruitmentDialog(true)}
                    >
                        {t('landing.recruitment.learnMore') || "Learn More & Apply"} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                </div>
            </div>

            <Dialog open={showRecruitmentDialog} onOpenChange={(open) => {
                setShowRecruitmentDialog(open);
                if (!open) setTimeout(resetRecruitmentDialog, 500);
            }}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Globe className="w-6 h-6 text-primary" />
                            {t('landing.recruitment.dialogTitle') || "Work with KIZERE"}
                        </DialogTitle>
                        <DialogDescription>
                            {t('landing.recruitment.dialogSubtitle') || "Help us make KIZERE accessible to everyone in Rwanda."}
                        </DialogDescription>
                    </DialogHeader>

                    {recruitmentStep === 'info' && (
                        <div className="space-y-4 py-4">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {t('landing.recruitment.description') || "We're looking for passionate individuals to help us translate and localize our platform into Kinyarwanda and Kiswahili. Your work will help thousands of people protect and recover their valuables."}
                            </p>

                            <div className="space-y-2 pt-2">
                                <h4 className="font-medium text-sm text-foreground">{t('landing.recruitment.requirementsTitle') || "What we're looking for:"}</h4>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                        <span>{t('landing.recruitment.req1') || "Native or near-native proficiency in Kinyarwanda or Kiswahili."}</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                        <span>{t('landing.recruitment.req2') || "Strong command of English."}</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                        <span>{t('landing.recruitment.req3') || "Attention to detail and cultural nuances."}</span>
                                    </li>
                                </ul>
                            </div>

                            <Button
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-4"
                                onClick={() => setRecruitmentStep('form')}
                            >
                                <ArrowRight className="w-4 h-4 mr-2" />
                                {t('landing.recruitment.applyNowBtn') || "Apply Now"}
                            </Button>
                        </div>
                    )}

                    {recruitmentStep === 'form' && (
                        <>
                            {isSuccess ? (
                                <div className="bg-green-500/10 p-6 rounded-lg mt-4 border border-green-500/20 text-center">
                                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                                    <h4 className="font-bold text-lg text-foreground mb-2">{t('landing.recruitment.formSuccessTitle') || "Application Sent!"}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {t('landing.recruitment.formSuccessDesc') || "Thank you for applying. We'll review your application and get back to you soon."}
                                    </p>
                                    <Button
                                        className="mt-6 w-full"
                                        onClick={() => {
                                            setShowRecruitmentDialog(false);
                                            setTimeout(resetRecruitmentDialog, 500);
                                        }}
                                    >
                                        Close
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleRecruitmentSubmit} className="space-y-4 py-2">
                                    <h4 className="font-medium text-sm text-primary">{t('landing.recruitment.howToApplyTitle') || "Application Form:"}</h4>

                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <Label htmlFor="recruitment-name">{t('landing.recruitment.formName') || "Full Name"}</Label>
                                            <Input
                                                id="recruitment-name"
                                                required
                                                value={formData.name}
                                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="recruitment-email">{t('landing.recruitment.formEmail') || "Email Address"}</Label>
                                            <Input
                                                id="recruitment-email"
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="recruitment-phone">{t('landing.recruitment.formPhone') || "Telephone Number"}</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input
                                                    id="recruitment-phone"
                                                    type="tel"
                                                    required
                                                    className="pl-9"
                                                    value={formData.phone}
                                                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="recruitment-language">{t('landing.recruitment.formLanguage') || "Target Language"}</Label>
                                            <select
                                                id="recruitment-language"
                                                title={t('landing.recruitment.formLanguage') || "Target Language"}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                value={formData.targetLanguage}
                                                onChange={e => setFormData(prev => ({ ...prev, targetLanguage: e.target.value }))}
                                            >
                                                <option value="Kinyarwanda">{t('landing.recruitment.formLanguageKinyarwanda') || "Kinyarwanda"}</option>
                                                <option value="Kiswahili">{t('landing.recruitment.formLanguageKiswahili') || "Kiswahili"}</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="recruitment-sample">
                                                {t('landing.recruitment.formSample') || "Sample Translation (Translate: 'Welcome to KIZERE. Protect and recover your items.')"}
                                            </Label>
                                            <Textarea
                                                id="recruitment-sample"
                                                required
                                                className="min-h-[80px]"
                                                value={formData.sampleTranslation}
                                                onChange={e => setFormData(prev => ({ ...prev, sampleTranslation: e.target.value }))}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label>{t('landing.recruitment.formFile') || "Attach translation file (PDF/Doc)"}</Label>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".pdf,.doc,.docx"
                                                className="hidden"
                                                aria-label="Upload translation file"
                                                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full justify-start text-muted-foreground font-normal"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <Paperclip className="w-4 h-4 mr-2 shrink-0" />
                                                {selectedFile ? selectedFile.name : (t('landing.recruitment.formFile') || "Attach translation file (PDF/Doc)")}
                                            </Button>
                                        </div>
                                    </div>

                                    <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-2">
                                        <Mail className="w-4 h-4 mr-2" />
                                        {isSubmitting ? (t('landing.recruitment.formSubmitting') || "Submitting...") : (t('landing.recruitment.formSubmit') || "Submit Application")}
                                    </Button>
                                </form>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
