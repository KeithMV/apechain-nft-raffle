/**
 * Polygon-Specific Optimizations
 * Now powered by Alchemy Gas Oracle for real-time gas pricing
 */

import { getChainConfig } from '../config/chainConfigurations';
import { markEndpointAsFailed } from '../config/wagmiUnified';

// Define operation types locally since we removed gas oracle
type OperationType = 'create-raffle' | 'buy-tickets' | 'select-winner' | 'cancel-raffle';

export class PolygonOptimizer {
  private static instance: PolygonOptimizer;
  private performanceMetrics = {
    avgTransactionTime: 0,
    failureRate: 0,
    totalTransactions: 0,
    failedTransactions: 0,
  };

  static getInstance(): PolygonOptimizer {
    if (!PolygonOptimizer.instance) {
      PolygonOptimizer.instance = new PolygonOptimizer();
    }
    return PolygonOptimizer.instance;
  }

  /**
   * Get simple gas settings (no oracle)
   */
  async getOptimizedGasSettings(
    operation: OperationType,
    contractCall?: any
  ): Promise<{
    gasLimit: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    estimatedCostUSD?: number;
    congestionLevel: string;
  }> {
    // Use simple fallback settings (no oracle)
    return this.getFallbackGasSettings(operation);
  }

  /**
   * Get simple network status (no oracle)
   */
  async getNetworkStatus(): Promise<{
    baseFeeGwei: number;
    congestionLevel: string;
    recommendedAction: string;
    shouldWarn: boolean;
  }> {
    // Return simple status without oracle
    return {
      baseFeeGwei: 50, // Assume moderate gas
      congestionLevel: 'medium',
      recommendedAction: 'Gas prices are moderate. Transaction should work fine.',
      shouldWarn: false // Don't show warnings
    };
  }

  /**
   * Fallback gas settings when Alchemy fails
   */
  private getFallbackGasSettings(operation: OperationType) {
    console.warn('🔄 [POLYGON OPTIMIZER] Using fallback gas settings');
    
    const fallbackSettings = {
      'create-raffle': {
        gasLimit: '400000',
        maxFeePerGas: '300000000000', // 300 gwei (increased from 200)
        maxPriorityFeePerGas: '100000000000', // 100 gwei (increased from 80)
      },
      'buy-tickets': {
        gasLimit: '150000',
        maxFeePerGas: '280000000000', // 280 gwei (increased from 180)
        maxPriorityFeePerGas: '90000000000', // 90 gwei (increased from 70)
      },
      'select-winner': {
        gasLimit: '200000',
        maxFeePerGas: '320000000000', // 320 gwei (increased from 220)
        maxPriorityFeePerGas: '100000000000', // 100 gwei (increased from 90)
      },
      'cancel-raffle': {
        gasLimit: '100000',
        maxFeePerGas: '260000000000', // 260 gwei (increased from 160)
        maxPriorityFeePerGas: '80000000000', // 80 gwei (increased from 60)
      }
    };

    return {
      ...fallbackSettings[operation],
      congestionLevel: 'extreme', // Changed from 'high' to 'extreme' to reflect current conditions
      estimatedCostUSD: undefined
    };
  }

  /**
   * Handle Polygon-specific RPC errors
   */
  handlePolygonRPCError(error: any, endpoint?: string): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';

    // Polygon-specific error patterns
    const polygonErrorPatterns = [
      'execution reverted',
      'insufficient funds',
      'gas required exceeds allowance',
      'transaction underpriced',
      'replacement transaction underpriced',
      'nonce too low',
      'nonce too high',
      'already known',
      'transaction pool limit reached',
    ];

    if (polygonErrorPatterns.some(pattern => errorMessage.includes(pattern))) {
      console.warn('🔶 [POLYGON] Detected Polygon-specific error:', errorMessage);
      
      // Don't mark endpoint as failed for these errors - they're transaction-level issues
      return true; // Handled
    }

    // Rate limiting errors - mark endpoint as problematic
    if (errorMessage.includes('429') || errorMessage.includes('too many requests')) {
      console.warn('🚫 [POLYGON] Rate limit detected on endpoint:', endpoint);
      if (endpoint) {
        markEndpointAsFailed(endpoint);
      }
      return true; // Handled
    }

    // Network congestion errors
    if (errorMessage.includes('timeout') || errorMessage.includes('network error')) {
      console.warn('🐌 [POLYGON] Network congestion detected');
      this.recordFailure();
      return true; // Handled
    }

    return false; // Not handled
  }

  /**
   * Get optimized timeout for Polygon operations
   */
  getOptimizedTimeout(operation: 'create-raffle' | 'buy-tickets' | 'select-winner' | 'cancel-raffle'): number {
    const config = getChainConfig(137); // Polygon
    const baseTimeout = 20000; // REDUCED: From 30s to 20s base

    const operationMultipliers = {
      'create-raffle': 1.3,   // REDUCED: From 1.6 to 1.3 (26 seconds)
      'buy-tickets': 1.0,     // REDUCED: From 1.3 to 1.0 (20 seconds)
      'select-winner': 1.5,   // REDUCED: From 2.0 to 1.5 (30 seconds)
      'cancel-raffle': 1.2,   // REDUCED: From 1.4 to 1.2 (24 seconds)
    };

    const optimizedTimeout = baseTimeout * config.transaction.timeoutMultiplier * operationMultipliers[operation];
    
    // Add congestion buffer based on current failure rate (minimal impact)
    const congestionMultiplier = 1 + (this.performanceMetrics.failureRate * 0.2); // REDUCED: From 0.3 to 0.2
    
    return Math.floor(optimizedTimeout * congestionMultiplier);
  }

  /**
   * Check if Polygon is currently congested
   */
  isPolygonCongested(): boolean {
    return this.performanceMetrics.failureRate > 0.3; // 30% failure rate indicates congestion
  }

  /**
   * Get recommended retry strategy for Polygon
   */
  getRetryStrategy(operation: string) {
    const isCongested = this.isPolygonCongested();
    
    return {
      maxRetries: isCongested ? 1 : 2, // Fewer retries when congested
      retryDelay: isCongested ? 8000 : 5000, // Longer delays when congested
      backoffMultiplier: 2.0,
    };
  }

  /**
   * Record transaction success
   */
  recordSuccess(transactionTime: number) {
    this.performanceMetrics.totalTransactions++;
    this.performanceMetrics.avgTransactionTime = 
      (this.performanceMetrics.avgTransactionTime + transactionTime) / 2;
    
    this.updateFailureRate();
  }

  /**
   * Record transaction failure
   */
  recordFailure() {
    this.performanceMetrics.totalTransactions++;
    this.performanceMetrics.failedTransactions++;
    
    this.updateFailureRate();
  }

  /**
   * Update failure rate calculation
   */
  private updateFailureRate() {
    if (this.performanceMetrics.totalTransactions > 0) {
      this.performanceMetrics.failureRate = 
        this.performanceMetrics.failedTransactions / this.performanceMetrics.totalTransactions;
    }
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  /**
   * Reset performance metrics (useful for testing)
   */
  resetMetrics() {
    this.performanceMetrics = {
      avgTransactionTime: 0,
      failureRate: 0,
      totalTransactions: 0,
      failedTransactions: 0,
    };
  }
}

// Export singleton instance
export const polygonOptimizer = PolygonOptimizer.getInstance();

// Polygon-specific utility functions
export const polygonUtils = {
  /**
   * Check if an error is Polygon-specific and recoverable
   */
  isRecoverableError(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';
    const recoverablePatterns = [
      'nonce too low',
      'replacement transaction underpriced',
      'transaction underpriced',
      'network error',
      'timeout',
    ];
    
    return recoverablePatterns.some(pattern => message.includes(pattern));
  },

  /**
   * Get human-readable error message for Polygon errors
   */
  getPolygonErrorMessage(error: any): string {
    const message = error?.message?.toLowerCase() || '';
    
    if (message.includes('insufficient funds')) {
      return 'Insufficient POL balance for transaction fees';
    }
    if (message.includes('gas required exceeds allowance')) {
      return 'Transaction requires more gas than allowed';
    }
    if (message.includes('transaction underpriced')) {
      return 'Gas price too low for current network conditions';
    }
    if (message.includes('nonce too low')) {
      return 'Transaction nonce conflict - please try again';
    }
    if (message.includes('execution reverted')) {
      return 'Transaction failed - contract execution reverted';
    }
    if (message.includes('timeout')) {
      return 'Transaction timed out due to network congestion';
    }
    
    return 'Polygon network error - please try again';
  },

  /**
   * Suggest action for Polygon errors
   */
  getPolygonErrorAction(error: any): string {
    const message = error?.message?.toLowerCase() || '';
    
    if (message.includes('insufficient funds')) {
      return 'Add more POL to your wallet for transaction fees';
    }
    if (message.includes('transaction underpriced')) {
      return 'Increase gas price and try again';
    }
    if (message.includes('nonce')) {
      return 'Wait a moment and retry the transaction';
    }
    if (message.includes('timeout') || message.includes('network error')) {
      return 'Network is congested - wait and try again';
    }
    
    return 'Check network status and retry';
  },
};