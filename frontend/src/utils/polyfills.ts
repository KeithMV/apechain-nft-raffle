/**
 * Polyfills for mobile browser compatibility
 * Fixes React 19 issues with older mobile browsers
 * Using type-safe approach to avoid TypeScript compilation errors
 */

// Polyfill for requestIdleCallback (missing in older mobile browsers)
if (typeof window !== 'undefined' && !('requestIdleCallback' in window)) {
  (window as any).requestIdleCallback = function(callback: any, options?: any) {
    const start = Date.now();
    return setTimeout(function() {
      callback({
        didTimeout: false,
        timeRemaining: function() {
          return Math.max(0, 50 - (Date.now() - start));
        }
      });
    }, 1);
  };
}

// Polyfill for cancelIdleCallback
if (typeof window !== 'undefined' && !('cancelIdleCallback' in window)) {
  (window as any).cancelIdleCallback = function(id: number) {
    clearTimeout(id);
  };
}

// Additional mobile compatibility fixes
if (typeof window !== 'undefined') {
  // Fix for older mobile browsers that don't support ResizeObserver
  if (!('ResizeObserver' in window)) {
    (window as any).ResizeObserver = function(callback: any) {
      // Minimal polyfill - just call callback once
      setTimeout(() => {
        try {
          callback([], this);
        } catch (error) {
          console.warn('ResizeObserver polyfill error:', error);
        }
      }, 0);
    };
    (window as any).ResizeObserver.prototype = {
      observe: function() {},
      unobserve: function() {},
      disconnect: function() {}
    };
  }

  // Fix for mobile browsers that don't support IntersectionObserver
  if (!('IntersectionObserver' in window)) {
    (window as any).IntersectionObserver = function(callback: any) {
      // Minimal polyfill - assume all elements are visible
      setTimeout(() => {
        try {
          callback([], this);
        } catch (error) {
          console.warn('IntersectionObserver polyfill error:', error);
        }
      }, 0);
    };
    (window as any).IntersectionObserver.prototype = {
      observe: function() {},
      unobserve: function() {},
      disconnect: function() {},
      takeRecords: function() { return []; },
      get root() { return null; },
      get rootMargin() { return '0px'; },
      get thresholds() { return [0]; }
    };
  }
}

// Export for explicit imports if needed
export const polyfillsLoaded = true;