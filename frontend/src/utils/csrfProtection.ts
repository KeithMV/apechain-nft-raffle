/**
 * CSRF Protection Utilities
 * Centralized security functions to prevent cross-site request forgery
 */

export class CSRFProtection {
  private static readonly ALLOWED_ORIGINS = [
    'https://web3raffles.io', // Primary production domain
    'https://apechainraffles.io', // Legacy domain (if still needed)
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];

  /**
   * Validate request origin to prevent CSRF attacks
   */
  static validateOrigin(): void {
    if (typeof window === 'undefined') return;
    
    const currentOrigin = window.location.origin;
    if (!this.ALLOWED_ORIGINS.includes(currentOrigin)) {
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
      return this.ALLOWED_ORIGINS.includes(referrerOrigin);
    } catch {
      return false;
    }
  }
}