import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import ReactGA from "react-ga4";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
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
import { Loader2, AlertTriangle, MapPin, Calendar, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Item, lostItemReportSchema } from "@shared/schema";

interface ReportRegisteredItemDialogProps {
    item: Item;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// We'll use a subset of the lost item schema, since some fields come from the item itself
// Localized report schema
const getReportSchema = (t: any) => z.object({
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: t("reports.registeredItemDialog.dateRequired"),
    }),
    location: z.string().min(2, t("reports.registeredItemDialog.locationRequired")),
    description: z.string().min(10, t("reports.registeredItemDialog.descMin")),
    contactInfo: z.string().optional(),
});

type ReportFormValues = z.infer<ReturnType<typeof getReportSchema>>;

interface ReportResponse {
    id: number;
    receiptNumber?: string;
    [key: string]: any;
}

export function ReportRegisteredItemDialog({ item, open, onOpenChange }: ReportRegisteredItemDialogProps) {
    const { t } = useLanguage(); // Project-standard language hook
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [success, setSuccess] = useState(false);
    const [receiptNumber, setReceiptNumber] = useState<string | null>(null);

    const form = useForm<ReportFormValues>({
        resolver: zodResolver(getReportSchema(t)),
        defaultValues: {
            date: new Date().toISOString().split("T")[0],
            location: "",
            description: t("reports.registeredItemDialog.defaultDesc", { itemName: item.name, id: item.uniqueIdentifier }),
            contactInfo: "",
        },
    });

    const mutation = useMutation({
        mutationFn: async (data: ReportFormValues) => {
            // Construct the full report payload
            const payload = {
                type: "lost",
                title: t("reports.registeredItemDialog.lostTitle", { itemName: item.name }),
                category: item.category,
                itemId: item.id, // Link to the registered item
                uniqueIdentifier: item.uniqueIdentifier,
                description: data.description,
                location: data.location,
                date: new Date(data.date).toISOString(),
                contactInfo: data.contactInfo,
                status: "Open",
                imageUrls: item.imageUrls || [], // Use item's existing images
            };

            return await apiRequest<ReportResponse>("/api/reports", { method: "POST", data: payload });
        },
        onSuccess: (data) => {
            setSuccess(true);
            if (data?.receiptNumber) {
                setReceiptNumber(data.receiptNumber);
            }

            // Track successful report submission
            ReactGA.event("report_submitted", {
                category: item.category,
                type: "lost",
                item_id: item.id
            });

            // Optimistic UI update: update item status in cache immediately
            queryClient.setQueryData<Item[]>(["/api/items"], (oldItems) => {
                if (!oldItems) return oldItems;
                return oldItems.map((i) =>
                    i.id === item.id ? { ...i, status: 'Lost' as const } : i
                );
            });

            // Also invalidate to ensure fresh data
            queryClient.invalidateQueries({ queryKey: ["/api/items"] });
            queryClient.invalidateQueries({ queryKey: ["/api/reports"] });

            toast({
                title: t("reports.registeredItemDialog.toastTitle"),
                description: t("reports.registeredItemDialog.toastDescription"),
            });

            // Close dialog after a brief delay to show success state
            setTimeout(() => {
                onOpenChange(false);
                setSuccess(false);
                setReceiptNumber(null);
                form.reset();
            }, 3000);
        },
        onError: (error: Error) => {
            toast({
                title: t("reports.registeredItemDialog.errorTitle"),
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const onSubmit = (data: ReportFormValues) => {
        mutation.mutate(data);
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            // Reset state when closing
            if (success) {
                setSuccess(false);
                setReceiptNumber(null);
                form.reset();
            }
        }
        onOpenChange(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                {success ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                        <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-emerald-500/20 flex items-center justify-center text-green-600 dark:text-emerald-400 mb-2">
                            <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <DialogTitle className="text-2xl font-bold text-green-700">
                            {t("reports.registeredItemDialog.successTitle")}
                        </DialogTitle>
                        <DialogDescription>
                            {t("reports.registeredItemDialog.successDescription", { itemName: item.name })}
                        </DialogDescription>
                        {receiptNumber && (
                            <div className="bg-muted/50 px-4 py-2 rounded-lg border">
                                <span className="text-xs text-muted-foreground">
                                    {t("reports.registeredItemDialog.receiptNumber")}
                                </span>
                                <p className="font-mono font-bold text-primary">{receiptNumber}</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>{t("reports.registeredItemDialog.title")}</DialogTitle>
                            <DialogDescription>
                                <span dangerouslySetInnerHTML={{
                                    __html: t("reports.registeredItemDialog.description", { itemName: item.name })
                                }} />
                                {' '}
                                <span className="text-green-600 font-medium">
                                    {t("reports.registeredItemDialog.freeForRegistered")}
                                </span>
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex items-center p-3 bg-muted/50 rounded-lg mb-4">
                            {item.imageUrls && item.imageUrls.length > 0 ? (
                                <img
                                    src={item.imageUrls[0]}
                                    alt={item.name}
                                    className="h-12 w-12 rounded object-cover mr-3"
                                    width={48}
                                    height={48}
                                    loading="lazy"
                                    decoding="async"
                                />
                            ) : (
                                <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center mr-3 text-primary font-bold text-xs">
                                    {t("reports.registeredItemDialog.noImage")}
                                </div>
                            )}
                            <div>
                                <p className="font-semibold text-sm">{item.name}</p>
                                <p className="text-xs font-mono text-muted-foreground">{item.uniqueIdentifier}</p>
                            </div>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("reports.registeredItemDialog.dateLost")}</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input type="date" aria-label={t("reports.registeredItemDialog.dateLost")} {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="location"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("reports.registeredItemDialog.location")}</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            placeholder={t("reports.registeredItemDialog.locationPlaceholder")}
                                                            aria-label={t("reports.registeredItemDialog.location")}
                                                            {...field}
                                                        />
                                                        <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    </div>
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
                                            <FormLabel>{t("reports.registeredItemDialog.additionalDetails")}</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder={t("reports.registeredItemDialog.additionalDetailsPlaceholder")}
                                                    className="resize-none"
                                                    aria-label={t("reports.registeredItemDialog.additionalDetails")}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="contactInfo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("reports.registeredItemDialog.contactInfo")}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder={t("reports.registeredItemDialog.contactInfoPlaceholder")}
                                                    aria-label={t("reports.registeredItemDialog.contactInfo")}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                {t("reports.registeredItemDialog.contactInfoHint")}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="bg-yellow-50 dark:bg-yellow-500/10 p-3 rounded-md flex gap-2 text-xs text-yellow-800 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-500/20">
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    <p dangerouslySetInnerHTML={{ __html: t("reports.registeredItemDialog.warning") }} />
                                </div>

                                <DialogFooter className="gap-2 sm:gap-0">
                                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                        {t("reports.registeredItemDialog.cancel")}
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="destructive"
                                        disabled={mutation.isPending}
                                    >
                                        {mutation.isPending ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                {t("reports.registeredItemDialog.submitting")}
                                            </>
                                        ) : (
                                            t("reports.registeredItemDialog.confirmReport")
                                        )}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
