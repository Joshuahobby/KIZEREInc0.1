import { z } from 'zod';
import { InsertUser, UserLogin } from '@shared/schema';

/**
 * Authentication Model
 * 
 * This model handles authentication-related functionality such as
 * user login, registration, validation, and state management.
 */
export class AuthModel {
  /**
   * Custom validator for username, which can be an email or phone number
   * - Phone numbers should follow Rwanda format (+250 XXX XXX XXX)
   * - Can also be a standard email format
   */
  static usernameValidator = z.string().min(3, "Username is required").refine((value) => {
    // Check if it's an email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Check if it's a Rwandan phone number
    // Format: +250 XXX XXX XXX or without spaces
    const rwandaPhoneRegex = /^(\+250|0)?[79][0-9]{8}$/;
    
    return emailRegex.test(value) || rwandaPhoneRegex.test(value);
  }, {
    message: "Enter a valid email or phone number (+250XXXXXXXXX)",
  });

  // Login Schema
  static loginSchema = z.object({
    username: z.string().min(1, "Username, email, or phone is required"),
    password: z.string().min(1, "Password is required"),
  });

  // Simplified Registration Schema
  static registerSchema = z.object({
    fullName: z.string().min(3, "Full name must be at least 3 characters"),
    username: this.usernameValidator,
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
  }).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

  /**
   * Prepare user login data
   * @param loginData - Raw login form data
   * @returns Validated login data for API
   */
  static prepareLoginData(loginData: z.infer<typeof this.loginSchema>): UserLogin {
    return {
      username: loginData.username,
      password: loginData.password
    };
  }

  /**
   * Prepare user registration data
   * @param registerData - Raw registration form data
   * @returns Validated registration data for API
   */
  static prepareRegisterData(registerData: z.infer<typeof this.registerSchema>): InsertUser {
    const { confirmPassword, ...userData } = registerData;
    
    // Check if username is an email or phone number
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.username);
    
    return {
      ...userData,
      email: isEmail ? userData.username : `${userData.username}@kizere.user`, // Generate an email if username is a phone
      phoneNumber: !isEmail ? userData.username : null, // Set phoneNumber if username is a phone
      role: 'Subscriber'
    };
  }

  /**
   * Validate password strength
   * @param password - Password to validate
   * @returns Object with validation result and message
   */
  static validatePasswordStrength(password: string): { isStrong: boolean; message: string } {
    if (password.length < 8) {
      return { isStrong: false, message: 'Password should be at least 8 characters' };
    }
    
    if (!/[A-Z]/.test(password)) {
      return { isStrong: false, message: 'Password should include at least one uppercase letter' };
    }
    
    if (!/[a-z]/.test(password)) {
      return { isStrong: false, message: 'Password should include at least one lowercase letter' };
    }
    
    if (!/[0-9]/.test(password)) {
      return { isStrong: false, message: 'Password should include at least one number' };
    }
    
    if (!/[^A-Za-z0-9]/.test(password)) {
      return { isStrong: false, message: 'Password should include at least one special character' };
    }
    
    return { isStrong: true, message: 'Strong password' };
  }

  /**
   * Validate if a string is a Rwandan phone number
   * @param value - The string to validate
   * @returns Boolean indicating if it's a valid Rwandan phone number
   */
  static isRwandanPhoneNumber(value: string): boolean {
    const rwandaPhoneRegex = /^(\+250|0)?[79][0-9]{8}$/;
    return rwandaPhoneRegex.test(value);
  }

  /**
   * Format a phone number to the standard Rwandan format
   * @param phone - The phone number to format
   * @returns Formatted phone number
   */
  static formatRwandanPhoneNumber(phone: string): string {
    if (!this.isRwandanPhoneNumber(phone)) return phone;

    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Handle different formats
    let normalizedNumber = digits;
    if (digits.length === 9) {
      // If it's 9 digits, assume it's already without the country code
      normalizedNumber = '+250' + digits;
    } else if (digits.length === 10 && digits.startsWith('0')) {
      // If it starts with 0, replace it with +250
      normalizedNumber = '+250' + digits.substring(1);
    } else if (digits.length === 12 && digits.startsWith('250')) {
      // If it starts with 250, add the + sign
      normalizedNumber = '+' + digits;
    }
    
    // Format as +250 XXX XXX XXX
    if (normalizedNumber.startsWith('+250') && normalizedNumber.length === 13) {
      return `+250 ${normalizedNumber.substring(4, 7)} ${normalizedNumber.substring(7, 10)} ${normalizedNumber.substring(10)}`;
    }
    
    return phone; // Return original if we couldn't format it
  }
}