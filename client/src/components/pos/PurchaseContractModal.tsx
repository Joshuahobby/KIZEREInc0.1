import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiGet, apiPut } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer, FileText, X, Edit2, ArrowLeft } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface ContractData {
  ledger: {
    id: number;
    event: string;
    timestamp: string;
    notes: string | null;
    purchaseAgreement: string | null;
    metadata: any;
    fromUserId: number | null;
    toUserId: number | null;
    registeredBy: number | null;
  };
  product: {
    id: number | null;
    name: string | null;
    brand: string | null;
    model: string | null;
    category: string | null;
    serialNumber: string | null;
    metadata: any;
    color?: string;
    features?: string;
    accessories?: string;
  };
  seller: {
    fullName: string;
    nationalId: string | null;
    phoneNumber: string | null;
    address: string | null;
    city: string | null;
    province?: string;
    district?: string;
    sector?: string;
    cell?: string;
    village?: string;
  } | null;
  buyer: {
    fullName: string;
    nationalId: string | null;
    phoneNumber: string | null;
    address: string | null;
    city: string | null;
    province?: string;
    district?: string;
    sector?: string;
    cell?: string;
    village?: string;
  } | null;
  retailer: { name: string; address: string | null; phone: string | null } | null;
}

interface Props {
  ledgerId: number;
  open: boolean;
  onClose: () => void;
}

function blank(value: string | null | undefined, width = 28) {
  if (value) return value;
  return ".".repeat(width);
}

function getCategoryPluralKinyarwanda(category: string | null | undefined): string {
  const cat = (category || "").toLowerCase();
  if (cat === "phones") return "TELEPHONE ZAKORESHEJWE";
  if (cat === "computers") return "KOMPYUTA ZAKORESHEJWE";
  if (cat === "electronics") return "BIKORESHO BYA ELEKTRONIKI BYAKORESHEJWE";
  return "BIKORESHO BYAKORESHEJWE";
}

function getCategorySingularKinyarwanda(category: string | null | undefined): string {
  const cat = (category || "").toLowerCase();
  if (cat === "phones") return "telephone";
  if (cat === "computers") return "kompyuta";
  if (cat === "electronics") return "igikoresho cya elektroniki";
  return "igikoresho";
}

function ContractBody({ data }: { data: ContractData }) {
  const date = data.ledger.timestamp ? format(new Date(data.ledger.timestamp), "dd/MM/yyyy") : blank(null, 20);

  // Seller = fromUser if present, otherwise retailer (initial sale)
  const sellerName = data.seller?.fullName || data.retailer?.name || "";
  const sellerNid = data.seller?.nationalId || "";
  const sellerPhone = data.seller?.phoneNumber || data.retailer?.phone || "";
  const sellerAddress = data.seller?.address || data.seller?.city || data.retailer?.address || "";

  const buyerName = data.buyer?.fullName || "";
  const buyerNid = data.buyer?.nationalId || "";
  const buyerPhone = data.buyer?.phoneNumber || "";

  const price = data.ledger.purchaseAgreement || (data.ledger.metadata?.transactionValue ? `${data.ledger.metadata.transactionValue} RWF` : "");
  const origin = data.retailer?.name ? `${data.retailer.name}${data.retailer.address ? " — " + data.retailer.address : ""}` : "";

  const features = data.product.features || data.ledger.notes || "";
  const accessories = data.product.accessories || data.ledger.metadata?.accessories || "";

  const dotLine = (text: string, dots = 24) =>
    text ? <strong>{text}</strong> : <span style={{ borderBottom: "1px solid #333", display: "inline-block", minWidth: `${dots * 7}px` }}>&nbsp;</span>;

  const row = (label: string, value: string, dots = 30) => (
    <p style={{ marginBottom: 6 }}>
      {label} {dotLine(value, dots)}
    </p>
  );

  const isSellerRetailer = !data.seller;
  const sellerProvince = data.seller?.province || "";
  const sellerDistrict = data.seller?.district || "";
  const sellerSector = data.seller?.sector || "";
  const sellerCell = data.seller?.cell || "";
  const sellerVillage = data.seller?.village || "";

  const buyerProvince = data.buyer?.province || "";
  const buyerDistrict = data.buyer?.district || "";
  const buyerSector = data.buyer?.sector || "";
  const buyerCell = data.buyer?.cell || "";
  const buyerVillage = data.buyer?.village || "";

  return (
    <div
      id="purchase-contract-body"
      style={{
        fontFamily: "'Times New Roman', serif",
        fontSize: 13,
        lineHeight: 1.8,
        color: "#000",
        padding: "40px 48px",
        maxWidth: 680,
        margin: "0 auto",
        background: "#fff",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <p style={{ fontWeight: "bold", fontSize: 14, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
          GetRwanda LTD
        </p>
        <p style={{ fontWeight: "bold", fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>
          AMASEZERANO Y'UBUGURE BWA {getCategoryPluralKinyarwanda(data.product.category)}
        </p>
        <p style={{ marginTop: 8 }}>
          Taliki ya{" "}
          <strong style={{ borderBottom: "1px solid #333" }}>&nbsp;{date}&nbsp;</strong>
        </p>
      </div>

      {/* Seller */}
      <p style={{ marginBottom: 4 }}>Amasezerano hagati ya</p>
      <div style={{ paddingLeft: 8, marginBottom: 16 }}>
        {row("", sellerName, 40)}
        <p style={{ marginBottom: 6 }}>
          ufite ID, passport cg TIN number{" "}
          {dotLine(sellerNid, 20)}
          {isSellerRetailer ? (
            <> utuye/ikorera mu {dotLine(sellerAddress, 40)}</>
          ) : (
            <>
              {" "}utuye mu Ntara ya {dotLine(sellerProvince, 16)},
              Akarere ka {dotLine(sellerDistrict, 16)},
              Umurenge wa {dotLine(sellerSector, 16)}
            </>
          )}
        </p>
        <p style={{ marginBottom: 6 }}>
          {!isSellerRetailer && (
            <>
              Akagari ka {dotLine(sellerCell, 16)},
              Umudugudu wa {dotLine(sellerVillage, 16)},{" "}
            </>
          )}
          ufite numero ya telephone {dotLine(sellerPhone, 18)}
        </p>
      </div>

      <p style={{ textAlign: "center", fontWeight: "bold", marginBottom: 8 }}>Na</p>

      {/* Buyer */}
      <div style={{ paddingLeft: 8, marginBottom: 20 }}>
        {row("", buyerName, 40)}
        <p style={{ marginBottom: 6 }}>
          ufite ID, passport cg TIN number{" "}
          {dotLine(buyerNid, 20)}
          {" "}utuye mu Ntara ya {dotLine(buyerProvince, 16)},
          Akarere ka {dotLine(buyerDistrict, 16)},
          Umurenge wa {dotLine(buyerSector, 16)}
        </p>
        <p style={{ marginBottom: 6 }}>
          Akagari ka {dotLine(buyerCell, 16)},
          Umudugudu wa {dotLine(buyerVillage, 16)},{" "}
          ufite numero ya telephone {dotLine(buyerPhone, 18)}
        </p>
      </div>

      <p style={{ marginBottom: 12 }}>
        Dukoze amasezerano y'ubugure bwa {getCategorySingularKinyarwanda(data.product.category)} ifite ibimenyetso bikurikira
      </p>

      {/* Device details */}
      <div style={{ paddingLeft: 16, marginBottom: 20 }}>
        <p style={{ marginBottom: 6 }}>1 &nbsp; Icyiciro &nbsp;{dotLine(data.product.category || "", 28)}</p>
        <p style={{ marginBottom: 6 }}>2 &nbsp; Izina ry'icyirango (Brand) &nbsp;{dotLine(data.product.brand || "", 26)}</p>
        <p style={{ marginBottom: 6 }}>3 &nbsp; Izina ry'igikoresho (Name) &nbsp;{dotLine(data.product.name || "", 16)}</p>
        <p style={{ marginBottom: 6 }}>4 &nbsp; Modeli (Model) &nbsp;{dotLine(data.product.model || "", 26)}</p>
        <p style={{ marginBottom: 6 }}>5 &nbsp; Ibara (Color) &nbsp;{dotLine(data.product.color || "", 26)}</p>
        <p style={{ marginBottom: 6 }}>6 &nbsp; Nimero ya seri (Serial Number / IMEI) &nbsp;{dotLine(data.product.serialNumber || "", 28)}</p>
        <p style={{ marginBottom: 6 }}>7 &nbsp; Ibisobanuro by'imikorere (Features) &nbsp;{dotLine(features, 20)}</p>
        <p style={{ marginBottom: 6 }}>
          &nbsp;&nbsp;&nbsp;&nbsp; N'imikoreshereze y'igicuruzwa (Accessories) &nbsp;{dotLine(accessories, 22)}
        </p>
      </div>

      {/* Additional terms */}
      <p style={{ fontWeight: "bold", marginBottom: 6 }}>Andi makuru</p>
      <div style={{ paddingLeft: 16, marginBottom: 16 }}>
        <p style={{ marginBottom: 6 }}>
          ❖ &nbsp; UGURISHA ndahamya ko mpaye UGURA {getCategorySingularKinyarwanda(data.product.category)} nzima ikora icyo cyagenewe.
        </p>
        <p style={{ marginBottom: 6 }}>
          ❖ &nbsp; Ikiguzi cy'igicuruzwa ni{" "}
          {dotLine(price, 20)}
          {" "}nk'UMUGUZI nemeye kwishyura UGURISHA
        </p>
        <p style={{ marginBottom: 6 }}>
          ❖ &nbsp; UGURISHA ngejeje ku MUGUZI {getCategorySingularKinyarwanda(data.product.category)} kandi nawe yemeye kucyakira kuwa{" "}
          {dotLine(date, 12)}
        </p>
      </div>

      <p style={{ marginBottom: 6 }}>
        Njyewe{" "}
        {dotLine(buyerName || "", 30)}
        {" "}ndahamya ko ari njye nyiri {getCategorySingularKinyarwanda(data.product.category)}
      </p>

      <p style={{ marginBottom: 4 }}>Cyasobanuwe haruguru kandi nakibonye mu buryo bukurikije amategeko</p>
      <div style={{ paddingLeft: 16, marginBottom: 20 }}>
        <p style={{ marginBottom: 6 }}>
          ❖ &nbsp; Aho igicuruzwa gikomoka &nbsp;{dotLine(origin, 28)}
        </p>
      </div>

      <p style={{ marginBottom: 28, fontSize: 12 }}>
        Ndahamya ko amakuru akubiye muri aya masezerano yuzuye kandi ari ukuri mfite ubushobozi bwo
        kuyashyiraho umukono.
      </p>

      {/* Signatures */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 32 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: "bold", marginBottom: 20 }}>UGURISHA (Umugurisha)</p>
          <p style={{ marginBottom: 8 }}>
            Umukono &nbsp;{dotLine("", 18)}
          </p>
          <p>
            Italiki &nbsp;{dotLine(date, 14)}
          </p>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: "bold", marginBottom: 20 }}>UGURA (Uwagura)</p>
          <p style={{ marginBottom: 8 }}>
            Umukono &nbsp;{dotLine("", 18)}
          </p>
          <p>
            Italiki &nbsp;{dotLine(date, 14)}
          </p>
        </div>
      </div>

      {/* Footer with QR */}
      <div style={{ marginTop: 32, borderTop: "1px solid #999", paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 10, color: "#666" }}>
          <p style={{ margin: 0 }}>GetRwanda LTD · KIZERE Platform</p>
          <p style={{ margin: "2px 0 0" }}>kizere.rw · Ref: LDG-{String(data.ledger.id).padStart(6, "0")}</p>
          {data.product.serialNumber && (
            <p style={{ margin: "2px 0 0", fontFamily: "monospace", fontSize: 9 }}>S/N: {data.product.serialNumber}</p>
          )}
        </div>
        {data.product.serialNumber && (
          <div style={{ textAlign: "center" }}>
            <QRCodeSVG
              value={`${typeof window !== "undefined" ? window.location.origin : "https://kizere.rw"}/verify/${data.product.serialNumber}`}
              size={56}
              level="M"
            />
            <p style={{ fontSize: 8, color: "#999", marginTop: 2 }}>SCAN TO VERIFY</p>
          </div>
        )}
      </div>
    </div>
  );
}

function EditContractForm({
  data,
  onSave,
  onCancel,
  isSaving,
}: {
  data: ContractData;
  onSave: (formData: any) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = React.useState({
    seller: {
      fullName: data.seller?.fullName || data.retailer?.name || "",
      nationalId: data.seller?.nationalId || "",
      phoneNumber: data.seller?.phoneNumber || data.retailer?.phone || "",
      province: data.seller?.province || "",
      district: data.seller?.district || "",
      sector: data.seller?.sector || "",
      cell: data.seller?.cell || "",
      village: data.seller?.village || "",
    },
    buyer: {
      fullName: data.buyer?.fullName || "",
      nationalId: data.buyer?.nationalId || "",
      phoneNumber: data.buyer?.phoneNumber || "",
      province: data.buyer?.province || "",
      district: data.buyer?.district || "",
      sector: data.buyer?.sector || "",
      cell: data.buyer?.cell || "",
      village: data.buyer?.village || "",
    },
    product: {
      name: data.product.name || "",
      brand: data.product.brand || "",
      model: data.product.model || "",
      category: data.product.category || "",
      color: data.product.color || "",
      features: data.product.features || data.ledger.notes || "",
      accessories: data.product.accessories || data.ledger.metadata?.accessories || "",
    },
    purchaseAgreement: data.ledger.purchaseAgreement || (data.ledger.metadata?.transactionValue ? `${data.ledger.metadata.transactionValue} RWF` : ""),
  });

  const handleChange = (section: 'seller' | 'buyer' | 'product', field: string, val: string) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: val,
      },
    }));
  };

  const handlePriceChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      purchaseAgreement: val,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-slate-800">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-800 border-b pb-2 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          Seller Information (Umugurisha)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
              value={formData.seller.fullName}
              onChange={(e) => handleChange('seller', 'fullName', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">National ID / Passport / TIN</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
              value={formData.seller.nationalId}
              onChange={(e) => handleChange('seller', 'nationalId', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Phone Number</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
              value={formData.seller.phoneNumber}
              onChange={(e) => handleChange('seller', 'phoneNumber', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Province (Intara)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
              value={formData.seller.province}
              onChange={(e) => handleChange('seller', 'province', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">District (Akarere)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
              value={formData.seller.district}
              onChange={(e) => handleChange('seller', 'district', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Sector (Umurenge)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
              value={formData.seller.sector}
              onChange={(e) => handleChange('seller', 'sector', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Cell (Akagari)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
              value={formData.seller.cell}
              onChange={(e) => handleChange('seller', 'cell', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Village (Umudugudu)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
              value={formData.seller.village}
              onChange={(e) => handleChange('seller', 'village', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-semibold text-slate-800 border-b pb-2 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          Buyer Information (Umuguzi)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
              value={formData.buyer.fullName}
              onChange={(e) => handleChange('buyer', 'fullName', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">National ID / Passport / TIN</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
              value={formData.buyer.nationalId}
              onChange={(e) => handleChange('buyer', 'nationalId', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Phone Number</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
              value={formData.buyer.phoneNumber}
              onChange={(e) => handleChange('buyer', 'phoneNumber', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Province (Intara)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
              value={formData.buyer.province}
              onChange={(e) => handleChange('buyer', 'province', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">District (Akarere)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
              value={formData.buyer.district}
              onChange={(e) => handleChange('buyer', 'district', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Sector (Umurenge)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
              value={formData.buyer.sector}
              onChange={(e) => handleChange('buyer', 'sector', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Cell (Akagari)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
              value={formData.buyer.cell}
              onChange={(e) => handleChange('buyer', 'cell', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Village (Umudugudu)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
              value={formData.buyer.village}
              onChange={(e) => handleChange('buyer', 'village', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-semibold text-slate-800 border-b pb-2 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
          Product Information (Igikoresho)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Product Name (Izina)</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
              value={formData.product.name}
              onChange={(e) => handleChange('product', 'name', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Brand (Icyirango)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
              value={formData.product.brand}
              onChange={(e) => handleChange('product', 'brand', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Model (Ubwoko)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
              value={formData.product.model}
              onChange={(e) => handleChange('product', 'model', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Category (Icyiciro)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
              value={formData.product.category}
              onChange={(e) => handleChange('product', 'category', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Color (Ibara)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
              value={formData.product.color}
              onChange={(e) => handleChange('product', 'color', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Functional Notes (Imikorere)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
              value={formData.product.features}
              onChange={(e) => handleChange('product', 'features', e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Accessories (Imikoreshereze / Ibindi biherekeje)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
              value={formData.product.accessories}
              onChange={(e) => handleChange('product', 'accessories', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-semibold text-slate-800 border-b pb-2 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          Transaction Details (Ubugure)
        </h3>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Purchase Agreement (Sale Price / Amasezerano)</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
            placeholder="e.g. 150,000 RWF"
            value={formData.purchaseAgreement}
            onChange={(e) => handlePriceChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button
          type="button"
          variant="outline"
          disabled={isSaving}
          onClick={onCancel}
          className="rounded-lg text-sm border-slate-300 hover:bg-slate-100"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSaving}
          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm gap-2"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

export function PurchaseContractModal({ ledgerId, open, onClose }: Props) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["/api/pos/ledger/contract-data", ledgerId],
    queryFn: () => apiGet<{ success: boolean; data: ContractData }>(`/api/pos/ledger/${ledgerId}/contract-data`),
    enabled: open && !!ledgerId,
    staleTime: Infinity,
  });

  const contractData = data?.data;

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  const handleSave = async (formData: any) => {
    setIsSaving(true);
    try {
      const response = await apiPut<{ success: boolean }>(`/api/pos/ledger/${ledgerId}/contract-data`, formData);
      if (response && response.success) {
        toast({
          title: "Contract Updated",
          description: "Purchase contract details updated successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/pos/ledger/contract-data", ledgerId] });
        setIsEditing(false);
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update contract data.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    const content = document.getElementById("purchase-contract-body")?.outerHTML;
    if (!content) return;

    const win = window.open("", "_blank", "width=900,height=1100");
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>AMASEZERANO Y'UBUGURE</title>
  <style>
    @page { size: A4; margin: 0; }
    body { margin: 0; padding: 0; background: #fff; }
    * { box-sizing: border-box; }
  </style>
</head>
<body>${content}</body>
</html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 bg-slate-50 border border-slate-200">
        <DialogHeader className="flex flex-row items-center justify-between px-6 pt-4 pb-2 border-b bg-white border-slate-200">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            <DialogTitle className="text-base font-bold text-slate-800">
              {isEditing ? "Edit Contract Details" : "Purchase Contract"}
            </DialogTitle>
          </div>
          <div className="flex items-center gap-2">
            {contractData && !isEditing && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 rounded-lg border-slate-300 hover:bg-slate-50 text-slate-700"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="h-4 w-4 text-slate-500" />
                  Edit Details
                </Button>
                <Button
                  size="sm"
                  className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                  onClick={handlePrint}
                >
                  <Printer className="h-4 w-4" />
                  Print / Save PDF
                </Button>
              </>
            )}
            {isEditing && (
              <Button
                size="sm"
                variant="outline"
                className="gap-2 rounded-lg border-slate-300 hover:bg-slate-50 text-slate-700"
                onClick={() => setIsEditing(false)}
              >
                <ArrowLeft className="h-4 w-4 text-slate-500" />
                Back to Preview
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="bg-slate-50 p-4">
          {isLoading ? (
            <div className="space-y-3 p-8">
              <Skeleton className="h-6 w-2/3 mx-auto" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : isError ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Failed to load contract data. Please try again.
            </div>
          ) : contractData ? (
            isEditing ? (
              <EditContractForm
                data={contractData}
                onSave={handleSave}
                onCancel={() => setIsEditing(false)}
                isSaving={isSaving}
              />
            ) : (
              <div className="shadow-lg rounded-xl overflow-hidden border border-slate-200 bg-white">
                <ContractBody data={contractData} />
              </div>
            )
          ) : null}
        </div>

        {contractData && !isEditing && (
          <div className="px-6 py-3 border-t text-xs text-muted-foreground bg-white border-slate-200">
            Contract ref: LDG-{String(contractData.ledger.id).padStart(6, "0")} · This document is generated automatically by KIZERE and is legally binding when signed by both parties.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

