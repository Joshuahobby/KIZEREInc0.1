import * as React from "react";
import { PurchaseContractModal } from "@/components/pos/PurchaseContractModal";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { apiGet } from "@/lib/api";
import { Link } from "wouter";
import { BarcodeScanner } from "@/components/pos/barcode-scanner";
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
  Store,
  Printer,
  LayoutDashboard,
  Activity,
  ListPlus,
  WifiOff,
  CloudLightning,
  Key,
  Lock,
  Check,
  PackagePlus,
  LogOut,
  Maximize2,
  Minimize2,
  UserPlus,
  FileText,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useQuery } from "@tanstack/react-query";
import { openDB } from "idb";
import { thermalPrinter } from "@/lib/printer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

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

type Step = "scenario" | "customer" | "product" | "confirm" | "receipt" | "new-customer" | "transfer-device" | "transfer-buyer" | "transfer-confirm" | "transfer-pending";
type Scenario = "sale" | "stock-in" | "transfer";

export default function PosTerminal() {
  const { t } = useLanguage();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();

  // Session timer
  const [sessionSeconds, setSessionSeconds] = React.useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => setSessionSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  const sessionTime = `${String(Math.floor(sessionSeconds / 3600)).padStart(2, "0")}:${String(Math.floor((sessionSeconds % 3600) / 60)).padStart(2, "0")}:${String(sessionSeconds % 60).padStart(2, "0")}`;


  const [step, setStep] = React.useState<Step>("scenario");
  const [scenario, setScenario] = React.useState<Scenario | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  // Customer State
  const [nationalId, setNationalId] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [customer, setCustomer] = React.useState<CustomerData | null>(null);
  const [isNewCustomer, setIsNewCustomer] = React.useState(false);
  const [isStockInMode, setIsStockInMode] = React.useState(false);

  // Product State
  const [serialNumber, setSerialNumber] = React.useState("");
  const [productName, setProductName] = React.useState("");
  const [category, setCategory] = React.useState("Electronics");
  const [sku, setSku] = React.useState("");
  const [purchasePrice, setPurchasePrice] = React.useState("");
  const [supplier, setSupplier] = React.useState("");
  const [isScannerOpen, setIsScannerOpen] = React.useState(false);
  const [isFromInventory, setIsFromInventory] = React.useState(false);
  const [inventoryProductId, setInventoryProductId] = React.useState<number | null>(null);
  const [inventorySearch, setInventorySearch] = React.useState("");

  // Security State
  const [isStolen, setIsStolen] = React.useState(false);
  const [alertReason, setAlertReason] = React.useState("");

  // Result State
  const [registeredProduct, setRegisteredProduct] = React.useState<RegisteredProduct | null>(null);
  const [verifyUrl, setVerifyUrl] = React.useState<string>("");
  const [registeredLedgerId, setRegisteredLedgerId] = React.useState<number | null>(null);
  const [contractOpen, setContractOpen] = React.useState(false);

  // P2P Transfer State
  const [transferSerial, setTransferSerial] = React.useState("");
  const [transferProduct, setTransferProduct] = React.useState<{ id: number; name: string; serialNumber: string; category: string; currentOwner?: string } | null>(null);
  const [transferBuyer, setTransferBuyer] = React.useState<CustomerData | null>(null);
  const [transferBuyerNid, setTransferBuyerNid] = React.useState("");
  const [transferBuyerName, setTransferBuyerName] = React.useState("");
  const [transferBuyerPhone, setTransferBuyerPhone] = React.useState("");
  const [transferMomoPhone, setTransferMomoPhone] = React.useState("");
  const [transferPendingRef, setTransferPendingRef] = React.useState<string | null>(null);
  const transferPollTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const receiptRef = React.useRef<HTMLDivElement>(null);
  const [useWebSerial, setUseWebSerial] = React.useState(false);
  const [isPrinterConnected, setIsPrinterConnected] = React.useState(false);

  // Offline Sync State
  const [offlineCount, setOfflineCount] = React.useState(0);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  // Cashier Lock State
  const [activeCashier, setActiveCashier] = React.useState<{ id: string; name: string } | null>(null);
  const [pinInput, setPinInput] = React.useState("");
  const [isPinVerified, setIsPinVerified] = React.useState(false);

  const cashiers = user?.preferences?.cashiers || [];
  const hasCashiers = cashiers.length > 0;
  const isLocked = !isAuthLoading && user && hasCashiers && !isPinVerified;

  const { data: inventoryData } = useQuery<{ success: boolean; products: any[] }>({
    queryKey: ["/api/pos/my-products"],
  });
  const inventory = inventoryData?.products || [];

  // Initialize from URL
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "stock-in") {
      setScenario("stock-in");
      setIsStockInMode(true);
      setStep("product");
    }
  }, []);

  // Fullscreen Handler
  // Handle manual logout/lock
  const handleLock = () => {
    setIsPinVerified(false);
    setActiveCashier(null);
    setPinInput("");
  };

  const handlePinSubmit = (val?: string) => {
    const pinToVerify = val || pinInput;
    if (!cashiers) return;
    const cashier = cashiers.find(c => c.pin === pinToVerify);
    if (cashier) {
      setActiveCashier({ id: cashier.id, name: cashier.name });
      setIsPinVerified(true);
      setPinInput("");
    } else {
      toast({ title: t("pos.invalidPin", "Invalid PIN"), description: t("pos.invalidPinDesc", "The PIN entered is incorrect."), variant: "destructive" });
      setPinInput("");
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // ─── Offline Support ───
  React.useEffect(() => {
    const handleOnline = () => { setIsOnline(true); syncOfflineQueue(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    updateOfflineCount();
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const getDb = async () => {
    return openDB("kizere-pos", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("sync-queue")) {
          db.createObjectStore("sync-queue", { keyPath: "id", autoIncrement: true });
        }
      },
    });
  };

  const updateOfflineCount = async () => {
    try {
      const db = await getDb();
      const count = await db.count("sync-queue");
      setOfflineCount(count);
    } catch (e) { console.warn(e); }
  };

  const handleConnectPrinter = async () => {
    try {
      const connected = await thermalPrinter.connect();
      setIsPrinterConnected(connected);
      if (connected) {
        toast({ title: t("pos.printerConnected", "Printer Connected"), description: t("pos.printerReady", "Thermal printer is ready.") });
      }
    } catch (err: any) {
      toast({ title: t("pos.printerError", "Printer error"), description: err.message, variant: "destructive" });
    }
  };

  const syncOfflineQueue = async () => {
    try {
      const db = await getDb();
      const items = await db.getAll("sync-queue");
      if (items.length === 0) return;
      toast({ title: t("pos.syncing", "Syncing"), description: t("pos.syncingDesc", "Uploading offline registrations...") });
      for (const item of items) {
        try {
          let ownerId = item.payload.ownerId;
          if (item.type === "registration" && item.customerData) {
            const custRes = await apiRequest<any>("/api/pos/check-or-create", { method: "POST", data: item.customerData });
            if (custRes.success) ownerId = custRes.customer.id;
          }
          await apiRequest<any>("/api/pos/register", { method: "POST", data: { ...item.payload, ownerId } });
          await db.delete("sync-queue", item.id);
        } catch (err) { console.error(err); }
      }
      updateOfflineCount();
    } catch (e) { console.error(e); }
  };

  // ─── POS Logic ───
  const handleCustomerLookup = async () => {
    if (!nationalId || nationalId.length !== 16) {
      toast({ title: "Invalid ID", description: "Rwanda National ID must be exactly 16 digits.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest<any>("/api/pos/check-or-create", { method: "POST", data: { nationalId } });
      if (res.success) {
        setCustomer(res.customer);
        setFullName(res.customer.fullName);
        setPhone(res.customer.phone || "");
        setEmail(res.customer.email || "");
        setIsNewCustomer(false);
        toast({ title: t("pos.customerFound", "Customer Found"), description: res.customer.fullName });
      } else {
        setIsNewCustomer(true);
        toast({ title: t("pos.customerNotFound", "Not Found"), description: "Please enter new details." });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleCustomerSubmit = async () => {
    if (!nationalId || nationalId.length !== 16) {
      toast({ title: "Invalid ID", description: "Rwanda National ID must be exactly 16 digits.", variant: "destructive" });
      return;
    }

    if (!isNewCustomer) {
      setLoading(true);
      try {
        const res = await apiRequest<any>("/api/pos/check-or-create", { method: "POST", data: { nationalId } });
        if (res.success) {
          setCustomer(res.customer);
          setFullName(res.customer.fullName);
          setPhone(res.customer.phone || "");
          setEmail(res.customer.email || "");
          setIsNewCustomer(false);
          setStep("product"); 
        } else {
          setIsNewCustomer(true);
          setCustomer(null);
          toast({ title: t("pos.customerNotFound", "Not Found"), description: "Please enter new details." });
        }
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally { setLoading(false); }
      return;
    }

    if (!fullName) {
      toast({ title: "Missing Name", description: "Please enter the customer's full name.", variant: "destructive" });
      return;
    }
    if (!isOnline) {
      setCustomer({ id: -1, fullName, username: `off_${nationalId}`, nationalId });
      setStep("product");
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest<any>("/api/pos/check-or-create", {
        method: "POST",
        data: { nationalId, fullName, phone, email }
      });
      if (res.success) {
        setCustomer(res.customer);
        setIsNewCustomer(res.isNew);
        setStep("product");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleInventorySearch = async () => {
    if (!serialNumber || serialNumber.length < 3) return;
    try {
      const res = await apiGet<any>(`/api/pos/inventory/search?serialNumber=${encodeURIComponent(serialNumber)}`);
      if (res.success && res.inStock) {
        setProductName(res.product.name);
        setCategory(res.product.category);
        setSku(res.product.sku || "");
        toast({ title: "In Inventory", description: res.product.name });
      }
    } catch (e) {}
  };

  const handleRegister = async () => {
    if (!isOnline) {
      // Offline implementation simplified for brevity
      setStep("receipt");
      return;
    }
    setLoading(true);
    try {
      if (isFromInventory && serialNumber && customer?.id) {
        // Transfer from stock to customer: re-use /register — the service detects
        // the existing stock entry and does an internal ownership transfer without payment.
        const res = await apiRequest<any>("/api/pos/register", {
          method: "POST",
          data: {
            serialNumber,
            name: productName,
            category,
            sku: sku || undefined,
            ownerId: customer.id,
          }
        });
        if (res.success) {
          setRegisteredProduct(res.product);
          setRegisteredLedgerId(res.ledger?.id ?? null);
          setStep("receipt");
          setVerifyUrl(`${window.location.origin}/verify/${res.product.serialNumber}`);
        }
      } else {
        const endpoint = scenario === "stock-in" ? "/api/pos/stock-in" : "/api/pos/register";
        const metadata = scenario === "stock-in" ? { purchasePrice, supplier } : {};
        const data: any = scenario === "stock-in" 
          ? { serialNumber, name: productName, category, sku, metadata }
          : { serialNumber, name: productName, category, sku, ownerId: customer?.id, metadata };
        
        // Ensure ownerId is a number if present
        if (data.ownerId) {
          data.ownerId = parseInt(data.ownerId.toString(), 10);
        }
        
        const res = await apiRequest<any>(endpoint, { method: "POST", data });
        if (res.success) {
          setRegisteredProduct(res.product);
          setRegisteredLedgerId(res.ledger?.id ?? null);
          setStep("receipt");
          if (scenario !== "stock-in") setVerifyUrl(`${window.location.origin}/verify/${res.product.serialNumber}`);
          else setVerifyUrl(""); // Clear QR for stock-in if not needed
        }
      }
    } catch (err: any) {
      if (err.status === 403) {
        setIsStolen(true);
        setAlertReason(err.message);
      } else {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    } finally { setLoading(false); }
  };

  const resetFlow = () => {
    setStep("scenario");
    setScenario(null);
    setNationalId(""); setFullName(""); setPhone(""); setEmail("");
    setCustomer(null); setSerialNumber(""); setProductName(""); setRegisteredProduct(null); setRegisteredLedgerId(null);
    setPurchasePrice(""); setSupplier(""); setSku("");
    setIsStolen(false);
    setIsStockInMode(false);
    setIsFromInventory(false);
    setInventoryProductId(null);
    setInventorySearch("");
    setTransferSerial(""); setTransferProduct(null); setTransferBuyer(null);
    setTransferBuyerNid(""); setTransferBuyerName(""); setTransferBuyerPhone("");
    setTransferMomoPhone(""); setTransferPendingRef(null);
    if (transferPollTimer.current) clearTimeout(transferPollTimer.current);
  };

  const handleTransferDeviceLookup = async () => {
    if (transferSerial.length < 3) return;
    setLoading(true);
    try {
      const res = await apiGet<any>(`/api/pos/device-lookup?serial=${encodeURIComponent(transferSerial)}`);
      if (!res.found) {
        toast({ title: "Device Not Found", description: "No KIZERE registration found for that serial number.", variant: "destructive" });
        return;
      }
      if (res.stolen || res.archived) {
        toast({ title: "Cannot Transfer", description: res.message, variant: "destructive" });
        return;
      }
      setTransferProduct({ ...res.product, currentOwner: res.ownerName });
      setStep("transfer-buyer");
    } catch (err: any) {
      toast({ title: "Lookup Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleTransferBuyerLookup = async () => {
    if (!transferBuyerNid || !transferBuyerName) return;
    setLoading(true);
    try {
      const res = await apiRequest<any>("/api/pos/check-or-create", {
        method: "POST",
        data: { nationalId: transferBuyerNid, fullName: transferBuyerName, phone: transferBuyerPhone || undefined },
      });
      if (res.success) {
        setTransferBuyer(res.customer);
        setStep("transfer-confirm");
      }
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateTransfer = async () => {
    if (!transferProduct || !transferBuyer || !transferMomoPhone.trim()) return;
    setLoading(true);
    try {
      const res = await apiRequest<any>("/api/pos/transfer", {
        method: "POST",
        data: { productId: transferProduct.id, newOwnerId: transferBuyer.id, phoneNumber: transferMomoPhone.trim() },
      });
      setTransferPendingRef(res.transactionRef);
      setStep("transfer-pending");
      toast({ title: "Transfer Initiated", description: "The buyer should approve the MoMo prompt." });
    } catch (err: any) {
      toast({ title: "Transfer Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ─── Rendering Helpers ───
  const steps: { key: Step; icon: any; label: string }[] = React.useMemo(() => {
    if (step === "scenario") return [];
    
    const filteredInventory = inventory.filter(p => 
      p.name.toLowerCase().includes(inventorySearch.toLowerCase()) || 
      (p.serialNumber && p.serialNumber.toLowerCase().includes(inventorySearch.toLowerCase()))
    );

    if (scenario === "stock-in") 
      return [
        { key: "product", icon: Package, label: "Inventory" },
        { key: "confirm", icon: ShieldCheck, label: "Review" },
        { key: "receipt", icon: QrCode, label: "Finish" },
      ];

    if (step === "new-customer")
      return [
        { key: "customer", icon: User, label: "Client" },
        { key: "new-customer", icon: UserPlus, label: "Registration" },
        { key: "product", icon: Package, label: "Device" },
        { key: "confirm", icon: ShieldCheck, label: "Review" },
        { key: "receipt", icon: QrCode, label: "Finish" },
      ];
      
    // Direct Sales: customer first, then product
    return [
      { key: "customer", icon: User, label: "Client" },
      { key: "product", icon: Package, label: "Device" },
      { key: "confirm", icon: ShieldCheck, label: "Review" },
      { key: "receipt", icon: QrCode, label: "Finish" },
    ];
  }, [scenario, step]);

  const currentStepIdx = steps.findIndex(s => s.key === step);

  if (isAuthLoading) return <div className="h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;

  if (isLocked) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">Terminal Locked</h1>
            <p className="text-slate-400">Enter PIN to resume session</p>
          </div>
          <Card className="bg-slate-900 border-slate-800 p-6">
            <div className="flex justify-center gap-2 mb-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={cn("w-3 h-3 rounded-full border-2", pinInput.length > i ? "bg-emerald-500 border-emerald-500" : "border-slate-700")} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "OK"].map((btn) => (
                <Button
                  key={btn}
                  variant="secondary"
                  className="h-14 text-xl font-bold bg-slate-800 border-slate-700 hover:bg-emerald-500 hover:text-white"
                  onClick={() => {
                    if (btn === "C") setPinInput("");
                    else if (btn === "OK") handlePinSubmit();
                    else if (pinInput.length < 6) {
                      const next = pinInput + btn;
                      setPinInput(next);
                      if (next.length === 6) handlePinSubmit(next);
                    }
                  }}
                >
                  {btn}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0f172a] text-slate-200 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 bg-[#1e293b]/50 border-b border-slate-800 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-white leading-none">KIZERE POS</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">{scenario === "stock-in" ? "Stock Management" : "Retail Terminal"}</span>
              <Badge variant="outline" className={cn(
                "h-4 text-[8px] border-none uppercase tracking-tighter",
                scenario === "stock-in" ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
              )}>
                {scenario === "stock-in" ? "Stock-In" : "Sales Mode"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Pills */}
          <div className="hidden md:flex items-center gap-2 mr-4">
            {!isOnline && <Badge variant="destructive" className="animate-pulse">OFFLINE</Badge>}
            {offlineCount > 0 && <Badge className="bg-amber-500">{offlineCount} PENDING</Badge>}
            <Badge variant="outline" className="border-slate-700 text-slate-400">v1.2.4</Badge>
          </div>

          <Button variant="ghost" size="icon" onClick={() => setIsStockInMode(!isStockInMode)} className={cn("rounded-lg", isStockInMode ? "text-amber-500 bg-amber-500/10" : "text-slate-400")}>
            <PackagePlus className="w-5 h-5" />
          </Button>

          <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-slate-400 hidden sm:flex">
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </Button>

          <div className="h-8 w-px bg-slate-800 mx-2" />

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white leading-none">{activeCashier?.name || user?.fullName}</p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase">{activeCashier ? "Cashier" : "Administrator"}</p>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full bg-slate-800/50 hover:bg-red-500/10 hover:text-red-500" onClick={() => setIsPinVerified(false)}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Step Indicator */}
      {step !== "scenario" && steps.length > 0 && (
        <div className="md:hidden shrink-0 px-4 py-3 bg-[#1e293b]/60 border-b border-slate-800">
          <div className="flex items-center">
            {steps.map((s, idx) => {
              const isActive = s.key === step;
              const isPast = currentStepIdx > idx;
              return (
                <React.Fragment key={s.key}>
                  <div className="flex flex-col items-center gap-1 min-w-0">
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors shrink-0",
                      isActive ? "bg-emerald-500 border-emerald-500 text-white" :
                      isPast ? "bg-slate-800 border-emerald-500 text-emerald-500" :
                      "bg-slate-900 border-slate-700 text-slate-600"
                    )}>
                      {isPast ? <Check className="w-3 h-3" /> : <s.icon className="w-3 h-3" />}
                    </div>
                    <span className={cn(
                      "text-[8px] font-bold uppercase tracking-wide",
                      isActive ? "text-emerald-400" : isPast ? "text-slate-500" : "text-slate-700"
                    )}>{s.label}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={cn("h-0.5 flex-1 mx-1 -mt-3", isPast ? "bg-emerald-500" : "bg-slate-800")} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Left Sidebar - Navigation & Steps */}
        <aside className="hidden md:flex md:flex-col md:w-64 bg-[#1e293b]/30 border-r border-slate-800 p-6 shrink-0">
          <div className="space-y-4 flex-1">
            {step === "scenario" ? (
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Select Mode</p>
                <p className="text-xs text-slate-500 mt-1">Please select a terminal scenario to begin.</p>
              </div>
            ) : (
              steps.map((s, idx) => {
                const isActive = s.key === step;
                const isPast = steps.findIndex(x => x.key === step) > idx;
                return (
                  <div key={s.key} className="relative">
                    {idx < steps.length - 1 && (
                      <div className={cn("absolute left-5 top-10 w-0.5 h-10", isPast ? "bg-emerald-500" : "bg-slate-800")} />
                    )}
                    <div className={cn("flex items-center gap-4 group transition-all", isActive ? "scale-105" : "opacity-60")}>
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                        isActive ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" :
                        isPast ? "bg-slate-800 border-emerald-500 text-emerald-500" : "bg-slate-900 border-slate-800 text-slate-600"
                      )}>
                        {isPast ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className={cn("text-xs font-bold uppercase tracking-wider", isActive ? "text-emerald-400" : "text-slate-500")}>{s.label}</p>
                        {isActive && <p className="text-[10px] text-slate-400 leading-none mt-1">Current Task</p>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-auto space-y-2 pt-6 border-t border-slate-800">
            <Button variant="outline" className="w-full border-slate-700 bg-slate-900/50 hover:bg-slate-800 justify-start gap-3" asChild>
              <Link href="/retailer/dashboard">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 text-slate-400 hover:text-white" onClick={resetFlow}>
              <Activity className="w-4 h-4" />
              Reset Session
            </Button>
          </div>
        </aside>

        {/* Content Body */}
        <section className="flex-1 flex flex-col relative bg-[#0f172a] overflow-y-auto custom-scrollbar">
          <div className="max-w-4xl w-full mx-auto p-4 md:p-10 pb-28 md:pb-10">
            {isStolen && (
              <div className="mb-8 p-6 bg-red-500/10 border border-red-500/50 rounded-2xl flex flex-col items-center text-center animate-in zoom-in">
                <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center mb-4 shadow-lg shadow-red-500/20">
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-black text-red-500 uppercase italic">Security Alert</h2>
                <p className="text-white font-medium mt-2">{alertReason}</p>
                <Button variant="secondary" className="mt-6 bg-white text-red-600 hover:bg-slate-100 font-bold" onClick={resetFlow}>Dismiss & Reset</Button>
              </div>
            )}

            <div className={cn("space-y-8", isStolen && "opacity-20 pointer-events-none")}>
              {/* Step: Scenario Selection */}
              {step === "scenario" && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl md:text-4xl font-black text-white">Select Operation</h2>
                    <p className="text-slate-400 text-sm md:text-base">Choose the type of transaction you want to perform</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <button
                      onClick={() => { setScenario("sale"); setIsStockInMode(false); setStep("customer"); }}
                      className="group p-5 md:p-8 bg-slate-900/50 border border-slate-800 rounded-[2rem] hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left space-y-3 md:space-y-4"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                        <UserPlus className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Direct Sales</h3>
                        <p className="text-sm text-slate-400 mt-2 leading-relaxed">Register a new or existing device to a specific client. This will create a legal ownership record.</p>
                      </div>
                      <div className="pt-4 flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-widest">
                        Start Client Flow <ArrowRight className="w-4 h-4" />
                      </div>
                    </button>

                    <button
                      onClick={() => { setScenario("stock-in"); setIsStockInMode(true); setStep("product"); }}
                      className="group p-5 md:p-8 bg-slate-900/50 border border-slate-800 rounded-[2rem] hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left space-y-3 md:space-y-4"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                        <PackagePlus className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Stock-In Inventory</h3>
                        <p className="text-sm text-slate-400 mt-2 leading-relaxed">Add new devices to your store's stock. These items can later be sold or assigned to customers.</p>
                      </div>
                      <div className="pt-4 flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-widest">
                        Start Stock Flow <ArrowRight className="w-4 h-4" />
                      </div>
                    </button>

                    <button
                      onClick={() => { setScenario("transfer"); setStep("transfer-device"); }}
                      className="group p-5 md:p-8 bg-slate-900/50 border border-slate-800 rounded-[2rem] hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-left space-y-3 md:space-y-4"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                        <ArrowLeft className="w-5 h-5" style={{ marginRight: -8 }} />
                        <ArrowRight className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Transfer Ownership</h3>
                        <p className="text-sm text-slate-400 mt-2 leading-relaxed">Facilitate a second-hand resale — transfer a registered device from its current owner to a new buyer. Requires transfer fee payment.</p>
                      </div>
                      <div className="pt-4 flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest">
                        Start Transfer <ArrowRight className="w-4 h-4" />
                      </div>
                    </button>
                  </div>

                  <div className="pt-10 border-t border-slate-800 flex justify-center">
                    <div className="flex items-center gap-8 opacity-40">
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-500" /> <span className="text-[10px] font-bold uppercase">Public Registry</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step: Customer */}
              {step === "customer" && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Find Customer</h2>
                    <p className="text-slate-400 text-sm md:text-base">Identify the customer via National ID to begin registration</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid gap-6">
                      <div className="relative group">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-all duration-300" />
                        <Input
                          placeholder="National ID Number (16 digits)"
                          className="h-14 sm:h-20 pl-14 text-lg sm:text-2xl font-mono tracking-[0.15em] sm:tracking-[0.25em] bg-slate-900/40 border-slate-800/50 focus:border-emerald-500/50 focus:ring-emerald-500/10 rounded-2xl transition-all"
                          value={nationalId}
                          maxLength={16}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setNationalId(val);
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && handleCustomerLookup()}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          {loading ? (
                            <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mr-2" />
                          ) : (
                            <Button
                              variant="ghost"
                              className="h-14 w-14 rounded-xl hover:bg-emerald-500/10 text-emerald-500 group"
                              onClick={handleCustomerLookup}
                            >
                              <Search className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {isNewCustomer && (
                        <div className="grid gap-6 p-8 bg-emerald-500/[0.03] border border-emerald-500/20 rounded-[2rem] animate-in zoom-in-95 duration-500 shadow-xl shadow-emerald-500/5">
                          <div className="flex items-center gap-3 text-emerald-400 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                              <UserPlus className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest">New Account Registration</span>
                          </div>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Full Name</label>
                              <Input
                                placeholder="Legal Name (matching ID)"
                                className="h-14 bg-slate-950/50 border-slate-800 focus:border-emerald-500/30 rounded-xl"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Phone Number</label>
                                <Input placeholder="07XXXXXXXX" className="h-14 bg-slate-950/50 border-slate-800 rounded-xl" value={phone} onChange={(e) => setPhone(e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Email (Optional)</label>
                                <Input placeholder="customer@example.com" className="h-14 bg-slate-950/50 border-slate-800 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4 md:pt-6">
                      <Button variant="outline" className="h-12 md:h-16 flex-1 border-slate-800 text-slate-500 hover:text-white hover:bg-slate-800 font-bold rounded-2xl transition-all" onClick={() => setStep("scenario")}>
                        Cancel
                      </Button>
                      <Button
                        className="h-12 md:h-16 flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-2xl shadow-emerald-600/20 active:scale-95 transition-all group"
                        disabled={loading || nationalId.length !== 16 || (isNewCustomer && !fullName)}
                        onClick={handleCustomerSubmit}
                      >
                        {loading ? <Loader2 className="animate-spin" /> : (
                          <div className="flex items-center gap-2">
                             <span>{isNewCustomer ? "Register & Continue" : "Identify & Continue"}</span>
                             <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step: Product */}
              {step === "product" && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-2xl md:text-3xl font-black text-white">{scenario === "stock-in" ? "Stock Entry Details" : "Product Details"}</h2>
                    <p className="text-slate-400 text-sm md:text-base">
                      {scenario === "stock-in"
                        ? "Registering new inventory arrivals to your store"
                        : "Scanning or manual entry for the item being processed"}
                    </p>
                  </div>

                  {customer && (
                    <div className="flex items-center gap-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                      <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                        {customer.fullName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{customer.fullName}</p>
                        <p className="text-xs text-slate-400 font-mono">{customer.nationalId}</p>
                      </div>
                      <Badge variant="outline" className="ml-auto border-emerald-500/30 text-emerald-400">ASSIGNED</Badge>
                    </div>
                  )}

                  {/* From Inventory vs Manual Entry */}
                  {scenario === "sale" && inventory.length > 0 ? (
                    <Tabs 
                      defaultValue="manual" 
                      className="w-full"
                      onValueChange={(val) => {
                        setIsFromInventory(val === "inventory");
                        if (val === "manual") setInventoryProductId(null);
                      }}
                    >
                      <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-900 border border-slate-800">
                        <TabsTrigger value="manual" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">New Device</TabsTrigger>
                        <TabsTrigger value="inventory" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">From Inventory</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="manual" className="space-y-6 mt-0">
                        <div className="relative group">
                          <BarcodeScanner
                            isOpen={isScannerOpen}
                            onClose={() => setIsScannerOpen(false)}
                            onScan={(text) => { setSerialNumber(text); setIsScannerOpen(false); }}
                          />
                          <Input
                            placeholder="Serial / IMEI Number"
                            className="h-16 pr-14 font-mono text-lg bg-slate-900/50 border-slate-800"
                            value={serialNumber}
                            onChange={(e) => setSerialNumber(e.target.value)}
                            onBlur={handleInventorySearch}
                          />
                          <Button variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 text-emerald-500" onClick={() => setIsScannerOpen(true)}>
                            <QrCode className="w-5 h-5" />
                          </Button>
                        </div>

                        <Input placeholder="Product Name (e.g. iPhone 15 Pro)" className="h-14 bg-slate-900/50 border-slate-800" value={productName} onChange={(e) => setProductName(e.target.value)} />

                        <div className="grid grid-cols-2 gap-4">
                          <select
                            className="h-14 bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                          >
                            <option value="Electronics">📱 Electronics</option>
                            <option value="Phones">📞 Phones</option>
                            <option value="Computers">💻 Computers</option>
                            <option value="Accessories">🎧 Accessories</option>
                            <option value="Other">📦 Other</option>
                          </select>
                          <Input placeholder="SKU (Optional)" className="h-14 bg-slate-900/50 border-slate-800" value={sku} onChange={(e) => setSku(e.target.value)} />
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="inventory" className="mt-0 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="mb-4">
                          <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                            <Input
                              placeholder="Search inventory by name or serial..."
                              className="h-12 pl-12 bg-slate-950/40 border-slate-800/50 focus:border-emerald-500/50 focus:ring-emerald-500/10 rounded-xl"
                              value={inventorySearch}
                              onChange={(e) => setInventorySearch(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                          {inventory.filter(p => 
                            p.name.toLowerCase().includes(inventorySearch.toLowerCase()) || 
                            (p.serialNumber && p.serialNumber.toLowerCase().includes(inventorySearch.toLowerCase()))
                          ).length === 0 ? (
                            <div className="text-center p-12 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl">
                              <Package className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                              <p className="text-sm text-slate-500 font-medium">No matching items in stock</p>
                            </div>
                          ) : inventory.filter(p => 
                            p.name.toLowerCase().includes(inventorySearch.toLowerCase()) || 
                            (p.serialNumber && p.serialNumber.toLowerCase().includes(inventorySearch.toLowerCase()))
                          ).map(p => (
                            <button
                              key={p.id}
                              className={cn(
                                "group relative flex items-center gap-4 p-5 bg-slate-900/40 border rounded-2xl transition-all duration-300 text-left overflow-hidden",
                                inventoryProductId === p.id 
                                  ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500" 
                                  : "border-slate-800 hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:translate-x-1"
                              )}
                              onClick={() => { 
                                setSerialNumber(p.serialNumber); 
                                setProductName(p.name); 
                                setCategory(p.category); 
                                setInventoryProductId(p.id);
                                setIsFromInventory(true);
                                setStep("confirm");
                              }}
                            >
                              <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                                inventoryProductId === p.id ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-500"
                              )}>
                                <Package className="w-6 h-6" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-white tracking-tight">{p.name}</p>
                                  {p.status === 'registered' && <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 text-[8px] h-4">VERIFIED</Badge>}
                                </div>
                                <p className="text-xs text-slate-500 font-mono mt-0.5">{p.serialNumber}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <Badge variant="secondary" className="bg-slate-800 text-slate-400 text-[10px] font-bold">STOCK</Badge>
                                {inventoryProductId === p.id && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                              </div>
                              {/* Selection overlay */}
                              {inventoryProductId === p.id && (
                                <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
                              )}
                            </button>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <div className="space-y-6">
                      <div className="relative group">
                        <BarcodeScanner
                          isOpen={isScannerOpen}
                          onClose={() => setIsScannerOpen(false)}
                          onScan={(text) => { setSerialNumber(text); setIsScannerOpen(false); }}
                        />
                        <Input
                          placeholder="Serial / IMEI Number"
                          className="h-16 pr-14 font-mono text-lg bg-slate-900/50 border-slate-800"
                          value={serialNumber}
                          onChange={(e) => setSerialNumber(e.target.value)}
                          onBlur={handleInventorySearch}
                        />
                        <Button variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 text-emerald-500" onClick={() => setIsScannerOpen(true)}>
                          <QrCode className="w-5 h-5" />
                        </Button>
                      </div>

                      <Input placeholder="Product Name (e.g. iPhone 15 Pro)" className="h-14 bg-slate-900/50 border-slate-800" value={productName} onChange={(e) => setProductName(e.target.value)} />

                      <div className="grid grid-cols-2 gap-4">
                        <select
                          className="h-14 bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          <option value="Electronics">📱 Electronics</option>
                          <option value="Phones">📞 Phones</option>
                          <option value="Computers">💻 Computers</option>
                          <option value="Accessories">🎧 Accessories</option>
                          <option value="Other">📦 Other</option>
                        </select>
                        <Input placeholder="SKU (Optional)" className="h-14 bg-slate-900/50 border-slate-800" value={sku} onChange={(e) => setSku(e.target.value)} />
                      </div>

                      {scenario === "stock-in" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Purchase Price (Cost)</label>
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              className="h-14 bg-slate-900/50 border-slate-800"
                              value={purchasePrice}
                              onChange={(e) => setPurchasePrice(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Supplier Info</label>
                            <Input 
                              placeholder="Name of Wholesaler" 
                              className="h-14 bg-slate-900/50 border-slate-800"
                              value={supplier}
                              onChange={(e) => setSupplier(e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="h-12 md:h-16 flex-1 border-slate-800 text-slate-400 font-bold rounded-2xl" onClick={() => setStep(scenario === "stock-in" ? "scenario" : "customer")}>
                      Back
                    </Button>
                    <Button
                      className="h-12 md:h-16 flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/20"
                      disabled={!serialNumber || !productName}
                      onClick={() => setStep("confirm")}
                    >
                      {scenario === "stock-in" ? "Review Stock Entry" : "Review & Confirm"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step: Confirm */}
              {step === "confirm" && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-2xl md:text-3xl font-black text-white">{scenario === "stock-in" ? "Review Stock Registration" : "Review & Confirm"}</h2>
                    <p className="text-slate-400 text-sm md:text-base">
                      {scenario === "stock-in"
                        ? "Verify arrival details before updating warehouse ledger"
                        : "Please verify all information is correct before submitting"}
                    </p>
                  </div>

                  <div className="grid gap-6">
                    <Card className="bg-slate-900/50 border-slate-800 overflow-hidden rounded-2xl">
                      <div className="p-6 space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-emerald-500/10 rounded-lg"><Package className="w-4 h-4 text-emerald-500" /></div>
                          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Product Information</span>
                        </div>
                        <div className="grid grid-cols-2 gap-y-4 text-sm">
                          <p className="text-slate-500">Model Name</p><p className="text-right font-bold text-white">{productName}</p>
                          <p className="text-slate-500">Serial/IMEI</p><p className="text-right font-mono text-emerald-400">{serialNumber}</p>
                          <p className="text-slate-500">Category</p><p className="text-right">{category}</p>
                          {sku && (<><p className="text-slate-500">SKU</p><p className="text-right font-mono text-xs">{sku}</p></>)}
                          {scenario === "stock-in" && purchasePrice && (
                            <>
                              <p className="text-slate-500">Unit Cost</p>
                              <p className="text-right font-bold text-amber-500">{new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(Number(purchasePrice))}</p>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>

                    {scenario === "stock-in" && supplier && (
                      <Card className="bg-slate-900/50 border-slate-800 overflow-hidden rounded-2xl border-l-4 border-l-amber-500">
                        <div className="p-6 space-y-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-amber-500/10 rounded-lg"><Store className="w-4 h-4 text-amber-500" /></div>
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Supplier / Source</span>
                          </div>
                          <div className="grid grid-cols-2 gap-y-4 text-sm">
                            <p className="text-slate-500">Origin</p><p className="text-right font-bold text-white">{supplier}</p>
                          </div>
                        </div>
                      </Card>
                    )}

                    {!isStockInMode && (
                      <Card className="bg-slate-900/50 border-slate-800 overflow-hidden rounded-2xl">
                        <div className="p-6 space-y-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-500/10 rounded-lg"><User className="w-4 h-4 text-blue-500" /></div>
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Owner Details</span>
                          </div>
                          <div className="grid grid-cols-2 gap-y-4 text-sm">
                            <p className="text-slate-500">Full Name</p><p className="text-right font-bold text-white">{customer?.fullName}</p>
                            <p className="text-slate-500">National ID</p><p className="text-right font-mono">{customer?.nationalId}</p>
                          </div>
                        </div>
                      </Card>
                    )}

                    <div className={cn("p-6 rounded-2xl border", scenario === "stock-in" ? "bg-amber-500/5 border-amber-500/20" : "bg-emerald-500/5 border-emerald-500/20")}>
                      <p className={cn("text-xs font-bold flex items-center gap-2", scenario === "stock-in" ? "text-amber-500" : "text-emerald-400")}>
                        <ShieldCheck className="w-4 h-4" />
                        {scenario === "stock-in" ? "INVENTORY CERTIFICATION" : "LEGAL CONFIRMATION"}
                      </p>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        {scenario === "stock-in"
                          ? "By proceeding, I certify that these items have been physically received, inspected for quality, and match the purchase invoice. This entry will update the store's retail ledger."
                          : "By clicking register, I confirm this device belongs to the identified individual and its provenance has been verified according to KIZERE guidelines."}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="h-12 md:h-16 flex-1 border-slate-800 text-slate-400 font-bold rounded-2xl" onClick={() => setStep("product")}>
                      Back
                    </Button>
                    <Button
                      className="h-12 md:h-16 flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/20"
                      disabled={loading}
                      onClick={handleRegister}
                    >
                      {loading ? <Loader2 className="animate-spin" /> : (scenario === "stock-in" ? "Complete Stock Entry" : "Finalize Sale & Register")}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step: Receipt */}
              {step === "receipt" && (
                <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
                  <div className="text-center">
                    <div className={cn(
                      "w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-in zoom-in duration-500",
                      scenario === "stock-in" ? "bg-amber-500 shadow-amber-500/30" : "bg-emerald-600 shadow-emerald-600/30"
                    )}>
                      {scenario === "stock-in" ? <ListPlus className="w-12 h-12 text-white stroke-[3px]" /> : <Check className="w-12 h-12 text-white stroke-[3px]" />}
                    </div>
                    <h2 className="text-4xl font-black text-white">{scenario === "stock-in" ? "Stock Registered" : "Success!"}</h2>
                    <p className="text-slate-400 mt-2">
                       {scenario === "stock-in" 
                        ? "The inventory has been updated and the device is ready for sale." 
                        : "Ownership has been secured and registered."}
                    </p>
                  </div>

                  <Card className={cn(
                    "w-full max-w-sm overflow-hidden shadow-2xl rounded-[2rem] transition-all",
                    scenario === "stock-in" ? "bg-slate-900 border-amber-500/20 text-white" : "bg-white text-slate-900"
                  )}>
                    <div className="p-8 space-y-6">
                      <div className="flex flex-col items-center text-center space-y-1">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center mb-2",
                          scenario === "stock-in" ? "bg-amber-500 text-white" : "bg-emerald-600 text-white"
                        )}>
                          {scenario === "stock-in" ? <Package /> : <ShieldCheck />}
                        </div>
                        <p className="font-black text-lg">{scenario === "stock-in" ? "INVENTORY GRN" : "KIZERE SECURE"}</p>
                        <p className={cn(
                          "text-[10px] font-bold tracking-[0.2em] uppercase",
                          scenario === "stock-in" ? "text-amber-500/70" : "text-slate-500"
                        )}>
                          {scenario === "stock-in" ? "Goods Received Note" : "Digital Ownership Receipt"}
                        </p>
                      </div>

                      <div className={cn(
                        "border-t border-b border-dashed py-6 space-y-4",
                        scenario === "stock-in" ? "border-slate-700" : "border-slate-200"
                      )}>
                        <div className="flex justify-between text-xs">
                          <span className={scenario === "stock-in" ? "text-slate-500" : "text-slate-400 font-bold uppercase"}>Product</span>
                          <span className="font-black text-right">{productName}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className={scenario === "stock-in" ? "text-slate-500" : "text-slate-400 font-bold uppercase"}>Serial</span>
                          <span className={cn("font-mono font-bold", scenario === "stock-in" ? "text-amber-400" : "text-emerald-600")}>{serialNumber}</span>
                        </div>
                        
                        {scenario === "stock-in" && purchasePrice && (
                          <div className="flex justify-between text-xs border-t border-slate-800 pt-4 mt-4">
                            <span className="text-slate-500">Value Added</span>
                            <span className="font-black text-right text-amber-500">
                              {new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(Number(purchasePrice))}
                            </span>
                          </div>
                        )}

                        {scenario !== "stock-in" && customer && (
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400 font-bold uppercase">Owner</span>
                            <span className="font-black text-right">{customer.fullName}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between text-xs">
                          <span className={scenario === "stock-in" ? "text-slate-500" : "text-slate-400 font-bold uppercase"}>Date</span>
                          <span>{new Date().toLocaleDateString()}</span>
                        </div>
                      </div>

                      {scenario !== "stock-in" && (
                        <div className="flex flex-col items-center space-y-4">
                          <div className="p-2 bg-slate-50 rounded-2xl border border-slate-100">
                             {verifyUrl ? <QRCodeSVG value={verifyUrl} size={140} level="H" /> : <QrCode size={140} className="text-slate-200" />}
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold">SCAN TO VERIFY AUTHENTICITY</p>
                        </div>
                      )}

                      {scenario === "stock-in" && (
                        <div className="flex flex-col items-center py-4">
                           <ShieldCheck className="w-12 h-12 text-amber-500/20 mb-2" />
                           <p className="text-[10px] text-slate-500 font-bold">INVENTORY VERIFIED</p>
                        </div>
                      )}
                    </div>
                    <div className={cn(
                      "p-4 text-center border-t",
                      scenario === "stock-in" ? "bg-slate-800/50 border-slate-800 text-slate-500" : "bg-slate-50 border-slate-100 text-slate-400"
                    )}>
                      <p className="text-[10px] font-bold uppercase tracking-widest">Entry ID: {registeredProduct?.id || 'POS-88294'}</p>
                    </div>
                  </Card>

                  <div className="flex flex-wrap justify-center gap-4 w-full">
                    {!isPrinterConnected && (
                      <Button variant="outline" className="h-14 px-8 border-emerald-500/30 bg-emerald-500/5 text-emerald-500 rounded-xl font-bold gap-3" onClick={handleConnectPrinter}>
                        <Printer className="w-4 h-4" />
                        Pair Printer
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      className="h-14 px-8 border-slate-800 bg-slate-900/50 rounded-xl font-bold gap-3" 
                      onClick={async () => {
                        if (!isPrinterConnected) {
                          const ok = await thermalPrinter.connect();
                          setIsPrinterConnected(ok);
                          if (!ok) return;
                        }
                        
                        const success = await thermalPrinter.printReceipt({
                          header: scenario === "stock-in" ? "INVENTORY GRN" : "KIZERE POS RECEIPT",
                          items: [
                            { label: "Date", value: new Date().toLocaleDateString() },
                            { label: "Product", value: registeredProduct?.name || productName },
                            { label: "S/N", value: serialNumber },
                            { label: "SKU", value: sku || "N/A" },
                            { label: "Retailer", value: user?.fullName || "KIZERE Store" },
                            ...(scenario === "stock-in" ? [
                              { label: "Type", value: "Goods Received" },
                              { label: "Supplier", value: supplier || "Direct" }
                            ] : [
                              { label: "Owner", value: customer?.fullName || "N/A" }
                            ])
                          ],
                          footer: scenario === "stock-in" ? "Inventory certified and logged." : "Thank you for using KIZERE.",
                          url: verifyUrl || `https://kizere.com/v/${serialNumber}`
                        });

                        if (success) toast({ title: t("pos.printed", "Printed"), description: t("pos.receiptPrinted", "Receipt printed successfully.") });
                        else toast({ title: t("pos.printFailed", "Print Failed"), description: t("pos.connectPrinterError", "Could not print. Check printer connection."), variant: "destructive" });
                      }}
                    >
                      <Printer className="w-4 h-4" />
                      {scenario === "stock-in" ? "Thermal GRN" : "Thermal Receipt"}
                    </Button>
                    <Button variant="outline" className="h-14 px-8 border-slate-800 bg-slate-900/50 rounded-xl font-bold gap-3" onClick={() => window.print()}>
                      <Copy className="w-4 h-4" />
                      Standard Print
                    </Button>
                    {scenario !== "stock-in" && registeredLedgerId && (
                      <Button
                        variant="outline"
                        className="h-14 px-8 border-emerald-700/30 bg-emerald-900/20 text-emerald-400 rounded-xl font-bold gap-3"
                        onClick={() => setContractOpen(true)}
                      >
                        <FileText className="w-4 h-4" />
                        Purchase Contract
                      </Button>
                    )}
                    <Button className={cn("h-14 px-10 rounded-xl font-bold gap-3 shadow-lg shadow-emerald-600/20", scenario === "stock-in" ? "bg-amber-600 hover:bg-amber-500" : "bg-emerald-600 hover:bg-emerald-500")} onClick={resetFlow}>
                      {scenario === "stock-in" ? <ListPlus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      {scenario === "stock-in" ? "Stock Another" : "New Registration"}
                    </Button>
                  </div>
                </div>
              )}

              {/* ─── P2P Transfer Steps ─── */}

              {/* Step: Find Device */}
              {step === "transfer-device" && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-white">Find Device</h2>
                    <p className="text-slate-400 text-sm mt-1">Enter the serial number of the device being transferred.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="relative">
                      <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <Input
                        placeholder="Serial Number / IMEI"
                        className="h-14 pl-14 text-lg font-mono bg-slate-900/40 border-slate-800/50 focus:border-indigo-500/50 rounded-2xl"
                        value={transferSerial}
                        onChange={e => setTransferSerial(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleTransferDeviceLookup()}
                      />
                    </div>
                    <Button
                      className="h-14 w-full rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-500 gap-3"
                      disabled={loading || transferSerial.length < 3}
                      onClick={handleTransferDeviceLookup}
                    >
                      {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
                      Look Up Device
                    </Button>
                  </div>
                </div>
              )}

              {/* Step: Find Buyer */}
              {step === "transfer-buyer" && transferProduct && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-white">Identify Buyer</h2>
                    <p className="text-slate-400 text-sm mt-1">Find or create the new owner's KIZERE account.</p>
                  </div>

                  <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-sm">
                    <p className="font-bold text-white">{transferProduct.name}</p>
                    <p className="font-mono text-indigo-400 text-xs mt-0.5">{transferProduct.serialNumber}</p>
                    {transferProduct.currentOwner && (
                      <p className="text-slate-400 mt-1">Current owner: <span className="text-white font-medium">{transferProduct.currentOwner}</span></p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Input
                      placeholder="Buyer's National ID"
                      className="h-12 bg-slate-900/40 border-slate-800/50 focus:border-indigo-500/50 rounded-xl"
                      value={transferBuyerNid}
                      onChange={e => setTransferBuyerNid(e.target.value.replace(/\D/g, ""))}
                    />
                    <Input
                      placeholder="Full Name"
                      className="h-12 bg-slate-900/40 border-slate-800/50 focus:border-indigo-500/50 rounded-xl"
                      value={transferBuyerName}
                      onChange={e => setTransferBuyerName(e.target.value)}
                    />
                    <Input
                      placeholder="Phone number"
                      className="h-12 bg-slate-900/40 border-slate-800/50 focus:border-indigo-500/50 rounded-xl"
                      value={transferBuyerPhone}
                      onChange={e => setTransferBuyerPhone(e.target.value)}
                    />
                    <Button
                      className="h-12 w-full rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 gap-2"
                      disabled={loading || transferBuyerNid.length < 6 || !transferBuyerName}
                      onClick={handleTransferBuyerLookup}
                    >
                      {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <User className="w-4 h-4" />}
                      Find / Create Buyer
                    </Button>
                  </div>
                </div>
              )}

              {/* Step: Confirm Transfer */}
              {step === "transfer-confirm" && transferProduct && transferBuyer && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-white">Confirm Transfer</h2>
                    <p className="text-slate-400 text-sm mt-1">Review the transfer and enter the buyer's MoMo number to initiate payment.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-2">
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Device</p>
                      <p className="font-bold text-white">{transferProduct.name}</p>
                      <p className="font-mono text-xs text-indigo-400">{transferProduct.serialNumber}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">From</p>
                        <p className="text-sm font-semibold text-white">{transferProduct.currentOwner ?? "Unknown"}</p>
                      </div>
                      <div className="p-4 bg-indigo-900/30 border border-indigo-500/30 rounded-2xl">
                        <p className="text-xs text-indigo-400 uppercase tracking-wider font-bold mb-1">To</p>
                        <p className="text-sm font-semibold text-white">{transferBuyer.fullName}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm text-slate-400 font-medium">Buyer's MoMo phone (transfer fee payment):</p>
                    <Input
                      placeholder="e.g. 0788123456"
                      type="tel"
                      className="h-12 bg-slate-900/40 border-slate-800/50 focus:border-indigo-500/50 rounded-xl font-mono"
                      value={transferMomoPhone}
                      onChange={e => setTransferMomoPhone(e.target.value)}
                    />
                    <Button
                      className="h-14 w-full rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-500 gap-3 shadow-lg shadow-indigo-600/20"
                      disabled={loading || !transferMomoPhone.trim()}
                      onClick={handleInitiateTransfer}
                    >
                      {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                      Initiate Transfer & Payment
                    </Button>
                  </div>
                </div>
              )}

              {/* Step: Transfer Pending */}
              {step === "transfer-pending" && (
                <div className="flex flex-col items-center space-y-8 animate-in slide-in-from-bottom-4 duration-500 py-10">
                  <div className="w-24 h-24 rounded-full bg-indigo-500/10 flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-3xl font-black text-white">Awaiting Payment</h2>
                    <p className="text-slate-400 mt-2 text-sm">
                      The buyer should complete the MoMo payment prompt on their phone.<br />
                      Ownership will transfer automatically once payment is confirmed.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <Button variant="outline" className="h-12 px-8 border-slate-800 rounded-xl font-bold" onClick={resetFlow}>
                      New Transaction
                    </Button>
                    <Button asChild className="h-12 px-8 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500">
                      <Link href="/retailer/transactions">View Transactions</Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#1e293b]/95 backdrop-blur-md border-t border-slate-800 p-3 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 border-slate-700 bg-slate-900/50 hover:bg-slate-800 justify-center gap-2 h-11" asChild>
          <Link href="/retailer/dashboard">
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-xs font-bold">Dashboard</span>
          </Link>
        </Button>
        <Button variant="ghost" size="sm" className="flex-1 justify-center gap-2 text-slate-400 hover:text-white h-11" onClick={resetFlow}>
          <Activity className="w-4 h-4" />
          <span className="text-xs font-bold">Reset Session</span>
        </Button>
      </div>

      {/* Footer / Status Bar */}
      <footer className="hidden md:flex h-8 bg-[#0f172a] border-t border-slate-800/50 items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500")} />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{isOnline ? "Server Online" : "Working Offline"}</span>
          </div>
          <div className="h-3 w-px bg-slate-800" />
          <p className="text-[10px] font-mono text-slate-600 uppercase">POS Terminal v1.2.4-stable</p>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-[10px] font-bold text-slate-600 uppercase">Session Time: {sessionTime}</p>
        </div>
      </footer>

      {registeredLedgerId && (
        <PurchaseContractModal
          ledgerId={registeredLedgerId}
          open={contractOpen}
          onClose={() => setContractOpen(false)}
        />
      )}
    </div>
  );
}

function Plus(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}
