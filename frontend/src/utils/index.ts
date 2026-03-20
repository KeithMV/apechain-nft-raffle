/**
 * Utility Exports
 * Centralized utility exports for better import organization
 */

// Security utilities (modular)
export * from './security';

// Performance utilities (modular)
export * from './performance';

// Wallet
export { cleanWalletConnectStorage, suppressWalletConnectErrors } from './walletCleanup';

// Chain
export { addApeChainToMetaMask } from './addApeChain';
export { useApeChainSwitching } from './chainSwitching';

// Legacy utilities (for backward compatibility)
export { performanceMonitor as legacyPerformanceMonitor } from './performanceMonitor';
export { logger } from './logger';
export { sanitizeForLog, safeLog, safeError } from './logSanitizer';

// Deprecated - use modular imports instead
// These will be removed in a future version
// export { SecurityUtils } from './security'; // Removed - use individual functions