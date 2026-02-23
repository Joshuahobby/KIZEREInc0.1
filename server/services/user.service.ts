/**
 * User Service
 * Handles all user-related business logic
 */
import { User, InsertUser } from '@shared/schema';
import { createLogger } from '../utils/logger';
import { validatePasswordStrength } from '../utils/auth-crypto';
import { DatabaseError, NotFoundError, ValidationError } from '../utils/error-handler';
import { userRepository } from '../repositories/user.repository';

const logger = createLogger('UserService');

export class UserService {
  /**
   * Get user by ID
   * @param userId User ID to look up
   * @returns User object or undefined if not found
   */
  static async getUserById(userId: number): Promise<User | undefined> {
    try {
      logger.info('Getting user by ID', { userId });
      return await userRepository.findById(userId);
    } catch (error) {
      logger.error('Error getting user by ID', { userId, error });
      throw new DatabaseError('Failed to retrieve user', { userId });
    }
  }

  /**
   * Get user by email
   * @param email Email to look up
   * @returns User object or undefined if not found
   */
  static async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      logger.info('Getting user by email', { email });
      return await userRepository.findByEmail(email);
    } catch (error: any) {
      logger.error('Error getting user by email', { email, error });
      throw new DatabaseError(`Failed to retrieve user by email: ${error.message}`);
    }
  }

  /**
   * Get user by username
   * @param username Username to look up
   * @returns User object or undefined if not found
   */
  static async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      return await userRepository.findByUsername(username);
    } catch (error) {
      logger.error('Error getting user by username', { username, error });
      throw new DatabaseError('Failed to retrieve user by username');
    }
  }

  /**
   * Create a new user
   * @param userData User data to create
   * @returns Created user object
   */
  static async createUser(userData: InsertUser): Promise<User> {
    try {
      // Validate password strength if provided
      if (userData.password) {
        const validation = validatePasswordStrength(userData.password);
        if (!validation.valid) {
          throw new ValidationError(validation.message || 'Password does not meet strength requirements');
        }
      }

      // Check if email is already in use
      const existingEmail = await userRepository.findByEmail(userData.email);
      if (existingEmail) {
        throw new ValidationError('Email address is already in use');
      }

      // Check if username is already in use (if provided)
      if (userData.username) {
        const existingUsername = await userRepository.findByUsername(userData.username);
        if (existingUsername) {
          throw new ValidationError('Username is already in use');
        }
      }

      const user = await userRepository.create(userData);
      logger.info('User created successfully', { userId: user.id, email: userData.email });
      return user;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error creating user', { error, email: userData.email });
      throw new DatabaseError('Failed to create user account');
    }
  }

  /**
   * Update an existing user
   * @param userId User ID to update
   * @param userData Data to update
   * @returns Updated user object
   */
  static async updateUser(userId: number, userData: Partial<User>): Promise<User> {
    try {
      // Validate password strength if being updated
      if (userData.password) {
        const validation = validatePasswordStrength(userData.password);
        if (!validation.valid) {
          throw new ValidationError(validation.message || 'Password does not meet strength requirements');
        }
      }

      // Check if email is being changed and is already in use
      if (userData.email) {
        const existingEmail = await userRepository.findByEmail(userData.email);
        if (existingEmail && existingEmail.id !== userId) {
          throw new ValidationError('Email address is already in use');
        }
      }

      // Check if username is being changed and is already in use
      if (userData.username) {
        const existingUsername = await userRepository.findByUsername(userData.username);
        if (existingUsername && existingUsername.id !== userId) {
          throw new ValidationError('Username is already in use');
        }
      }

      const updatedUser = await userRepository.update(userId, userData);
      logger.info('User updated successfully', { userId });
      return updatedUser;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error updating user', { userId, error });
      throw new DatabaseError('Failed to update user');
    }
  }

  /**
   * Get all users
   * @returns Array of all users
   */
  static async getAllUsers(): Promise<User[]> {
    try {
      return await userRepository.findAll();
    } catch (error) {
      logger.error('Error getting all users', { error });
      throw new DatabaseError('Failed to retrieve users');
    }
  }

  /**
   * Delete a user
   * @param userId User ID to delete
   * @returns True if deletion was successful
   */
  static async deleteUser(userId: number): Promise<boolean> {
    try {
      return await userRepository.delete(userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error deleting user', { userId, error });
      throw new DatabaseError('Failed to delete user');
    }
  }

  /**
   * Find users by role
   * @param role Role to filter by
   * @returns Users with the specified role
   */
  static async getUsersByRole(role: string): Promise<User[]> {
    try {
      return await userRepository.findByRole(role);
    } catch (error) {
      logger.error('Error getting users by role', { role, error });
      throw new DatabaseError('Failed to retrieve users by role');
    }
  }

  /**
   * Search users by query
   * @param query Search query (name, email, username)
   * @returns Matching users
   */
  static async searchUsers(query: string): Promise<User[]> {
    try {
      return await userRepository.searchUsers(query);
    } catch (error) {
      logger.error('Error searching users', { query, error });
      throw new DatabaseError('Failed to search users');
    }
  }
}