/**
 * Performance Optimization Utilities
 * Modular performance helpers organized by functionality
 */

// =============================================================================
// DEBOUNCE AND THROTTLE UTILITIES
// =============================================================================

/**
 * Debounce utility for expensive operations
 * Delays execution until after wait time has elapsed since last call
 */
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

/**
 * Throttle utility for high-frequency events
 * Limits execution to once per limit period
 */
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

// =============================================================================
// BATCH PROCESSING UTILITIES
// =============================================================================

export interface BatchOptions {
  batchSize?: number;
  delay?: number;
  maxConcurrent?: number;
}

/**
 * Memory-efficient batch processor
 * Process items in batches to avoid memory issues
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: BatchOptions = {}
): Promise<R[]> {
  const { batchSize = 5, delay = 0 } = options;
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
    
    if (delay > 0 && i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return results;
}

/**
 * Process items with concurrency control
 */
export async function processConcurrent<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  maxConcurrent: number = 3
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];
  
  for (const item of items) {
    const promise = processor(item).then(result => {
      results.push(result);
    });
    
    executing.push(promise);
    
    if (executing.length >= maxConcurrent) {
      await Promise.race(executing);
      executing.splice(executing.findIndex(p => p === promise), 1);
    }
  }
  
  await Promise.all(executing);
  return results;
}

// =============================================================================
// CACHE UTILITIES
// =============================================================================

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

// =============================================================================
// VIRTUAL SCROLLING UTILITIES
// =============================================================================

export interface VirtualScrollResult {
  startIndex: number;
  endIndex: number;
  visibleItems: number;
  offsetY: number;
  totalHeight: number;
}

/**
 * Virtual scrolling helper for large lists
 */
export function useVirtualScrolling(
  itemCount: number,
  itemHeight: number,
  containerHeight: number,
  scrollTop: number
): VirtualScrollResult {
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 2;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 1);
  const endIndex = Math.min(itemCount, startIndex + visibleCount);
  
  return {
    startIndex,
    endIndex,
    visibleItems: endIndex - startIndex,
    offsetY: startIndex * itemHeight,
    totalHeight: itemCount * itemHeight
  };
}

// =============================================================================
// IMAGE PRELOADER UTILITIES
// =============================================================================

export interface PreloadItem {
  src: string;
  priority: number;
}

/**
 * Image preloader with priority queue
 */
export class ImagePreloader {
  private queue: PreloadItem[] = [];
  private loading = new Set<string>();
  private loaded = new Set<string>();
  private failed = new Set<string>();
  private maxConcurrent: number;
  private timeout: number;

  constructor(maxConcurrent: number = 3, timeout: number = 10000) {
    this.maxConcurrent = maxConcurrent;
    this.timeout = timeout;
  }

  preload(src: string, priority: number = 0): Promise<void> {
    if (this.loaded.has(src)) {
      return Promise.resolve();
    }
    
    if (this.failed.has(src)) {
      return Promise.reject(new Error(`Image previously failed to load: ${src}`));
    }
    
    if (this.loading.has(src)) {
      return this.waitForLoad(src);
    }

    return new Promise((resolve, reject) => {
      this.queue.push({ src, priority });
      this.queue.sort((a, b) => b.priority - a.priority);
      this.processQueue();
      
      this.waitForLoad(src).then(resolve).catch(reject);
    });
  }

  private async processQueue(): Promise<void> {
    if (this.loading.size >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    this.loading.add(item.src);

    try {
      await this.loadImage(item.src);
      this.loaded.add(item.src);
    } catch (error) {
      this.failed.add(item.src);
      console.warn(`Failed to preload image: ${item.src}`, error);
    } finally {
      this.loading.delete(item.src);
      this.processQueue();
    }
  }

  private loadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const timeoutId = setTimeout(() => {
        reject(new Error(`Image load timeout: ${src}`));
      }, this.timeout);

      img.onload = () => {
        clearTimeout(timeoutId);
        resolve();
      };
      
      img.onerror = (error) => {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to load image: ${src} - ${error}`));
      };
      
      img.src = src;
    });
  }

  private waitForLoad(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkStatus = () => {
        if (this.loaded.has(src)) {
          resolve();
        } else if (this.failed.has(src)) {
          reject(new Error(`Image failed to load: ${src}`));
        } else {
          setTimeout(checkStatus, 100);
        }
      };
      checkStatus();
    });
  }
}

// =============================================================================
// PERFORMANCE MONITORING UTILITIES
// =============================================================================

export interface PerformanceStats {
  avg: number;
  min: number;
  max: number;
  count: number;
  p95?: number;
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();
  private maxSamples: number;

  constructor(maxSamples: number = 100) {
    this.maxSamples = maxSamples;
  }

  startTiming(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(label, duration);
    };
  }

  recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    const values = this.metrics.get(label)!;
    values.push(value);
    
    // Keep only last N measurements
    if (values.length > this.maxSamples) {
      values.shift();
    }
  }

  getStats(label: string): PerformanceStats | null {
    const values = this.metrics.get(label) || [];
    if (values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const p95Index = Math.ceil(sorted.length * 0.95) - 1;
    
    return { 
      avg, 
      min, 
      max, 
      count: values.length,
      p95: sorted[Math.max(0, p95Index)]
    };
  }

  clear(): void {
    this.metrics.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();