import React, { useRef, useImperativeHandle, forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck } from "lucide-react";
import { format } from "date-fns";

export interface PrintableProduct {
  id: number;
  name: string;
  serialNumber: string;
  kizereId?: string;
  ownerName: string;
  registrationDate: string | Date;
}

interface BulkReceiptPrinterProps {
  products: PrintableProduct[];
}

export interface BulkReceiptPrinterHandle {
  print: () => void;
}

export const BulkReceiptPrinter = forwardRef<BulkReceiptPrinterHandle, BulkReceiptPrinterProps>((props, ref) => {
  const printRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    print: () => {
      if (!printRef.current) return;
      const content = printRef.current.innerHTML;
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      printWindow.document.write(`
        <html>
          <head>
            <title>KIZERE Bulk Receipts</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #fff; }
              .receipt { 
                width: 80mm; 
                margin: 0 auto; 
                padding: 20px; 
                border-bottom: 2px dashed #000; 
                page-break-after: always;
                box-sizing: border-box;
              }
              .header { text-align: center; margin-bottom: 20px; }
              .logo { display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-weight: bold; font-size: 1.4rem; }
              .logo-icon { color: #10b981; font-size: 1.6rem; }
              .subtitle { margin: 5px 0; font-size: 0.8rem; color: #666; }
              .field { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 1rem; border-bottom: 1px dotted #eee; padding-bottom: 4px; }
              .field.border-none { border-bottom: none; }
              .label { color: #666; font-size: 0.9rem; }
              .value { font-weight: 600; text-align: right; }
              .mono { font-family: "Courier New", Courier, monospace; }
              .digital-id { color: #059669; }
              .qr-container { text-align: center; margin-top: 25px; margin-bottom: 15px; }
              .qr-hint { font-size: 0.75rem; color: #888; margin-top: 10px; }
              .footer { text-align: center; margin-top: 20px; font-size: 0.8rem; color: #666; border-top: 1px solid #eee; padding-top: 10px; }
              .cut-line-hint { display: none; }
              .hidden { display: none !important; }
              .trust-id-row { margin-top: 8px; padding-top: 8px; border-top: 1px dotted #eee; border-bottom: none; }
              .trust-id-label { color: #666; font-size: 0.75rem; }
              .trust-id-value { font-family: "Courier New", Courier, monospace; font-size: 0.65rem; color: #888; word-break: break-all; max-width: 55%; text-align: right; font-weight: 600; }
              @media print {
                .receipt { border-bottom: 1px dashed #000; width: 100%; padding: 40px 20px; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${content}
            <script>
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }));

  return (
    <div ref={printRef} className="hidden">
      {props.products.map((product) => (
        <div key={product.id} className="receipt">
          <div className="header">
            <div className="logo">
              {/* Note: In-browser printing might not render Lucide components correctly from innerHTML, 
                  so we use a simplified version or ensured icons are visible */}
              <span className="logo-icon">✓</span>
              <span>KIZERE</span>
            </div>
            <p className="subtitle">Official Ownership Certificate</p>
          </div>
          
          <div className="field">
            <span className="label">Product</span>
            <span className="value">{product.name}</span>
          </div>
          
          <div className="field">
            <span className="label">Serial Number</span>
            <span className="value mono">{product.serialNumber}</span>
          </div>
          
          <div className="field">
            <span className="label">Register Owner</span>
            <span className="value">{product.ownerName}</span>
          </div>
          
          <div className="field">
            <span className="label">Registration Date</span>
            <span className="value">{format(new Date(product.registrationDate), "MMMM d, yyyy")}</span>
          </div>
          
          <div className="field border-none">
            <span className="label">Digital Identity</span>
            <span className="value mono digital-id">
              POS-{String(product.id).padStart(6, "0")}
            </span>
          </div>

          {product.kizereId && (
            <div className="field trust-id-row">
              <span className="trust-id-label">KIZERE Trust ID</span>
              <span className="trust-id-value">{product.kizereId}</span>
            </div>
          )}
          
          <div className="qr-container">
            {/* We render the SVG here; innerHTML will capture it as static image/svg markup */}
            <QRCodeSVG
              value={`https://kizere.rw/verify/${product.serialNumber}`}
              size={150}
              level="M"
              includeMargin={true}
            />
            <p className="qr-hint">
              Scan QR code to verify authenticity and current owner status
            </p>
          </div>
          
          <div className="footer">
            <strong>Verified by KIZERE Platform</strong><br />
            Secure Asset Tracking & Anti-Theft Network<br />
            www.kizere.rw
          </div>
        </div>
      ))}
    </div>
  );
});

BulkReceiptPrinter.displayName = "BulkReceiptPrinter";
