/**
 * Console Security - Prevent Access Logging in Production
 * Blocks console output that could expose sensitive data
 */

export class ConsoleSecure {
  private static originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    debug: console.debug,
    group: console.group,
    groupEnd: console.groupEnd
  };

  /**
   * Secure console for production - blocks all non-error logging
   */
  static enableProductionMode(): void {
    if (process.env.NODE_ENV === 'production') {
      // Block all console output except errors in production
      console.log = () => {};
      console.info = () => {};
      console.warn = () => {};
      console.debug = () => {};
      console.group = () => {};
      console.groupEnd = () => {};
      
      // Keep error logging for critical issues only
      console.error = (...args) => {
        try {
          // Sanitize error messages to remove sensitive data
          const sanitizedArgs = args.map(arg => this.sanitizeErrorData(arg));
          this.originalConsole.log('ERROR:', ...sanitizedArgs);
        } catch (sanitizeError) {
          // Log sanitization error and original error safely
          this.originalConsole.log('ERROR: [Sanitization failed]', sanitizeError?.message || 'Unknown sanitization error');
          this.originalConsole.log('ORIGINAL ERROR:', args.map(arg => typeof arg === 'object' ? '[Object]' : String(arg)).join(' '));
        }
      };
    }
  }

  /**
   * Restore original console (for development)
   */
  static restoreConsole(): void {
    Object.assign(console, this.originalConsole);
  }

  /**
   * Sanitize error data to remove sensitive information
   */
  private static sanitizeErrorData(data: any): any {
    if (typeof data === 'string') {
      return data
        .replace(/0x[a-fA-F0-9]{40}/g, '0x***REDACTED***') // Addresses
        .replace(/0x[a-fA-F0-9]{64}/g, '0x***HASH***')     // Hashes/Keys
        .replace(/\b\d{12,}\b/g, '***NUMBER***');          // Large numbers
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      delete sanitized.privateKey;
      delete sanitized.mnemonic;
      delete sanitized.password;
      delete sanitized.token;
      delete sanitized.nonce;
      delete sanitized.signature;
      return sanitized;
    }
    
    return data;
  }
}

// Auto-enable in production (disabled for WalletConnect compatibility)
// if (typeof window !== 'undefined') {
//   ConsoleSecure.enableProductionMode();
// }