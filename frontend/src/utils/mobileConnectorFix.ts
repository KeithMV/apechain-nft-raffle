import { getAccount, getChainId } from '@wagmi/core';
import { config } from '../config/wagmi-minimal';

/**
 * Professional wallet connection validator
 * Handles cross-platform wallet connection validation with proper error handling
 */
export class WalletConnectionValidator {
  private static readonly APECHAIN_ID = 33139;
  private static readonly CONNECTION_TIMEOUT = 5000;

  /**
   * Validates wallet connection state with mobile Safari compatibility
   */
  static async validateConnection(): Promise<{
    isValid: boolean;
    account?: `0x${string}`;
    chainId?: number;
    error?: string;
  }> {
    try {
      const account = getAccount(config);
      
      // Mobile Safari compatibility: accept address even if isConnected is false
      if (!account.address) {
        return {
          isValid: false,
          error: 'Wallet not connected. Please connect your wallet first.'
        };
      }
      
      // Log for debugging mobile Safari issues
      if (!account.isConnected && account.address) {
        console.log('Mobile Safari mode: wallet address detected without isConnected flag');
      }

      // Validate chain ID with timeout for mobile networks
      let chainId: number;
      try {
        const chainIdPromise = Promise.resolve(getChainId(config));
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Chain validation timeout')), this.CONNECTION_TIMEOUT)
        );
        
        chainId = await Promise.race([chainIdPromise, timeoutPromise]);
        
        if (chainId !== this.APECHAIN_ID) {
          return {
            isValid: false,
            account: account.address as `0x${string}`,
            chainId,
            error: `Please switch to ApeChain network (${this.APECHAIN_ID}). Current: ${chainId}`
          };
        }
      } catch (chainError) {
        return {
          isValid: false,
          account: account.address as `0x${string}`,
          error: 'Unable to verify network. Please ensure you are connected to ApeChain.'
        };
      }

      return {
        isValid: true,
        account: account.address as `0x${string}`,
        chainId
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      return {
        isValid: false,
        error: `Connection validation failed: ${errorMessage}`
      };
    }
  }

  /**
   * Executes operation with validated wallet connection
   * Mobile Safari compatible with fallback
   */
  static async withValidatedConnection<T>(
    operation: (account: `0x${string}`) => Promise<T>
  ): Promise<T> {
    const validation = await this.validateConnection();
    
    if (!validation.isValid) {
      // Mobile Safari fallback: try direct account access
      const directAccount = getAccount(config);
      if (directAccount.address) {
        console.log('Using mobile Safari fallback with direct account access');
        return await operation(directAccount.address as `0x${string}`);
      }
      
      throw new Error(validation.error || 'Wallet connection validation failed');
    }

    if (!validation.account) {
      throw new Error('No wallet address available');
    }

    return await operation(validation.account);
  }

  /**
   * Quick connection check without chain validation
   * Used for non-critical operations
   */
  static hasConnectedWallet(): boolean {
    try {
      const account = getAccount(config);
      return account.isConnected && !!account.address;
    } catch {
      return false;
    }
  }
}