import { apiRequest } from "@/lib/queryClient";
import { PaymentType } from "@shared/schema";
import { getPaymentAmount, DEFAULT_CURRENCY } from "@/config/payment.config";
import { PaymentPackage } from "@/components/payment/payment-package-selector";

/**
 * Request interface for payment initialization
 */
export interface InitializePaymentRequest {
  type: PaymentType;
  amount?: number; // Optional, server will use default if not provided
  itemId?: number;
  reportId?: number;
  packageId?: number; // Optional, reference to the selected payment package
  phoneNumber: string; // Required for PawaPay Direct Deposit
  provider?: string; // Optional — auto-detected from phone number
}

/**
 * Response interface for payment initialization
 */
export interface InitializePaymentResponse {
  paymentId: number;
  transactionRef: string;
  amount: number;
  currency: string;
  depositId: string;
  depositStatus: string;
}

/**
 * Response interface for payment verification
 */
export interface VerifyPaymentResponse {
  status: "successful" | "failed" | "pending" | "cancelled";
  message: string;
  transactionRef: string;
  amount?: number;
  paymentDate?: string;
}

/**
 * Payment history item interface
 */
export interface PaymentHistoryItem {
  id: number;
  userId: number;
  transactionRef: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  itemId?: number;
  reportId?: number;
  paymentDate?: string;
  createdAt: string;
}

/**
 * Payment service to handle all payment-related API calls
 */
export class PaymentService {
  /**
   * Initialize a payment
   * 
   * @param paymentDetails Payment initialization details
   * @returns Payment initialization response with transaction reference and payment URL
   */
  static async initializePayment(paymentDetails: InitializePaymentRequest): Promise<InitializePaymentResponse> {
    try {
      console.log("Initializing payment with details:", paymentDetails);
      const responseData = await apiRequest("/api/payments/initiate", { method: "POST", data: paymentDetails });
      console.log("Payment initialization successful:", responseData);
      return responseData;
    } catch (error) {
      console.error("Payment initialization error:", error);
      throw error instanceof Error ? error : new Error("Failed to initialize payment");
    }
  }

  /**
   * Verify a payment by transaction reference
   * 
   * @param transactionRef The transaction reference to verify
   * @returns Payment verification response
   */
  static async verifyPayment(transactionRef: string): Promise<VerifyPaymentResponse> {
    try {
      return await apiRequest(`/api/payments/verify/${transactionRef}`, { method: "GET" });
    } catch (error) {
      console.error("Payment verification error:", error);
      throw error instanceof Error ? error : new Error("Failed to verify payment");
    }
  }

  /**
   * Get payment history for the current user
   * 
   * @returns Array of payment history items
   */
  static async getPaymentHistory(): Promise<PaymentHistoryItem[]> {
    try {
      // First try /api/payments/history endpoint
      try {
        return await apiRequest("/api/payments/history", { method: "GET" });
      } catch (innerError) {
        console.warn("Could not fetch from /api/payments/history, trying /api/payments", innerError);
      }

      // Fall back to /api/payments endpoint
      return await apiRequest("/api/payments", { method: "GET" });
    } catch (error) {
      console.error("Payment history fetch error:", error);
      throw error instanceof Error ? error : new Error("Failed to fetch payment history");
    }
  }

  /**
   * Get payment status by transaction reference
   * 
   * @param transactionRef The transaction reference
   * @returns Payment details
   */
  static async getPaymentStatus(transactionRef: string): Promise<PaymentHistoryItem> {
    try {
      return await apiRequest(`/api/payments/status/${transactionRef}`, { method: "GET" });
    } catch (error) {
      console.error("Payment status fetch error:", error);
      throw error instanceof Error ? error : new Error("Failed to fetch payment status");
    }
  }

  /**
   * Calculate payment amount based on payment type
   * 
   * @param type Payment type
   * @returns Payment amount in the default currency
   */
  static getPaymentAmount(type: PaymentType): number {
    // Use the centralized payment configuration
    return getPaymentAmount(type);
  }

  /**
   * Get all payment packages
   * 
   * @param includeInactive Whether to include inactive packages
   * @returns Array of payment packages
   */
  static async getPaymentPackages(includeInactive = false): Promise<PaymentPackage[]> {
    try {
      return await apiRequest(`/api/payment-packages?includeInactive=${includeInactive}`, { method: "GET" });
    } catch (error) {
      console.error("Payment packages fetch error:", error);
      throw error instanceof Error ? error : new Error("Failed to fetch payment packages");
    }
  }

  /**
   * Get payment packages by type
   * 
   * @param type The payment type
   * @param onlyActive Whether to include only active packages
   * @returns Array of payment packages for the specified type
   */
  static async getPaymentPackagesByType(type: PaymentType, onlyActive = true): Promise<PaymentPackage[]> {
    try {
      return await apiRequest(`/api/payment-packages/type/${type}?onlyActive=${onlyActive}`, { method: "GET" });
    } catch (error) {
      console.error(`Payment packages fetch error for type ${type}:`, error);
      throw error instanceof Error ? error : new Error(`Failed to fetch payment packages for type ${type}`);
    }
  }

  /**
   * Get a payment package by ID
   * 
   * @param packageId The package ID
   * @returns The payment package or null if not found
   */
  static async getPaymentPackage(packageId: number): Promise<PaymentPackage | null> {
    try {
      return await apiRequest(`/api/payment-packages/${packageId}`, { method: "GET" });
    } catch (error: any) {
      if (error.message && error.message.includes("404")) {
        return null;
      }
      console.error(`Payment package fetch error for ID ${packageId}:`, error);
      throw error instanceof Error ? error : new Error(`Failed to fetch payment package with ID ${packageId}`);
    }
  }
}