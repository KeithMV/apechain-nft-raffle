/**
 * Mobile WebSocket Error Suppression
 * Handles mobile-specific WebSocket connection issues gracefully
 */

// Mobile WebSocket error patterns to suppress
const MOBILE_WEBSOCKET_ERROR_PATTERNS = [
  'WebSocket connection to wss://relay.walletconnect.org',
  'The network connection was lost',
  'Failed to decode message from topic',
  'Missing or invalid. Decoded payload',
  'WebSocket connection failed',
  'relay.walletconnect.org',
  'ws://192.168.0.218:3000/ws',
  'connection was lost',
  'network connection was lost'
];

// Lit.dev warning patterns to suppress
const LIT_WARNING_PATTERNS = [
  'Lit is in dev mode',
  'Multiple versions of Lit loaded',
  'Loading multiple versions is not recommended',
  'Element w3m-connecting-wc-mobile scheduled an update'
];

// Font loading error patterns to suppress
const FONT_ERROR_PATTERNS = [
  'fonts.reown.com',
  'KHTeka-Medium.woff2',
  'was preloaded using link preload but not used'
];

let originalConsoleError: typeof console.error;
let originalConsoleWarn: typeof console.warn;
let isSuppressionActive = false;

/**
 * Check if an error message should be suppressed on mobile
 */
function shouldSuppressError(message: string): boolean {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (!isMobile) return false;
  
  return MOBILE_WEBSOCKET_ERROR_PATTERNS.some(pattern => 
    message.toLowerCase().includes(pattern.toLowerCase())
  );
}

/**
 * Check if a warning should be suppressed
 */
function shouldSuppressWarning(message: string): boolean {
  return LIT_WARNING_PATTERNS.some(pattern => 
    message.toLowerCase().includes(pattern.toLowerCase())
  ) || FONT_ERROR_PATTERNS.some(pattern => 
    message.toLowerCase().includes(pattern.toLowerCase())
  );
}

/**
 * Enable mobile WebSocket error suppression
 */
export function enableMobileErrorSuppression() {
  if (isSuppressionActive) return;
  
  // Store original console methods
  originalConsoleError = console.error;
  originalConsoleWarn = console.warn;
  
  // Override console.error
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    if (shouldSuppressError(message)) {
      // Log to a separate mobile debug channel instead of suppressing completely
      if (process.env.NODE_ENV === 'development') {
        console.debug('🔇 [MOBILE] Suppressed WebSocket error:', message);
      }
      return;
    }
    
    // Call original console.error for non-suppressed errors
    originalConsoleError.apply(console, args);
  };
  
  // Override console.warn
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    
    if (shouldSuppressWarning(message)) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('🔇 [MOBILE] Suppressed warning:', message);
      }
      return;
    }
    
    // Call original console.warn for non-suppressed warnings
    originalConsoleWarn.apply(console, args);
  };
  
  // Handle unhandled promise rejections (common with WebSocket failures)
  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || event.reason?.toString() || '';
    
    if (shouldSuppressError(message)) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('🔇 [MOBILE] Suppressed unhandled rejection:', message);
      }
      event.preventDefault();
    }
  });
  
  // Handle global errors
  window.addEventListener('error', (event) => {
    const message = event.message || event.error?.message || '';
    
    if (shouldSuppressError(message)) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('🔇 [MOBILE] Suppressed global error:', message);
      }
      event.preventDefault();
    }
  });
  
  isSuppressionActive = true;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔇 [MOBILE] Error suppression enabled for mobile WebSocket issues');
  }
}

/**
 * Disable mobile WebSocket error suppression
 */
export function disableMobileErrorSuppression() {
  if (!isSuppressionActive) return;
  
  // Restore original console methods
  if (originalConsoleError) {
    console.error = originalConsoleError;
  }
  
  if (originalConsoleWarn) {
    console.warn = originalConsoleWarn;
  }
  
  isSuppressionActive = false;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔊 [MOBILE] Error suppression disabled');
  }
}

/**
 * Get mobile connection diagnostics for debugging
 */
export function getMobileConnectionDiagnostics() {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  return {
    isMobile,
    userAgent: navigator.userAgent,
    onLine: navigator.onLine,
    connection: (navigator as any).connection?.effectiveType || 'unknown',
    hasEthereum: typeof window !== 'undefined' && !!window.ethereum,
    suppressionActive: isSuppressionActive,
    timestamp: new Date().toISOString()
  };
}

/**
 * Auto-enable suppression on mobile devices
 */
if (typeof window !== 'undefined') {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Enable suppression after a short delay to ensure all modules are loaded
    setTimeout(() => {
      enableMobileErrorSuppression();
    }, 1000);
  }
}