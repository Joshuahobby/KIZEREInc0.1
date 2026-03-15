/**
 * Payment configuration for the client
 * Centralizes all payment-related constants and settings.
 *
 * NOTE: All pricing is managed by admins via the payment_packages table.
 * There are NO hardcoded price fallbacks — prices are fetched from the API.
 */

import { PaymentType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

/**
 * Default currency code
 */
export const DEFAULT_CURRENCY = "RWF";

/**
 * Cached default package amounts to avoid repeated API calls within a session.
 */
const _amountCache: Record<string, { amount: number; expiry: number }> = {};

/**
 * Fetch the default payment amount from the server for a given type.
 * The server resolves the amount from admin-configured packages.
 *
 * @param type The type of payment ('registration' or 'lost_report')
 * @returns The payment amount in the default currency
 */
export async function getPaymentAmountAsync(type: PaymentType): Promise<number> {
  // Check local cache (valid for 5 minutes)
  const cached = _amountCache[type];
  if (cached && cached.expiry > Date.now()) {
    return cached.amount;
  }

  try {
    // Fetch active packages for this type and pick the default or first one
    const packages = await apiRequest<any[]>(`/api/payment-packages/type/${type}`);
    if (packages && packages.length > 0) {
      const defaultPkg = packages.find((p: any) => p.isDefault) || packages[0];
      const amount = Number(defaultPkg.amount);
      _amountCache[type] = { amount, expiry: Date.now() + 5 * 60 * 1000 };
      return amount;
    }
  } catch (error) {
    console.error(`Failed to fetch payment amount for type ${type}:`, error);
  }

  // Return 0 if no packages found — the payment modal will handle the error
  return 0;
}

/**
 * Get payment description based on the payment type
 *
 * @param type Payment type
 * @returns Human-readable description of the payment
 */
export function getPaymentDescription(type: PaymentType): string {
  switch (type) {
    case 'registration':
      return 'Item Registration Fee';
    case 'lost_report':
      return 'Lost Item Report Fee';
    default:
      return 'Payment';
  }
}

/**
 * Get the package name for a given package ID
 *
 * @param packageId The package ID
 * @returns Promise resolving to the package name or a default value
 */
export async function getPackageName(packageId: number): Promise<string> {
  try {
    const packageData = await apiRequest<any>(`/api/payment-packages/${packageId}`);
    return packageData?.name || 'Payment Package';
  } catch (error) {
    console.error("Error fetching package name:", error);
    return 'Payment Package';
  }
}