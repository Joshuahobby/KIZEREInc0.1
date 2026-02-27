/**
 * Centralized error handling
 * Provides standardized error classes and handlers for consistent error management
 */
import { Response } from 'express';
import { ZodError } from 'zod';
import crypto from 'crypto';
import { createLogger } from './logger';

const logger = createLogger('ErrorHandler');

/**
 * Custom application error class with additional metadata
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Database-related error class
 */
export class DatabaseError extends AppError {
  constructor(
    message: string = 'Database operation failed',
    details?: any
  ) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

/**
 * Authentication-related error class
 */
export class AuthenticationError extends AppError {
  constructor(
    message: string = 'Authentication failed',
    details?: any
  ) {
    super(message, 401, 'AUTHENTICATION_ERROR', details);
  }
}

/**
 * Authorization-related error class
 */
export class AuthorizationError extends AppError {
  constructor(
    message: string = 'You do not have permission to perform this action',
    details?: any
  ) {
    super(message, 403, 'AUTHORIZATION_ERROR', details);
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends AppError {
  constructor(
    resource: string = 'Resource',
    details?: any
  ) {
    super(`${resource} not found`, 404, 'NOT_FOUND', details);
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  constructor(
    message: string = 'Validation failed',
    details?: any
  ) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * Handle request errors with standardized responses
 * @param error Error to handle
 * @param res Express response object
 */
export function handleRequestError(error: any, res: Response): void {
  // Generate unique error ID for tracking
  const errorId = crypto.randomUUID();

  if (error instanceof ZodError) {
    // Handle validation errors from Zod
    const formattedErrors = error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message
    }));

    logger.warn('Validation error', {
      errorId,
      errors: formattedErrors
    });

    res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: formattedErrors,
      errorId
    });
  } else if (error instanceof AppError) {
    // Handle application-specific errors
    const logMethod = error.statusCode >= 500 ? 'error' : 'warn';

    logger[logMethod](`${error.name}: ${error.message}`, {
      errorId,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      stack: error.stack
    });

    // Send response with appropriate details
    // Hide detailed error information in production
    const responseBody = {
      status: 'error',
      message: error.message,
      code: error.code,
      errorId,
      ...(process.env.NODE_ENV !== 'production' && {
        details: error.details
      })
    };

    res.status(error.statusCode).json(responseBody);
  } else if (error.statusCode || error.status) {
    // Handle other errors that have a status code (like CSRF errors)
    const statusCode = error.statusCode || error.status;
    const logMethod = statusCode >= 500 ? 'error' : 'warn';

    logger[logMethod](`Status Error: ${error.message || 'Error occurred'}`, {
      errorId,
      statusCode,
      stack: error.stack
    });

    res.status(statusCode).json({
      status: 'error',
      message: error.message || 'An error occurred',
      errorId
    });
  } else {
    // Handle unexpected errors
    logger.error('Unexpected error', {
      errorId,
      error,
      stack: error.stack,
      message: error.message || 'Unknown error'
    });

    // Generic error response for unknown errors
    // Avoid exposing internal details in production
    res.status(500).json({
      status: 'error',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : error.message || 'Unknown error',
      errorId
    });
  }
}