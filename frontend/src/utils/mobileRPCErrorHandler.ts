/**
 * Mobile RPC Error Handler
 * Prevents cascade failures and infinite retry loops on mobile devices
 */

import { markEndpointAsFailed } from '../config/wagmiUnified';

interface RPCError {
  message: string;
  code?: number;
  endpoint?: string;
}

class MobileRPCErrorHandler {
  private errorCounts = new Map<string, number>();
  private readonly MAX_ERRORS_PER_ENDPOINT = 5;
  private readonly ERROR_RESET_TIME = 60 * 1000; // 1 minute

  handleRPCError(error: RPCError, endpoint?: string) {
    const errorKey = endpoint || 'unknown';
    const currentCount = this.errorCounts.get(errorKey) || 0;
    
    // Increment error count
    this.errorCounts.set(errorKey, currentCount + 1);
    
    // Check for cascade failure patterns
    if (this.isCascadeFailure(error)) {
      console.warn('🚨 [MOBILE RPC] Cascade failure detected, implementing circuit breaker');
      
      if (endpoint) {
        markEndpointAsFailed(endpoint);
      }
      
      // Reset error counts to prevent further cascade
      this.resetErrorCounts();
      return true; // Handled
    }
    
    // Check if endpoint has too many errors
    if (currentCount >= this.MAX_ERRORS_PER_ENDPOINT && endpoint) {
      console.warn(`🚨 [MOBILE RPC] Endpoint ${endpoint} has too many errors, marking as failed`);
      markEndpointAsFailed(endpoint);
      
      // Schedule error count reset
      setTimeout(() => {
        this.errorCounts.delete(errorKey);
      }, this.ERROR_RESET_TIME);
      
      return true; // Handled
    }
    
    return false; // Not handled
  }
  
  private isCascadeFailure(error: RPCError): boolean {
    const cascadePatterns = [
      '429', 'Too Many Requests',
      '401', 'Unauthorized', 
      '400', 'Bad Request',
      'timeout', '408', '504', 'Gateway Timeout',
      'Failed to fetch', 'NetworkError',
      'CORS', 'access control',
      'DNS', 'hostname could not be found', 'ERR_NAME_NOT_RESOLVED',
      'ERR_FAILED'
    ];
    
    return cascadePatterns.some(pattern => 
      error.message?.toLowerCase().includes(pattern.toLowerCase())
    );
  }
  
  private resetErrorCounts() {
    this.errorCounts.clear();
    console.log('🔄 [MOBILE RPC] Error counts reset to prevent cascade');
  }
  
  getErrorStats() {
    return {
      totalErrors: Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0),
      endpointErrors: Object.fromEntries(this.errorCounts)
    };
  }
}

export const mobileRPCErrorHandler = new MobileRPCErrorHandler();

// Global error handler for unhandled RPC errors
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  
  console.error = (...args) => {
    const message = args.join(' ');
    
    // Check if this is an RPC-related error
    if (message.includes('Failed to load resource') || 
        message.includes('429') || 
        message.includes('401') ||
        message.includes('504') ||
        message.includes('Bad Request') ||
        message.includes('ERR_NAME_NOT_RESOLVED') ||
        message.includes('ERR_FAILED') ||
        message.includes('CORS') ||
        message.includes('polygon-rpc.com') ||
        message.includes('matic.network') ||
        message.includes('walletconnect.org') ||
        message.includes('quiknode.pro')) {
      
      // Handle the error
      const handled = mobileRPCErrorHandler.handleRPCError({ message });
      
      // Only log if not handled or in development
      if (!handled || process.env.NODE_ENV === 'development') {
        originalConsoleError.apply(console, args);
      }
    } else {
      // Non-RPC error, log normally
      originalConsoleError.apply(console, args);
    }
  };
}