/**
 * Payment configuration for the server
 * Centralizes all payment-related constants and settings
 */

import { PaymentType } from "@shared/schema";
import { storage } from "../storage";

/**
 * Default fee structure for different payment types
 * These fees will be used as fallback if no packages are defined
 */
export const DEFAULT_PAYMENT_FEES = {
  REGISTRATION: 2000, // 2,000 in local currency for item registration
  LOST_REPORT: 1000,  // 1,000 in local currency for lost item report
  FOUND_REPORT: 0,    // Free
};

/**
 * Default currency code
 */
export const DEFAULT_CURRENCY = "RWF";

/**
 * Get the payment amount based on the payment type
 * If a default package exists for this type, use its amount
 * Otherwise fallback to the default fees
 * 
 * @param type The type of payment ('registration' or 'lost_report')
 * @returns The payment amount in the default currency
 */
export async function getPaymentAmount(type: PaymentType): Promise<number> {
  // Try to find a default package for this payment type
  const defaultPackage = await storage.getDefaultPackageByType(type);
  
  // If a default package exists, use its amount
  if (defaultPackage) {
    return Number(defaultPackage.amount);
  }
  
  // Otherwise fallback to default fees
  switch (type) {
    case "registration":
      return DEFAULT_PAYMENT_FEES.REGISTRATION;
    case "lost_report":
      return DEFAULT_PAYMENT_FEES.LOST_REPORT;
    default:
      return 0;
  }
}

/**
 * Get all available packages for a payment type
 * 
 * @param type Payment type
 * @returns Array of payment package options
 */
export async function getPaymentPackageOptions(type: PaymentType) {
  return storage.getPaymentPackageByType(type, true);
}

/**
 * Get payment description based on the payment type and package
 * 
 * @param type Payment type
 * @param packageId Optional package ID if a specific package is selected
 * @returns Human-readable description of the payment
 */
export async function getPaymentDescription(type: PaymentType, packageId?: number): Promise<string> {
  // If a package ID is provided, try to get the package name
  if (packageId) {
    const packageData = await storage.getPaymentPackage(packageId);
    if (packageData) {
      return packageData.name;
    }
  }
  
  // Otherwise, use default descriptions
  switch (type) {
    case "registration":
      return "Item Registration Fee";
    case "lost_report":
      return "Lost Item Report Fee";
    default:
      return "Payment";
  }
}