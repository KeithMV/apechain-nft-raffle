import { writeContract, readContract, waitForTransactionReceipt } from '@wagmi/core';
import { config } from '../config/wagmi';
import { RAFFLE_FACTORY_ADDRESS, RAFFLE_FACTORY_ABI, ERC721_ABI } from '../config/contracts';
import { parseEther } from 'viem/utils';
import { apeTokenService } from './apeTokenService';
import { safeLog, safeError } from '../utils/logSanitizer';

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
   * Create a new NFT raffle
   */
  async createRaffle(params: CreateRaffleParams): Promise<RaffleResult> {
    safeLog('🔄 Starting raffle creation with params:', params);
    safeLog('⛽ Using gas limit: 800000');

    try {
      // Pre-calculate APE amount to avoid async in transaction args
      const ticketPriceWei = await apeTokenService.parseApe(params.ticketPrice);
      
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
        ],
        gas: 800000n // Set reasonable gas limit
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

    } catch (error) {
      safeError('❌ Raffle creation failed:', error);
      // Return error result instead of throwing to prevent unhandled rejections
      return {
        hash: '',
        error: error instanceof Error ? error.message : 'Unknown error'
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
   * Mobile-safe with enhanced error handling
   */
  async approveForAll(nftContract: string): Promise<string> {
    try {
      safeLog('🔄 Approving NFT contract for raffle:', nftContract);
      
      // Mobile-safe transaction with retry logic
      let hash: string;
      try {
        hash = await writeContract(config, {
          address: nftContract as `0x${string}`,
          abi: ERC721_ABI,
          functionName: 'setApprovalForAll',
          args: [RAFFLE_FACTORY_ADDRESS as `0x${string}`, true],
          gas: 100000n // Set reasonable gas limit for approval
        });
      } catch (writeError: any) {
        // Handle mobile-specific errors
        if (writeError.message?.includes('getChainId is not a function')) {
          safeError('Mobile wallet compatibility issue detected, retrying...');
          // Wait a moment and retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          hash = await writeContract(config, {
            address: nftContract as `0x${string}`,
            abi: ERC721_ABI,
            functionName: 'setApprovalForAll',
            args: [RAFFLE_FACTORY_ADDRESS as `0x${string}`, true],
            // Remove gas limit for mobile compatibility
          });
        } else {
          throw writeError;
        }
      }

      safeLog('✅ Approval transaction submitted:', hash);

      // Wait for confirmation with mobile-safe timeout
      await waitForTransactionReceipt(config, {
        hash,
        confirmations: 1,
        timeout: 60000, // 60 second timeout for mobile
      });

      safeLog('✅ Approval confirmed');
      return hash;
    } catch (error) {
      safeError('❌ Approval failed:', error);
      
      // Enhance error message for mobile users
      if (error instanceof Error) {
        if (error.message.includes('getChainId is not a function')) {
          throw new Error('Mobile wallet compatibility issue. Please refresh the page and try again.');
        } else if (error.message.includes('network')) {
          throw new Error('Network connection issue. Please check your connection and try again.');
        }
      }
      
      throw error;
    }
  }

  /**
   * Revoke approval for RaffleFactory
   */
  async revokeApproval(nftContract: string): Promise<string> {
    try {
      safeLog('🔄 Revoking NFT contract approval:', nftContract);
      
      const hash = await writeContract(config, {
        address: nftContract as `0x${string}`,
        abi: ERC721_ABI,
        functionName: 'setApprovalForAll',
        args: [RAFFLE_FACTORY_ADDRESS as `0x${string}`, false],
        // Gas will be estimated automatically
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