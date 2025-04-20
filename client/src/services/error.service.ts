/**
 * Centralized Error Service
 * 
 * Provides standardized error handling, tracking, and reporting
 * across the application.
 */
import { createLogger } from '../lib/logger';

const logger = createLogger('ErrorService');

// Unique error ID generator
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Error types for categorization
export type ErrorCategory = 
  | 'auth' 
  | 'api' 
  | 'validation' 
  | 'network' 
  | 'payment'
  | 'database'
  | 'unknown';

// Base application error class
export class AppError extends Error {
  public readonly id: string;
  public readonly category: ErrorCategory;
  public readonly timestamp: Date;
  public readonly originalError?: Error;

  constructor(
    message: string, 
    category: ErrorCategory = 'unknown', 
    originalError?: Error
  ) {
    super(message);
    this.name = 'AppError';
    this.id = generateErrorId();
    this.category = category;
    this.timestamp = new Date();
    this.originalError = originalError;

    // Log the error immediately upon creation
    logger.error(`${this.category.toUpperCase()} ERROR [${this.id}]: ${this.message}`, {
      errorId: this.id,
      category: this.category,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack
      } : undefined
    });
  }
}

// Specialized error classes
export class AuthError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, 'auth', originalError);
    this.name = 'AuthError';
  }
}

export class ApiError extends AppError {
  public readonly statusCode?: number;
  
  constructor(message: string, statusCode?: number, originalError?: Error) {
    super(message, 'api', originalError);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

export class ValidationError extends AppError {
  public readonly fields?: Record<string, string>;
  
  constructor(message: string, fields?: Record<string, string>, originalError?: Error) {
    super(message, 'validation', originalError);
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

export class NetworkError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, 'network', originalError);
    this.name = 'NetworkError';
  }
}

export class PaymentError extends AppError {
  public readonly transactionId?: string;
  
  constructor(message: string, transactionId?: string, originalError?: Error) {
    super(message, 'payment', originalError);
    this.name = 'PaymentError';
    this.transactionId = transactionId;
  }
}

export class DatabaseError extends AppError {
  public readonly query?: string;
  
  constructor(message: string, query?: string, originalError?: Error) {
    super(message, 'database', originalError);
    this.name = 'DatabaseError';
    this.query = query;
  }
}

/**
 * ErrorService for centralized error handling and reporting
 */
export class ErrorService {
  /**
   * Report an error to monitoring system
   * @param error The error to report
   */
  static reportError(error: AppError | Error): void {
    if (!(error instanceof AppError)) {
      error = new AppError(error.message, 'unknown', error);
    }
    
    logger.error(`Error reported: ${error.message}`, { error });
    
    // TODO: Implement external error reporting service integration
    // if in production environment
    if (import.meta.env.PROD) {
      // Example: 
      // sendToErrorMonitoring(error);
      // or 
      // sendToCentralizedLogging(error);
    }
  }
  
  /**
   * Handle API fetch error and transform into appropriate error type
   * @param error Original fetch error
   * @param endpoint API endpoint that was called
   */
  static handleApiError(error: Error, endpoint: string): AppError {
    if (error instanceof AppError) {
      return error;
    }
    
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      return new NetworkError(
        `Network error while calling ${endpoint}. Please check your connection.`, 
        error
      );
    }
    
    return new ApiError(
      `API error while calling ${endpoint}: ${error.message}`, 
      undefined, 
      error
    );
  }
  
  /**
   * Handle authentication error
   * @param error Original error
   * @param operation What auth operation was being performed
   */
  static handleAuthError(error: Error, operation: string): AuthError {
    return new AuthError(
      `Authentication failed during ${operation}: ${error.message}`,
      error
    );
  }
  
  /**
   * Handle payment processing error
   * @param error Original error
   * @param transactionId Optional transaction ID
   */
  static handlePaymentError(error: Error, transactionId?: string): PaymentError {
    return new PaymentError(
      `Payment processing failed: ${error.message}`,
      transactionId,
      error
    );
  }
  
  /**
   * Get a user-friendly error message regardless of error type
   * @param error Any error object
   */
  static getUserFriendlyMessage(error: any): string {
    if (error instanceof AppError) {
      switch (error.category) {
        case 'auth':
          return 'Authentication failed. Please check your credentials and try again.';
        case 'network':
          return 'Network connection issue. Please check your internet connection and try again.';
        case 'validation':
          return 'Please check the form for errors and try again.';
        case 'payment':
          return 'Payment processing failed. Please try again or use a different payment method.';
        case 'api':
          return 'The service is temporarily unavailable. Please try again later.';
        case 'database':
          return 'A data error occurred. Please contact support if the issue persists.';
        default:
          return 'An unexpected error occurred. Please try again later.';
      }
    }
    
    return error?.message || 'An unknown error occurred. Please try again later.';
  }
}