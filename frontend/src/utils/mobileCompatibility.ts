/**
 * Mobile Compatibility Setup - Industry Standard Approach
 * Fixes React 19 mobile browser compatibility issues
 */

// Use established polyfill library instead of custom implementations
import 'core-js/stable/request-idle-callback';
import 'core-js/stable/resize-observer';
import 'core-js/stable/intersection-observer';

// Additional mobile-specific fixes
if (typeof window !== 'undefined') {
  // Ensure polyfills are properly loaded
  console.log('📱 [MOBILE] Polyfills loaded:', {
    requestIdleCallback: !!window.requestIdleCallback,
    ResizeObserver: !!window.ResizeObserver,
    IntersectionObserver: !!window.IntersectionObserver
  });

  // Mobile-specific performance optimizations
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    // Reduce animation frame rate on mobile for better performance
    const originalRAF = window.requestAnimationFrame;
    let rafThrottle = false;
    
    window.requestAnimationFrame = function(callback) {
      if (rafThrottle) return originalRAF(callback);
      
      rafThrottle = true;
      return originalRAF(() => {
        callback(performance.now());
        setTimeout(() => { rafThrottle = false; }, 16); // ~60fps max
      });
    };
  }
}

export const mobileCompatibilityLoaded = true;