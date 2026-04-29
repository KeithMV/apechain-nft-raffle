/**
 * CSRF Protection Utilities
 * Centralized security functions to prevent cross-site request forgery
 */

export class CSRFProtection {
  /**
   * Get allowed origins from environment configuration
   */
  private static getAllowedOrigins(): string[] {
    const origins: string[] = [];
    
    // Add the configured app URL for current environment
    if (process.env.REACT_APP_APP_URL) {
      origins.push(process.env.REACT_APP_APP_URL);
    }
    
    // Add development origins
    if (process.env.NODE_ENV === 'development' || process.env.REACT_APP_ENV === 'development') {
      origins.push('http://localhost:3000', 'http://127.0.0.1:3000');
    }
    
    // Fallback for safety
    if (origins.length === 0) {
      console.warn('No CSRF origins configured, using localhost fallback');
      origins.push('http://localhost:3000');
    }
    
    return origins;
  }

  /**
   * Validate request origin to prevent CSRF attacks
   */
  static validateOrigin(): void {
    if (typeof window === 'undefined') return;
    
    const currentOrigin = window.location.origin;
    const allowedOrigins = this.getAllowedOrigins();
    
    if (!allowedOrigins.includes(currentOrigin)) {
      console.error(`CSRF validation failed. Current: ${currentOrigin}, Allowed:`, allowedOrigins);
      throw new Error('CSRF: Invalid origin detected');
    }
  }

  /**
   * Sanitize contract addresses to prevent injection
   */
  static sanitizeContractAddress(address: string): string {
    const sanitized = address.replace(/[^a-fA-F0-9x]/g, '');
    if (!sanitized.startsWith('0x') || sanitized.length !== 42) {
      throw new Error('Invalid contract address format');
    }
    return sanitized.toLowerCase();
  }

  /**
   * Generate CSRF token for forms (if needed for future features)
   */
  static generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate referrer header
   */
  static validateReferrer(): boolean {
    if (typeof document === 'undefined') return true;
    
    const referrer = document.referrer;
    if (!referrer) return true; // Direct navigation is OK
    
    try {
      const referrerOrigin = new URL(referrer).origin;
      const allowedOrigins = this.getAllowedOrigins();
      return allowedOrigins.includes(referrerOrigin);
    } catch {
      return false;
    }
  }
}