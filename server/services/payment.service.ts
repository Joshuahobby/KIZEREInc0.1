/**
 * Payment Service
 * 
 * Centralizes all payment-related business logic and operations.
 * This service acts as an intermediary between routes and storage layer.
 */

import { storage } from '../storage';
import { Payment, InsertPayment, PaymentType, PaymentStatus } from '@shared/schema';
import { createLogger } from '../utils/logger';
import { 
  generateTransactionReference, 
  initializePayment, 
  verifyTransaction
} from '../utils/flutterwave';
import { getPaymentAmount, DEFAULT_CURRENCY } from '../config/payment.config';
import { getPaymentDescription } from '../config/payment.config';
import { UserService } from './user.service';

const logger = createLogger('PaymentService');

/**
 * Payment initialization request interface
 */
export interface PaymentInitializationRequest {
  userId: number;
  type: PaymentType;
  amount?: number;
  packageId?: number;
  itemId?: number;
  reportId?: number;
  redirectUrl?: string;
}

/**
 * Payment initialization response interface
 */
export interface PaymentInitializationResponse {
  paymentId: number;
  transactionRef: string;
  amount: number;
  currency: string;
  paymentUrl: string;
  redirectUrl: string;
}

/**
 * Payment verification response interface
 */
export interface PaymentVerificationResponse {
  status: PaymentStatus;
  message: string;
  transactionRef: string;
  amount?: number;
  paymentDate?: string;
}

/**
 * Payment Service class
 * Handles all payment-related business logic
 */
export class PaymentService {
  /**
   * Initialize a payment
   * 
   * @param paymentData Payment initialization data
   * @returns Payment initialization response
   */
  static async initializePayment(paymentData: PaymentInitializationRequest): Promise<PaymentInitializationResponse> {
    try {
      logger.info('Initializing payment', { userId: paymentData.userId, type: paymentData.type });
      
      // Check if user exists
      const user = await UserService.getUserById(paymentData.userId);
      if (!user) {
        logger.warn('User not found for payment initialization', { userId: paymentData.userId });
        throw new Error('User not found');
      }
      
      let packageData = null;
      let amount: number;
      
      // If package ID is provided, get the package details
      if (paymentData.packageId) {
        packageData = await storage.getPaymentPackage(paymentData.packageId);
        if (!packageData) {
          logger.warn('Package not found for payment initialization', { packageId: paymentData.packageId });
          throw new Error('Payment package not found');
        }
        
        // Ensure package type matches payment type
        if (packageData.type !== paymentData.type) {
          logger.warn('Package type does not match payment type', { 
            packageType: packageData.type, 
            paymentType: paymentData.type 
          });
          throw new Error('Invalid package for this payment type');
        }
        
        // Ensure package is active
        if (packageData.status !== 'active') {
          logger.warn('Package is not active', { packageId: paymentData.packageId });
          throw new Error('Selected package is not available');
        }
        
        // Use package amount
        amount = Number(packageData.amount);
      } else if (paymentData.amount) {
        // Explicit amount provided (for example custom payment)
        amount = paymentData.amount;
      } else {
        // Use default amount for this payment type
        amount = await getPaymentAmount(paymentData.type);
      }
      
      // Generate transaction reference
      const transactionRef = generateTransactionReference();
      
      // Set up redirect URL (use provided or default)
      const redirectUrl = paymentData.redirectUrl || `${process.env.APP_URL || 'http://localhost:5000'}/api/payments/callback`;
      
      // Create payment record in database
      const paymentRecord = await storage.createPayment({
        userId: paymentData.userId,
        amount: amount.toString(),
        currency: DEFAULT_CURRENCY,
        type: paymentData.type,
        status: 'pending',
        transactionRef,
        itemId: paymentData.itemId,
        reportId: paymentData.reportId,
        packageId: packageData?.id
      });
      
      // Get payment description based on package or type
      const description = await getPaymentDescription(
        paymentData.type,
        packageData?.id
      );
      
      // Initialize payment with Flutterwave
      const flutterwaveResponse = await initializePayment({
        amount,
        currency: DEFAULT_CURRENCY,
        tx_ref: transactionRef,
        redirect_url: redirectUrl,
        customer: {
          email: user.email,
          phone_number: user.phoneNumber || undefined,
          name: user.fullName
        },
        customizations: {
          title: 'KIZERE Platform',
          description
        },
        meta: {
          payment_id: paymentRecord.id,
          user_id: user.id,
          payment_type: paymentData.type,
          package_id: packageData?.id
        }
      });
      
      if (!flutterwaveResponse.data?.link) {
        logger.error('No payment URL returned from payment provider', { transactionRef });
        throw new Error('Failed to initialize payment with provider');
      }
      
      logger.info('Payment initialized successfully', { 
        paymentId: paymentRecord.id, 
        transactionRef,
        amount,
        packageId: packageData?.id
      });
      
      return {
        paymentId: paymentRecord.id,
        transactionRef,
        amount,
        currency: DEFAULT_CURRENCY,
        paymentUrl: flutterwaveResponse.data.link,
        redirectUrl
      };
    } catch (error) {
      logger.error('Error initializing payment', { error });
      throw error;
    }
  }
  
  /**
   * Verify a payment
   * 
   * @param transactionRef Transaction reference
   * @returns Payment verification response
   */
  static async verifyPayment(transactionRef: string): Promise<PaymentVerificationResponse> {
    try {
      logger.info('Verifying payment', { transactionRef });
      
      // Get payment from database
      const payment = await storage.getPaymentByTransactionRef(transactionRef);
      if (!payment) {
        logger.warn('Payment not found for verification', { transactionRef });
        return {
          status: 'failed',
          message: 'Payment not found',
          transactionRef
        };
      }
      
      // If payment is already successful, no need to verify again
      if (payment.status === 'successful') {
        logger.info('Payment already verified as successful', { transactionRef });
        return {
          status: 'successful',
          message: 'Payment completed successfully',
          transactionRef,
          amount: Number(payment.amount),
          paymentDate: payment.paymentDate?.toISOString()
        };
      }
      
      // If payment is already failed or cancelled, return status
      if (payment.status === 'failed' || payment.status === 'cancelled') {
        logger.info(`Payment already verified as ${payment.status}`, { transactionRef });
        return {
          status: payment.status,
          message: payment.status === 'failed' ? 'Payment failed' : 'Payment was cancelled',
          transactionRef
        };
      }
      
      // If payment has a transactionId, verify with payment provider
      if (payment.transactionId) {
        try {
          logger.info('Verifying payment with provider', { transactionId: payment.transactionId });
          
          const verificationResponse = await verifyTransaction(payment.transactionId);
          
          // Update payment status based on verification
          const newStatus: PaymentStatus = verificationResponse.data.status === 'successful' ? 'successful' : 
                                           verificationResponse.data.status === 'cancelled' ? 'cancelled' : 
                                           verificationResponse.data.status === 'failed' ? 'failed' : 'pending';
          
          // If payment is successful, update payment date
          const updateData: Partial<Payment> = { 
            status: newStatus,
            flutterwaveRef: verificationResponse.data.flw_ref
          };
          
          if (newStatus === 'successful' && !payment.paymentDate) {
            updateData.paymentDate = new Date();
          }
          
          // Update payment in database
          await storage.updatePayment(payment.id, updateData);
          
          logger.info('Payment verified with provider', { 
            transactionRef,
            status: newStatus
          });
          
          return {
            status: newStatus,
            message: newStatus === 'successful' ? 'Payment completed successfully' : 
                      newStatus === 'failed' ? 'Payment failed' : 
                      newStatus === 'cancelled' ? 'Payment was cancelled' : 'Payment is still pending',
            transactionRef,
            amount: Number(payment.amount),
            paymentDate: updateData.paymentDate?.toISOString()
          };
        } catch (verificationError) {
          logger.error('Error verifying payment with provider', { 
            transactionRef,
            transactionId: payment.transactionId,
            error: verificationError
          });
          
          // If verification failed, return current status
          return {
            status: payment.status as any,
            message: 'Unable to verify payment status',
            transactionRef
          };
        }
      }
      
      // If payment doesn't have a transactionId yet, it's still pending
      logger.info('Payment pending verification', { transactionRef });
      return {
        status: 'pending',
        message: 'Payment is still being processed',
        transactionRef
      };
    } catch (error) {
      logger.error('Error verifying payment', { transactionRef, error });
      throw error;
    }
  }
  
  /**
   * Update payment status
   * 
   * @param transactionRef Transaction reference
   * @param status New payment status
   * @param transactionId Optional transaction ID from payment provider
   * @returns Updated payment or undefined if not found
   */
  static async updatePaymentStatus(
    transactionRef: string, 
    status: PaymentStatus, 
    transactionId?: string
  ): Promise<Payment | undefined> {
    try {
      logger.info('Updating payment status', { transactionRef, status });
      
      // Get payment from database
      const payment = await storage.getPaymentByTransactionRef(transactionRef);
      if (!payment) {
        logger.warn('Payment not found for status update', { transactionRef });
        return undefined;
      }
      
      // Prepare update data
      const updateData: Partial<Payment> = { status };
      
      // Add transaction ID if provided
      if (transactionId) {
        updateData.transactionId = transactionId;
      }
      
      // Add payment date if status is successful and it doesn't have one yet
      if (status === 'successful' && !payment.paymentDate) {
        updateData.paymentDate = new Date();
      }
      
      // Update payment in database
      const updatedPayment = await storage.updatePayment(payment.id, updateData);
      
      logger.info('Payment status updated', { 
        paymentId: payment.id,
        transactionRef,
        status
      });
      
      return updatedPayment;
    } catch (error) {
      logger.error('Error updating payment status', { transactionRef, status, error });
      throw error;
    }
  }
  
  /**
   * Get payment by ID
   * 
   * @param id Payment ID
   * @returns Payment or undefined if not found
   */
  static async getPaymentById(id: number): Promise<Payment | undefined> {
    try {
      logger.info('Getting payment by ID', { paymentId: id });
      return await storage.getPayment(id);
    } catch (error) {
      logger.error('Error getting payment by ID', { paymentId: id, error });
      throw error;
    }
  }
  
  /**
   * Get payment by transaction reference
   * 
   * @param transactionRef Transaction reference
   * @returns Payment or undefined if not found
   */
  static async getPaymentByTransactionRef(transactionRef: string): Promise<Payment | undefined> {
    try {
      logger.info('Getting payment by transaction reference', { transactionRef });
      return await storage.getPaymentByTransactionRef(transactionRef);
    } catch (error) {
      logger.error('Error getting payment by transaction reference', { transactionRef, error });
      throw error;
    }
  }
  
  /**
   * Get user payments
   * 
   * @param userId User ID
   * @returns Array of payments
   */
  static async getUserPayments(userId: number): Promise<Payment[]> {
    try {
      logger.info('Getting user payments', { userId });
      return await storage.getUserPayments(userId);
    } catch (error) {
      logger.error('Error getting user payments', { userId, error });
      throw error;
    }
  }
  
  /**
   * Get all payments (admin only)
   * 
   * @returns Array of all payments
   */
  static async getAllPayments(): Promise<Payment[]> {
    try {
      logger.info('Getting all payments');
      return await storage.getAllPayments();
    } catch (error) {
      logger.error('Error getting all payments', { error });
      throw error;
    }
  }
  
  /**
   * Get payments with filters (admin only)
   * 
   * @param options Filter options
   * @returns Filtered payments and total count
   */
  static async getPaymentsWithFilters(options: {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    type?: string;
    dateFilter?: { start: Date; end: Date } | null;
  }): Promise<{ payments: Payment[]; total: number }> {
    try {
      logger.info('Getting payments with filters', { options });
      return await storage.getPaymentsWithFilters(options);
    } catch (error) {
      logger.error('Error getting payments with filters', { options, error });
      throw error;
    }
  }
  
  /**
   * Get payment summary statistics (admin only)
   * 
   * @returns Payment summary
   */
  static async getPaymentSummary(): Promise<{
    totalRevenue: number;
    registrationRevenue: number;
    lostReportRevenue: number;
    pendingPayments: number;
    recentTransactions: Payment[];
  }> {
    try {
      logger.info('Getting payment summary');
      
      // Get all payments
      const allPayments = await this.getAllPayments();
      
      // Calculate total revenue (from successful payments only)
      const successfulPayments = allPayments.filter(payment => payment.status === 'successful');
      const totalRevenue = successfulPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      
      // Calculate revenue by payment type
      const registrationPayments = successfulPayments.filter(payment => payment.type === 'registration');
      const lostReportPayments = successfulPayments.filter(payment => payment.type === 'lost_report');
      
      const registrationRevenue = registrationPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const lostReportRevenue = lostReportPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      
      // Count pending payments
      const pendingPayments = allPayments.filter(payment => payment.status === 'pending').length;
      
      // Get 5 most recent transactions
      const recentTransactions = [...allPayments]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      
      return {
        totalRevenue,
        registrationRevenue,
        lostReportRevenue,
        pendingPayments,
        recentTransactions
      };
    } catch (error) {
      logger.error('Error getting payment summary', { error });
      throw error;
    }
  }
}