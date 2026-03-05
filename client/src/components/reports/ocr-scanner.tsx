import { useState } from "react";
import { createWorker } from "tesseract.js";

import { Button } from "@/components/ui/button";
import { Loader2, ScanLine, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface OCRScannerProps {
    image: File | null;
    onScanComplete: (data: { uniqueIdentifier: string; title: string }) => void;
}

export function OCRScanner({ image, onScanComplete }: OCRScannerProps) {
    const [isScanning, setIsScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const { t } = useLanguage();
    const { toast } = useToast();

    const handleScan = async () => {
        if (!image) {
            toast({
                title: t("ocr.no_image"),
                description: t("ocr.upload_first"),
                variant: "destructive",
            });
            return;
        }

        setIsScanning(true);
        setProgress(0);

        try {
            const worker = await createWorker('eng', 1, {
                logger: (m: any) => {
                    if (m.status === "recognizing text") {
                        setProgress(Math.round(m.progress * 100));
                    }
                },
            });

            const { data: { text } } = await worker.recognize(image);
            await worker.terminate();

            // Simple extraction logic
            const idPattern = /\b\d{16}\b/; // Rwanda ID
            const imeiPattern = /\b\d{15}\b/; // IMEI
            const serialPattern = /\b[A-Z0-9]{8,12}\b/;

            const idMatch = text.match(idPattern);
            const imeiMatch = text.match(imeiPattern);
            const serialMatch = text.match(serialPattern);

            const uniqueIdentifier = idMatch?.[0] || imeiMatch?.[0] || serialMatch?.[0] || "";

            // Try to extract a title from the first line or common keywords
            const lines = text.split('\n').filter((l: string) => l.trim().length > 5);
            const title = lines[0] ? lines[0].substring(0, 30) : "";

            onScanComplete({ uniqueIdentifier, title });

            toast({
                title: t("ocr.scan_success"),
                description: uniqueIdentifier
                    ? t("ocr.extracted_id", { id: uniqueIdentifier })
                    : t("ocr.no_id_found"),
            });
        } catch (error) {
            console.error("OCR Error:", error);
            toast({
                title: t("ocr.scan_failed"),
                description: t("ocr.extract_error"),
                variant: "destructive",
            });
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleScan}
                disabled={isScanning || !image}
                className="flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/5"
            >
                {isScanning ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("ocr.scanning")} {progress}%
                    </>
                ) : (
                    <>
                        <ScanLine className="h-4 w-4" />
                        {t("ocr.scan_button")}
                    </>
                )}
            </Button>
            {!image && (
                <p className="text-[10px] text-neutral-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {t("ocr.upload_hint")}
                </p>
            )}
        </div>
    );
}
