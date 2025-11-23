import { writeContract, readContract, waitForTransactionReceipt, getAccount, getChainId } from '@wagmi/core';
import { config } from '../config/wagmi-minimal';
import { RAFFLE_FACTORY_ADDRESS, RAFFLE_FACTORY_ABI, ERC721_ABI } from '../config/contracts';
import { parseEther } from 'viem/utils';
import { apeTokenService } from './apeTokenService';
import { safeLog, safeError } from '../utils/logSanitizer';
import { WalletConnectionService } from '../utils/walletConnectionService';

export interface CreateRaffleParams {
  nftContract: string;
  tokenId: string;
  ticketPrice: string; // In APE
  maxTickets: number;
  duration: number; // In seconds
}

export interface RaffleResult {
  hash: string;
  raffleId?: number;
  raffleContract?: string;
}

class RaffleService {
  
  /**
   * Get current platform fee
   */
  async getPlatformFee(): Promise<bigint> {
    try {
      const fee = await readContract(config, {
        address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
        abi: RAFFLE_FACTORY_ABI,
        functionName: 'platformFee',
      });
      return fee as bigint;
    } catch (error) {
      safeError('Failed to get platform fee:', error);
      // Return fallback for backward compatibility, but log the error
      console.warn('Using fallback platform fee due to contract read failure');
      return BigInt(1000); // Default 10%
    }
  }

  /**
   * Get current raffle counter
   */
  async getRaffleCounter(): Promise<number> {
    try {
      const counter = await readContract(config, {
        address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
        abi: RAFFLE_FACTORY_ABI,
        functionName: 'raffleCounter',
      });
      return Number(counter);
    } catch (error) {
      safeError('Failed to get raffle counter:', error);
      return 0;
    }
  }

  /**
   * Create a new NFT raffle with mobile Safari compatibility
   */
  async createRaffle(params: CreateRaffleParams): Promise<RaffleResult> {
    safeLog('🔄 Starting raffle creation with params:', params);

    try {
      return await WalletConnectionService.executeWithWallet(async (accountAddress) => {
        // Pre-calculate APE amount to avoid async in transaction args
        const ticketPriceWei = await apeTokenService.parseApe(params.ticketPrice);
        
        // Mobile Safari compatibility - validated account for transaction
        const hash = await writeContract(config, {
          address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
          abi: RAFFLE_FACTORY_ABI,
          functionName: 'createRaffle',
          args: [
            params.nftContract as `0x${string}`,
            BigInt(params.tokenId),
            ticketPriceWei,
            BigInt(params.maxTickets),
            BigInt(params.duration)
          ] as const,
          account: accountAddress as `0x${string}`,
        });

        safeLog('✅ Raffle creation transaction submitted:', hash);

        // Wait for transaction confirmation
        const receipt = await waitForTransactionReceipt(config, {
          hash,
          confirmations: 1,
        });

        safeLog('✅ Raffle creation confirmed:', receipt);

        // Try to get raffle ID and contract address
        let raffleId: number | undefined;
        let raffleContract: string | undefined;
        
        try {
          const currentCounter = await this.getRaffleCounter();
          raffleId = currentCounter - 1; // Latest raffle ID
          raffleContract = await this.getRaffleContract(raffleId);
          safeLog('🎯 Raffle created - ID:', raffleId, 'Contract:', raffleContract);
        } catch (error) {
          safeError('⚠️ Could not retrieve raffle details:', error);
        }

        return {
          hash,
          raffleId,
          raffleContract
        };
      });

    } catch (error) {
      safeError('❌ Raffle creation failed:', error);
      
      // Enhanced mobile Safari error handling
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.message.includes('getChainId') || error.message.includes('connector')) {
          errorMessage = 'Mobile wallet connection issue. Please reconnect your wallet and try again.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network connection issue. Please check your connection and try again.';
        } else if (error.message.includes('rejected') || error.message.includes('denied')) {
          errorMessage = 'Transaction was rejected by user.';
        } else {
          errorMessage = error.message;
        }
      }
      
      // Return error result instead of throwing to prevent unhandled rejections
      return {
        hash: '',
        error: errorMessage
      } as RaffleResult & { error: string };
    }
  }

  /**
   * Get raffle contract address by ID
   */
  async getRaffleContract(raffleId: number): Promise<string> {
    try {
      const raffleContract = await readContract(config, {
        address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
        abi: RAFFLE_FACTORY_ABI,
        functionName: 'getRaffleContract',
        args: [BigInt(raffleId)],
      });
      return raffleContract as string;
    } catch (error) {
      safeError('Failed to get raffle contract:', error);
      return '';
    }
  }

  /**
   * Check if user has approved RaffleFactory for all NFTs from a contract
   */
  async isApprovedForAll(nftContract: string, userAddress: string): Promise<boolean> {
    try {
      const isApproved = await readContract(config, {
        address: nftContract as `0x${string}`,
        abi: ERC721_ABI,
        functionName: 'isApprovedForAll',
        args: [userAddress as `0x${string}`, RAFFLE_FACTORY_ADDRESS as `0x${string}`],
      });
      return isApproved as boolean;
    } catch (error) {
      safeError('Failed to check approval status:', error);
      return false;
    }
  }

  /**
   * Approve RaffleFactory to transfer all NFTs from a contract
   * Professional implementation with proper error handling
   */
  async approveForAll(nftContract: string): Promise<string> {
    if (!nftContract || !nftContract.startsWith('0x')) {
      throw new Error('Invalid NFT contract address');
    }

    return await WalletConnectionService.executeWithWallet(async (account) => {
      safeLog('🔄 Approving NFT contract for raffle:', nftContract);
      
      try {
        const hash = await writeContract(config, {
          address: nftContract as `0x${string}`,
          abi: ERC721_ABI,
          functionName: 'setApprovalForAll',
          args: [RAFFLE_FACTORY_ADDRESS as `0x${string}`, true],
          account,
        });

        safeLog('✅ Approval transaction submitted:', hash);

        // Wait for confirmation with appropriate timeout
        await waitForTransactionReceipt(config, {
          hash,
          confirmations: 1,
          timeout: 60_000, // 60 seconds for mobile networks
        });

        safeLog('✅ NFT approval confirmed');
        return hash;
        
      } catch (error) {
        safeError('❌ NFT approval failed:', error);
        
        // Professional error handling with specific user guidance
        if (error instanceof Error) {
          if (error.message.includes('rejected') || error.message.includes('denied')) {
            throw new Error('Transaction was rejected. Please try again.');
          }
          if (error.message.includes('insufficient funds')) {
            throw new Error('Insufficient funds for transaction fees.');
          }
          if (error.message.includes('network') || error.message.includes('timeout')) {
            throw new Error('Network error. Please check your connection and try again.');
          }
        }
        
        // Re-throw with original error for debugging
        throw error;
      }
    });
  }

  /**
   * Revoke approval for RaffleFactory
   */
  async revokeApproval(nftContract: string): Promise<string> {
    return await WalletConnectionService.executeWithWallet(async (accountAddress) => {
      try {
        safeLog('🔄 Revoking NFT contract approval:', nftContract);
        
        const hash = await writeContract(config, {
          address: nftContract as `0x${string}`,
          abi: ERC721_ABI,
          functionName: 'setApprovalForAll',
          args: [RAFFLE_FACTORY_ADDRESS as `0x${string}`, false],
          account: accountAddress as `0x${string}`,
        });

        safeLog('✅ Revoke transaction submitted:', hash);

        // Wait for confirmation
        await waitForTransactionReceipt(config, {
          hash,
          confirmations: 1,
        });

        safeLog('✅ Approval revoked');
        return hash;
      } catch (error) {
        safeError('❌ Revoke failed:', error);
        throw error;
      }
    });
  }

  /**
   * Emergency pause all raffle operations (owner only)
   */
  async emergencyPause(): Promise<string> {
    try {
      safeLog('🚨 Emergency pausing raffle factory');
      
      const hash = await writeContract(config, {
        address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
        abi: RAFFLE_FACTORY_ABI,
        functionName: 'emergencyPause',
      });

      await waitForTransactionReceipt(config, { hash });
      safeLog('✅ Emergency pause activated');
      return hash;
    } catch (error) {
      safeError('❌ Emergency pause failed:', error);
      throw error;
    }
  }

  /**
   * Resume operations after emergency pause (owner only)
   */
  async emergencyUnpause(): Promise<string> {
    try {
      safeLog('🔄 Resuming raffle operations');
      
      const hash = await writeContract(config, {
        address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
        abi: RAFFLE_FACTORY_ABI,
        functionName: 'emergencyUnpause',
      });

      await waitForTransactionReceipt(config, { hash });
      safeLog('✅ Operations resumed');
      return hash;
    } catch (error) {
      safeError('❌ Resume failed:', error);
      throw error;
    }
  }

  /**
   * Check if factory is paused
   */
  async isPaused(): Promise<boolean> {
    try {
      const paused = await readContract(config, {
        address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
        abi: RAFFLE_FACTORY_ABI,
        functionName: 'paused',
      });
      return paused as boolean;
    } catch (error) {
      safeError('Failed to check pause status:', error);
      return false;
    }
  }
}

export const raffleService = new RaffleService();

// Emergency pause interface for admin use
export interface EmergencyControls {
  pause: () => Promise<string>;
  unpause: () => Promise<string>;
  isPaused: () => Promise<boolean>;
}

export const emergencyControls: EmergencyControls = {
  pause: () => raffleService.emergencyPause(),
  unpause: () => raffleService.emergencyUnpause(),
  isPaused: () => raffleService.isPaused()
};