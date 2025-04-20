/**
 * Payment configuration for the client
 * Centralizes all payment-related constants and settings
 * Mirrors server configuration
 */

/**
 * Fee structure for different payment types
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
export function getPaymentAmount(type: 'registration' | 'lost_report'): number {
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
 * @returns Human-readable description of the payment
 */
export function getPaymentDescription(type: 'registration' | 'lost_report'): string {
  switch (type) {
    case 'registration':
      return 'Item Registration Fee';
    case 'lost_report':
      return 'Lost Item Report Fee';
    default:
      return 'Payment';
  }
}