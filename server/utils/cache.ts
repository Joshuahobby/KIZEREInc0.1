/**
 * Memory Caching Utility
 * Provides in-memory caching for frequently accessed data
 */
import { createLogger } from './logger';

const logger = createLogger('Cache');

// Cache configuration
interface CacheConfig {
  ttl: number;  // Time-to-live in seconds
  maxSize: number; // Maximum number of items in cache
}

// Cache entry with metadata
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  key: string;
}

/**
 * In-memory cache implementation with TTL and size limits
 */
export class MemoryCache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: CacheConfig;
  private name: string;
  
  constructor(name: string, config: Partial<CacheConfig> = {}) {
    this.name = name;
    this.config = {
      ttl: config.ttl || 300, // 5 minutes default
      maxSize: config.maxSize || 100
    };
    
    logger.info(`Created cache "${name}" with TTL=${this.config.ttl}s, maxSize=${this.config.maxSize}`);
    
    // Set up cleanup interval (every minute)
    setInterval(() => this.cleanup(), 60000);
  }
  
  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Optional custom TTL in seconds
   */
  set(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + ((ttl || this.config.ttl) * 1000);
    
    // Ensure we're not exceeding the max size
    if (!this.cache.has(key) && this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }
    
    this.cache.set(key, { value, expiresAt, key });
    logger.debug(`Cache "${this.name}": set "${key}"`);
  }
  
  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns Cached value or undefined if not found or expired
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    // Return undefined if entry not found or expired
    if (!entry || entry.expiresAt < Date.now()) {
      if (entry) {
        // Entry exists but expired, remove it
        this.cache.delete(key);
        logger.debug(`Cache "${this.name}": miss (expired) "${key}"`);
      } else {
        logger.debug(`Cache "${this.name}": miss (not found) "${key}"`);
      }
      return undefined;
    }
    
    logger.debug(`Cache "${this.name}": hit "${key}"`);
    return entry.value;
  }
  
  /**
   * Delete a specific key from the cache
   * @param key Cache key to delete
   */
  delete(key: string): void {
    this.cache.delete(key);
    logger.debug(`Cache "${this.name}": deleted "${key}"`);
  }
  
  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
    logger.info(`Cache "${this.name}": cleared all entries`);
  }
  
  /**
   * Get the current number of items in the cache
   */
  get size(): number {
    return this.cache.size;
  }
  
  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      logger.debug(`Cache "${this.name}": cleaned up ${expiredCount} expired entries`);
    }
  }
  
  /**
   * Evict the oldest entry in the cache
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.expiresAt < oldestTime) {
        oldestTime = entry.expiresAt;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      logger.debug(`Cache "${this.name}": evicted oldest entry "${oldestKey}"`);
    }
  }
}

// Create cache instances for different data types
export const userCache = new MemoryCache<any>('users', { ttl: 300 }); // 5 minutes
export const itemCache = new MemoryCache<any>('items', { ttl: 600 }); // 10 minutes
export const reportCache = new MemoryCache<any>('reports', { ttl: 600 }); // 10 minutes
export const statsCache = new MemoryCache<any>('stats', { ttl: 60 }); // 1 minute

/**
 * Decorator for caching the result of a method
 * @param cache Cache instance to use
 * @param keyPrefix Prefix for the cache key
 * @param ttl Optional custom TTL for this method
 */
export function cacheable(cache: MemoryCache, keyPrefix: string, ttl?: number) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      // Create a cache key from method name, prefix and arguments
      const cacheKey = `${keyPrefix}:${propertyKey}:${JSON.stringify(args)}`;
      
      // Check if result is already in cache
      const cachedResult = cache.get(cacheKey);
      if (cachedResult !== undefined) {
        return cachedResult;
      }
      
      // Execute the original method
      const result = await originalMethod.apply(this, args);
      
      // Store result in cache (if it's not undefined)
      if (result !== undefined) {
        cache.set(cacheKey, result, ttl);
      }
      
      return result;
    };
    
    return descriptor;
  };
}