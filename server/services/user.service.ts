/**
 * User Service
 * 
 * Centralizes all user-related business logic and operations.
 * This service acts as an intermediary between routes and storage layer.
 */

import { storage } from '../storage';
import { User, InsertUser } from '@shared/schema';
import { createLogger } from '../utils/logger';

const logger = createLogger('UserService');

/**
 * User Service class
 * Handles all user-related business logic
 */
export class UserService {
  /**
   * Get a user by ID
   * 
   * @param id User ID
   * @returns User object or undefined if not found
   */
  static async getUserById(id: number): Promise<User | undefined> {
    try {
      logger.info('Getting user by ID', { userId: id });
      return await storage.getUser(id);
    } catch (error) {
      logger.error('Error getting user by ID', { userId: id, error });
      throw error;
    }
  }
  
  /**
   * Get a user by username
   * 
   * @param username Username to look up
   * @returns User object or undefined if not found
   */
  static async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      logger.info('Getting user by username', { username });
      return await storage.getUserByUsername(username);
    } catch (error) {
      logger.error('Error getting user by username', { username, error });
      throw error;
    }
  }
  
  /**
   * Get a user by email
   * 
   * @param email Email to look up
   * @returns User object or undefined if not found
   */
  static async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      logger.info('Getting user by email', { email });
      return await storage.getUserByEmail(email);
    } catch (error) {
      logger.error('Error getting user by email', { email, error });
      throw error;
    }
  }
  
  /**
   * Create a new user
   * 
   * @param userData User data to create
   * @returns Created user object
   */
  static async createUser(userData: InsertUser): Promise<User> {
    try {
      logger.info('Creating new user', { email: userData.email });
      
      // Check if user with email already exists
      const existingUserByEmail = await this.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        logger.warn('User with this email already exists', { email: userData.email });
        throw new Error('User with this email already exists');
      }
      
      // Check if user with username already exists
      const existingUserByUsername = await this.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        logger.warn('User with this username already exists', { username: userData.username });
        throw new Error('User with this username already exists');
      }
      
      // Create the user
      const newUser = await storage.createUser(userData);
      logger.info('User created successfully', { userId: newUser.id });
      
      return newUser;
    } catch (error) {
      logger.error('Error creating user', { error });
      throw error;
    }
  }
  
  /**
   * Update an existing user
   * 
   * @param id User ID
   * @param userData User data to update
   * @returns Updated user object or undefined if not found
   */
  static async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    try {
      logger.info('Updating user', { userId: id });
      
      // Check if user exists
      const existingUser = await this.getUserById(id);
      if (!existingUser) {
        logger.warn('User not found for update', { userId: id });
        return undefined;
      }
      
      // If updating email, check if it's already in use by another user
      if (userData.email && userData.email !== existingUser.email) {
        const userWithEmail = await this.getUserByEmail(userData.email);
        if (userWithEmail && userWithEmail.id !== id) {
          logger.warn('Email already in use by another user', { email: userData.email });
          throw new Error('Email already in use by another user');
        }
      }
      
      // If updating username, check if it's already in use by another user
      if (userData.username && userData.username !== existingUser.username) {
        const userWithUsername = await this.getUserByUsername(userData.username);
        if (userWithUsername && userWithUsername.id !== id) {
          logger.warn('Username already in use by another user', { username: userData.username });
          throw new Error('Username already in use by another user');
        }
      }
      
      // Update the user
      const updatedUser = await storage.updateUser(id, userData);
      logger.info('User updated successfully', { userId: id });
      
      return updatedUser;
    } catch (error) {
      logger.error('Error updating user', { userId: id, error });
      throw error;
    }
  }
  
  /**
   * Get all users
   * 
   * @returns Array of all users
   */
  static async getAllUsers(): Promise<User[]> {
    try {
      logger.info('Getting all users');
      return await storage.getAllUsers();
    } catch (error) {
      logger.error('Error getting all users', { error });
      throw error;
    }
  }
  
  /**
   * Get user statistics
   * 
   * @returns User statistics
   */
  static async getUserStatistics(): Promise<{ totalUsers: number; newUsersThisWeek: number; activeUsers: number; usersByRole: Record<string, number> }> {
    try {
      logger.info('Getting user statistics');
      
      // Get all users
      const allUsers = await this.getAllUsers();
      
      // Calculate total users
      const totalUsers = allUsers.length;
      
      // Calculate new users this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const newUsersThisWeek = allUsers.filter(
        user => new Date(user.createdAt) > oneWeekAgo
      ).length;
      
      // Calculate active users (placeholder logic - in production this would use session data)
      const activeUsers = Math.floor(totalUsers * 0.7); // Placeholder logic
      
      // Calculate users by role
      const usersByRole = allUsers.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return {
        totalUsers,
        newUsersThisWeek,
        activeUsers,
        usersByRole
      };
    } catch (error) {
      logger.error('Error getting user statistics', { error });
      throw error;
    }
  }
}