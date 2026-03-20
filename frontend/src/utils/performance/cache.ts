/**
 * Cache Utilities
 * Optimized caching with size limits and TTL support
 */

export interface CacheOptions {
  maxSize?: number;
  maxItems?: number;
  ttl?: number;
}

/**
 * Optimized cache with size limits and TTL
 */
export class OptimizedCache<T> {
  private cache = new Map<string, { data: T; timestamp: number; size: number }>();
  private maxSize: number;
  private maxItems: number;
  private ttl: number;
  private currentSize = 0;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize ?? 5 * 1024 * 1024; // 5MB default
    this.maxItems = options.maxItems ?? 1000;
    this.ttl = options.ttl ?? 300000; // 5 minutes default
  }

  set(key: string, data: T): void {
    const size = this.estimateSize(data);
    const now = Date.now();
    
    // Remove expired entries
    this.cleanup();
    
    // Check size limits
    if (size > this.maxSize) return;
    
    // Make room if needed
    while (this.cache.size >= this.maxItems || this.currentSize + size > this.maxSize) {
      this.evictOldest();
    }
    
    this.cache.set(key, { data, timestamp: now, size });
    this.currentSize += size;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.currentSize -= entry.size;
      return null;
    }
    
    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      this.currentSize -= entry.size;
      return true;
    }
    return false;
  }

  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  size(): number {
    this.cleanup();
    return this.cache.size;
  }

  getStats(): { size: number; items: number; currentSize: number; maxSize: number } {
    this.cleanup();
    return {
      size: this.cache.size,
      items: this.cache.size,
      currentSize: this.currentSize,
      maxSize: this.maxSize
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        this.currentSize -= entry.size;
      }
    }
  }

  private evictOldest(): void {
    const oldest = Array.from(this.cache.entries())
      .sort(([,a], [,b]) => a.timestamp - b.timestamp)[0];
    
    if (oldest) {
      this.cache.delete(oldest[0]);
      this.currentSize -= oldest[1].size;
    }
  }

  private estimateSize(data: T): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate
    } catch {
      return 1000; // Default size
    }
  }
}

/**
 * Simple LRU Cache implementation
 */
export class LRUCache<T> {
  private cache = new Map<string, T>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: string, value: T): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Create a memoized version of a function with caching
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: CacheOptions = {}
): T {
  const cache = new OptimizedCache<ReturnType<T>>(options);
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    
    if (cached !== null) {
      return cached;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}