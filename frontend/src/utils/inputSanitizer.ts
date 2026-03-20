/**
 * Input Sanitization and Security Utilities
 * Modular security helpers organized by functionality
 */

// =============================================================================
// INPUT SANITIZATION UTILITIES
// =============================================================================

/**
 * Sanitize string inputs to prevent XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  try {
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags and content
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/alert\s*\(/gi, '') // Remove alert calls
      .trim()
      .slice(0, 1000); // Limit length
  } catch (error) {
    console.warn('String sanitization failed:', error);
    return '';
  }
}

// Alias for test compatibility
export const sanitizeInput = sanitizeString;

/**
 * Sanitize and validate Ethereum addresses
 */
export function sanitizeAddress(address: string): string {
  if (typeof address !== 'string') {
    return '';
  }
  
  // Remove HTML tags but preserve content for better UX during typing
  return address
    .replace(/<\/?script[^>]*>/gi, '') // Remove script tags but keep content
    .replace(/<[^>]*>/g, '') // Remove other HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/[<>"'&\x00-\x1f\x7f-\x9f]/g, '') // Remove dangerous characters
    .trim();
}

/**
 * Sanitize numeric inputs
 */
export function sanitizeNumber(input: string, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): string {
  if (typeof input !== 'string') {
    return '0';
  }
  
  // Remove non-numeric characters except decimal point
  const cleaned = input.replace(/[^0-9.]/g, '');
  
  // Parse and validate range
  const num = parseFloat(cleaned);
  if (isNaN(num) || num < min || num > max) {
    return min.toString();
  }
  
  return num.toString();
}

/**
 * Sanitize token ID (positive integers only)
 */
export function sanitizeTokenId(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove non-numeric characters
  const cleaned = input.replace(/[^0-9]/g, '');
  
  // Validate as positive integer
  const num = parseInt(cleaned, 10);
  if (isNaN(num) || num < 0) {
    return '';
  }
  
  return num.toString();
}

/**
 * Validate and sanitize URLs
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') {
    return '';
  }
  
  try {
    const parsed = new URL(url.trim());
    
    // Only allow HTTPS and IPFS protocols
    if (!['https:', 'ipfs:'].includes(parsed.protocol)) {
      return '';
    }
    
    // Block dangerous domains
    const hostname = parsed.hostname.toLowerCase();
    const dangerousPatterns = [
      /localhost/,
      /127\.0\.0\.1/,
      /0\.0\.0\.0/,
      /192\.168\./,
      /10\./,
      /172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /169\.254\./,
      /metadata/
    ];
    
    if (dangerousPatterns.some(pattern => pattern.test(hostname))) {
      return '';
    }
    
    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * Sanitize form data object
 */
export function sanitizeFormData<T extends Record<string, any>>(data: T): T {
  const sanitized = {} as T;
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeString(value) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value;
    }
  }
  
  return sanitized;
}

// =============================================================================
// INPUT VALIDATION UTILITIES
// =============================================================================

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Address validation function
 */
export function validateAddress(address: string): boolean {
  if (typeof address !== 'string') {
    return false;
  }
  
  const cleaned = address.trim();
  return /^0x[a-fA-F0-9]{40}$/.test(cleaned);
}

/**
 * Positive number validation
 */
export function validatePositiveNumber(value: string): boolean {
  if (typeof value !== 'string' || value === '') {
    return false;
  }
  
  // Check for invalid formats first
  if (value.includes('e') || value.includes('E')) {
    return false; // No scientific notation
  }
  
  if ((value.match(/\./g) || []).length > 1) {
    return false; // Multiple decimal points
  }
  
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
}

/**
 * Email validation
 */
export function validateEmail(email: string): boolean {
  if (typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * URL validation
 */
export function validateUrl(url: string): boolean {
  if (typeof url !== 'string') {
    return false;
  }
  
  try {
    const parsed = new URL(url.trim());
    return ['https:', 'http:', 'ipfs:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Comprehensive input validator
 */
export function validateInput(value: any, rules: any): ValidationResult {
  if (rules.required && (!value || value === '')) {
    return { isValid: false, error: 'This field is required' };
  }
  
  if (rules.pattern && !rules.pattern.test(value)) {
    return { isValid: false, error: rules.message || 'Invalid format' };
  }
  
  if (rules.min !== undefined || rules.max !== undefined) {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return { isValid: false, error: 'Must be a valid number' };
    }
    
    if (rules.min !== undefined && num < rules.min) {
      return { isValid: false, error: `Minimum value is ${rules.min}` };
    }
    
    if (rules.max !== undefined && num > rules.max) {
      return { isValid: false, error: `Maximum value is ${rules.max}` };
    }
  }
  
  return { isValid: true };
}

/**
 * Validate multiple fields
 */
export function validateFields(data: Record<string, any>, rules: Record<string, any>): Record<string, ValidationResult> {
  const results: Record<string, ValidationResult> = {};
  
  for (const [field, fieldRules] of Object.entries(rules)) {
    results[field] = validateInput(data[field], fieldRules);
  }
  
  return results;
}

/**
 * Check if all validations passed
 */
export function isValidationPassed(results: Record<string, ValidationResult>): boolean {
  return Object.values(results).every(result => result.isValid);
}

// =============================================================================
// RATE LIMITING UTILITIES
// =============================================================================

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  blocked: boolean;
}

/**
 * Rate limiting helper
 */
class RateLimiter {
  private attempts = new Map<string, number[]>();
  private blocked = new Map<string, number>();
  private maxAttempts: number;
  private windowMs: number;
  private blockDuration: number;

  constructor(maxAttempts: number = 10, windowMs: number = 60000, blockDuration: number = 300000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.blockDuration = blockDuration;
  }
  
  isAllowed(key: string, maxAttempts?: number, windowMs?: number): boolean {
    const now = Date.now();
    const windowStart = now - (windowMs || this.windowMs);
    const maxAllowed = maxAttempts || this.maxAttempts;
    
    // Check if currently blocked
    const blockedUntil = this.blocked.get(key);
    if (blockedUntil && now < blockedUntil) {
      return false;
    }
    
    // Remove expired block
    if (blockedUntil && now >= blockedUntil) {
      this.blocked.delete(key);
    }
    
    if (!this.attempts.has(key)) {
      this.attempts.set(key, []);
    }
    
    const keyAttempts = this.attempts.get(key)!;
    
    // Remove old attempts outside the window
    const recentAttempts = keyAttempts.filter(time => time > windowStart);
    this.attempts.set(key, recentAttempts);
    
    if (recentAttempts.length >= maxAllowed) {
      // Block the key
      this.blocked.set(key, now + this.blockDuration);
      return false;
    }
    
    // Add current attempt
    recentAttempts.push(now);
    return true;
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
    this.blocked.delete(key);
  }

  clear(): void {
    this.attempts.clear();
    this.blocked.clear();
  }
}

export const rateLimiter = new RateLimiter();

// =============================================================================
// VALIDATION RULES CONFIGURATION
// =============================================================================

export interface ValidationRule {
  required?: boolean;
  pattern?: RegExp;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  message?: string;
}

/**
 * Input validation rules
 */
export const ValidationRules = {
  address: {
    required: true,
    pattern: /^0x[a-fA-F0-9]{40}$/,
    message: 'Invalid Ethereum address format'
  },
  tokenId: {
    required: true,
    min: 0,
    max: Number.MAX_SAFE_INTEGER,
    message: 'Token ID must be a positive number'
  },
  ticketPrice: {
    required: true,
    min: 0.001,
    max: 1000000,
    message: 'Ticket price must be between 0.001 and 1,000,000 APE'
  },
  maxTickets: {
    required: true,
    min: 1,
    max: 10000,
    message: 'Max tickets must be between 1 and 10,000'
  },
  duration: {
    required: true,
    min: 1,
    max: 168,
    message: 'Duration must be between 1 and 168 hours'
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Invalid email format'
  },
  url: {
    required: true,
    pattern: /^https?:\/\/.+/,
    message: 'Invalid URL format'
  }
} as const;