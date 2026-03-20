/**
 * Essential Utilities
 * Clean implementations without performance monitoring overhead
 */

// Simple Cache Implementation
interface CacheOptions {
  maxSize?: number;
  maxItems?: number;
  ttl?: number;
}

interface CacheItem<T> {
  value: T;
  timestamp: number;
}

export class OptimizedCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private maxItems: number;
  private ttl: number;

  constructor(options: CacheOptions = {}) {
    this.maxItems = options.maxItems || 500;
    this.ttl = options.ttl || 900000; // 15 minutes
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  set(key: string, value: T): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxItems) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Simple Debounce Function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Simple Throttle Function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Simple Batch Processor
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: { batchSize?: number; delay?: number } | number = 10
): Promise<R[]> {
  const batchSize = typeof options === 'number' ? options : (options.batchSize || 10);
  const delay = typeof options === 'object' ? (options.delay || 0) : 0;
  
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
    
    // Add delay between batches if specified
    if (delay > 0 && i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return results;
}

// No-op replacements for removed performance monitoring
export const measureSync = <T>(label: string, fn: () => T): T => fn();
export const measureAsync = async <T>(label: string, fn: () => Promise<T>): Promise<T> => fn();

// Mock performance monitor (no-op)
export const performanceMonitor = {
  startTiming: (label: string) => () => {}, // Returns no-op function
  clear: () => {},
  getAllStats: () => ({})
};

// Simple Virtual Scrolling Hook (minimal implementation)
export function useVirtualScrolling(items: any[], itemHeight: number = 100) {
  return {
    visibleItems: items, // Return all items for simplicity
    containerProps: {},
    scrollToIndex: (index: number) => {}
  };
}