import React, { useState } from "react";
import Papa from "papaparse";
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
import { Label } from "@/components/ui/label";
import { 
  Download, 
  Upload, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  FileBox, 
  FileSpreadsheet,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface BulkImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkImportModal({ open, onOpenChange }: BulkImportModalProps) {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ success: number; skipped: string[]; errors: string[] } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const downloadTemplate = () => {
    const headers = ["Serial_Number", "Name", "Brand", "Model", "Category", "SKU"];
    const rows = [
      ["SN123456789", "Samsung Galaxy S24 Ultra", "Samsung", "Galaxy S24 Ultra", "Smartphone", "SAM-S24U-256"],
      ["IMEI987654321", "iPhone 15 Pro", "Apple", "iPhone 15 Pro", "Smartphone", "APL-IP15P-128"]
    ];
    const csvContent = headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "kizere_inventory_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const formattedData = results.data.map((row: any) => ({
            serialNumber: String(row.Serial_Number || row.serial_number || row.serialNumber || "").trim(),
            name: (row.Name || row.name || `${row.Brand || ""} ${row.Model || ""}`.trim() || "Unknown Product"),
            brand: row.Brand || row.brand || undefined,
            model: row.Model || row.model || undefined,
            category: row.Category || row.category || "Other",
            sku: row.SKU || row.sku || undefined,
            metadata: {
              importedAt: new Date().toISOString()
            }
          })).filter(item => item.serialNumber && item.serialNumber.length >= 3);

          if (formattedData.length === 0) {
            throw new Error(t("pos.inventory.noValidProducts", "No valid products found. Ensure 'Serial_Number' and 'Name' (or 'Brand'/'Model') columns are filled."));
          }

          const response = await apiRequest("/api/pos/bulk-register", {
            method: "POST",
            data: formattedData
          });

          setResult(response);
          toast({ 
            title: t("pos.inventory.importSuccess"), 
            description: t("pos.inventory.importSuccessDesc", { count: response.success }) 
          });
          
          queryClient.invalidateQueries({ queryKey: ["/api/pos/my-products/search"] });
          queryClient.invalidateQueries({ queryKey: ["/api/pos/my-stats"] });
        } catch (error: any) {
          toast({ 
            title: t("pos.error"), 
            description: error.message, 
            variant: "destructive" 
          });
        } finally {
          setIsUploading(false);
          setFile(null);
        }
      },
      error: (err) => {
        toast({ title: t("pos.inventory.parsingError", "Parsing Error"), description: err.message, variant: "destructive" });
        setIsUploading(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl flex items-center gap-2">
            <FileBox className="h-5 w-5 text-primary" />
            {t("pos.inventory.bulkUpload") || "Bulk Inventory Upload"}
          </DialogTitle>
          <DialogDescription>
            {t("pos.inventory.bulkUploadDesc") || "Add multiple items to your stock using a simple spreadsheet file."}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Template Section */}
          <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
              <Download className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{t("pos.inventory.templateTitle") || "Download Spreadsheet Template"}</p>
              <p className="text-xs text-muted-foreground">{t("pos.inventory.templateDesc") || "Use this format to ensure your data imports correctly."}</p>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="font-semibold shadow-sm">
              {t("pos.inventory.download") || "Download"}
            </Button>
          </div>

          {!result ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <Label htmlFor="file-upload" className="text-sm font-semibold px-1">
                  {t("pos.inventory.selectFile") || "Select CSV File"}
                </Label>
                
                {!file ? (
                  <div className="relative group">
                    <input 
                      id="file-upload" 
                      type="file" 
                      accept=".csv" 
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      title="Select CSV file"
                      placeholder="Select CSV file"
                    />
                    <div className="h-32 rounded-xl border-2 border-dashed border-muted-foreground/20 group-hover:border-primary/40 group-hover:bg-muted/5 transition-all flex flex-col items-center justify-center gap-3">
                      <FileSpreadsheet className="h-8 w-8 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                      <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                        {t("pos.inventory.dragDropCsv", "Click or drag CSV file here")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-muted-foreground/10 animate-in fade-in zoom-in-95">
                    <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center shadow-sm">
                      <FileSpreadsheet className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={clearFile} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <DialogFooter className="sm:justify-start">
                <Button 
                  onClick={handleUpload} 
                  disabled={!file || isUploading}
                  className="w-full h-11 text-base font-semibold gap-2 shadow-lg shadow-primary/20"
                >
                  {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                  {isUploading ? t("pos.inventory.uploading") || "Processing..." : t("pos.inventory.startImport") || "Confirm & Start Import"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-green-50 border border-green-100 text-center shadow-sm">
                  <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 mb-1">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-black text-green-700">{result.success}</p>
                  <p className="text-[10px] font-bold text-green-600/80 uppercase tracking-wider">{t("pos.inventory.importSuccessful")}</p>
                </div>
                <div className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-amber-50 border border-amber-100 text-center shadow-sm">
                  <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 mb-1">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-black text-amber-700">{result.skipped.length}</p>
                  <p className="text-[10px] font-bold text-amber-600/80 uppercase tracking-wider">{t("pos.inventory.importDuplicates")}</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="p-4 rounded-xl bg-red-50/50 border border-red-100 max-h-[120px] overflow-y-auto">
                  <p className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {t("pos.inventory.validationErrors")} ({result.errors.length})
                  </p>
                  <ul className="text-[11px] text-red-600/90 leading-relaxed font-medium">
                    {result.errors.map((err, i) => (
                      <li key={i} className="flex gap-2 mb-1">
                        <span className="text-red-300">•</span>
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button variant="outline" className="w-full h-11 font-semibold" onClick={() => setResult(null)}>
                {t("pos.inventory.uploadMore") || "Upload Another File"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
