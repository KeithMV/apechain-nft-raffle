import { writeContract, readContract, waitForTransactionReceipt } from '@wagmi/core';
import { wagmiConfig } from '../config/wagmi';
import { RAFFLE_CONTRACT_ABI } from '../config/contracts';
import { parseEther } from 'viem';
import { safeLog, safeError } from '../utils/logSanitizer';

export interface RaffleInfo {
  nftContract: string;
  tokenId: bigint;
  creator: string;
  ticketPrice: bigint;
  maxTickets: bigint;
  ticketsSold: bigint;
  endTime: bigint;
  winner: string;
  completed: boolean;
  platformFee: bigint;
}

export interface BuyTicketsParams {
  raffleContract: string;
  quantity: number;
  ticketPrice: string; // In APE
}

class RaffleContractService {
  
  /**
   * Buy tickets for a raffle
   */
  async buyTickets(params: BuyTicketsParams): Promise<string> {
    safeLog('🔄 Buying tickets with params:', params);

    try {
      // Get current raffle info to validate
      const raffleInfo = await this.getRaffleInfo(params.raffleContract);
      const availableTickets = Number(raffleInfo.maxTickets - raffleInfo.ticketsSold);
      
      safeLog('📊 Raffle validation:', {
        availableTickets,
        requestedQuantity: params.quantity,
        completed: raffleInfo.completed,
        ticketPrice: params.ticketPrice
      });
      
      // Validate quantity
      if (params.quantity > availableTickets) {
        throw new Error(`Only ${availableTickets} tickets available`);
      }
      
      if (raffleInfo.completed) {
        throw new Error('Raffle has already completed');
      }
      
      // Check if raffle is still active (not expired)
      const now = Math.floor(Date.now() / 1000);
      if (now >= Number(raffleInfo.endTime)) {
        throw new Error('Raffle has expired');
      }
      
      const totalCost = parseEther((parseFloat(params.ticketPrice) * params.quantity).toString());
      safeLog('💰 Total cost:', totalCost.toString(), 'wei');
      
      const hash = await writeContract(wagmiConfig, {
        address: params.raffleContract as `0x${string}`,
        abi: RAFFLE_CONTRACT_ABI,
        functionName: 'buyTickets',
        args: [BigInt(params.quantity)],
        value: totalCost,
        gas: BigInt(300000), // Increased gas for potential winner selection
      });

      safeLog('✅ Ticket purchase transaction submitted:', hash);

      // Wait for confirmation with longer timeout for winner selection
      const receipt = await waitForTransactionReceipt(wagmiConfig, {
        hash,
        confirmations: 1,
        timeout: 60000, // 60 second timeout
      });

      safeLog('✅ Ticket purchase confirmed:', receipt.status);
      
      if (receipt.status === 'reverted') {
        throw new Error('Transaction reverted - check your APE balance and allowance');
      }
      
      return hash;

    } catch (error: any) {
      safeError('❌ Ticket purchase failed:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('insufficient funds')) {
        throw new Error('Insufficient APE balance for ticket purchase');
      }
      if (error.message?.includes('allowance')) {
        throw new Error('Please approve APE spending for this contract');
      }
      if (error.message?.includes('user rejected')) {
        throw new Error('Transaction cancelled by user');
      }
      if (error.message?.includes('unknown reason')) {
        throw new Error('Transaction failed - check your APE balance and try again');
      }
      
      throw error;
    }
  }

  /**
   * Get raffle information
   */
  async getRaffleInfo(raffleContract: string): Promise<RaffleInfo> {
    try {
      const info = await readContract(wagmiConfig, {
        address: raffleContract as `0x${string}`,
        abi: RAFFLE_CONTRACT_ABI,
        functionName: 'getRaffleInfo',
      });
      
      // Handle both tuple and object return types
      if (Array.isArray(info)) {
        const [
          nftContract,
          tokenId,
          creator,
          ticketPrice,
          maxTickets,
          ticketsSold,
          endTime,
          winner,
          completed,
          platformFee
        ] = info;

        return {
          nftContract,
          tokenId,
          creator,
          ticketPrice,
          maxTickets,
          ticketsSold,
          endTime,
          winner,
          completed,
          platformFee
        };
      } else {
        // Handle object return type
        return info as RaffleInfo;
      }
    } catch (error) {
      safeError('Failed to get raffle info:', error);
      throw error;
    }
  }

  /**
   * Check if raffle is active
   */
  async isActive(raffleContract: string): Promise<boolean> {
    try {
      const active = await readContract(wagmiConfig, {
        address: raffleContract as `0x${string}`,
        abi: RAFFLE_CONTRACT_ABI,
        functionName: 'isActive',
      });
      return active as boolean;
    } catch (error) {
      safeError('Failed to check raffle status:', error);
      return false;
    }
  }

  /**
   * Get user's ticket count for a raffle
   */
  async getUserTickets(raffleContract: string, userAddress: string): Promise<number> {
    try {
      const tickets = await readContract(wagmiConfig, {
        address: raffleContract as `0x${string}`,
        abi: RAFFLE_CONTRACT_ABI,
        functionName: 'ticketsPurchased',
        args: [userAddress as `0x${string}`],
      });
      return Number(tickets);
    } catch (error) {
      safeError('Failed to get user tickets:', error);
      return 0;
    }
  }

  /**
   * Select winner (can be called by anyone after raffle ends)
   */
  async selectWinner(raffleContract: string): Promise<string> {
    try {
      safeLog('🔄 Selecting winner for raffle:', raffleContract);
      
      const hash = await writeContract(wagmiConfig, {
        address: raffleContract as `0x${string}`,
        abi: RAFFLE_CONTRACT_ABI,
        functionName: 'selectWinner',
        gas: BigInt(150000), // Set reasonable gas limit
      });

      safeLog('✅ Winner selection transaction submitted:', hash);

      // Wait for confirmation with timeout
      await waitForTransactionReceipt(wagmiConfig, {
        hash,
        confirmations: 1,
        timeout: 30000, // 30 second timeout
      });

      safeLog('✅ Winner selection confirmed');
      return hash;

    } catch (error) {
      safeError('❌ Winner selection failed:', error);
      throw error;
    }
  }

  /**
   * Calculate time remaining for raffle
   */
  getTimeRemaining(endTime: bigint): {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  } {
    const now = Math.floor(Date.now() / 1000);
    const end = Number(endTime);
    const remaining = end - now;

    if (remaining <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;

    return { days, hours, minutes, seconds, isExpired: false };
  }

  /**
   * Calculate win probability for user
   */
  calculateWinProbability(userTickets: number, totalTickets: number): number {
    if (totalTickets === 0) return 0;
    return (userTickets / totalTickets) * 100;
  }
}

export const raffleContractService = new RaffleContractService();