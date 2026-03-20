import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Report } from "@shared/schema";
import { format } from "date-fns";
import { MapPin, Calendar, Tag as TagIcon, ShieldCheck, Mail, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShareWhatsAppButton } from "@/components/ui/share-whatsapp-button";
import { useState } from "react";
import { ClaimForm } from "./claim-form";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface ReportDetailDialogProps {
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReportDetailDialog({ report, isOpen, onClose }: ReportDetailDialogProps) {
  const { t } = useTranslation();
  const [showClaimForm, setShowClaimForm] = useState(false);
  const { user } = useAuth(); // Call useAuth unconditionally

  if (!report) return null;

  const isOwner = user?.id === report.userId;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        setShowClaimForm(false);
      }
    }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex gap-2">
                <Badge variant={report.type === 'lost' ? 'destructive' : 'secondary'}>
                  {report.type === 'lost' ? t('common.lost') : t('common.found')}
                </Badge>
                <Badge variant="outline">{report.status}</Badge>
              </div>
              <DialogTitle className="text-2xl">{report.title}</DialogTitle>
              <DialogDescription>
                {t('report_detail.reported_on', { date: format(new Date(report.reportedAt), 'PPP') })}
              </DialogDescription>
            </div>
            {report.receiptNumber && (
              <div className="text-right flex flex-col items-end">
                <p className="text-[10px] text-neutral-400 uppercase font-bold">{t('report_detail.receipt')}</p>
                <p className="text-sm font-mono font-bold text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-zinc-900/50 px-2 py-1 rounded border dark:border-white/10">{report.receiptNumber}</p>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
          <div className="space-y-6">
            {report.imageUrls && report.imageUrls.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {report.imageUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={report.title}
                    className="rounded-lg object-cover h-40 w-full border"
                    width={400}
                    height={200}
                    loading="lazy"
                    decoding="async"
                  />
                ))}
              </div>
            ) : (
              <div className="bg-neutral-50 dark:bg-zinc-900/50 border-2 border-dashed border-neutral-200 dark:border-white/10 rounded-xl h-40 flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500">
                <TagIcon className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-xs">{t('report_detail.no_images')}</p>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2 text-neutral-800 dark:text-white">
                <Info className="h-4 w-4 text-primary" />
                {t('report_detail.description')}
              </h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">{report.description}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4 bg-neutral-50 dark:bg-zinc-900/50 p-5 rounded-xl border border-neutral-100 dark:border-white/10">
              <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-300">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span>{report.location}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-300">
                <Calendar className="h-4 w-4 text-primary shrink-0" />
                <span>{format(new Date(report.date), 'PPP')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-300">
                <TagIcon className="h-4 w-4 text-primary shrink-0" />
                <span>{report.category}</span>
              </div>
            </div>

            {report.type === 'lost' && (
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2 text-neutral-800 dark:text-white">
                  <Mail className="h-4 w-4 text-primary" />
                  {t('report_wizard.contact_info')}
                </h4>
                <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-500/20">
                  {report.contactInfo}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {!isOwner && report.type === 'found' && !showClaimForm && (
                <Button
                  onClick={() => setShowClaimForm(true)}
                  className="w-full bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold h-12 shadow-lg"
                >
                  <ShieldCheck className="mr-2 h-5 w-5" />
                  {t('report_detail.is_my_item')}
                </Button>
              )}

              <ShareWhatsAppButton
                itemName={report.title}
                itemUrl={`${window.location.origin}/report/${report.id}`}
                className="w-full"
              />
            </div>

            {showClaimForm && (
              <div className="border-t pt-6 animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-lg">{t('report_detail.file_claim')}</h4>
                  <Button variant="ghost" size="sm" onClick={() => setShowClaimForm(false)}>{t('common.back')}</Button>
                </div>
                <ClaimForm reportId={report.id} onSuccess={onClose} />
              </div>
            )}

            {isOwner && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <p className="text-xs text-primary font-medium text-center">{t('report_detail.is_your_report')}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
