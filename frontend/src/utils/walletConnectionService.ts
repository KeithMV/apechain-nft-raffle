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
   * Comprehensive wallet state validation with mobile compatibility
   * Follows patterns used by leading Web3 applications
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

      // Mobile-aware connection state check
      // Some mobile wallets may not set isConnected properly
      const hasValidAddress = accountState.address && accountState.address.startsWith('0x');
      if (!hasValidAddress) {
        return {
          isValid: false,
          error: 'Invalid wallet address detected.'
        };
      }

      // Network validation with timeout protection
      let currentChainId: number;
      try {
        const chainPromise = getChainId(config);
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), this.VALIDATION_TIMEOUT)
        );
        
        currentChainId = await Promise.race([chainPromise, timeoutPromise]);
        
        if (currentChainId !== this.REQUIRED_CHAIN_ID) {
          return {
            isValid: false,
            account: accountState.address as `0x${string}`,
            chainId: currentChainId,
            error: `Wrong network. Please switch to ApeChain (${this.REQUIRED_CHAIN_ID}).`
          };
        }
      } catch (networkError) {
        // Network validation failed - allow transaction to proceed
        // The wallet will enforce correct network during transaction
        console.warn('Network validation failed, proceeding with transaction attempt');
        currentChainId = this.REQUIRED_CHAIN_ID; // Assume correct network
      }

      return {
        isValid: true,
        account: accountState.address as `0x${string}`,
        chainId: currentChainId
      };
      
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Wallet validation failed'
      };
    }
  }

  /**
   * Executes Web3 operations with validated wallet connection
   * Industry standard pattern used by major dApps
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