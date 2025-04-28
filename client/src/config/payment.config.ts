/**
 * Payment configuration for the client
 * Centralizes all payment-related constants and settings
 * Mirrors server configuration
 */

import { PaymentType } from "@shared/schema";
import { PaymentService } from "@/services/payment.service";

/**
 * Default fee structure for different payment types
 * These fees will be used as fallback if no packages are available
 */
export const PAYMENT_FEES = {
  REGISTRATION: 2000, // Item registration fee in RWF
  LOST_REPORT: 1000,  // Lost item report fee in RWF
};

/**
 * Default currency code
 */
export const DEFAULT_CURRENCY = "RWF";

/**
 * Get the payment amount based on the payment type
 * 
 * @param type The type of payment ('registration' or 'lost_report')
 * @returns The payment amount in the default currency
 */
export function getPaymentAmount(type: PaymentType): number {
  switch (type) {
    case 'registration':
      return PAYMENT_FEES.REGISTRATION;
    case 'lost_report':
      return PAYMENT_FEES.LOST_REPORT;
    default:
      return 0;
  }
}

/**
 * Get payment description based on the payment type
 * 
 * @param type Payment type
 * @param packageId Optional package ID if a specific package is selected
 * @returns Human-readable description of the payment
 */
export function getPaymentDescription(type: PaymentType, packageId?: number): string {
  // Without a package, use default descriptions
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
    const packageData = await PaymentService.getPaymentPackage(packageId);
    return packageData?.name || 'Payment Package';
  } catch (error) {
    console.error("Error fetching package name:", error);
    return 'Payment Package';
  }
}