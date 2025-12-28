/**
 * Input Sanitization Utilities for Security Hardening
 * Prevents XSS, injection attacks, and validates user inputs
 */

// Sanitize string inputs to prevent XSS
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

// Sanitize and validate Ethereum addresses
export function sanitizeAddress(address: string): string {
  if (typeof address !== 'string') {
    return '';
  }
  
  const cleaned = address.trim().toLowerCase();
  
  // Must be valid Ethereum address format
  if (!/^0x[a-f0-9]{40}$/i.test(cleaned)) {
    return '';
  }
  
  return cleaned;
}

// Address validation function for tests
export function validateAddress(address: string): boolean {
  if (typeof address !== 'string') {
    return false;
  }
  
  const cleaned = address.trim();
  return /^0x[a-fA-F0-9]{40}$/.test(cleaned);
}

// Positive number validation for tests
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

// Sanitize numeric inputs
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

// Sanitize token ID (positive integers only)
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

// Validate and sanitize URLs
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

// Sanitize form data object
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

// Rate limiting helper
class RateLimiter {
  private attempts = new Map<string, number[]>();
  
  isAllowed(key: string, maxAttempts: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.attempts.has(key)) {
      this.attempts.set(key, []);
    }
    
    const keyAttempts = this.attempts.get(key)!;
    
    // Remove old attempts outside the window
    const recentAttempts = keyAttempts.filter(time => time > windowStart);
    this.attempts.set(key, recentAttempts);
    
    if (recentAttempts.length >= maxAttempts) {
      return false;
    }
    
    // Add current attempt
    recentAttempts.push(now);
    return true;
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

// Input validation rules
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
  }
};

// Comprehensive input validator
export function validateInput(value: any, rules: any): { isValid: boolean; error?: string } {
  if (rules.required && (!value || value === '')) {
    return { isValid: false, error: 'This field is required' };
  }
  
  if (rules.pattern && !rules.pattern.test(value)) {
    return { isValid: false, error: rules.message };
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