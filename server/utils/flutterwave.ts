import crypto from 'crypto';
import { z } from 'zod';
import { createLogger } from './logger';
import { DEFAULT_PAYMENT_FEES, getPaymentAmount as configGetPaymentAmount } from '../config/payment.config';
import { env } from "../config";

const logger = createLogger('FlutterwaveUtils');


// Environment variables validation
const flutterwaveConfigSchema = z.object({
  FLUTTERWAVE_SECRET_KEY: z.string().optional(),
  FLUTTERWAVE_PUBLIC_KEY: z.string().optional()
});

let isConfigured = false;
try {
  const config = flutterwaveConfigSchema.parse(process.env);
  if (config.FLUTTERWAVE_SECRET_KEY && config.FLUTTERWAVE_PUBLIC_KEY) {
    isConfigured = true;
  } else {
    logger.warn("Flutterwave is not fully configured. Payment features will be disabled.", {
      hasSecretKey: !!config.FLUTTERWAVE_SECRET_KEY,
      hasPublicKey: !!config.FLUTTERWAVE_PUBLIC_KEY
    });
  }
} catch (error) {
  logger.warn("Flutterwave configuration validation failed. Payment features will be disabled.", { error });
}

export const isFlutterwaveConfigured = () => isConfigured;

function checkConfig() {
  if (!isConfigured) {
    throw new Error("Flutterwave is not configured. Please set FLUTTERWAVE_SECRET_KEY and FLUTTERWAVE_PUBLIC_KEY.");
  }
}

// Use centralized payment fee structure
export const PAYMENT_FEES = DEFAULT_PAYMENT_FEES;

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
    link?: string; // Payment link used for redirecting users
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

// Transfer initialization interface
export interface TransferInitialization {
  account_bank: string; // Destination bank code (e.g. 'MPS' for mobile money)
  account_number: string; // Phone number
  amount: number;
  currency: string;
  narration: string;
  reference: string;
  callback_url?: string;
  debit_currency?: string;
}

export interface FlutterwaveTransferResponse {
  status: string;
  message: string;
  data?: {
    id: number;
    account_number: string;
    bank_code: string;
    full_name: string;
    created_at: string;
    currency: string;
    debit_currency: string;
    amount: number;
    fee: number;
    status: string;
    reference: string;
    meta: any;
    narration: string;
    complete_message: string;
    requires_approval: number;
    is_approved: number;
    bank_name: string;
  };
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
    checkConfig();
    logger.info('Attempting to verify transaction', { transactionId });

    // Mock mode for testing
    if (process.env.MOCK_PAYMENTS === 'true') {
      logger.info('MOCK_PAYMENTS is enabled, returning successful mock response', { transactionId });
      return {
        status: 'success',
        message: 'Transaction fetched successfully',
        data: {
          id: 123456,
          tx_ref: transactionId,
          flw_ref: `flw-mock-${Date.now()}`,
          amount: 5000, // Default mock amount
          currency: 'RWF',
          charged_amount: 5000,
          status: 'successful',
          payment_type: 'card',
          narration: 'Mock Payment',
          customer: {
            id: 999,
            name: 'Mock User',
            email: 'mock@example.com',
            phone_number: '0780000000'
          },
          created_at: new Date().toISOString()
        }
      };
    }

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
    checkConfig();

    // Mock mode for testing
    if (process.env.MOCK_PAYMENTS === 'true') {
      logger.info('MOCK_PAYMENTS is enabled, returning successful mock initialization');
      return {
        status: 'success',
        message: 'Payment initialized',
        data: {
          link: `http://localhost:5000/mock-payment?tx_ref=${paymentData.tx_ref}`, // Fake link
          id: 123456,
          tx_ref: paymentData.tx_ref,
          flw_ref: `flw-mock-${Date.now()}`,
          amount: paymentData.amount,
          currency: paymentData.currency,
          charged_amount: paymentData.amount,
          status: 'success',
          payment_type: 'card',
          customer: {
            email: paymentData.customer.email,
            name: paymentData.customer.name
          },
          created_at: new Date().toISOString()
        }
      };
    }

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
 * Initiate a transfer (payout) with Flutterwave
 * 
 * @param transferData The transfer initialization data
 * @returns The transfer response
 */
export async function initiateTransfer(transferData: TransferInitialization): Promise<FlutterwaveTransferResponse> {
  try {
    checkConfig();
    const response = await fetch('https://api.flutterwave.com/v3/transfers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transferData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Transfer initialization failed', {
        status: response.status,
        error: errorText
      });
      throw new Error(`Transfer initialization failed: ${errorText}`);
    }

    const responseData: FlutterwaveTransferResponse = await response.json();
    logger.info('Transfer initialized', {
      status: responseData.status,
      message: responseData.message,
      reference: transferData.reference
    });

    return responseData;
  } catch (error) {
    logger.error('Error initializing transfer', { error });
    throw new Error(`Error initializing transfer: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get the payment amount based on the payment type
 * 
 * @param paymentType The type of payment ('registration' or 'lost_report' or 'bounty')
 * @returns The payment amount in the default currency
 */
export async function getPaymentAmount(paymentType: 'registration' | 'lost_report' | 'bounty'): Promise<number> {
  // Use the centralized config function
  return configGetPaymentAmount(paymentType as any);
}