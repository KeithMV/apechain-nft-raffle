/**
 * Performance Monitoring Utility
 * Phase C: Real-time performance tracking and optimization
 */

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  bundleSize: number;
  memoryUsage: number;
  networkRequests: number;
}

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    // Monitor page load performance
    if (typeof window !== 'undefined' && 'performance' in window) {
      this.trackPageLoad();
      this.trackResourceLoading();
      this.trackMemoryUsage();
    }
  }

  private trackPageLoad() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      this.metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart;
      this.metrics.renderTime = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
      
      this.logMetrics('Page Load', {
        loadTime: this.metrics.loadTime,
        renderTime: this.metrics.renderTime,
        domInteractive: navigation.domInteractive - navigation.fetchStart,
        firstContentfulPaint: this.getFirstContentfulPaint(),
      });
    });
  }

  private trackResourceLoading() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        let totalSize = 0;
        let requestCount = 0;

        entries.forEach((entry) => {
          if (entry.name.includes('.js') || entry.name.includes('.css')) {
            totalSize += (entry as any).transferSize || 0;
            requestCount++;
          }
        });

        this.metrics.bundleSize = totalSize;
        this.metrics.networkRequests = requestCount;
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    }
  }

  private trackMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize;
      
      // Monitor memory every 30 seconds
      setInterval(() => {
        const currentMemory = (performance as any).memory.usedJSHeapSize;
        if (currentMemory > this.metrics.memoryUsage! * 1.5 && 
            process.env.NODE_ENV === 'development' &&
            typeof window !== 'undefined' && 
            (window.location.hostname === 'localhost' || window.location.hostname.includes('192.168'))) {
          console.warn('Memory usage increased significantly:', {
            previous: this.metrics.memoryUsage,
            current: currentMemory,
            increase: ((currentMemory - this.metrics.memoryUsage!) / this.metrics.memoryUsage! * 100).toFixed(2) + '%'
          });
        }
        this.metrics.memoryUsage = currentMemory;
      }, 30000);
    }
  }

  private getFirstContentfulPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : 0;
  }

  private logMetrics(event: string, data: any) {
    // Only log in local development (not staging/production)
    if (process.env.NODE_ENV === 'development' && 
        typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname.includes('192.168'))) {
      const sanitizedData = this.sanitizeMetricsData(data);
      console.group(`🚀 Performance: ${event}`);
      Object.entries(sanitizedData).forEach(([key, value]) => {
        const formattedValue = typeof value === 'number' ? `${value.toFixed(2)}ms` : value;
        console.log(`${key}: ${formattedValue}`);
      });
      console.groupEnd();
    }
  }

  private sanitizeMetricsData(data: any): any {
    const sanitized = { ...data };
    // Remove potentially sensitive data
    delete sanitized.userAgent;
    delete sanitized.referrer;
    delete sanitized.url;
    return sanitized;
  }

  // Public methods for component-level tracking
  public startTimer(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.logMetrics(`Component: ${label}`, { duration });
    };
  }

  public trackUserInteraction(action: string, component: string) {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.logMetrics(`User Interaction: ${action}`, { 
        component, 
        duration,
        timestamp: Date.now() 
      });
    };
  }

  public getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  public generateReport(): string {
    const metrics = this.getMetrics();
    const report = [
      '📊 Performance Report',
      '==================',
      `Load Time: ${metrics.loadTime?.toFixed(2)}ms`,
      `Render Time: ${metrics.renderTime?.toFixed(2)}ms`,
      `Bundle Size: ${(metrics.bundleSize! / 1024).toFixed(2)}KB`,
      `Memory Usage: ${(metrics.memoryUsage! / 1024 / 1024).toFixed(2)}MB`,
      `Network Requests: ${metrics.networkRequests}`,
      '',
      '🎯 Performance Targets:',
      `Load Time: ${metrics.loadTime! < 2000 ? '✅' : '❌'} (<2000ms)`,
      `Bundle Size: ${metrics.bundleSize! < 400000 ? '✅' : '❌'} (<400KB)`,
      `Memory Usage: ${metrics.memoryUsage! < 50000000 ? '✅' : '❌'} (<50MB)`,
    ].join('\n');

    return report;
  }

  public cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const [monitor] = React.useState(() => new PerformanceMonitor());

  React.useEffect(() => {
    return () => monitor.cleanup();
  }, [monitor]);

  return {
    startTimer: monitor.startTimer.bind(monitor),
    trackInteraction: monitor.trackUserInteraction.bind(monitor),
    getMetrics: monitor.getMetrics.bind(monitor),
    generateReport: monitor.generateReport.bind(monitor),
  };
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Performance optimization utilities
export const optimizationUtils = {
  // Debounce function for performance
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function for performance
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Lazy load images with intersection observer
  lazyLoadImage: (img: HTMLImageElement, src: string) => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          img.src = src;
          observer.unobserve(img);
        }
      });
    });
    observer.observe(img);
  },

  // Preload critical resources
  preloadResource: (href: string, as: string) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  },
};

// Import React for the hook
import React from 'react';