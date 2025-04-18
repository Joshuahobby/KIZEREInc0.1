import { z } from 'zod';
import { InsertUser, UserLogin } from '@shared/schema';

/**
 * Authentication Model
 * 
 * This model handles authentication-related functionality such as
 * user login, registration, validation, and state management.
 */
export class AuthModel {
  // Login Schema
  static loginSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
  });

  // Registration Schema
  static registerSchema = z.object({
    fullName: z.string().min(3, "Full name must be at least 3 characters"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
    role: z.string().optional(),
  }).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

  // Type definitions will be used in components using this model
  // By using z.infer<typeof AuthModel.loginSchema> and z.infer<typeof AuthModel.registerSchema>

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
    
    return {
      ...userData,
      role: userData.role || 'Subscriber',
      phoneNumber: userData.phoneNumber || null
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
}