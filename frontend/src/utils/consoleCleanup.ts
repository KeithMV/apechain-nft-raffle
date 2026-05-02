/**
 * Console Cleanup - Eliminate all development noise
 * Aggressively suppresses console output for professional production experience
 */

export class ConsoleCleanup {
  private static originalConsole: any = {};
  private static isInitialized = false;

  static initialize() {
    if (this.isInitialized) return;
    
    // Store original console methods
    this.originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      debug: console.debug,
      error: console.error,
      group: console.group,
      groupEnd: console.groupEnd,
      groupCollapsed: console.groupCollapsed,
      table: console.table,
      time: console.time,
      timeEnd: console.timeEnd,
    };

    const isLocalDev = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname.includes('192.168'));
    
    // ENHANCED: Also check for staging environment or disabled logging
    const isLoggingDisabled = process.env.REACT_APP_ENABLE_LOGGING === 'false';
    const isStaging = process.env.REACT_APP_ENV === 'staging';

    // Suppress logging if not local dev OR if explicitly disabled OR if staging
    if (!isLocalDev || isLoggingDisabled || isStaging) {
      this.suppressAllLogging();
    }

    this.isInitialized = true;
  }

  private static suppressAllLogging() {
    // Completely silence all console output except critical errors
    console.log = () => {};
    console.info = () => {};
    console.debug = () => {};
    console.group = () => {};
    console.groupEnd = () => {};
    console.groupCollapsed = () => {};
    console.table = () => {};
    console.time = () => {};
    console.timeEnd = () => {};

    // Filter warnings to only show critical ones
    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      
      // Block all known development noise
      if (
        message.includes('was preloaded using link preload') ||
        message.includes('fonts.reown.com') ||
        message.includes('KHTeka-Medium.woff2') ||
        message.includes('Lit is in dev mode') ||
        message.includes('Multiple versions of Lit') ||
        message.includes('Download the React DevTools') ||
        message.includes('SES Removing') ||
        message.includes('LaunchDarkly') ||
        message.includes('Event received') ||
        message.includes('Network:') ||
        message.includes('balance for') ||
        message.includes('Raw balance') ||
        message.includes('[DASHBOARD-WINNER]') ||
        message.includes('[WINNER-BUTTON]') ||
        message.includes('[TICKETS]') ||
        message.includes('[REFRESH]') ||
        message.includes('[WINNER]') ||
        message.includes('🔍') ||
        message.includes('🎫') ||
        message.includes('🏆') ||
        message.includes('🔄')
      ) {
        return;
      }

      // Only show critical warnings
      if (message.includes('Failed to') || message.includes('Error:')) {
        this.originalConsole.warn(...args);
      }
    };

    // Keep error logging but sanitize sensitive data
    console.error = (...args: any[]) => {
      const sanitizedArgs = args.map(arg => {
        if (typeof arg === 'string') {
          return arg
            .replace(/0x[a-fA-F0-9]{40}/g, '0x***ADDRESS***')
            .replace(/0x[a-fA-F0-9]{64}/g, '0x***HASH***')
            .replace(/\b\d{12,}\b/g, '***NUMBER***');
        }
        return arg;
      });
      this.originalConsole.error(...sanitizedArgs);
    };
  }

  static restore() {
    if (!this.isInitialized) return;
    
    Object.assign(console, this.originalConsole);
    this.isInitialized = false;
  }
}

// Auto-initialize
ConsoleCleanup.initialize();