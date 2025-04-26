/**
 * User Repository
 * Handles data access operations for users
 */
import { BaseRepository } from './base.repository';
import { users, User, InsertUser } from '@shared/schema';
import { hashPassword } from '../utils/auth';
import { db } from '../db';
import { eq, or, like } from 'drizzle-orm';
import { createLogger } from '../utils/logger';
import { DatabaseError } from '../utils/error-handler';

const logger = createLogger('UserRepository');

/**
 * User Repository implementation
 */
export class UserRepository extends BaseRepository<User, InsertUser> {
  constructor() {
    super(users, users.id, 'User');
  }

  /**
   * Get user by email
   * @param email Email to look up
   * @returns User or undefined
   */
  async findByEmail(email: string): Promise<User | undefined> {
    return this.findOneByField(users.email, email);
  }

  /**
   * Get user by username
   * @param username Username to look up
   * @returns User or undefined
   */
  async findByUsername(username: string): Promise<User | undefined> {
    return this.findOneByField(users.username, username);
  }
  
  /**
   * Create a new user with password hashing
   * @param userData User data to create
   * @returns Created user
   */
  async create(userData: InsertUser): Promise<User> {
    // Hash password if provided
    if (userData.password) {
      userData.password = await hashPassword(userData.password);
    }
    
    return super.create(userData);
  }

  /**
   * Update user with password hashing if needed
   * @param id User ID to update
   * @param userData Data to update
   * @returns Updated user
   */
  async update(id: number, userData: Partial<User>): Promise<User> {
    // Hash password if it's being updated
    if (userData.password) {
      userData.password = await hashPassword(userData.password);
    }
    
    return super.update(id, userData);
  }

  /**
   * Find users by role
   * @param role Role to filter by
   * @returns Users with the specified role
   */
  async findByRole(role: string): Promise<User[]> {
    return this.findByField(users.role, role);
  }
  
  /**
   * Search users by name, email, or username
   * @param query Search query
   * @returns Matching users
   */
  async searchUsers(query: string): Promise<User[]> {
    try {
      const searchTerm = `%${query}%`;
      
      const results = await db
        .select()
        .from(users)
        .where(
          or(
            like(users.fullName, searchTerm),
            like(users.email, searchTerm),
            like(users.username, searchTerm)
          )
        );
      
      return results as User[];
    } catch (error) {
      logger.error('Error searching users', { query, error });
      throw new DatabaseError('Failed to search users');
    }
  }
  
  /**
   * Get users with pagination
   * @param page Page number (1-based)
   * @param pageSize Number of users per page
   * @returns Paginated users with total count
   */
  async getPaginatedUsers(page: number, pageSize: number): Promise<{ users: User[]; total: number }> {
    try {
      const offset = (page - 1) * pageSize;
      
      // Get total count first for optimization
      const total = await this.count();
      
      // Get paginated users
      const results = await db
        .select()
        .from(users)
        .limit(pageSize)
        .offset(offset)
        .orderBy(users.id);
      
      return {
        users: results as User[],
        total
      };
    } catch (error) {
      logger.error('Error getting paginated users', { page, pageSize, error });
      throw new DatabaseError('Failed to retrieve paginated users');
    }
  }
}

// Singleton instance
export const userRepository = new UserRepository();