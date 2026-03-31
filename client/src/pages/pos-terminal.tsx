import * as React from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Package,
  QrCode,
  Search,
  ShieldCheck,
  User,
  Loader2,
  Copy,
  Download,
  Smartphone,
  Store,
  Printer,
  LayoutDashboard,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

// ═══════════════════════════════════════════════
//  Types
// ═══════════════════════════════════════════════
interface CustomerData {
  id: number;
  fullName: string;
  username: string;
  phone?: string;
  email?: string;
  nationalId?: string;
}

interface RegisteredProduct {
  id: number;
  serialNumber: string;
  name: string;
  category: string;
  registrationDate: string;
}

type Step = "customer" | "product" | "confirm" | "receipt";

// ═══════════════════════════════════════════════
//  Component
// ═══════════════════════════════════════════════
export default function PosTerminal() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = React.useState<Step>("customer");
  const [loading, setLoading] = React.useState(false);

  // Customer
  const [nationalId, setNationalId] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [customer, setCustomer] = React.useState<CustomerData | null>(null);
  const [isNewCustomer, setIsNewCustomer] = React.useState(false);

  // Product
  const [serialNumber, setSerialNumber] = React.useState("");
  const [productName, setProductName] = React.useState("");
  const [category, setCategory] = React.useState("Electronics");
  const [sku, setSku] = React.useState("");

  // Result
  const [registeredProduct, setRegisteredProduct] = React.useState<RegisteredProduct | null>(null);
  const [verifyUrl, setVerifyUrl] = React.useState<string>("");
  const receiptRef = React.useRef<HTMLDivElement>(null);

  const categories = [
    "Electronics", "Phones", "Computers", "Documents", "Jewelry",
    "Accessories", "Clothing", "Bags", "Keys", "Wallets", "Transportation", "Other",
  ];

  // ─── Step 1: Customer Lookup / Create ───
  const handleCustomerLookup = async () => {
    if (!nationalId || nationalId.length < 6) {
      toast({ title: t("pos.error", "Error"), description: t("pos.nidRequired", "National ID is required (min 6 characters)"), variant: "destructive" });
      return;
    }
    if (!fullName || fullName.length < 2) {
      toast({ title: t("pos.error", "Error"), description: t("pos.nameRequired", "Full name is required"), variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest<any>("/api/pos/check-or-create", {
        method: "POST",
        data: { nationalId, fullName, phone: phone || undefined, email: email || undefined },
      });

      if (res.success) {
        setCustomer(res.customer);
        setIsNewCustomer(res.isNew);
        setStep("product");
        toast({
          title: res.isNew ? t("pos.newAccountCreated", "New Account Created") : t("pos.customerFound", "Customer Found"),
          description: res.isNew
            ? t("pos.newAccountDesc", "A KIZERE account was created for {{name}}", { name: res.customer.fullName })
            : t("pos.customerFoundDesc", "Welcome back, {{name}}", { name: res.customer.fullName }),
        });
      }
    } catch (err: any) {
      toast({ title: t("pos.error", "Error"), description: err.message || "Failed to lookup customer", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2 → 3: Move to confirmation ───
  const handleProductConfirm = () => {
    if (!serialNumber || serialNumber.length < 3) {
      toast({ title: t("pos.error", "Error"), description: t("pos.serialRequired", "Serial number is required (min 3 characters)"), variant: "destructive" });
      return;
    }
    if (!productName || productName.length < 2) {
      toast({ title: t("pos.error", "Error"), description: t("pos.productNameRequired", "Product name is required"), variant: "destructive" });
      return;
    }
    setStep("confirm");
  };

  // ─── Step 3: Register Product ───
  const handleRegister = async () => {
    if (!customer) return;

    setLoading(true);
    try {
      const res = await apiRequest<any>("/api/pos/register", {
        method: "POST",
        data: {
          serialNumber,
          name: productName,
          category,
          sku: sku || undefined,
          ownerId: customer.id,
        },
      });

      if (res.success) {
        setRegisteredProduct(res.product);
        setStep("receipt");
        toast({ title: t("pos.registrationSuccess", "Product Registered!"), description: t("pos.registrationSuccessDesc", "Product has been registered to the customer") });

        // Set verification URL for QR code
        const productId = `KZR-${String(res.product.id).padStart(6, "0")}`;
        setVerifyUrl(`${window.location.origin}/verify/${productId}`);
      }
    } catch (err: any) {
      toast({ title: t("pos.error", "Error"), description: err.message || "Registration failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ─── Print receipt ───
  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>KIZERE Receipt</title>
        <style>
          body { font-family: monospace; max-width: 300px; margin: 0 auto; padding: 16px; }
          .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 12px; margin-bottom: 12px; }
          .header h1 { margin: 0; font-size: 18px; }
          .row { display: flex; justify-content: space-between; font-size: 12px; margin: 6px 0; }
          .label { color: #666; }
          .value { font-weight: bold; }
          .qr { text-align: center; margin: 16px 0; }
          .qr img { width: 128px; height: 128px; }
          .footer { text-align: center; border-top: 2px dashed #ccc; padding-top: 12px; margin-top: 12px; font-size: 10px; color: #999; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>KIZERE POS</h1>
          <p style="margin:4px 0 0;font-size:11px;color:#666;">Product Registration Receipt</p>
        </div>
        ${printContent.innerHTML}
        ${verifyUrl ? `<div class="qr"><img src="https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(verifyUrl)}" alt="Verify QR" /></div><p style="text-align:center;font-size:10px;color:#999;">Scan to verify ownership</p>` : ""}
        <div class="footer">Verified by KIZERE &bull; kizere.com<br/>${new Date().toLocaleString()}</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
  };

  // ─── Reset flow ───
  const resetFlow = () => {
    setStep("customer");
    setNationalId("");
    setFullName("");
    setPhone("");
    setEmail("");
    setCustomer(null);
    setIsNewCustomer(false);
    setSerialNumber("");
    setProductName("");
    setCategory("Electronics");
    setSku("");
    setRegisteredProduct(null);
    setVerifyUrl("");
  };

  // ─── Step indicator ───
  const steps: { key: Step; icon: React.ReactNode; label: string }[] = [
    { key: "customer", icon: <User className="w-5 h-5" />, label: t("pos.stepCustomer", "Customer") },
    { key: "product", icon: <Package className="w-5 h-5" />, label: t("pos.stepProduct", "Product") },
    { key: "confirm", icon: <ShieldCheck className="w-5 h-5" />, label: t("pos.stepConfirm", "Confirm") },
    { key: "receipt", icon: <QrCode className="w-5 h-5" />, label: t("pos.stepReceipt", "Receipt") },
  ];

  const stepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">{t("pos.title", "KIZERE POS")}</h1>
              <p className="text-xs text-slate-400">{t("pos.subtitle", "Retailer Terminal")}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-sm font-medium">
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            </Link>
            <div className="text-right text-xs text-slate-400">
              <div className="font-medium text-white">{user?.fullName}</div>
              <div>{new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Step Progress */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <React.Fragment key={s.key}>
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
                    i < stepIndex
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                      : i === stepIndex
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400/50 ring-offset-2 ring-offset-slate-900"
                      : "bg-slate-700/50 text-slate-500"
                  }`}
                >
                  {i < stepIndex ? <CheckCircle2 className="w-5 h-5" /> : s.icon}
                </div>
                <span className={`text-xs font-medium ${i <= stepIndex ? "text-emerald-400" : "text-slate-500"}`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-500 ${i < stepIndex ? "bg-emerald-500" : "bg-slate-700/50"}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-2xl">
          {/* ─── STEP: Customer ─── */}
          {step === "customer" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-xl font-bold mb-1">{t("pos.customerLookup", "Customer Identification")}</h2>
                <p className="text-sm text-slate-400">{t("pos.customerLookupDesc", "Enter the customer's National ID to find or create their KIZERE account.")}</p>
              </div>

              <div className="space-y-4">
                {/* National ID */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    {t("pos.nationalId", "National ID")} <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      placeholder={t("pos.nationalIdPlaceholder", "e.g. 1199880012345678")}
                      className="w-full bg-slate-700/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-lg tracking-wider font-mono"
                      autoFocus
                    />
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    {t("pos.fullName", "Full Name")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t("pos.fullNamePlaceholder", "Customer full name")}
                    className="w-full bg-slate-700/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  />
                </div>

                {/* Phone & Email row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">{t("pos.phone", "Phone")}</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+250 7XX XXX XXX"
                      className="w-full bg-slate-700/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">{t("pos.email", "Email")}</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full bg-slate-700/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleCustomerLookup}
                disabled={loading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-lg transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {t("pos.lookupCustomer", "Find / Create Customer")}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* ─── STEP: Product ─── */}
          {step === "product" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-xl font-bold mb-1">{t("pos.productInfo", "Product Information")}</h2>
                <p className="text-sm text-slate-400">
                  {t("pos.productInfoDesc", "Enter the product details to register to {{name}}.", { name: customer?.fullName || "" })}
                </p>
              </div>

              {/* Customer badge */}
              {customer && (
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-medium text-emerald-300">{customer.fullName}</div>
                    <div className="text-xs text-slate-400">
                      {isNewCustomer && <span className="text-amber-400 mr-2">● {t("pos.newAccount", "New Account")}</span>}
                      ID: {customer.nationalId || customer.username}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* Serial Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    {t("pos.serialNumber", "Serial Number / IMEI")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder={t("pos.serialPlaceholder", "e.g. SN-GHXK29803MVXA")}
                    className="w-full bg-slate-700/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-mono tracking-wider text-lg"
                    autoFocus
                  />
                </div>

                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    {t("pos.productName", "Product Name")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder={t("pos.productNamePlaceholder", "e.g. Samsung Galaxy S24 Ultra")}
                    className="w-full bg-slate-700/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  />
                </div>

                {/* Category & SKU */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">{t("pos.category", "Category")}</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      aria-label={t("pos.category", "Category")}
                      className="w-full bg-slate-700/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all appearance-none"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat} className="bg-slate-800">{t(`categories.${cat}`, cat)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">{t("pos.sku", "SKU (Optional)")}</label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder={t("pos.skuPlaceholder", "Store SKU code")}
                      className="w-full bg-slate-700/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("customer")}
                  className="px-6 py-4 rounded-xl border border-white/10 bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 font-medium transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t("common.back", "Back")}
                </button>
                <button
                  onClick={handleProductConfirm}
                  className="flex-1 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-lg transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  {t("pos.reviewRegistration", "Review Registration")}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP: Confirm ─── */}
          {step === "confirm" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-xl font-bold mb-1">{t("pos.confirmTitle", "Confirm Registration")}</h2>
                <p className="text-sm text-slate-400">{t("pos.confirmDesc", "Review the details below before registering this product.")}</p>
              </div>

              {/* Summary card */}
              <div className="space-y-4">
                <div className="bg-slate-700/30 border border-white/5 rounded-xl p-5">
                  <h3 className="text-sm uppercase tracking-wider text-slate-400 mb-3">{t("pos.customerDetails", "Customer")}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t("pos.fullName", "Full Name")}</span>
                      <span className="font-medium">{customer?.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t("pos.nationalId", "National ID")}</span>
                      <span className="font-mono text-sm">{nationalId}</span>
                    </div>
                    {customer?.phone && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">{t("pos.phone", "Phone")}</span>
                        <span>{customer.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-700/30 border border-white/5 rounded-xl p-5">
                  <h3 className="text-sm uppercase tracking-wider text-slate-400 mb-3">{t("pos.productDetails", "Product")}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t("pos.productName", "Product Name")}</span>
                      <span className="font-medium">{productName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t("pos.serialNumber", "Serial Number")}</span>
                      <span className="font-mono text-sm">{serialNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t("pos.category", "Category")}</span>
                      <span>{t(`categories.${category}`, category)}</span>
                    </div>
                    {sku && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">{t("pos.sku", "SKU")}</span>
                        <span className="font-mono text-sm">{sku}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("product")}
                  className="px-6 py-4 rounded-xl border border-white/10 bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 font-medium transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t("common.back", "Back")}
                </button>
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="flex-1 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-lg transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      {t("pos.registerNow", "Register Product")}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP: Receipt ─── */}
          {step === "receipt" && registeredProduct && (
            <div className="space-y-6 animate-in fade-in duration-300 text-center">
              {/* Success animation */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30 animate-in zoom-in duration-500">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold">{t("pos.receiptTitle", "Registration Complete!")}</h2>
                <p className="text-sm text-slate-400 max-w-md">
                  {t("pos.receiptDesc", "The product has been registered and the ownership record created. Share the receipt with the customer.")}
                </p>
              </div>

              {/* Digital receipt card */}
              <div className="mx-auto max-w-sm bg-white text-slate-900 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-lg">KIZERE</span>
                </div>

                <div className="border-t border-dashed border-slate-200 pt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t("pos.productName", "Product")}</span>
                    <span className="font-semibold">{registeredProduct.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t("pos.serialNumber", "Serial")}</span>
                    <span className="font-mono text-xs">{registeredProduct.serialNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t("pos.owner", "Owner")}</span>
                    <span className="font-semibold">{customer?.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t("pos.registeredAt", "Date")}</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t("pos.productId", "Product ID")}</span>
                    <span className="font-mono font-bold text-emerald-600">KZR-{String(registeredProduct.id).padStart(6, "0")}</span>
                  </div>
                </div>

                {/* QR Code */}
                <div className="mt-4 pt-4 border-t border-dashed border-slate-200 flex flex-col items-center">
                  {verifyUrl ? (
                    <QRCodeSVG value={verifyUrl} size={128} level="M" className="rounded-xl" />
                  ) : (
                    <div className="w-32 h-32 bg-slate-100 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-300">
                      <QrCode className="w-16 h-16 text-slate-400" />
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-2">{t("pos.scanToVerify", "Scan to verify ownership")}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-dashed border-slate-200 text-center">
                  <p className="text-xs text-slate-400">{t("pos.receiptFooter", "Verified by KIZERE • kizere.com")}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
                <button
                  onClick={handlePrint}
                  className="flex-1 py-3 rounded-xl border border-white/10 bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  {t("pos.printReceipt", "Print")}
                </button>
                <button
                  onClick={() => {
                    const receiptText = `KIZERE Receipt\nProduct: ${registeredProduct.name}\nSerial: ${registeredProduct.serialNumber}\nOwner: ${customer?.fullName}\nID: KZR-${String(registeredProduct.id).padStart(6, "0")}\nDate: ${new Date().toLocaleDateString()}`;
                    navigator.clipboard.writeText(receiptText);
                    toast({ title: t("pos.copied", "Copied!"), description: t("pos.copiedDesc", "Receipt copied to clipboard") });
                  }}
                  className="flex-1 py-3 rounded-xl border border-white/10 bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {t("pos.copyReceipt", "Copy")}
                </button>
                <button
                  onClick={resetFlow}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  {t("pos.registerAnother", "Register Another")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
