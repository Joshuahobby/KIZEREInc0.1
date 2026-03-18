/**
 * Payment configuration for the server
 * Centralizes all payment-related constants and settings.
 * 
 * NOTE: All pricing is managed by admins via the payment_packages table.
 * There are NO hardcoded price fallbacks — if no package is configured,
 * an error is thrown so the admin must set up pricing first.
 */

import { PaymentType } from "@shared/schema";
import { storage } from "../storage";

/**
 * Image upload limits based on user role or package
 */
export const DEFAULT_UPLOAD_LIMITS = {
  FREE: 2,
  PAID: 5,
  BUSINESS: 10,
  ADMIN: 20
};

/**
 * Default currency code
 */
export const DEFAULT_CURRENCY = "RWF";

/**
 * Get the image upload limit for a user
 */
export function getUploadLimit(user: any): number {
  if (user.role === 'Admin') return DEFAULT_UPLOAD_LIMITS.ADMIN;
  if (user.role === 'Business') return DEFAULT_UPLOAD_LIMITS.BUSINESS;

  // For other users, check if they have a paid package
  // This is a simplified check - in a real app we might check active subscriptions
  if (user.role === 'Subscriber') {
    return DEFAULT_UPLOAD_LIMITS.FREE; // Default for free subscribers
  }

  return DEFAULT_UPLOAD_LIMITS.FREE;
}

/**
 * Get the payment amount based on the payment type.
 * Uses the admin-configured default package for this type.
 * If no package is configured, throws an error so the admin knows to set one up.
 * 
 * @param type The type of payment ('registration', 'lost_report', or 'bounty')
 * @returns The payment amount in the default currency
 */
export async function getPaymentAmount(type: PaymentType): Promise<number> {
  // Bounty amounts are user-defined, not package-based
  if (type === 'bounty') {
    return 0;
  }

  // Look up the admin-configured default package for this payment type
  const defaultPackage = await storage.getDefaultPackageByType(type);

  if (defaultPackage) {
    return Number(defaultPackage.amount);
  }

  // No default package found — try any active package of this type
  const activePackages = await storage.getPaymentPackageByType(type, true);
  if (activePackages && activePackages.length > 0) {
    return Number(activePackages[0].amount);
  }

  // No packages configured at all — throw a clear error
  throw new Error(
    `No payment package configured for type "${type}". ` +
    `An admin must create at least one active package in the Payment Packages dashboard.`
  );
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
    case "bounty":
      return "Bounty Payment";
    case "featured_upgrade":
      return "Report Featured Upgrade";
    default:
      return "Payment";
  }
}