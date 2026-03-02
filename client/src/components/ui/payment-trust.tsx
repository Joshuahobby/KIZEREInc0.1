import * as React from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface PaymentTrustProps {
    className?: string;
    showText?: boolean;
}

export function PaymentTrust({ className, showText = true }: PaymentTrustProps) {
    const { t } = useTranslation();

    return (
        <div className={cn("flex flex-col items-center gap-3 py-4", className)}>
            {showText && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                    {t("common.paymentTrustTitle")}
                </p>
            )}
            <div className="flex items-center gap-6">
                {/* MTN MoMo Logo Styled Component */}
                <div className="flex items-center gap-2 group transition-transform hover:scale-105">
                    <div className="w-10 h-10 bg-[#FFCC00] rounded-lg flex items-center justify-center shadow-sm border border-black/5 overflow-hidden">
                        <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center font-black text-[#FFCC00] text-[8px] leading-none">
                            MTN
                        </div>
                    </div>
                    <span className="text-[11px] font-black text-foreground/80">MoMo</span>
                </div>

                <div className="w-px h-6 bg-muted/20" />

                {/* Airtel Money Logo Styled Component */}
                <div className="flex items-center gap-2 group transition-transform hover:scale-105">
                    <div className="w-10 h-10 bg-[#FF0000] rounded-lg flex items-center justify-center shadow-sm border border-white/10 overflow-hidden">
                        <span className="text-white font-black italic text-sm">a</span>
                    </div>
                    <span className="text-[11px] font-black text-foreground/80">Airtel Money</span>
                </div>
            </div>

            <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                <p className="text-[9px] font-medium text-muted-foreground italic">{t("common.paymentTrustSubtitle")}</p>
            </div>
        </div>
    );
}
