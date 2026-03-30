/**
 * Performance Utilities - Unified Exports
 * Consolidated performance optimization functions and classes
 */

// Debounce and throttle utilities
export {
  debounce,
  throttle,
  debounceImmediate,
  throttleTrailing,
  debounceAsync
} from './debounce';

// Cache utilities
export {
  OptimizedCache,
  LRUCache,
  memoize
} from './cache';

export type { CacheOptions } from './cache';

// Batch processing utilities
export {
  processBatch,
  processConcurrent,
  processChunks,
  processBatchWithRetry,
  BatchQueue
} from './batch';

export type { BatchOptions } from './batch';

// Virtual scrolling utilities
export {
  useVirtualScrolling,
  VariableVirtualScroller,
  useVirtualGrid
} from './virtual-scroll';

export type {
  VirtualScrollResult,
  VirtualScrollOptions,
  VirtualGridResult
} from './virtual-scroll';

// Performance monitoring utilities
export {
  PerformanceMonitor,
  WebVitalsMonitor,
  performanceMonitor,
  webVitalsMonitor,
  measureAsync,
  measureSync,
  getMemoryInfo
} from './monitor';

export type {
  PerformanceStats,
  PerformanceEntry,
  WebVitalsMetrics,
  MemoryInfo
} from './monitor';

// Convenience re-exports for backward compatibility
export { debounce as createDebounce } from './debounce';
export { throttle as createThrottle } from './debounce';
export { OptimizedCache as Cache } from './cache';
export { performanceMonitor as monitor } from './monitor';