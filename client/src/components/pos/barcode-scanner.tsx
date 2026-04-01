import * as React from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { X, Camera } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white">{t("pos.scanBarcode", "Scan Barcode")}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 bg-black">
          <div id="pos-barcode-scanner-reader" className="w-full rounded-xl overflow-hidden bg-black [&>img]:hidden [&>video]:object-cover [&>video]:w-full [&>video]:rounded-xl border-none"></div>
        </div>
        
        <div className="p-4 bg-slate-800/50 text-center text-sm text-slate-400">
          {t("pos.scanInstruction", "Position the barcode or QR code inside the frame to scan.")}
        </div>
      </div>
    </div>
  );
}
