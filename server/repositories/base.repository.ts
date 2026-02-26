/**
 * Base Repository
 * Generic repository pattern implementation for consistent data access
 */
import { db } from '../db';
import { createLogger } from '../utils/logger';
import { DatabaseError, NotFoundError } from '../utils/error-handler';
import { eq, and, SQL, sql } from 'drizzle-orm';

const logger = createLogger('BaseRepository');

/**
 * Base repository// This will be decided after inspection
 */
export abstract class BaseRepository<T, InsertT, IdType = number> {
  constructor(
    protected readonly table: any,
    protected readonly idColumn: any,
    protected readonly tableName: string
  ) { }

  /**
   * Find an entity by ID
   * @param id Entity ID to look up
   * @returns Entity or undefined if not found
   */
  async findById(id: IdType): Promise<T | undefined> {
    try {
      const results = await db
        .select()
        .from(this.table)
        .where(eq(this.idColumn, id as any))
        .limit(1);

      return results.length > 0 ? results[0] as T : undefined;
    } catch (error) {
      logger.error(`Error finding ${this.tableName} by ID`, { id, error });
      throw new DatabaseError(`Failed to retrieve ${this.tableName}`);
    }
  }

  /**
   * Find entities by a field value
   * @param field Field to filter by
   * @param value Value to match
   * @returns Array of matching entities
   */
  async findByField(field: any, value: any): Promise<T[]> {
    try {
      return await db
        .select()
        .from(this.table)
        .where(eq(field, value)) as T[];
    } catch (error) {
      logger.error(`Error finding ${this.tableName} by field`, { fieldName: (field as any).name, value, error });
      throw new DatabaseError(`Failed to retrieve ${this.tableName} by field`);
    }
  }

  /**
   * Find a single entity by a field value
   * @param field Field to filter by
   * @param value Value to match
   * @returns Entity or undefined if not found
   */
  async findOneByField(field: any, value: any): Promise<T | undefined> {
    try {
      const results = await db
        .select()
        .from(this.table)
        .where(eq(field, value))
        .limit(1);

      return results.length > 0 ? results[0] as T : undefined;
    } catch (error) {
      logger.error(`Error finding ${this.tableName} by field`, { fieldName: (field as any).name, value, error });
      throw new DatabaseError(`Failed to retrieve ${this.tableName} by field`);
    }
  }

  /**
   * Find entities with multiple conditions
   * @param conditions Array of SQL conditions to apply
   * @returns Array of matching entities
   */
  async findByConditions(conditions: SQL[]): Promise<T[]> {
    try {
      return await db
        .select()
        .from(this.table)
        .where(and(...conditions)) as T[];
    } catch (error) {
      logger.error(`Error finding ${this.tableName} by conditions`, { error });
      throw new DatabaseError(`Failed to retrieve ${this.tableName} by conditions`);
    }
  }

  /**
   * Get all entities
   * @returns Array of all entities
   */
  async findAll(): Promise<T[]> {
    try {
      return await db
        .select()
        .from(this.table) as T[];
    } catch (error) {
      logger.error(`Error getting all ${this.tableName}`, { error });
      throw new DatabaseError(`Failed to retrieve ${this.tableName} list`);
    }
  }

  /**
   * Create a new entity
   * @param data Entity data to create
   * @returns Created entity
   */
  async create(data: InsertT): Promise<T> {
    try {
      const [result] = await db
        .insert(this.table)
        .values(data as any)
        .returning() as any[];

      logger.info(`Created ${this.tableName} successfully`, { id: result.id });
      return result as T;
    } catch (error) {
      logger.error(`Error creating ${this.tableName}`, { data, error });
      throw new DatabaseError(`Failed to create ${this.tableName}`);
    }
  }

  /**
   * Update an entity
   * @param id Entity ID to update
   * @param data Data to update
   * @returns Updated entity
   */
  async update(id: IdType, data: Partial<T>): Promise<T> {
    try {
      // Check if entity exists
      const entity = await this.findById(id);
      if (!entity) {
        throw new NotFoundError(this.tableName);
      }

      const updateData = {
        ...data as any,
        updatedAt: new Date()
      };

      const [updated] = await db
        .update(this.table)
        .set(updateData)
        .where(eq(this.idColumn, id as any))
        .returning();

      logger.info(`Updated ${this.tableName} successfully`, { id });
      return updated as T;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(`Error updating ${this.tableName}`, { id, data, error });
      throw new DatabaseError(`Failed to update ${this.tableName}`);
    }
  }

  /**
   * Delete an entity
   * @param id Entity ID to delete
   * @returns True if deletion was successful
   */
  async delete(id: IdType): Promise<boolean> {
    try {
      // Check if entity exists
      const entity = await this.findById(id);
      if (!entity) {
        throw new NotFoundError(this.tableName);
      }

      await db
        .delete(this.table)
        .where(eq(this.idColumn, id as any));

      logger.info(`Deleted ${this.tableName} successfully`, { id });
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(`Error deleting ${this.tableName}`, { id, error });
      throw new DatabaseError(`Failed to delete ${this.tableName}`);
    }
  }

  /**
   * Count entities
   * @param conditions Optional SQL conditions to apply
   * @returns Count of matching entities
   */
  async count(conditions?: SQL[]): Promise<number> {
    try {
      let queryBuilder: any = db
        .select({ count: sql<number>`count(*)::int` })
        .from(this.table);

      if (conditions?.length) {
        queryBuilder = queryBuilder.where(and(...conditions));
      }

      const result = await queryBuilder;
      return Number(result[0]?.count || 0);
    } catch (error) {
      logger.error(`Error counting ${this.tableName}`, { error });
      throw new DatabaseError(`Failed to count ${this.tableName}`);
    }
  }
}