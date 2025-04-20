/**
 * Payment configuration for the server
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
 * Default currency code
 */
export const DEFAULT_CURRENCY = "RWF";

/**
 * Get the payment amount based on the payment type
 * 
 * @param type The type of payment ('registration' or 'lost_report')
 * @returns The payment amount in RWF
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
 * 
 * @param type Payment type
 * @returns Human-readable description of the payment
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