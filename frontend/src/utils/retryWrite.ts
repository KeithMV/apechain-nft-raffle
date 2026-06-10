/**
 * Retry utility for write contract operations
 * Handles transient RPC errors with exponential backoff
 */

import { rpcDebugLogger } from './rpcDebugLogger';

export interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  onRetry?: (attempt: number, error: any) => void;
}

/**
 * Wraps a write contract function with retry logic for RPC errors
 */
export async function retryWriteContract<T>(
  writeFn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 8000,
    onRetry,
  } = config;

  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      rpcDebugLogger.log('WRITE_CONTRACT_ATTEMPT', {
        attempt: attempt + 1,
        maxRetries,
      });
      
      return await writeFn();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's an RPC error that should be retried
      const errorMessage = error?.message || String(error);
      const isRpcError = 
        errorMessage.includes('RPC endpoint') ||
        errorMessage.includes('HTTP client error') ||
        errorMessage.includes('network error') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('429') ||
        errorMessage.includes('503') ||
        errorMessage.includes('502');
      
      // Don't retry user rejections or contract errors
      const isUserRejection = 
        errorMessage.includes('User rejected') ||
        errorMessage.includes('user rejected') ||
        errorMessage.includes('denied');
      
      const isContractError = 
        errorMessage.includes('execution reverted') ||
        errorMessage.includes('insufficient funds') ||
        errorMessage.includes('gas required exceeds');
      
      // Log the error
      rpcDebugLogger.log('WRITE_CONTRACT_ERROR', {
        attempt: attempt + 1,
        maxRetries,
        isRpcError,
        isUserRejection,
        isContractError,
        willRetry: isRpcError && attempt < maxRetries - 1,
      }, error);
      
      // If last attempt or non-retryable error, throw immediately
      if (attempt === maxRetries - 1 || isUserRejection || isContractError) {
        throw error;
      }
      
      // Only retry RPC errors
      if (!isRpcError) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      
      rpcDebugLogger.log('RETRY_DELAY', {
        attempt: attempt + 1,
        delayMs: delay,
      });
      
      if (onRetry) {
        onRetry(attempt + 1, error);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // If we get here, all retries failed
  throw lastError;
}

/**
 * Creates a retry wrapper with specific configuration
 */
export function createRetryWrapper(config: RetryConfig) {
  return <T>(writeFn: () => Promise<T>) => retryWriteContract(writeFn, config);
}
