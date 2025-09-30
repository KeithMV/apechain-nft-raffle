import { writeContract, readContract, waitForTransactionReceipt } from '@wagmi/core';
import { wagmiConfig } from '../config/wagmi';
import { RAFFLE_FACTORY_ADDRESS, RAFFLE_FACTORY_ABI, ERC721_ABI } from '../config/contracts';
import { parseEther } from 'viem';
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
      const fee = await readContract(wagmiConfig, {
        address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
        abi: RAFFLE_FACTORY_ABI,
        functionName: 'platformFee',
      });
      return fee as bigint;
    } catch (error) {
      safeError('Failed to get platform fee:', error);
      return BigInt(1000); // Default 10%
    }
  }

  /**
   * Get current raffle counter
   */
  async getRaffleCounter(): Promise<number> {
    try {
      const counter = await readContract(wagmiConfig, {
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

    try {
      const hash = await writeContract(wagmiConfig, {
        address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
        abi: RAFFLE_FACTORY_ABI,
        functionName: 'createRaffle',
        args: [
          params.nftContract as `0x${string}`,
          BigInt(params.tokenId),
          parseEther(params.ticketPrice),
          BigInt(params.maxTickets),
          BigInt(params.duration)
        ],
        gas: BigInt(500000), // Set reasonable gas limit
      });

      safeLog('✅ Raffle creation transaction submitted:', hash);

      // Wait for transaction confirmation
      const receipt = await waitForTransactionReceipt(wagmiConfig, {
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
      throw error;
    }
  }

  /**
   * Get raffle contract address by ID
   */
  async getRaffleContract(raffleId: number): Promise<string> {
    try {
      const raffleContract = await readContract(wagmiConfig, {
        address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
        abi: RAFFLE_FACTORY_ABI,
        functionName: 'getRaffleContract',
        args: [BigInt(raffleId)],
      });
      return raffleContract as string;
    } catch (error) {
      safeError('Failed to get raffle contract:', error);
      throw error;
    }
  }

  /**
   * Check if user has approved RaffleFactory for all NFTs from a contract
   */
  async isApprovedForAll(nftContract: string, userAddress: string): Promise<boolean> {
    try {
      const isApproved = await readContract(wagmiConfig, {
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
   */
  async approveForAll(nftContract: string): Promise<string> {
    try {
      safeLog('🔄 Approving NFT contract for raffle:', nftContract);
      
      const hash = await writeContract(wagmiConfig, {
        address: nftContract as `0x${string}`,
        abi: ERC721_ABI,
        functionName: 'setApprovalForAll',
        args: [RAFFLE_FACTORY_ADDRESS as `0x${string}`, true],
        gas: BigInt(100000), // Set reasonable gas limit for approval
      });

      safeLog('✅ Approval transaction submitted:', hash);

      // Wait for confirmation
      await waitForTransactionReceipt(wagmiConfig, {
        hash,
        confirmations: 1,
      });

      safeLog('✅ Approval confirmed');
      return hash;
    } catch (error) {
      safeError('❌ Approval failed:', error);
      throw error;
    }
  }

  /**
   * Revoke approval for RaffleFactory
   */
  async revokeApproval(nftContract: string): Promise<string> {
    try {
      safeLog('🔄 Revoking NFT contract approval:', nftContract);
      
      const hash = await writeContract(wagmiConfig, {
        address: nftContract as `0x${string}`,
        abi: ERC721_ABI,
        functionName: 'setApprovalForAll',
        args: [RAFFLE_FACTORY_ADDRESS as `0x${string}`, false],
        gas: BigInt(100000), // Set reasonable gas limit
      });

      safeLog('✅ Revoke transaction submitted:', hash);

      // Wait for confirmation
      await waitForTransactionReceipt(wagmiConfig, {
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
}

export const raffleService = new RaffleService();