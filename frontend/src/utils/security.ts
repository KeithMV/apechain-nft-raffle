/**
 * Security Utilities
 * Centralized security functions for input validation and sanitization
 */

import { isAddress } from 'viem/utils';

export class SecurityUtils {
  /**
   * Validate Ethereum address format
   */
  static validateAddress(address: string): boolean {
    return !!(address && typeof address === 'string' && isAddress(address));
  }

  /**
   * Validate URL for safety (prevent SSRF)
   */
  static validateUrl(url: string): { valid: boolean; error?: string } {
    if (!url || typeof url !== 'string') {
      return { valid: false, error: 'URL must be a non-empty string' };
    }

    try {
      const parsed = new URL(url);
      
      // Only allow HTTPS and IPFS protocols
      if (!['https:', 'ipfs:', 'wss:', 'ws:'].includes(parsed.protocol)) {
        return { valid: false, error: `Unsupported protocol: ${parsed.protocol}. Only HTTPS, IPFS, WSS, and WS are allowed` };
      }
      
      // Allow WalletConnect domains
      if (parsed.hostname.includes('walletconnect.org') || 
          parsed.hostname.includes('walletconnect.com')) {
        return { valid: true };
      }
      
      // Block private/local networks
      if (parsed.hostname === 'localhost' || 
          parsed.hostname.startsWith('127.') ||
          parsed.hostname.startsWith('192.168.') ||
          parsed.hostname.startsWith('10.') ||
          parsed.hostname.includes('169.254.')) {
        return { valid: false, error: `Private/local network access blocked: ${parsed.hostname}` };
      }
      
      return { valid: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid URL format';
      return { valid: false, error: `URL parsing failed: ${errorMessage}` };
    }
  }

  /**
   * Validate IPFS hash format
   */
  static validateIpfsHash(hash: string): boolean {
    return typeof hash === 'string' && /^[a-zA-Z0-9]{46,59}$/.test(hash);
  }

  /**
   * Sanitize string input (prevent XSS)
   */
  static sanitizeString(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') return '';
    return input
      .replace(/[<>'"&]/g, '') // Remove potential XSS characters
      .slice(0, maxLength)
      .trim();
  }

  /**
   * Validate and sanitize localStorage data
   */
  static validateCacheData(data: string, maxSize: number = 100000): { valid: boolean; data?: any; error?: string } {
    if (!data || typeof data !== 'string') {
      return { valid: false, error: 'Cache data must be a non-empty string' };
    }
    
    if (data.length > maxSize) {
      return { valid: false, error: `Cache data exceeds maximum size of ${maxSize} characters` };
    }
    
    try {
      const parsed = JSON.parse(data);
      
      if (!parsed || typeof parsed !== 'object') {
        return { valid: false, error: 'Cache data must be a valid JSON object' };
      }
      
      return { valid: true, data: parsed };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid JSON format';
      return { valid: false, error: `JSON parsing failed: ${errorMessage}` };
    }
  }

  /**
   * Generate cryptographically secure random number
   */
  static generateSecureRandom(): bigint {
    const array = new Uint32Array(2);
    crypto.getRandomValues(array);
    return BigInt(array[0]) * BigInt(2**32) + BigInt(array[1]);
  }

  /**
   * Validate numeric input
   */
  static validateNumber(value: any, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): boolean {
    const num = Number(value);
    return !isNaN(num) && num >= min && num <= max;
  }

  /**
   * Rate limiting for API calls
   */
  private static rateLimits = new Map<string, number[]>();
  
  static checkRateLimit(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const requests = this.rateLimits.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false; // Rate limit exceeded
    }
    
    validRequests.push(now);
    this.rateLimits.set(key, validRequests);
    return true;
  }
}