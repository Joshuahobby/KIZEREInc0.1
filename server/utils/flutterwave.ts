import crypto from 'crypto';
import { z } from 'zod';
import { createLogger } from './logger';
import { PAYMENT_FEES as CONFIG_PAYMENT_FEES, getPaymentAmount as configGetPaymentAmount } from '../config/payment.config';

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

// Use centralized payment fee structure
export const PAYMENT_FEES = CONFIG_PAYMENT_FEES;

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
    logger.info('Attempting to verify transaction', { transactionId });
    
    // Input validation
    if (!transactionId) {
      logger.error('Invalid transaction ID provided', { transactionId });
      throw new Error('Invalid transaction ID: empty or undefined');
    }
    
    // Clean up transaction ID if needed (sometimes there might be extra characters)
    const cleanTransactionId = transactionId.trim();
    
    logger.info('Calling Flutterwave API', { 
      transactionId: cleanTransactionId,
      url: `https://api.flutterwave.com/v3/transactions/${cleanTransactionId}/verify` 
    });
    
    // Make API request to Flutterwave
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${cleanTransactionId}/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // Check if request was successful
    if (!response.ok) {
      let errorMessage = '';
      
      try {
        // Try to parse error as JSON
        const errorData = await response.json();
        errorMessage = errorData.message || JSON.stringify(errorData);
      } catch {
        // If not JSON, get as text
        errorMessage = await response.text();
      }
      
      logger.error('Transaction verification failed', { 
        transactionId: cleanTransactionId, 
        status: response.status, 
        error: errorMessage
      });
      
      throw new Error(`Transaction verification failed (${response.status}): ${errorMessage}`);
    }

    // Parse response data
    const verificationData: FlutterwaveVerificationResponse = await response.json();
    
    logger.info('Transaction verification response received', { 
      transactionId: cleanTransactionId, 
      status: verificationData.status,
      message: verificationData.message,
      dataStatus: verificationData.data?.status,
      amount: verificationData.data?.amount,
      currency: verificationData.data?.currency
    });

    return verificationData;
  } catch (error) {
    logger.error('Error verifying transaction', { 
      transactionId, 
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    });
    
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
 * @returns The payment amount in the default currency
 */
export function getPaymentAmount(paymentType: 'registration' | 'lost_report'): number {
  // Use the centralized config function
  return configGetPaymentAmount(paymentType);
}