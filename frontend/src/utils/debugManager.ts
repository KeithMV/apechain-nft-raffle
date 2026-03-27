/**
 * Debug Utility - Clean Console & Performance Profiling
 * Helps identify real performance bottlenecks by controlling log noise
 */

import React from 'react';

// Debug levels
export type DebugLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug' | 'verbose';

class DebugManager {
  private level: DebugLevel = 'error'; // Start with minimal logging
  private performanceMarks = new Map<string, number>();
  private slowOperations: Array<{operation: string, duration: number, timestamp: number}> = [];

  setLevel(level: DebugLevel) {
    this.level = level;
    console.log(`🔧 [DEBUG] Log level set to: ${level}`);
  }

  // Controlled logging based on level
  error(...args: any[]) {
    if (this.shouldLog('error')) console.error('❌', ...args);
  }

  warn(...args: any[]) {
    if (this.shouldLog('warn')) console.warn('⚠️', ...args);
  }

  info(...args: any[]) {
    if (this.shouldLog('info')) console.log('ℹ️', ...args);
  }

  debug(...args: any[]) {
    if (this.shouldLog('debug')) console.log('🐛', ...args);
  }

  verbose(...args: any[]) {
    if (this.shouldLog('verbose')) console.log('📝', ...args);
  }

  private shouldLog(level: DebugLevel): boolean {
    const levels = ['silent', 'error', 'warn', 'info', 'debug', 'verbose'];
    return levels.indexOf(this.level) >= levels.indexOf(level);
  }

  // Performance profiling
  startTimer(operation: string) {
    this.performanceMarks.set(operation, Date.now());
    this.verbose(`⏱️ [TIMER] Started: ${operation}`);
  }

  endTimer(operation: string): number {
    const startTime = this.performanceMarks.get(operation);
    if (!startTime) {
      this.warn(`Timer not found for operation: ${operation}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.performanceMarks.delete(operation);

    // Track slow operations (>2 seconds)
    if (duration > 2000) {
      this.slowOperations.push({
        operation,
        duration,
        timestamp: Date.now()
      });
      this.error(`🐌 [SLOW] ${operation} took ${duration}ms`);
    } else if (duration > 500) {
      this.warn(`⏳ [MEDIUM] ${operation} took ${duration}ms`);
    } else {
      this.debug(`✅ [FAST] ${operation} took ${duration}ms`);
    }

    return duration;
  }

  // Get performance summary
  getPerformanceSummary() {
    return {
      slowOperations: this.slowOperations.slice(-10), // Last 10 slow operations
      activeTimers: Array.from(this.performanceMarks.keys()),
    };
  }

  // Clear performance data
  clearPerformanceData() {
    this.slowOperations = [];
    this.performanceMarks.clear();
    this.info('🧹 Performance data cleared');
  }
}

// Global debug instance
export const debugManager = new DebugManager();

// Convenience functions
export const setDebugLevel = (level: DebugLevel) => debugManager.setLevel(level);
export const debugLog = {
  error: (...args: any[]) => debugManager.error(...args),
  warn: (...args: any[]) => debugManager.warn(...args),
  info: (...args: any[]) => debugManager.info(...args),
  debug: (...args: any[]) => debugManager.debug(...args),
  verbose: (...args: any[]) => debugManager.verbose(...args),
};

// Performance helpers
export const startTimer = (operation: string) => debugManager.startTimer(operation);
export const endTimer = (operation: string) => debugManager.endTimer(operation);
export const getPerformanceSummary = () => debugManager.getPerformanceSummary();

// React hook for performance monitoring
export function usePerformanceDebug(componentName: string) {
  React.useEffect(() => {
    startTimer(`${componentName}-mount`);
    return () => {
      endTimer(`${componentName}-mount`);
    };
  }, [componentName]);

  const measureRender = React.useCallback((renderName: string, fn: () => void) => {
    startTimer(`${componentName}-${renderName}`);
    fn();
    endTimer(`${componentName}-${renderName}`);
  }, [componentName]);

  return { measureRender };
}

// Network request profiler
export function profileNetworkRequest(url: string, requestFn: () => Promise<any>) {
  const operation = `network-${url.split('/').pop()}`;
  startTimer(operation);
  
  return requestFn()
    .then(result => {
      endTimer(operation);
      return result;
    })
    .catch(error => {
      endTimer(operation);
      debugLog.error(`Network request failed: ${url}`, error);
      throw error;
    });
}

// Auto-detect performance issues
export function detectPerformanceIssues() {
  const summary = getPerformanceSummary();
  
  if (summary.slowOperations.length > 0) {
    console.group('🚨 PERFORMANCE ISSUES DETECTED');
    console.log('Recent slow operations:');
    summary.slowOperations.forEach(op => {
      console.log(`  • ${op.operation}: ${op.duration}ms`);
    });
    console.groupEnd();
  }

  if (summary.activeTimers.length > 0) {
    console.group('⏱️ ACTIVE TIMERS');
    console.log('Operations still running:');
    summary.activeTimers.forEach(timer => {
      console.log(`  • ${timer}`);
    });
    console.groupEnd();
  }
}

// Initialize with minimal logging
if (typeof window !== 'undefined') {
  // Set debug level based on environment
  const isDev = window.location.hostname === 'localhost';
  debugManager.setLevel(isDev ? 'warn' : 'error');
  
  // Add global debug helpers
  (window as any).setDebugLevel = setDebugLevel;
  (window as any).getPerformanceSummary = getPerformanceSummary;
  (window as any).detectPerformanceIssues = detectPerformanceIssues;
  
  console.log('🔧 Debug tools available:');
  console.log('  • setDebugLevel("verbose") - Enable all logs');
  console.log('  • setDebugLevel("error") - Minimal logs');
  console.log('  • getPerformanceSummary() - View performance data');
  console.log('  • detectPerformanceIssues() - Check for problems');
}