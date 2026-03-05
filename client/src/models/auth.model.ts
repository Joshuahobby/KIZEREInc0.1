import { z } from 'zod';
import { InsertUser, UserLogin, DEFAULT_USER_PREFERENCES } from '@shared/schema';

/**
 * Authentication Model
 * 
 * This model handles authentication-related functionality such as
 * user login, registration, validation, and state management.
 */
// Define class with static methods
class AuthModelClass {
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

  // Registration Schema matched with UI
  // Note: 'username' field accepts either email or phone number
  static registerSchema = z.object({
    fullName: z.string().min(3, "Full name must be at least 3 characters"),
    username: z.string().min(3, "Email or phone number is required").refine((value) => {
      // Accept email or Rwandan phone number
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const rwandaPhoneRegex = /^(\+250|0)?[79][0-9]{8}$/;
      return emailRegex.test(value) || rwandaPhoneRegex.test(value);
    }, {
      message: "Enter a valid email or phone number (+250XXXXXXXXX)",
    }),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
    role: z.enum(['Admin', 'Agent', 'Subscriber']).optional(),
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
    const { confirmPassword, username, ...userData } = registerData;

    // Determine if username is email or phone
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(username);

    return {
      ...userData,
      username: username, // Keep the original username
      email: isEmail ? username : `${username.replace(/[^a-zA-Z0-9]/g, '')}_${Math.floor(Math.random() * 10000)}@placeholder.kizere.rw`, // Use email or generate unique placeholder
      phoneNumber: !isEmail ? username : null,
      role: userData.role || 'Subscriber',
      preferences: DEFAULT_USER_PREFERENCES
    };
  }

  /**
   * Evaluate password strength and return a score (0-5)
   * @param password - Password to evaluate
   * @returns Score from 0 to 5
   */
  static evaluatePasswordStrength(password: string): number {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }

  /**
   * Validate password strength
   * @param password - Password to validate
   * @returns Object with validation result and message
   */
  static validatePasswordStrength(password: string): { isStrong: boolean; message: string; score: number } {
    const score = this.evaluatePasswordStrength(password);

    if (score < 3) {
      return { isStrong: false, message: 'Weak password', score };
    }

    return { isStrong: true, message: 'Strong password', score };
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

// Export an instance of the class
export const AuthModel = AuthModelClass;