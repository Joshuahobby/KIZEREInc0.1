import { apiRequest } from "@/lib/queryClient";
import { PaymentType } from "@shared/schema";

/**
 * Payment Fee Response
 */
export interface PaymentFees {
  itemRegistration: number;
  lostItemReport: number;
  foundItemReport: number;
  currency: string;
}

/**
 * Initialize Payment Request
 */
export interface InitializePaymentRequest {
  amount?: number;
  type: PaymentType;
  itemId?: number;
  reportId?: number;
  metadata?: Record<string, any>;
}

/**
 * Initialize Payment Response
 */
export interface InitializePaymentResponse {
  paymentId: number;
  transactionRef: string;
  amount: number;
  currency: string;
  paymentUrl: string | null;
  redirectUrl: string;
}

/**
 * Payment Verification Response
 */
export interface VerifyPaymentResponse {
  status: string;
  message: string;
  payment: {
    id: number;
    userId: number;
    amount: number;
    currency: string;
    type: string;
    status: string;
    transactionId: string | null;
    transactionRef: string;
    flutterwaveRef: string | null;
    itemId: number | null;
    reportId: number | null;
    paymentDate: string | null;
    createdAt: string;
    metadata: Record<string, any> | null;
  };
}

/**
 * Payment History Item
 */
export interface PaymentHistoryItem {
  id: number;
  userId: number;
  amount: number;
  currency: string;
  type: string;
  status: string;
  transactionId: string | null;
  transactionRef: string;
  flutterwaveRef: string | null;
  itemId: number | null;
  reportId: number | null;
  paymentDate: string | null;
  createdAt: string;
  metadata: Record<string, any> | null;
}

/**
 * Payment Service
 * 
 * Handles payment-related operations for the KIZERE platform
 */
export class PaymentService {
  /**
   * Get payment fee structure
   * 
   * @returns Payment fee structure
   */
  static async getPaymentFees(): Promise<PaymentFees> {
    try {
      const response = await apiRequest("GET", "/api/payments/fees");
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch payment fees:", error);
      throw new Error("Failed to fetch payment fees");
    }
  }

  /**
   * Initialize a payment
   * 
   * @param paymentData Payment initialization data
   * @returns Payment initialization response
   */
  static async initializePayment(paymentData: InitializePaymentRequest): Promise<InitializePaymentResponse> {
    try {
      const response = await apiRequest("POST", "/api/payments/initialize", paymentData);
      return await response.json();
    } catch (error) {
      console.error("Failed to initialize payment:", error);
      throw new Error("Failed to initialize payment");
    }
  }

  /**
   * Verify a payment by transaction reference
   * 
   * @param transactionRef Transaction reference
   * @returns Payment verification response
   */
  static async verifyPayment(transactionRef: string): Promise<VerifyPaymentResponse> {
    try {
      const response = await apiRequest("GET", `/api/payments/verify/${transactionRef}`);
      return await response.json();
    } catch (error) {
      console.error("Failed to verify payment:", error);
      throw new Error("Failed to verify payment");
    }
  }

  /**
   * Get user's payment history
   * 
   * @returns Array of payment history items
   */
  static async getPaymentHistory(): Promise<PaymentHistoryItem[]> {
    try {
      const response = await apiRequest("GET", "/api/payments");
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch payment history:", error);
      throw new Error("Failed to fetch payment history");
    }
  }
}