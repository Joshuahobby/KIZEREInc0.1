/**
 * Payment configuration for the application
 * Centralizes all payment-related constants and settings
 */

import { PaymentType } from "@shared/schema";

/**
 * Fee structure for different payment types
 */
export const PAYMENT_FEES = {
  REGISTRATION: 2000, // 2,000 RWF for item registration
  LOST_REPORT: 1000,  // 1,000 RWF for lost item report
  FOUND_REPORT: 0,    // Free
};

/**
 * Currency code for payments
 */
export const DEFAULT_CURRENCY = "RWF";

/**
 * Get the payment amount based on the payment type
 */
export function getPaymentAmount(type: PaymentType): number {
  switch (type) {
    case "registration":
      return PAYMENT_FEES.REGISTRATION;
    case "lost_report":
      return PAYMENT_FEES.LOST_REPORT;
    default:
      return 0;
  }
}

/**
 * Get payment description based on the payment type
 */
export function getPaymentDescription(type: PaymentType): string {
  switch (type) {
    case "registration":
      return "Item Registration Fee";
    case "lost_report":
      return "Lost Item Report Fee";
    default:
      return "Payment";
  }
}

/**
 * Format currency amount for display
 */
export function formatCurrency(amount: number, currency: string = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format currency without the currency symbol
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-RW", {
    maximumFractionDigits: 0
  }).format(amount);
}