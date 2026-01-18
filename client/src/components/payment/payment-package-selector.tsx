import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { PaymentType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check } from "lucide-react";

// UI components
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { toast } = useToast();
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
      // Find default package or use the first one
      const defaultPackage = packages.find(pkg => pkg.isDefault) || packages[0];
      setSelectedId(defaultPackage.id);
      onSelectPackage(defaultPackage.id, Number(defaultPackage.amount));
    }
  }, [packages, selectedId, onSelectPackage]);

  // Handle package selection
  const handleSelectPackage = (packageId: number, amount: number) => {
    setSelectedId(packageId);
    onSelectPackage(packageId, amount);
  };

  // Display loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  // Display error state
  if (error || !packages || packages.length === 0) {
    return (
      <div className="p-4 border border-destructive/50 rounded-md bg-destructive/10 text-destructive">
        <p className="font-medium">Failed to load payment packages</p>
        <p className="text-sm mt-1">
          {error instanceof Error 
            ? error.message 
            : packages && packages.length === 0 
              ? 'No payment packages available for this type.' 
              : 'An unknown error occurred'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Select a Package</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <Card 
            key={pkg.id}
            className={`relative cursor-pointer transition-all ${
              selectedId === pkg.id 
                ? 'border-primary ring-2 ring-primary/20' 
                : 'hover:border-primary/50'
            }`}
            onClick={() => handleSelectPackage(pkg.id, Number(pkg.amount))}
          >
            {pkg.isDefault && (
              <Badge variant="secondary" className="absolute top-2 right-2">
                Recommended
              </Badge>
            )}
            <CardHeader className="pb-2">
              <CardTitle>{pkg.name}</CardTitle>
              <CardDescription>{pkg.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pkg.amount} {pkg.currency}</div>
              
              {pkg.features && pkg.features.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check size={18} className="mr-2 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant={selectedId === pkg.id ? "default" : "outline"} 
                className="w-full"
              >
                {selectedId === pkg.id ? "Selected" : "Select Package"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}