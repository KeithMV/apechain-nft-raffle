/**
 * Polyfills for mobile browser compatibility
 * Fixes React 19 issues with older mobile browsers
 */

// Polyfill for requestIdleCallback (missing in older mobile browsers)
if (typeof window !== 'undefined' && !window.requestIdleCallback) {
  window.requestIdleCallback = function(callback: IdleRequestCallback, options?: IdleRequestOptions) {
    const start = Date.now();
    return setTimeout(function() {
      callback({
        didTimeout: false,
        timeRemaining: function() {
          return Math.max(0, 50 - (Date.now() - start));
        }
      });
    }, 1) as any;
  };
}

// Polyfill for cancelIdleCallback
if (typeof window !== 'undefined' && !window.cancelIdleCallback) {
  window.cancelIdleCallback = function(id: number) {
    clearTimeout(id);
  };
}

// Additional mobile compatibility fixes
if (typeof window !== 'undefined') {
  // Fix for older mobile browsers that don't support ResizeObserver
  if (!window.ResizeObserver) {
    window.ResizeObserver = class ResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        // Minimal polyfill - just call callback once
        setTimeout(() => {
          try {
            callback([], this);
          } catch (error) {
            console.warn('ResizeObserver polyfill error:', error);
          }
        }, 0);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  // Fix for mobile browsers that don't support IntersectionObserver
  if (!window.IntersectionObserver) {
    window.IntersectionObserver = class IntersectionObserver {
      constructor(callback: IntersectionObserverCallback) {
        // Minimal polyfill - assume all elements are visible
        setTimeout(() => {
          try {
            callback([], this);
          } catch (error) {
            console.warn('IntersectionObserver polyfill error:', error);
          }
        }, 0);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
      get root() { return null; }
      get rootMargin() { return '0px'; }
      get thresholds() { return [0]; }
    };
  }
}

// Export for explicit imports if needed
export const polyfillsLoaded = true;