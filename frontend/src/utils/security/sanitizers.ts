/**
 * String and Input Sanitization Utilities
 * Core sanitization functions for preventing XSS and injection attacks
 */

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