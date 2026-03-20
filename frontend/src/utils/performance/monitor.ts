/**
 * Performance Monitoring Utilities
 * Track and analyze application performance metrics
 */

export interface PerformanceStats {
  avg: number;
  min: number;
  max: number;
  count: number;
  p95?: number;
  p99?: number;
}

export interface PerformanceEntry {
  label: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Performance monitoring class
 */
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();
  private entries: PerformanceEntry[] = [];
  private maxSamples: number;
  private maxEntries: number;

  constructor(maxSamples: number = 100, maxEntries: number = 1000) {
    this.maxSamples = maxSamples;
    this.maxEntries = maxEntries;
  }

  startTiming(label: string, metadata?: Record<string, any>): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(label, duration, metadata);
    };
  }

  recordMetric(label: string, value: number, metadata?: Record<string, any>): void {
    // Store in metrics map for statistics
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    const values = this.metrics.get(label)!;
    values.push(value);
    
    // Keep only last N measurements
    if (values.length > this.maxSamples) {
      values.shift();
    }

    // Store detailed entry
    this.entries.push({
      label,
      duration: value,
      timestamp: Date.now(),
      metadata
    });

    // Keep entries within limit
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
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
    const p99Index = Math.ceil(sorted.length * 0.99) - 1;
    
    return { 
      avg, 
      min, 
      max, 
      count: values.length,
      p95: sorted[Math.max(0, p95Index)],
      p99: sorted[Math.max(0, p99Index)]
    };
  }

  getAllStats(): Record<string, PerformanceStats> {
    const stats: Record<string, PerformanceStats> = {};
    for (const label of this.metrics.keys()) {
      const stat = this.getStats(label);
      if (stat) {
        stats[label] = stat;
      }
    }
    return stats;
  }

  getEntries(label?: string, limit?: number): PerformanceEntry[] {
    let filtered = label 
      ? this.entries.filter(entry => entry.label === label)
      : this.entries;

    if (limit) {
      filtered = filtered.slice(-limit);
    }

    return filtered;
  }

  getSlowestOperations(limit: number = 10): PerformanceEntry[] {
    return [...this.entries]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  getRecentOperations(minutes: number = 5): PerformanceEntry[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.entries.filter(entry => entry.timestamp > cutoff);
  }

  clear(label?: string): void {
    if (label) {
      this.metrics.delete(label);
      this.entries = this.entries.filter(entry => entry.label !== label);
    } else {
      this.metrics.clear();
      this.entries = [];
    }
  }

  export(): { metrics: Record<string, PerformanceStats>; entries: PerformanceEntry[] } {
    return {
      metrics: this.getAllStats(),
      entries: [...this.entries]
    };
  }
}

/**
 * Web Vitals monitoring
 */
export interface WebVitalsMetrics {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
}

export class WebVitalsMonitor {
  private metrics: WebVitalsMetrics = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers(): void {
    // Observe paint metrics
    if ('PerformanceObserver' in window) {
      try {
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.FCP = entry.startTime;
            }
          }
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);
      } catch (e) {
        console.warn('Paint observer not supported');
      }

      // Observe largest contentful paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.LCP = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // Observe layout shifts
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          this.metrics.CLS = (this.metrics.CLS || 0) + clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported');
      }
    }

    // Measure TTFB
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        this.metrics.TTFB = navigationEntries[0].responseStart - navigationEntries[0].requestStart;
      }
    }
  }

  getMetrics(): WebVitalsMetrics {
    return { ...this.metrics };
  }

  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

/**
 * Memory usage monitoring
 */
export interface MemoryInfo {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
  usedPercent?: number;
}

export function getMemoryInfo(): MemoryInfo {
  const memory = (performance as any).memory;
  if (!memory) {
    return {};
  }

  const usedPercent = memory.totalJSHeapSize > 0 
    ? (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100 
    : 0;

  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    usedPercent: Math.round(usedPercent * 100) / 100
  };
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Global web vitals monitor instance
 */
export const webVitalsMonitor = new WebVitalsMonitor();

/**
 * Convenience function to measure async operations
 */
export async function measureAsync<T>(
  label: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const endTiming = performanceMonitor.startTiming(label, metadata);
  try {
    const result = await operation();
    endTiming();
    return result;
  } catch (error) {
    endTiming();
    throw error;
  }
}

/**
 * Convenience function to measure sync operations
 */
export function measureSync<T>(
  label: string,
  operation: () => T,
  metadata?: Record<string, any>
): T {
  const endTiming = performanceMonitor.startTiming(label, metadata);
  try {
    const result = operation();
    endTiming();
    return result;
  } catch (error) {
    endTiming();
    throw error;
  }
}