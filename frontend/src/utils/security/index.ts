/**
 * Security Utilities - Unified Exports
 * Consolidated security functions for input sanitization, validation, and rate limiting
 */

// Sanitization utilities
export {
  sanitizeString,
  sanitizeInput,
  sanitizeAddress,
  sanitizeNumber,
  sanitizeTokenId,
  sanitizeUrl,
  sanitizeFormData
} from './sanitizers';

// Validation utilities
export {
  validateAddress,
  validatePositiveNumber,
  validateEmail,
  validateUrl,
  validateInput,
  validateFields,
  isValidationPassed
} from './validators';

export type { ValidationResult } from './validators';

// Rate limiting utilities
export {
  rateLimiter,
  createRateLimiter,
  checkRateLimit
} from './rate-limiter';

export type { RateLimitResult } from './rate-limiter';

// Validation rules
export {
  ValidationRules,
  Web3ValidationRules,
  NFTValidationRules,
  RaffleValidationRules,
  createValidationRule,
  combineValidationRules
} from './rules';

export type { ValidationRule } from './rules';

// Convenience re-exports for backward compatibility
export { ValidationRules as defaultValidationRules } from './rules';

// Legacy SecurityUtils class for backward compatibility
export class SecurityUtils {
  static validateAddress = validateAddress;
  static sanitizeString = sanitizeString;
}