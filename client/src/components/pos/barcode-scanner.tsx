import React from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Camera } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (error: any) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function BarcodeScanner({ onScan, onError, onClose, isOpen }: BarcodeScannerProps) {
  const { t } = useLanguage();
  const scannerRef = React.useRef<Html5QrcodeScanner | null>(null);

  React.useEffect(() => {
    if (!isOpen) {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
      return;
    }

    // Initialize scanner
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      showTorchButtonIfSupported: true,
      rememberLastUsedCamera: true,
    };

    scannerRef.current = new Html5QrcodeScanner(
      "pos-barcode-scanner-reader",
      config,
      false
    );

    const handleScanSuccess = (decodedText: string) => {
      onScan(decodedText);
    };

    const handleScanError = (errorMessage: string) => {
      if (onError) onError(errorMessage);
    };

    scannerRef.current.render(handleScanSuccess, handleScanError);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [isOpen, onScan, onError]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-slate-900 border-slate-700">
        <DialogHeader className="p-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <DialogTitle className="text-white">{t("pos.scanBarcode", "Scan Barcode")}</DialogTitle>
          </div>
          <DialogDescription className="text-slate-400 text-xs">
            {t("pos.scanInstruction", "Position the barcode or QR code inside the frame to scan.")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 bg-black">
          <div id="pos-barcode-scanner-reader" className="w-full rounded-xl overflow-hidden bg-black [&>img]:hidden [&>video]:object-cover [&>video]:w-full [&>video]:rounded-xl border-none"></div>
        </div>
        
        <div className="p-4 bg-slate-800/50 text-center text-sm text-slate-400">
          {t("pos.scanReady", "Listening for serial/IMEI barcodes...")}
        </div>
      </DialogContent>
    </Dialog>
  );
}
