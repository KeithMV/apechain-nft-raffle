import { getAccount } from '@wagmi/core';
import { config } from '../config/wagmi-minimal';

/**
 * Enterprise wallet connection service following Web3 industry standards
 * Mobile Safari compatible - bypasses connector validation completely
 */
export class WalletConnectionService {
  private static readonly REQUIRED_CHAIN_ID = 33139;
  
  /**
   * Mobile Safari compatible wallet validation
   * No connector dependency - address-first validation
   */
  static async validateWalletState(): Promise<{
    isValid: boolean;
    account?: `0x${string}`;
    chainId?: number;
    error?: string;
  }> {
    try {
      const accountState = getAccount(config);
      
      if (!accountState.address) {
        return {
          isValid: false,
          error: 'No wallet connected. Please connect your wallet.'
        };
      }

      if (!accountState.address.startsWith('0x')) {
        return {
          isValid: false,
          error: 'Invalid wallet address detected.'
        };
      }

      return {
        isValid: true,
        account: accountState.address as `0x${string}`,
        chainId: this.REQUIRED_CHAIN_ID
      };
      
    } catch (error) {
      return {
        isValid: false,
        error: 'Wallet connection failed. Please reconnect your wallet.'
      };
    }
  }

  /**
   * Mobile Safari compatible wallet execution
   * Direct address extraction - no connector validation
   */
  static async executeWithWallet<T>(
    operation: (account: `0x${string}`) => Promise<T>
  ): Promise<T> {
    const accountState = getAccount(config);
    
    if (!accountState.address) {
      throw new Error('No wallet connected. Please connect your wallet.');
    }

    return await operation(accountState.address as `0x${string}`);
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