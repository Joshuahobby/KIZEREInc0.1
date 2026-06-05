import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiGet } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer, FileText, X } from "lucide-react";
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
    name: string | null;
    brand: string | null;
    model: string | null;
    category: string | null;
    serialNumber: string | null;
    metadata: any;
  };
  seller: { fullName: string; nationalId: string | null; phoneNumber: string | null; address: string | null; city: string | null } | null;
  buyer: { fullName: string; nationalId: string | null; phoneNumber: string | null; address: string | null; city: string | null } | null;
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
  const buyerAddress = data.buyer?.address || data.buyer?.city || "";

  const price = data.ledger.purchaseAgreement || (data.ledger.metadata?.transactionValue ? `${data.ledger.metadata.transactionValue} RWF` : "");
  const origin = data.retailer?.name ? `${data.retailer.name}${data.retailer.address ? " — " + data.retailer.address : ""}` : "";

  const productTitle = [data.product.brand, data.product.name, data.product.model].filter(Boolean).join(" / ");
  const features = data.product.model || data.ledger.notes || "";
  const accessories = data.ledger.metadata?.accessories || "";

  const dotLine = (text: string, dots = 24) =>
    text ? <strong>{text}</strong> : <span style={{ borderBottom: "1px solid #333", display: "inline-block", minWidth: `${dots * 7}px` }}>&nbsp;</span>;

  const row = (label: string, value: string, dots = 30) => (
    <p style={{ marginBottom: 6 }}>
      {label} {dotLine(value, dots)}
    </p>
  );

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
          AMASEZERANO Y'UBUGURE BWA TELEPHONE ZAKORESHEJWE
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
          {" "}utuye mu ntara ya{" "}
          {dotLine(sellerAddress, 16)}
        </p>
        <p style={{ marginBottom: 6 }}>
          Umudugudu wa{" "}
          {dotLine("", 14)}
          {" "}ufite numero ya telephone{" "}
          {dotLine(sellerPhone, 18)}
        </p>
      </div>

      <p style={{ textAlign: "center", fontWeight: "bold", marginBottom: 8 }}>Na</p>

      {/* Buyer */}
      <div style={{ paddingLeft: 8, marginBottom: 20 }}>
        {row("", buyerName, 40)}
        <p style={{ marginBottom: 6 }}>
          ufite ID, passport cg TIN number{" "}
          {dotLine(buyerNid, 20)}
          {" "}utuye mu ntara ya{" "}
          {dotLine(buyerAddress, 16)}
        </p>
        <p style={{ marginBottom: 6 }}>
          Umudugudu wa{" "}
          {dotLine("", 14)}
          {" "}ufite numero ya telephone{" "}
          {dotLine(buyerPhone, 18)}
        </p>
      </div>

      <p style={{ marginBottom: 12 }}>
        Dukoze amasezerano y'ubugure bwa telephone ifite ibimenyetso bikurikira
      </p>

      {/* Device details */}
      <div style={{ paddingLeft: 16, marginBottom: 20 }}>
        <p style={{ marginBottom: 6 }}>1 &nbsp; Icyiciro &nbsp;{dotLine(data.product.category || "", 28)}</p>
        <p style={{ marginBottom: 6 }}>2 &nbsp; Izina ry'icyirango &nbsp;{dotLine(data.product.brand || "", 26)}</p>
        <p style={{ marginBottom: 6 }}>3 &nbsp; Izina ndangakigererezo mu Ruganda &nbsp;{dotLine(data.product.name || "", 16)}</p>
        <p style={{ marginBottom: 6 }}>4 &nbsp; Nimero y'ubwoko &nbsp;{dotLine(data.product.metadata?.color || "", 26)}</p>
        <p style={{ marginBottom: 6 }}>5 &nbsp; Nimero ya seri &nbsp;{dotLine(data.product.serialNumber || "", 28)}</p>
        <p style={{ marginBottom: 6 }}>6 &nbsp; Ibisobanuro by'imikorere &nbsp;{dotLine(features, 20)}</p>
        <p style={{ marginBottom: 6 }}>
          &nbsp;&nbsp;&nbsp;&nbsp; N'imikoreshereze y'igicuruzwa &nbsp;{dotLine(accessories, 22)}
        </p>
      </div>

      {/* Additional terms */}
      <p style={{ fontWeight: "bold", marginBottom: 6 }}>Andi makuru</p>
      <div style={{ paddingLeft: 16, marginBottom: 16 }}>
        <p style={{ marginBottom: 6 }}>
          ❖ &nbsp; UGURISHA ndahamya ko mpaye UGURA igikoresho kizima gikora icyo cyagenewe.
        </p>
        <p style={{ marginBottom: 6 }}>
          ❖ &nbsp; Ikiguzi cy'igicuruzwa ni{" "}
          {dotLine(price, 20)}
          {" "}nk'UMUGUZI nemeye kwishyura UGURISHA
        </p>
        <p style={{ marginBottom: 6 }}>
          ❖ &nbsp; UGURISHA ngejeje ku MUGUZI igicuruzwa kandi nawe yemeye kucyakira kuwa{" "}
          {dotLine(date, 12)}
        </p>
      </div>

      <p style={{ marginBottom: 6 }}>
        Njyewe{" "}
        {dotLine(buyerName || "", 30)}
        {" "}ndahamya ko ari njye nyiri gicuruzwa
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

export function PurchaseContractModal({ ledgerId, open, onClose }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["/api/pos/ledger/contract-data", ledgerId],
    queryFn: () => apiGet<{ success: boolean; data: ContractData }>(`/api/pos/ledger/${ledgerId}/contract-data`),
    enabled: open && !!ledgerId,
    staleTime: Infinity,
  });

  const contractData = data?.data;

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
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="flex flex-row items-center justify-between px-6 pt-4 pb-2 border-b">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            <DialogTitle className="text-base font-bold">Purchase Contract</DialogTitle>
          </div>
          <div className="flex items-center gap-2">
            {contractData && (
              <Button
                size="sm"
                className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4" />
                Print / Save PDF
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={onClose}>
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
            <div className="shadow-lg rounded-xl overflow-hidden border border-slate-200">
              <ContractBody data={contractData} />
            </div>
          ) : null}
        </div>

        {contractData && (
          <div className="px-6 py-3 border-t text-xs text-muted-foreground">
            Contract ref: LDG-{String(contractData.ledger.id).padStart(6, "0")} · This document is generated automatically by KIZERE and is legally binding when signed by both parties.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
