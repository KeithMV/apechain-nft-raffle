/**
 * Production-Safe Logger
 * Replaces all console logging with environment-aware alternatives
 */

import { config } from '../config/environment';

class ProductionLogger {
  private isLocalDev = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname.includes('192.168'));

  debug(message: string, ...args: any[]) {
    if (this.isLocalDev) {
      console.debug(`🔍 [DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.isLocalDev) {
      console.info(`ℹ️ [INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (config.enableLogging) {
      console.warn(`⚠️ [WARN] ${message}`, ...args);
    }
  }

  error(message: string, error?: Error, ...args: any[]) {
    // Always log errors, but sanitize in production
    if (config.environment === 'production') {
      console.error(`❌ [ERROR] ${message}`, error?.message || 'Unknown error');
    } else {
      console.error(`❌ [ERROR] ${message}`, error, ...args);
    }
  }

  // Web3 specific logging (development only)
  web3(action: string, data?: any) {
    if (this.isLocalDev) {
      this.info(`Web3: ${action}`, data);
    }
  }

  // Performance logging (development only)
  performance(metric: string, value: number, unit = 'ms') {
    if (this.isLocalDev) {
      this.info(`Performance: ${metric} = ${value}${unit}`);
    }
  }
}

export const logger = new ProductionLogger();

// Aggressive console suppression for production
if (typeof window !== 'undefined' && config.environment !== 'development') {
  const originalConsole = { ...console };
  
  // Override all console methods except error
  (window as any).console = {
    ...console,
    log: () => {},
    info: () => {},
    debug: () => {},
    warn: (message: string, ...args: any[]) => {
      const msg = [message, ...args].join(' ');
      // Only allow specific warnings through
      if (msg.includes('Failed to') || msg.includes('Error:')) {
        originalConsole.warn(message, ...args);
      }
    },
    error: originalConsole.error,
    group: () => {},
    groupEnd: () => {},
    groupCollapsed: () => {},
    table: () => {},
    time: () => {},
    timeEnd: () => {},
  };
}