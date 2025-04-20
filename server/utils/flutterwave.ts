import crypto from 'crypto';
import { z } from 'zod';
import { createLogger } from './logger';

const logger = createLogger('FlutterwaveUtils');

// Environment variables validation
const flutterwaveConfigSchema = z.object({
  FLUTTERWAVE_SECRET_KEY: z.string().min(1, "Flutterwave secret key is required"),
  FLUTTERWAVE_PUBLIC_KEY: z.string().min(1, "Flutterwave public key is required")
});

// Verify configuration
try {
  flutterwaveConfigSchema.parse(process.env);
} catch (error) {
  logger.error("Flutterwave configuration error", { error });
  throw new Error("Flutterwave configuration error: Missing required environment variables");
}

// Define our payment fee structure
export const PAYMENT_FEES = {
  ITEM_REGISTRATION: 500, // RWF
  LOST_ITEM_REPORT: 500,  // RWF
  FOUND_ITEM_REPORT: 0    // Free
};

// Types for Flutterwave response
export interface FlutterwavePaymentResponse {
  status: string;
  message: string;
  data?: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    charged_amount: number;
    status: string;
    payment_type: string;
    narration?: string;
    processor_response?: string;
    customer: {
      id?: number;
      name?: string;
      email: string;
      phone_number?: string;
    };
    created_at: string;
  };
}

export interface FlutterwaveVerificationResponse {
  status: string;
  message: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    charged_amount: number;
    status: string; 
    payment_type: string;
    narration: string;
    customer: {
      id: number;
      name: string;
      email: string;
      phone_number: string;
    };
    created_at: string;
  };
}

// Payment initialization interface
export interface PaymentInitialization {
  amount: number;
  currency: string;
  tx_ref: string;
  redirect_url: string;
  payment_options?: string;
  customer: {
    email: string;
    phone_number?: string;
    name: string;
  };
  customizations?: {
    title?: string;
    description?: string;
    logo?: string;
  };
  meta?: Record<string, any>;
}

/**
 * Verify a webhook signature from Flutterwave
 * 
 * @param signature The signature from the request headers
 * @param data The request body as a string
 * @returns boolean indicating if the signature is valid
 */
export function verifyWebhookSignature(signature: string, data: string): boolean {
  try {
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY as string;
    const hash = crypto
      .createHmac('sha256', secretKey)
      .update(data)
      .digest('hex');
    
    return hash === signature;
  } catch (error) {
    logger.error('Error verifying webhook signature', { error });
    return false;
  }
}

/**
 * Generate a unique transaction reference for Flutterwave
 * 
 * @param prefix Optional prefix for the transaction reference
 * @returns A unique transaction reference
 */
export function generateTransactionReference(prefix = 'KIZERE'): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  return `${prefix}-${timestamp}-${randomString}`;
}

/**
 * Call Flutterwave API to verify a transaction
 * 
 * @param transactionId The transaction ID to verify
 * @returns The verification response
 */
export async function verifyTransaction(transactionId: string): Promise<FlutterwaveVerificationResponse> {
  try {
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Transaction verification failed', { 
        transactionId, 
        status: response.status, 
        error: errorText 
      });
      throw new Error(`Transaction verification failed: ${errorText}`);
    }

    const verificationData: FlutterwaveVerificationResponse = await response.json();
    logger.info('Transaction verified', { 
      transactionId, 
      status: verificationData.status,
      amount: verificationData.data?.amount,
      currency: verificationData.data?.currency
    });

    return verificationData;
  } catch (error) {
    logger.error('Error verifying transaction', { transactionId, error });
    throw new Error(`Error verifying transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Initialize a payment with Flutterwave
 * 
 * @param paymentData The payment initialization data
 * @returns The payment initialization response
 */
export async function initializePayment(paymentData: PaymentInitialization): Promise<FlutterwavePaymentResponse> {
  try {
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Payment initialization failed', { 
        status: response.status, 
        error: errorText 
      });
      throw new Error(`Payment initialization failed: ${errorText}`);
    }

    const responseData: FlutterwavePaymentResponse = await response.json();
    logger.info('Payment initialized', { 
      status: responseData.status,
      message: responseData.message,
      transactionRef: paymentData.tx_ref
    });

    return responseData;
  } catch (error) {
    logger.error('Error initializing payment', { error });
    throw new Error(`Error initializing payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get the payment amount based on the payment type
 * 
 * @param paymentType The type of payment ('registration' or 'lost_report')
 * @returns The payment amount in RWF
 */
export function getPaymentAmount(paymentType: 'registration' | 'lost_report'): number {
  switch (paymentType) {
    case 'registration':
      return PAYMENT_FEES.ITEM_REGISTRATION;
    case 'lost_report':
      return PAYMENT_FEES.LOST_ITEM_REPORT;
    default:
      throw new Error(`Invalid payment type: ${paymentType}`);
  }
}