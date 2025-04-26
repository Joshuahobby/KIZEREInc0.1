/**
 * Authentication utilities
 * Handles password hashing and verification
 */
import bcrypt from 'bcrypt';
import { createLogger } from './logger';

const logger = createLogger('AuthUtils');
const SALT_ROUNDS = 10;

/**
 * Hash a plain text password
 * @param password Plain text password to hash
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    logger.error('Error hashing password', { error });
    throw new Error('Failed to hash password');
  }
}

/**
 * Compare a plain text password with a hashed password
 * @param plainPassword Plain text password to compare
 * @param hashedPassword Hashed password to compare against
 * @returns True if passwords match
 */
export async function comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    logger.error('Error comparing passwords', { error });
    throw new Error('Failed to compare passwords');
  }
}

/**
 * Generates a random string token
 * @param length Length of the token to generate
 * @returns Random token string
 */
export function generateToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return token;
}

/**
 * Check if a password meets strength requirements
 * @param password Password to check
 * @returns Object with validation result and message
 */
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  if (!hasUppercase) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!hasLowercase) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!hasNumbers) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  if (!hasSpecialChars) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  
  return { valid: true };
}