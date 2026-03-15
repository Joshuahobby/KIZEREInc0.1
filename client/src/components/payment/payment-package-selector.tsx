import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { PaymentType } from "@shared/schema";
import { Check, Loader2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface PaymentPackage {
  id: number;
  name: string;
  description: string | null;
  type: PaymentType;
  amount: number;
  currency: string;
  features: string[];
  isDefault: boolean;
  status: 'active' | 'inactive' | 'archived';
  validityDays: number | null;
  createdAt: string;
  updatedAt: string;
}

interface PaymentPackageSelectorProps {
  paymentType: PaymentType;
  onSelectPackage: (packageId: number, amount: number) => void;
  selectedPackageId?: number | null;
}

export function PaymentPackageSelector({
  paymentType,
  onSelectPackage,
  selectedPackageId = null
}: PaymentPackageSelectorProps) {
  const [selectedId, setSelectedId] = useState<number | null>(selectedPackageId);

  // Fetch payment packages
  const { data: packages, isLoading, error } = useQuery({
    queryKey: ['/api/payment-packages/type', paymentType],
    queryFn: async () => {
      return await apiRequest<PaymentPackage[]>(`/api/payment-packages/type/${paymentType}`);
    }
  });

  // Select default package initially if none is selected
  useEffect(() => {
    if (packages && packages.length > 0 && !selectedId) {
      const defaultPackage = packages.find(pkg => pkg.isDefault) || packages[0];
      setSelectedId(defaultPackage.id);
      onSelectPackage(defaultPackage.id, Number(defaultPackage.amount));
    }
  }, [packages, selectedId, onSelectPackage]);

  const handleSelectPackage = (packageId: number, amount: number) => {
    setSelectedId(packageId);
    onSelectPackage(packageId, amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !packages || packages.length === 0) {
    return (
      <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10 text-destructive">
        <p className="font-medium text-sm">No payment packages available</p>
        <p className="text-xs mt-1">
          {error instanceof Error
            ? error.message
            : "An admin needs to configure payment packages before payments can be processed."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Choose a plan</p>
      <div className="space-y-2">
        {packages.map((pkg) => {
          const isSelected = selectedId === pkg.id;

          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => handleSelectPackage(pkg.id, Number(pkg.amount))}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:border-primary/40 hover:bg-muted/30"
              )}
            >
              {/* Radio indicator */}
              <div className={cn(
                "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                isSelected
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/40"
              )}>
                {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>

              {/* Package info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{pkg.name}</span>
                  {pkg.isDefault && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 gap-0.5">
                      <Star className="h-2.5 w-2.5" />
                      Recommended
                    </Badge>
                  )}
                </div>
                {pkg.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{pkg.description}</p>
                )}
              </div>

              {/* Price */}
              <div className="flex-shrink-0 text-right">
                <span className="font-bold text-sm">{Number(pkg.amount).toLocaleString()} {pkg.currency}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}