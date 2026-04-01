/**
 * Multi-Chain Error Handler
 * Specialized error handling for different chains and RPC issues
 */

import { toastManager } from './toastManager';

export interface ChainError extends Error {
  chainId?: number;
  rpcUrl?: string;
  code?: string | number;
  data?: any;
}

export class MultiChainErrorHandler {
  static handleRpcError(error: ChainError, chainId: number) {
    const chainName = chainId === 137 ? 'Polygon' : chainId === 33139 ? 'ApeChain' : `Chain ${chainId}`;
    
    // Rate limiting errors
    if (this.isRateLimitError(error)) {
      console.warn(`🚫 Rate limited on ${chainName}:`, error.message);
      toastManager.error(`${chainName} network is busy. Please try again in a moment.`, {
        duration: 5000,
      });
      return 'RATE_LIMITED';
    }

    // CORS errors
    if (this.isCorsError(error)) {
      console.warn(`🚫 CORS error on ${chainName}:`, error.message);
      toastManager.error(`Network connection issue with ${chainName}. Switching to backup RPC...`, {
        duration: 3000,
      });
      return 'CORS_ERROR';
    }

    // Network connectivity
    if (this.isNetworkError(error)) {
      console.warn(`🌐 Network error on ${chainName}:`, error.message);
      toastManager.error(`${chainName} network unavailable. Check your connection.`, {
        duration: 4000,
      });
      return 'NETWORK_ERROR';
    }

    // Transaction errors
    if (this.isTransactionError(error)) {
      console.warn(`💸 Transaction error on ${chainName}:`, error.message);
      const userMessage = this.getTransactionErrorMessage(error, chainName);
      toastManager.error(userMessage, {
        duration: 6000,
      });
      return 'TRANSACTION_ERROR';
    }

    // Generic error
    console.error(`❌ Unknown error on ${chainName}:`, error);
    toastManager.error(`${chainName} operation failed. Please try again.`, {
      duration: 4000,
    });
    return 'UNKNOWN_ERROR';
  }

  private static isRateLimitError(error: ChainError): boolean {
    const message = error.message?.toLowerCase() || '';
    const code = error.code?.toString() || '';
    
    return message.includes('429') || 
           message.includes('too many requests') ||
           message.includes('rate limit') ||
           code === '429';
  }

  private static isCorsError(error: ChainError): boolean {
    const message = error.message?.toLowerCase() || '';
    
    return message.includes('cors') ||
           message.includes('access-control-allow-origin') ||
           message.includes('blocked by cors policy');
  }

  private static isNetworkError(error: ChainError): boolean {
    const message = error.message?.toLowerCase() || '';
    
    return message.includes('network') ||
           message.includes('fetch') ||
           message.includes('connection') ||
           message.includes('timeout') ||
           message.includes('net::err');
  }

  private static isTransactionError(error: ChainError): boolean {
    const message = error.message?.toLowerCase() || '';
    
    return message.includes('transaction') ||
           message.includes('gas') ||
           message.includes('nonce') ||
           message.includes('insufficient funds') ||
           message.includes('execution reverted');
  }

  private static getTransactionErrorMessage(error: ChainError, chainName: string): string {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('insufficient funds')) {
      return `Insufficient ${chainName === 'Polygon' ? 'POL' : 'APE'} for transaction fees`;
    }
    
    if (message.includes('gas')) {
      return `Transaction failed due to gas issues on ${chainName}`;
    }
    
    if (message.includes('nonce')) {
      return `Transaction nonce error on ${chainName}. Please reset your wallet.`;
    }
    
    if (message.includes('execution reverted')) {
      return `Smart contract rejected the transaction on ${chainName}`;
    }
    
    return `Transaction failed on ${chainName}. Please try again.`;
  }

  static async withRetry<T>(
    operation: () => Promise<T>,
    chainId: number,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: ChainError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as ChainError;
        
        const errorType = this.handleRpcError(lastError, chainId);
        
        // Don't retry rate limit errors immediately
        if (errorType === 'RATE_LIMITED') {
          await new Promise(resolve => setTimeout(resolve, delay * attempt * 2));
        } else if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    }
    
    throw lastError!;
  }
}

// Export convenience functions
export const handlePolygonError = (error: ChainError) => 
  MultiChainErrorHandler.handleRpcError(error, 137);

export const handleApeChainError = (error: ChainError) => 
  MultiChainErrorHandler.handleRpcError(error, 33139);

export const withPolygonRetry = <T>(operation: () => Promise<T>) =>
  MultiChainErrorHandler.withRetry(operation, 137);

export const withApeChainRetry = <T>(operation: () => Promise<T>) =>
  MultiChainErrorHandler.withRetry(operation, 33139);