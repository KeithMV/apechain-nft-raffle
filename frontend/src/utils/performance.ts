/**
 * Performance Optimization Utilities
 * Critical performance helpers for Phase 3 optimization
 */

// Debounce utility for expensive operations
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

// Throttle utility for high-frequency events
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

// Memory-efficient batch processor
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 5,
  delay: number = 0
): Promise<R[]> {
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

// Optimized cache with size limits and TTL
export class OptimizedCache<T> {
  private cache = new Map<string, { data: T; timestamp: number; size: number }>();
  private maxSize: number;
  private maxItems: number;
  private ttl: number;
  private currentSize = 0;

  constructor(maxSize: number = 5 * 1024 * 1024, maxItems: number = 1000, ttl: number = 300000) {
    this.maxSize = maxSize;
    this.maxItems = maxItems;
    this.ttl = ttl;
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

// Virtual scrolling helper for large lists
export function useVirtualScrolling(
  itemCount: number,
  itemHeight: number,
  containerHeight: number,
  scrollTop: number
) {
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

// Image preloader with priority queue
export class ImagePreloader {
  private queue: Array<{ src: string; priority: number }> = [];
  private loading = new Set<string>();
  private loaded = new Set<string>();
  private maxConcurrent = 3;

  preload(src: string, priority: number = 0): Promise<void> {
    if (this.loaded.has(src) || this.loading.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.queue.push({ src, priority });
      this.queue.sort((a, b) => b.priority - a.priority);
      this.processQueue();
      
      const checkLoaded = () => {
        if (this.loaded.has(src)) {
          resolve();
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
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
      console.warn(`Failed to preload image: ${item.src}`);
    } finally {
      this.loading.delete(item.src);
      this.processQueue();
    }
  }

  private loadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();

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
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  getStats(label: string) {
    const values = this.metrics.get(label) || [];
    if (values.length === 0) return null;
    
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return { avg, min, max, count: values.length };
  }
}

export const performanceMonitor = new PerformanceMonitor();