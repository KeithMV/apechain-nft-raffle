/**
 * Utility Exports
 * Centralized utility exports for better import organization
 */

// Security
export { SecurityUtils } from './security';

// Wallet
export { formatAddress, clearWalletStorage, getConnectionErrorMessage, isConnectionError } from './walletUtils';
export { cleanWalletConnectStorage, suppressWalletConnectErrors } from './walletCleanup';

// Chain
export { addApeChainToMetaMask } from './addApeChain';
export { useApeChainSwitching } from './chainSwitching';

// Performance
export { performanceMonitor as legacyPerformanceMonitor } from './performanceMonitor';
export { logger } from './logger';
export {
  debounce,
  throttle,
  processBatch,
  OptimizedCache,
  useVirtualScrolling,
  ImagePreloader,
  PerformanceMonitor,
  performanceMonitor
} from './performance';

// Input Handling
export { sanitizeString, sanitizeAddress, sanitizeNumber, sanitizeTokenId, sanitizeUrl, sanitizeFormData, rateLimiter, ValidationRules, validateInput } from './inputSanitizer';
export { sanitizeForLog, safeLog, safeError } from './logSanitizer';