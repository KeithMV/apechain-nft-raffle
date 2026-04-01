/**
 * Centralized Error Handling Utility
 * Provides consistent error handling across the application
 */

import toast from 'react-hot-toast';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
}

export class ErrorHandler {
  private static logError(error: AppError): void {
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorHandler]', error);
    }
  }

  static createError(code: string, message: string, details?: any): AppError {
    return {
      code,
      message,
      details,
      timestamp: Date.now()
    };
  }

  static handleWalletError = (error: any): AppError => {
    const appError = ErrorHandler.createError('WALLET_ERROR', 'Wallet operation failed', error);
    
    if (error?.code === 4001) {
      appError.message = 'Transaction rejected by user';
    } else if (error?.code === -32002) {
      appError.message = 'Connection request already pending';
    } else if (error?.message?.includes('insufficient funds')) {
      appError.message = 'Insufficient funds for transaction';
    } else if (error?.message?.includes('network')) {
      appError.message = 'Network connection failed';
    }
    
    ErrorHandler.logError(appError);
    toast.error(appError.message);
    return appError;
  };

  static handleContractError = (error: any): AppError => {
    const appError = ErrorHandler.createError('CONTRACT_ERROR', 'Contract operation failed', error);
    
    // Extract detailed revert reason with comprehensive logging
    let revertReason = '';
    
    console.log('🔍 Full Contract Error Analysis:', {
      error,
      errorType: typeof error,
      errorConstructor: error?.constructor?.name,
      message: error?.message,
      reason: error?.reason,
      cause: error?.cause,
      data: error?.data,
      code: error?.code,
      details: error?.details,
      shortMessage: error?.shortMessage,
      version: error?.version,
      stack: error?.stack?.split('\n').slice(0, 5)
    });
    
    // Try multiple extraction methods
    if (error?.cause?.reason) {
      revertReason = error.cause.reason;
      console.log('✅ Found revert reason in cause.reason:', revertReason);
    } else if (error?.reason) {
      revertReason = error.reason;
      console.log('✅ Found revert reason in reason:', revertReason);
    } else if (error?.shortMessage) {
      revertReason = error.shortMessage;
      console.log('✅ Found revert reason in shortMessage:', revertReason);
    } else if (error?.details) {
      revertReason = error.details;
      console.log('✅ Found revert reason in details:', revertReason);
    } else if (error?.message) {
      // Try to extract revert reason from message
      const revertMatch = error.message.match(/reverted with reason string '([^']+)'/);
      const customErrorMatch = error.message.match(/reverted with custom error '([^']+)'/);
      const panicMatch = error.message.match(/reverted with panic code ([0-9x]+)/);
      
      if (revertMatch) {
        revertReason = revertMatch[1];
        console.log('✅ Extracted revert reason from message:', revertReason);
      } else if (customErrorMatch) {
        revertReason = `Custom error: ${customErrorMatch[1]}`;
        console.log('✅ Extracted custom error from message:', revertReason);
      } else if (panicMatch) {
        revertReason = `Panic code: ${panicMatch[1]}`;
        console.log('✅ Extracted panic code from message:', revertReason);
      } else if (error.message.includes('execution reverted')) {
        revertReason = 'Transaction reverted (no reason provided)';
        console.log('⚠️ Generic revert detected');
      }
    }
    
    if (revertReason) {
      appError.message = `Contract rejected: ${revertReason}`;
    } else if (error?.message?.includes('execution reverted')) {
      appError.message = 'Transaction failed - contract rejected (no specific reason)';
    } else if (error?.message?.includes('gas')) {
      appError.message = 'Transaction failed - insufficient gas';
    } else if (error?.message?.includes('Rate limit exceeded')) {
      appError.message = 'Please wait before creating another raffle (rate limit)';
    } else if (error?.message?.includes('user rejected')) {
      appError.message = 'Transaction cancelled by user';
    }
    
    ErrorHandler.logError(appError);
    toast.error(appError.message);
    return appError;
  };

  static handleNetworkError(error: any): AppError {
    const appError = this.createError('NETWORK_ERROR', 'Network request failed', error);
    
    if (error?.message?.includes('timeout')) {
      appError.message = 'Request timed out - please try again';
    } else if (error?.message?.includes('fetch')) {
      appError.message = 'Network connection failed';
    }
    
    this.logError(appError);
    toast.error(appError.message);
    return appError;
  }

  static handleValidationError(field: string, value: any): AppError {
    const appError = this.createError('VALIDATION_ERROR', `Invalid ${field}`, { field, value });
    this.logError(appError);
    toast.error(appError.message);
    return appError;
  }

  static handleGenericError(error: any, context?: string): AppError {
    const appError = this.createError('GENERIC_ERROR', 'An unexpected error occurred', { error, context });
    this.logError(appError);
    toast.error('Something went wrong. Please try again.');
    return appError;
  }

  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    errorHandler?: (error: any) => AppError
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      if (errorHandler) {
        errorHandler(error);
      } else {
        this.handleGenericError(error);
      }
      return null;
    }
  }
}