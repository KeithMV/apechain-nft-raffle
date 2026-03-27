/**
 * Alchemy-Based Smart Gas Oracle
 * Uses dedicated Alchemy API for real-time gas price optimization
 */

import { createPublicClient, http, formatGwei, parseGwei } from 'viem';
import { polygon } from 'viem/chains';

export type OperationType = 'create-raffle' | 'buy-tickets' | 'select-winner' | 'cancel-raffle';
export type CongestionLevel = 'low' | 'medium' | 'high' | 'extreme';

export interface GasEstimate {
  gasLimit: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  estimatedCostUSD?: number;
  congestionLevel: CongestionLevel;
  baseFeeGwei: number;
}

export interface GasOracleConfig {
  cacheDuration: number;
  fallbackGasLimit: bigint;
  fallbackMaxFee: bigint;
  fallbackPriorityFee: bigint;
}

class AlchemyGasOracle {
  private static instance: AlchemyGasOracle;
  private gasClient: any;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private config: GasOracleConfig;

  private constructor() {
    // Create dedicated gas estimation client
    const gasApiKey = process.env.REACT_APP_ALCHEMY_GAS_KEY;
    
    if (!gasApiKey || gasApiKey === 'your_gas_api_key_here') {
      console.warn('⚠️ [GAS ORACLE] No dedicated gas API key found, using RPC key');
      // Fallback to RPC key if gas key not set
      const rpcKey = process.env.REACT_APP_ALCHEMY_API_KEY;
      this.gasClient = createPublicClient({
        chain: polygon,
        transport: http(`https://polygon-mainnet.g.alchemy.com/v2/${rpcKey}`)
      });
    } else {
      this.gasClient = createPublicClient({
        chain: polygon,
        transport: http(`https://polygon-mainnet.g.alchemy.com/v2/${gasApiKey}`)
      });
      console.log('✅ [GAS ORACLE] Using dedicated Alchemy gas API key');
    }

    this.config = {
      cacheDuration: 10000, // 10 seconds
      fallbackGasLimit: 500000n,
      fallbackMaxFee: parseGwei('300'), // 300 gwei emergency fallback (increased from 200)
      fallbackPriorityFee: parseGwei('60'), // 60 gwei priority fallback (increased from 40)
    };
  }

  static getInstance(): AlchemyGasOracle {
    if (!AlchemyGasOracle.instance) {
      AlchemyGasOracle.instance = new AlchemyGasOracle();
    }
    return AlchemyGasOracle.instance;
  }

  /**
   * Get optimal gas settings for a specific operation
   */
  async getOptimalGas(
    operation: OperationType,
    contractCall?: any
  ): Promise<GasEstimate> {
    const cacheKey = `gas-${operation}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.config.cacheDuration) {
      console.log(`🔄 [GAS ORACLE] Using cached gas for ${operation}`);
      return cached.data;
    }

    try {
      // Get current network conditions
      const [feeData, latestBlock, gasEstimate] = await Promise.all([
        this.gasClient.estimateFeesPerGas(),
        this.gasClient.getBlock({ blockTag: 'latest' }),
        contractCall ? this.gasClient.estimateGas(contractCall).catch(() => this.config.fallbackGasLimit) : this.config.fallbackGasLimit
      ]);

      // Calculate base fee and congestion level
      const baseFee = latestBlock.baseFeePerGas || parseGwei('30');
      const baseFeeGwei = Number(formatGwei(baseFee));
      const congestionLevel = this.detectCongestion(baseFeeGwei);

      // Get operation-specific multipliers
      const multiplier = this.getGasMultiplier(congestionLevel, operation);

      // Calculate optimal gas settings
      const maxFeePerGas = this.calculateMaxFeePerGas(baseFee, feeData.maxFeePerGas, multiplier);
      const maxPriorityFeePerGas = this.calculatePriorityFee(feeData.maxPriorityFeePerGas, congestionLevel);
      const gasLimit = typeof gasEstimate === 'bigint' ? gasEstimate * 120n / 100n : this.config.fallbackGasLimit;

      // CRITICAL VALIDATION: Ensure maxFeePerGas > baseFee + maxPriorityFeePerGas
      const requiredMaxFee = baseFee + maxPriorityFeePerGas + parseGwei('5'); // +5 gwei safety margin
      const validatedMaxFeePerGas = maxFeePerGas > requiredMaxFee ? maxFeePerGas : requiredMaxFee;

      const result: GasEstimate = {
        gasLimit,
        maxFeePerGas: validatedMaxFeePerGas,
        maxPriorityFeePerGas,
        congestionLevel,
        baseFeeGwei,
        estimatedCostUSD: await this.estimateCostUSD(gasLimit, validatedMaxFeePerGas)
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      console.log(`⚡ [GAS ORACLE] ${operation} gas: ${formatGwei(maxFeePerGas)} gwei (${congestionLevel} congestion)`);
      
      return result;

    } catch (error) {
      console.error('🚨 [GAS ORACLE] Failed to get gas estimate:', error);
      return this.getFallbackGas(operation);
    }
  }

  /**
   * Detect network congestion level based on base fee
   */
  private detectCongestion(baseFeeGwei: number): CongestionLevel {
    if (baseFeeGwei > 50) return 'extreme';  // 50+ gwei is extreme for Polygon (normal is 1-3 gwei)
    if (baseFeeGwei > 20) return 'high';     // 20+ gwei is high congestion
    if (baseFeeGwei > 10) return 'medium';   // 10+ gwei is medium congestion
    return 'low';
  }

  /**
   * Get gas multiplier based on congestion and operation type
   */
  private getGasMultiplier(congestion: CongestionLevel, operation: OperationType): number {
    const congestionMultipliers = {
      'low': 1.1,
      'medium': 1.3,
      'high': 1.6,
      'extreme': 2.2
    };

    const operationMultipliers = {
      'create-raffle': 1.2, // Complex operation
      'buy-tickets': 1.0,   // Simple operation
      'select-winner': 1.3, // Complex operation
      'cancel-raffle': 1.1  // Medium operation
    };

    return congestionMultipliers[congestion] * operationMultipliers[operation];
  }

  /**
   * Calculate optimal max fee per gas
   */
  private calculateMaxFeePerGas(baseFee: bigint, suggestedMaxFee: bigint | undefined, multiplier: number): bigint {
    // EMERGENCY CAP: Never exceed 300 gwei max fee during extreme congestion (increased from 200)
    const emergencyMaxFee = parseGwei('300');
    
    // Get the higher of: (baseFee * 2.5) or suggested max fee
    const minMaxFee = baseFee * 25n / 10n; // 2.5x base fee minimum
    const suggestedFee = suggestedMaxFee || minMaxFee;
    const baseMaxFee = suggestedFee > minMaxFee ? suggestedFee : minMaxFee;
    
    // Apply multiplier
    const multiplierBigInt = BigInt(Math.floor(multiplier * 100));
    const calculatedMaxFee = baseMaxFee * multiplierBigInt / 100n;
    
    // CRITICAL FIX: Ensure maxFeePerGas is always higher than baseFee + reasonable priority fee
    const priorityFeeBuffer = baseFee / 10n; // 10% of base fee as priority buffer
    const minimumRequired = baseFee + priorityFeeBuffer + parseGwei('10'); // +10 gwei safety margin
    
    const validMaxFee = calculatedMaxFee > minimumRequired ? calculatedMaxFee : minimumRequired;
    
    // EMERGENCY CAP: Never exceed 300 gwei to protect user funds (but allow higher during extreme congestion)
    return validMaxFee > emergencyMaxFee ? emergencyMaxFee : validMaxFee;
  }

  /**
   * Calculate optimal priority fee
   */
  private calculatePriorityFee(suggestedPriorityFee: bigint | undefined, congestion: CongestionLevel): bigint {
    // Use network-suggested priority fee or a higher minimum for extreme congestion
    const networkPriorityFee = suggestedPriorityFee || parseGwei('20');
    const minPriorityFeeForExtreme = parseGwei('85'); // Minimum 85 gwei for extreme congestion
    
    const basePriorityFee = congestion === 'extreme' && networkPriorityFee < minPriorityFeeForExtreme 
      ? minPriorityFeeForExtreme 
      : networkPriorityFee;
    
    const priorityMultipliers = {
      'low': 1.0,
      'medium': 1.2,
      'high': 1.5,
      'extreme': 1.1  // Reduced multiplier since we're using higher base fee for extreme
    };

    const multiplier = priorityMultipliers[congestion];
    const multiplierBigInt = BigInt(Math.floor(multiplier * 100));
    
    // Increased priority fee cap to handle extreme congestion
    const calculatedFee = basePriorityFee * multiplierBigInt / 100n;
    const maxPriorityFee = parseGwei('100'); // 100 gwei cap
    
    return calculatedFee > maxPriorityFee ? maxPriorityFee : calculatedFee;
  }

  /**
   * Estimate transaction cost in USD (rough estimate)
   */
  private async estimateCostUSD(gasLimit: bigint, maxFeePerGas: bigint): Promise<number> {
    try {
      // Rough POL price estimate (in production, you'd fetch this from an API)
      const polPriceUSD = 0.45; // Approximate POL price
      
      const gasCostPol = Number(gasLimit * maxFeePerGas) / 1e18;
      return gasCostPol * polPriceUSD;
    } catch {
      return 0;
    }
  }

  /**
   * Get fallback gas settings when API fails
   */
  private getFallbackGas(operation: OperationType): GasEstimate {
    console.warn('🔄 [GAS ORACLE] Using fallback gas settings');
    
    const operationGasLimits = {
      'create-raffle': 400000n,
      'buy-tickets': 150000n,
      'select-winner': 200000n,
      'cancel-raffle': 100000n
    };

    return {
      gasLimit: operationGasLimits[operation],
      maxFeePerGas: this.config.fallbackMaxFee,
      maxPriorityFeePerGas: this.config.fallbackPriorityFee,
      congestionLevel: 'high', // Assume high congestion for safety
      baseFeeGwei: 100 // Conservative estimate
    };
  }

  /**
   * Get current network status
   */
  async getNetworkStatus(): Promise<{
    baseFeeGwei: number;
    congestionLevel: CongestionLevel;
    recommendedAction: string;
  }> {
    try {
      const latestBlock = await this.gasClient.getBlock({ blockTag: 'latest' });
      const baseFee = latestBlock.baseFeePerGas || parseGwei('30');
      const baseFeeGwei = Number(formatGwei(baseFee));
      const congestionLevel = this.detectCongestion(baseFeeGwei);

      const recommendations = {
        'low': 'Great time for transactions! Low gas fees.',
        'medium': 'Moderate gas fees. Consider waiting if not urgent.',
        'high': 'High gas fees. Consider using ApeChain or waiting.',
        'extreme': 'Extremely high gas fees! Strongly recommend waiting or using ApeChain.'
      };

      return {
        baseFeeGwei,
        congestionLevel,
        recommendedAction: recommendations[congestionLevel]
      };
    } catch (error) {
      return {
        baseFeeGwei: 100,
        congestionLevel: 'high',
        recommendedAction: 'Unable to check network status. Proceed with caution.'
      };
    }
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 [GAS ORACLE] Cache cleared');
  }
}

// Export singleton instance
export const alchemyGasOracle = AlchemyGasOracle.getInstance();

// Utility functions
export const gasUtils = {
  /**
   * Format gas price for display
   */
  formatGasPrice(gasPrice: bigint): string {
    return `${formatGwei(gasPrice)} gwei`;
  },

  /**
   * Format estimated cost for display
   */
  formatCost(costUSD: number): string {
    if (costUSD < 0.01) return '< $0.01';
    if (costUSD < 1) return `$${costUSD.toFixed(3)}`;
    return `$${costUSD.toFixed(2)}`;
  },

  /**
   * Get congestion color for UI
   */
  getCongestionColor(level: CongestionLevel): string {
    const colors = {
      'low': '#10b981',    // green
      'medium': '#f59e0b', // yellow
      'high': '#ef4444',   // red
      'extreme': '#dc2626' // dark red
    };
    return colors[level];
  },

  /**
   * Get congestion emoji for UI
   */
  getCongestionEmoji(level: CongestionLevel): string {
    const emojis = {
      'low': '🟢',
      'medium': '🟡',
      'high': '🔴',
      'extreme': '🚨'
    };
    return emojis[level];
  }
};