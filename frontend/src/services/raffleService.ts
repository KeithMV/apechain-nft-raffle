import { writeContract, readContract, waitForTransactionReceipt } from '@wagmi/core';
import { wagmiConfig } from '../config/wagmi';
import { RAFFLE_FACTORY_ADDRESS, RAFFLE_FACTORY_ABI, ERC721_ABI } from '../config/contracts';
import { parseEther } from 'viem';

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
      console.error('Failed to get platform fee:', error);
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
      console.error('Failed to get raffle counter:', error);
      return 0;
    }
  }

  /**
   * Create a new NFT raffle
   */
  async createRaffle(params: CreateRaffleParams): Promise<RaffleResult> {
    console.log('🔄 Starting raffle creation with params:', params);

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

      console.log('✅ Raffle creation transaction submitted:', hash);

      // Wait for transaction confirmation
      const receipt = await waitForTransactionReceipt(wagmiConfig, {
        hash,
        confirmations: 1,
      });

      console.log('✅ Raffle creation confirmed:', receipt);

      // Try to get raffle ID and contract address
      let raffleId: number | undefined;
      let raffleContract: string | undefined;
      
      try {
        const currentCounter = await this.getRaffleCounter();
        raffleId = currentCounter - 1; // Latest raffle ID
        raffleContract = await this.getRaffleContract(raffleId);
        console.log('🎯 Raffle created - ID:', raffleId, 'Contract:', raffleContract);
      } catch (error) {
        console.warn('⚠️ Could not retrieve raffle details:', error);
      }

      return {
        hash,
        raffleId,
        raffleContract
      };

    } catch (error) {
      console.error('❌ Raffle creation failed:', error);
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
      console.error('Failed to get raffle contract:', error);
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
      console.error('Failed to check approval status:', error);
      return false;
    }
  }

  /**
   * Approve RaffleFactory to transfer all NFTs from a contract
   */
  async approveForAll(nftContract: string): Promise<string> {
    try {
      console.log('🔄 Approving NFT contract for raffle:', nftContract);
      
      const hash = await writeContract(wagmiConfig, {
        address: nftContract as `0x${string}`,
        abi: ERC721_ABI,
        functionName: 'setApprovalForAll',
        args: [RAFFLE_FACTORY_ADDRESS as `0x${string}`, true],
        gas: BigInt(100000), // Set reasonable gas limit for approval
      });

      console.log('✅ Approval transaction submitted:', hash);

      // Wait for confirmation
      await waitForTransactionReceipt(wagmiConfig, {
        hash,
        confirmations: 1,
      });

      console.log('✅ Approval confirmed');
      return hash;
    } catch (error) {
      console.error('❌ Approval failed:', error);
      throw error;
    }
  }

  /**
   * Revoke approval for RaffleFactory
   */
  async revokeApproval(nftContract: string): Promise<string> {
    try {
      console.log('🔄 Revoking NFT contract approval:', nftContract);
      
      const hash = await writeContract(wagmiConfig, {
        address: nftContract as `0x${string}`,
        abi: ERC721_ABI,
        functionName: 'setApprovalForAll',
        args: [RAFFLE_FACTORY_ADDRESS as `0x${string}`, false],
        gas: BigInt(100000), // Set reasonable gas limit
      });

      console.log('✅ Revoke transaction submitted:', hash);

      // Wait for confirmation
      await waitForTransactionReceipt(wagmiConfig, {
        hash,
        confirmations: 1,
      });

      console.log('✅ Approval revoked');
      return hash;
    } catch (error) {
      console.error('❌ Revoke failed:', error);
      throw error;
    }
  }
}

export const raffleService = new RaffleService();