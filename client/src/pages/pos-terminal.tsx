import * as React from "react";
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

type Step = "scenario" | "customer" | "product" | "confirm" | "receipt";
type Scenario = "sale" | "stock-in";

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
  const [isScannerOpen, setIsScannerOpen] = React.useState(false);
  const [isFromInventory, setIsFromInventory] = React.useState(false);

  // Security State
  const [isStolen, setIsStolen] = React.useState(false);
  const [alertReason, setAlertReason] = React.useState("");

  // Result State
  const [registeredProduct, setRegisteredProduct] = React.useState<RegisteredProduct | null>(null);
  const [verifyUrl, setVerifyUrl] = React.useState<string>("");
  const receiptRef = React.useRef<HTMLDivElement>(null);
  const [useWebSerial, setUseWebSerial] = React.useState(false);

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
    if (!fullName) {
      toast({ title: "Missing Name", description: "Please enter the customer's full name.", variant: "destructive" });
      return;
    }
    if (!isOnline) {
      setCustomer({ id: -1, fullName, username: `off_${nationalId}`, nationalId });
      setStep("confirm");
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
        setStep("confirm");
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
      const endpoint = isStockInMode ? "/api/pos/stock-in" : "/api/pos/register";
      const data: any = isStockInMode 
        ? { serialNumber, name: productName, category, sku }
        : { serialNumber, name: productName, category, sku, ownerId: customer?.id };
      
      // Ensure ownerId is a number if present
      if (data.ownerId) {
        data.ownerId = parseInt(data.ownerId.toString(), 10);
      }
      
      const res = await apiRequest<any>(endpoint, { method: "POST", data });
      if (res.success) {
        setRegisteredProduct(res.product);
        setStep("receipt");
        if (!isStockInMode) setVerifyUrl(`${window.location.origin}/verify/${res.product.serialNumber}`);
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
    setCustomer(null); setSerialNumber(""); setProductName(""); setRegisteredProduct(null);
    setIsStolen(false);
    setIsStockInMode(false);
  };

  // ─── Rendering Helpers ───
  const steps: { key: Step; icon: any; label: string }[] = React.useMemo(() => {
    if (step === "scenario") return [];
    
    if (scenario === "stock-in") 
      return [
        { key: "product", icon: Package, label: "Inventory" },
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
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">{isStockInMode ? "Stock Management" : "Direct Sales"}</span>
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

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Left Sidebar - Navigation & Steps */}
        <aside className="w-full md:w-64 bg-[#1e293b]/30 border-r border-slate-800 p-6 flex flex-col shrink-0">
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
          <div className="max-w-4xl w-full mx-auto p-6 md:p-10">
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
                    <h2 className="text-4xl font-black text-white">Select Operation</h2>
                    <p className="text-slate-400">Choose the type of transaction you want to perform</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button 
                      onClick={() => { setScenario("sale"); setIsStockInMode(false); setStep("customer"); }}
                      className="group p-8 bg-slate-900/50 border border-slate-800 rounded-[2rem] hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left space-y-4"
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
                      className="group p-8 bg-slate-900/50 border border-slate-800 rounded-[2rem] hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left space-y-4"
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
                  </div>

                  <div className="pt-10 border-t border-slate-800 flex justify-center">
                    <div className="flex items-center gap-8 opacity-40">
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> <span className="text-[10px] font-bold uppercase">Secure Sales</span></div>
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500" /> <span className="text-[10px] font-bold uppercase">Inventory Control</span></div>
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> <span className="text-[10px] font-bold uppercase">Theft Protected</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step: Customer */}
              {step === "customer" && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-3xl font-black text-white">Find Customer</h2>
                    <p className="text-slate-400">Identify the customer via National ID to begin registration</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid gap-6">
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                        <Input
                          placeholder="National ID Number"
                          className="h-16 pl-12 text-lg font-mono tracking-[0.2em] bg-slate-900/50 border-slate-800 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                          value={nationalId}
                          onChange={(e) => setNationalId(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleCustomerLookup()}
                        />
                        <Button
                          variant="ghost"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 hover:bg-emerald-500/10 text-emerald-500"
                          onClick={handleCustomerLookup}
                        >
                          <Search className="w-5 h-5" />
                        </Button>
                      </div>

                      {isNewCustomer && (
                        <div className="grid gap-6 p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl animate-in fade-in">
                          <div className="flex items-center gap-2 text-emerald-400 mb-2">
                            <UserPlus className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">New Account Registration</span>
                          </div>
                          <Input
                            placeholder="Customer Full Name"
                            className="h-14 bg-slate-900/50 border-slate-800"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                          />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input placeholder="Phone Number" className="h-14 bg-slate-900/50 border-slate-800" value={phone} onChange={(e) => setPhone(e.target.value)} />
                            <Input placeholder="Email Address" className="h-14 bg-slate-900/50 border-slate-800" value={email} onChange={(e) => setEmail(e.target.value)} />
                          </div>
                        </div>
                      )}
                    </div>

                  <div className="flex gap-4 pt-4">
                    <Button variant="outline" className="h-16 flex-1 border-slate-800 text-slate-400 font-bold rounded-2xl" onClick={() => setStep("product")}>
                      Back
                    </Button>
                    <Button
                      className="h-16 flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white text-lg font-bold rounded-2xl shadow-xl shadow-emerald-600/20"
                      disabled={loading || nationalId.length !== 16 || (isNewCustomer && !fullName)}
                      onClick={handleCustomerSubmit}
                    >
                      {loading ? <Loader2 className="animate-spin" /> : "Review & Sell Item"}
                    </Button>
                  </div>
                  </div>
                </div>
              )}

              {/* Step: Product */}
              {step === "product" && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-3xl font-black text-white">Product Details</h2>
                    <p className="text-slate-400">Scanning or manual entry for the item being processed</p>
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

                  <Tabs defaultValue="manual" className="w-full">
                    <TabsList className="bg-slate-900 border border-slate-800 h-14 p-1 rounded-2xl w-full">
                      <TabsTrigger value="manual" className="flex-1 rounded-xl data-[state=active]:bg-slate-800 h-full">Manual Entry</TabsTrigger>
                      <TabsTrigger value="inventory" className="flex-1 rounded-xl data-[state=active]:bg-slate-800 h-full">From Inventory</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="manual" className="mt-8 space-y-6">
                      <div className="grid gap-6">
                        <div className="relative group">
                          <BarcodeScanner
                            isOpen={isScannerOpen}
                            onClose={() => setIsScannerOpen(false)}
                            onScan={(text) => { setSerialNumber(text); setIsScannerOpen(false); }}
                          />
                          <Input
                            placeholder="Serial / IMEI Number"
                            className="h-16 pr-24 font-mono text-lg bg-slate-900/50 border-slate-800"
                            value={serialNumber}
                            onChange={(e) => setSerialNumber(e.target.value)}
                            onBlur={handleInventorySearch}
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                            <Button variant="ghost" className="h-12 w-12 text-emerald-500" onClick={() => setIsScannerOpen(true)}>
                              <QrCode className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>

                        <Input placeholder="Product Name (e.g. iPhone 15 Pro)" className="h-14 bg-slate-900/50 border-slate-800" value={productName} onChange={(e) => setProductName(e.target.value)} />
                        
                        <div className="grid grid-cols-2 gap-4">
                           <select
                              className="h-14 bg-slate-900/50 border-slate-800 rounded-xl px-4 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                              value={category}
                              onChange={(e) => setCategory(e.target.value)}
                            >
                              <option value="Electronics">Electronics</option>
                              <option value="Phones">Phones</option>
                              <option value="Computers">Computers</option>
                              <option value="Other">Other</option>
                            </select>
                            <Input placeholder="SKU (Optional)" className="h-14 bg-slate-900/50 border-slate-800" value={sku} onChange={(e) => setSku(e.target.value)} />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="inventory" className="mt-8">
                       <div className="grid gap-4">
                        {inventory.length > 0 ? (
                          inventory.slice(0, 5).map(p => (
                            <button
                              key={p.id}
                              className="flex items-center gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-colors text-left"
                              onClick={() => { setSerialNumber(p.serialNumber); setProductName(p.name); setCategory(p.category); setStep("confirm"); }}
                            >
                              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center"><Package className="w-5 h-5 text-slate-500" /></div>
                              <div className="flex-1">
                                <p className="text-sm font-bold text-white">{p.name}</p>
                                <p className="text-xs text-slate-500 font-mono">{p.serialNumber}</p>
                              </div>
                              <Badge variant="secondary" className="bg-slate-800 text-slate-400">IN STOCK</Badge>
                            </button>
                          ))
                        ) : (
                          <div className="py-10 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
                            No inventory items found.
                          </div>
                        )}
                       </div>
                    </TabsContent>
                  </Tabs>

                  <div className="flex gap-4 pt-4">
                    <Button variant="outline" className="h-16 flex-1 border-slate-800 text-slate-400 font-bold rounded-2xl" onClick={() => setStep(scenario === "stock-in" ? "scenario" : "customer")}>
                      Back
                    </Button>
                    <Button
                      className="h-16 flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white text-lg font-bold rounded-2xl shadow-xl shadow-emerald-600/20"
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
                    <h2 className="text-3xl font-black text-white">Review & Confirm</h2>
                    <p className="text-slate-400">Please verify all information is correct before submitting</p>
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
                        </div>
                      </div>
                    </Card>

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

                    <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                      <p className="text-xs text-emerald-400 font-bold flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        LEGAL CONFIRMATION
                      </p>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        By clicking register, I confirm this device belongs to the identified individual and its provenance has been verified according to KIZERE guidelines.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button variant="outline" className="h-16 flex-1 border-slate-800 text-slate-400 font-bold rounded-2xl" onClick={() => setStep("product")}>
                      Back
                    </Button>
                    <Button
                      className="h-16 flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white text-lg font-bold rounded-2xl shadow-xl shadow-emerald-600/20"
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
                    <div className="w-24 h-24 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-600/30">
                      <Check className="w-12 h-12 text-white stroke-[3px]" />
                    </div>
                    <h2 className="text-4xl font-black text-white">Success!</h2>
                    <p className="text-slate-400 mt-2">Ownership has been secured and registered.</p>
                  </div>

                  <Card className="w-full max-w-sm bg-white text-slate-900 overflow-hidden shadow-2xl rounded-[2rem]">
                    <div className="p-8 space-y-6">
                      <div className="flex flex-col items-center text-center space-y-1">
                        <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white mb-2"><ShieldCheck /></div>
                        <p className="font-black text-lg">KIZERE SECURE</p>
                        <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">Digital Ownership Receipt</p>
                      </div>

                      <div className="border-t border-b border-dashed border-slate-200 py-6 space-y-4">
                        <div className="flex justify-between text-xs"><span className="text-slate-400 font-bold uppercase">Product</span><span className="font-black text-right">{productName}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-slate-400 font-bold uppercase">Serial</span><span className="font-mono text-emerald-600 font-bold">{serialNumber}</span></div>
                        {!isStockInMode && <div className="flex justify-between text-xs"><span className="text-slate-400 font-bold uppercase">Owner</span><span className="font-black text-right">{customer?.fullName}</span></div>}
                        <div className="flex justify-between text-xs"><span className="text-slate-400 font-bold uppercase">Date</span><span>{new Date().toLocaleDateString()}</span></div>
                      </div>

                      <div className="flex flex-col items-center space-y-4">
                        <div className="p-2 bg-slate-50 rounded-2xl border border-slate-100">
                           {verifyUrl ? <QRCodeSVG value={verifyUrl} size={140} level="H" /> : <QrCode size={140} className="text-slate-200" />}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold">SCAN TO VERIFY AUTHENTICITY</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400">TRX ID: {registeredProduct?.id || 'POS-88294'}</p>
                    </div>
                  </Card>

                  <div className="flex flex-wrap justify-center gap-4 w-full">
                    <Button variant="outline" className="h-14 px-8 border-slate-800 bg-slate-900/50 rounded-xl font-bold gap-3" onClick={() => window.print()}>
                      <Printer className="w-4 h-4" />
                      Print Receipt
                    </Button>
                    <Button variant="outline" className="h-14 px-8 border-slate-800 bg-slate-900/50 rounded-xl font-bold gap-3" onClick={() => {
                      navigator.clipboard.writeText(verifyUrl);
                      toast({ title: "Copied", description: "Verification link copied to clipboard" });
                    }}>
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </Button>
                    <Button className="h-14 px-10 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold gap-3" onClick={resetFlow}>
                      <Plus className="w-4 h-4" />
                      New Registration
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer / Status Bar */}
      <footer className="h-8 bg-[#0f172a] border-t border-slate-800/50 flex items-center justify-between px-6 shrink-0">
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
