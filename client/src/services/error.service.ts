/**
 * Error Service
 * 
 * A centralized service for handling errors consistently across the application.
 * This service provides standardized error handling, logging, and user feedback.
 */
import { useToast } from "@/hooks/use-toast";

// Define error types
export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: Record<string, any>;
  errorId?: string;
}

export interface ErrorDetails {
  message: string;
  title?: string;
  status?: number;
  code?: string;
  details?: Record<string, any>;
  errorId?: string;
}

/**
 * Error Service class
 * Provides static methods for consistent error handling
 */
export class ErrorService {
  private static toast = useToast().toast;
  private static errorCounter = 0;
  
  /**
   * Generate a sequential error ID
   * 
   * @returns A unique error ID for tracking
   */
  private static generateErrorId(): string {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
    const counter = String(++this.errorCounter).padStart(4, '0');
    return `ERR-${timestamp}-${counter}`;
  }
  
  /**
   * Handle API errors with consistent formatting
   * 
   * @param error The error to handle
   * @param fallbackMessage Optional fallback message if error doesn't have one
   * @returns Formatted error details
   */
  static handleApiError(error: unknown, fallbackMessage = "An unexpected error occurred"): ErrorDetails {
    console.error("API Error:", error);
    
    // Generate unique error ID for tracking
    const errorId = this.generateErrorId();
    
    if (error instanceof Response) {
      return {
        message: error.statusText || fallbackMessage,
        status: error.status,
        errorId
      };
    }
    
    if (this.isApiError(error)) {
      return {
        message: error.message || fallbackMessage,
        status: error.status,
        code: error.code,
        details: error.details,
        errorId: error.errorId || errorId
      };
    }
    
    if (error instanceof Error) {
      return {
        message: error.message || fallbackMessage,
        title: error.name || "Error",
        errorId
      };
    }
    
    // For unknown error types
    return {
      message: typeof error === 'string' ? error : fallbackMessage,
      errorId
    };
  }
  
  /**
   * Display an error toast notification with consistent formatting
   * 
   * @param error The error to display
   * @param fallbackMessage Optional fallback message if error doesn't have one
   */
  static notifyError(error: unknown, fallbackMessage = "An unexpected error occurred"): void {
    const errorDetails = this.handleApiError(error, fallbackMessage);
    
    this.toast({
      variant: "destructive",
      title: errorDetails.title || "Error",
      description: errorDetails.message,
    });
    
    // For development, log additional details to console
    if (process.env.NODE_ENV !== 'production') {
      console.error("Error Details:", errorDetails);
    }
  }
  
  /**
   * Create an API error object with standardized format
   * 
   * @param message Error message
   * @param status HTTP status code
   * @param code Error code
   * @param details Additional error details
   * @returns API error object
   */
  static createApiError(message: string, status?: number, code?: string, details?: Record<string, any>): ApiError {
    const error = new Error(message) as ApiError;
    error.status = status;
    error.code = code;
    error.details = details;
    error.errorId = this.generateErrorId();
    return error;
  }
  
  /**
   * Check if an error is an API error
   * 
   * @param error Error to check
   * @returns True if the error is an API error
   */
  static isApiError(error: unknown): error is ApiError {
    return error instanceof Error && ('status' in error || 'code' in error);
  }
  
  /**
   * Extract error message from a response
   * 
   * @param response Response object
   * @returns Error message
   */
  static async extractErrorMessageFromResponse(response: Response): Promise<string> {
    try {
      const data = await response.json();
      return data.message || data.error || response.statusText || 'An error occurred';
    } catch (e) {
      return response.statusText || 'An error occurred';
    }
  }
  
  /**
   * Create error from response
   * 
   * @param response Response object
   * @returns API error
   */
  static async createErrorFromResponse(response: Response): Promise<ApiError> {
    const message = await this.extractErrorMessageFromResponse(response);
    return this.createApiError(message, response.status);
  }
}

/**
 * HOC error wrapper for async functions
 * Use this to wrap async functions with consistent error handling
 * 
 * @param fn Function to wrap
 * @param errorHandler Error handler function
 * @returns Wrapped function
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorHandler: (error: unknown) => void = ErrorService.notifyError
): (...args: Parameters<T>) => Promise<ReturnType<T> | null> {
  return async (...args: Parameters<T>): Promise<ReturnType<T> | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      errorHandler(error);
      return null;
    }
  };
}