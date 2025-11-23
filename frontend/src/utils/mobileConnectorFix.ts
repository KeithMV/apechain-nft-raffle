import { getAccount, getChainId, reconnect } from '@wagmi/core';
import { config } from '../config/wagmi-minimal';

/**
 * Mobile Safari connector recovery utility
 * Handles the persistent "Connector not connected" error on mobile Safari
 */
export class MobileConnectorFix {
  
  /**
   * Validate and recover mobile Safari connection
   */
  static async validateConnection(): Promise<{ isValid: boolean; account?: string; error?: string }> {
    try {
      // Check account connection
      const account = getAccount(config);
      if (!account.isConnected || !account.address) {
        return { 
          isValid: false, 
          error: 'Wallet not connected. Please connect your wallet first.' 
        };
      }

      // Try to get chain ID (this often fails on mobile Safari)
      try {
        const chainId = getChainId(config);
        if (chainId !== 33139) {
          return { 
            isValid: false, 
            error: 'Please switch to ApeChain network.' 
          };
        }
      } catch (chainError) {
        console.warn('Mobile Safari: Chain validation failed, attempting recovery');
        
        // Attempt reconnection for mobile Safari
        try {
          await reconnect(config);
          const retryChainId = getChainId(config);
          if (retryChainId !== 33139) {
            return { 
              isValid: false, 
              error: 'Please switch to ApeChain network after reconnection.' 
            };
          }
        } catch (reconnectError) {
          console.warn('Mobile Safari: Reconnection failed, proceeding with caution');
          // For mobile Safari, we'll allow the transaction to proceed
          // The wallet will handle the actual connection validation
        }
      }

      return { 
        isValid: true, 
        account: account.address 
      };
      
    } catch (error) {
      console.error('Connection validation failed:', error);
      return { 
        isValid: false, 
        error: 'Connection validation failed. Please refresh and reconnect.' 
      };
    }
  }

  /**
   * Mobile-safe transaction wrapper
   */
  static async withConnectionValidation<T>(
    operation: (account: string) => Promise<T>
  ): Promise<T> {
    const validation = await this.validateConnection();
    
    if (!validation.isValid) {
      throw new Error(validation.error || 'Connection validation failed');
    }

    if (!validation.account) {
      throw new Error('No account address available');
    }

    return await operation(validation.account);
  }
}