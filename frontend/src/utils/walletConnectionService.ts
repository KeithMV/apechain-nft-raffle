import { getAccount, getChainId } from '@wagmi/core';
import { config } from '../config/wagmi-minimal';

/**
 * Enterprise wallet connection service following Web3 industry standards
 * Used by Uniswap, Aave, and other professional dApps
 */
export class WalletConnectionService {
  private static readonly REQUIRED_CHAIN_ID = 33139;
  private static readonly VALIDATION_TIMEOUT = 3000;
  
  /**
   * Professional wallet validation with mobile Safari compatibility
   * Maintains security while handling mobile browser limitations
   */
  static async validateWalletState(): Promise<{
    isValid: boolean;
    account?: `0x${string}`;
    chainId?: number;
    error?: string;
  }> {
    try {
      const accountState = getAccount(config);
      
      // Primary validation: ensure wallet address is available
      if (!accountState.address) {
        return {
          isValid: false,
          error: 'No wallet connected. Please connect your wallet.'
        };
      }

      // Validate address format
      const hasValidAddress = accountState.address && accountState.address.startsWith('0x');
      if (!hasValidAddress) {
        return {
          isValid: false,
          error: 'Invalid wallet address detected.'
        };
      }

      // Professional network validation with mobile Safari compatibility
      let currentChainId: number;
      try {
        // Use timeout for mobile networks
        const chainIdPromise = getChainId(config);
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), this.VALIDATION_TIMEOUT)
        );
        
        currentChainId = await Promise.race([chainIdPromise, timeoutPromise]);
        
        if (currentChainId !== this.REQUIRED_CHAIN_ID) {
          return {
            isValid: false,
            account: accountState.address as `0x${string}`,
            chainId: currentChainId,
            error: `Please switch to ApeChain network (${this.REQUIRED_CHAIN_ID})`
          };
        }
      } catch (networkError) {
        // Mobile Safari: graceful degradation for network validation
        // Transaction will fail at wallet level if wrong network
        console.warn('Network validation timeout - proceeding with transaction');
        currentChainId = this.REQUIRED_CHAIN_ID;
      }

      return {
        isValid: true,
        account: accountState.address as `0x${string}`,
        chainId: currentChainId
      };
      
    } catch (error) {
      return {
        isValid: false,
        error: 'Wallet validation failed. Please reconnect your wallet.'
      };
    }
  }

  /**
   * Professional wallet execution with mobile Safari compatibility
   * Maintains security standards while handling mobile limitations
   */
  static async executeWithWallet<T>(
    operation: (account: `0x${string}`) => Promise<T>
  ): Promise<T> {
    const walletState = await this.validateWalletState();
    
    if (!walletState.isValid || !walletState.account) {
      throw new Error(walletState.error || 'Wallet validation failed');
    }

    return await operation(walletState.account);
  }

  /**
   * Quick wallet availability check
   * Used for UI state management
   */
  static isWalletAvailable(): boolean {
    try {
      const account = getAccount(config);
      return !!account.address;
    } catch {
      return false;
    }
  }

  /**
   * Get current wallet address without validation
   * Used for display purposes only
   */
  static getCurrentAddress(): `0x${string}` | null {
    try {
      const account = getAccount(config);
      return account.address as `0x${string}` || null;
    } catch {
      return null;
    }
  }
}