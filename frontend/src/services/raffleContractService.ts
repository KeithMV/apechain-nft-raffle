import { writeContract, readContract, waitForTransactionReceipt, getPublicClient } from '@wagmi/core';
import { config } from '../config/wagmi';
import { RAFFLE_CONTRACT_ABI } from '../config/contracts';
import { parseEther } from 'viem/utils';
import { apeTokenService } from './apeTokenService';
import { safeLog, safeError } from '../utils/logSanitizer';
import { ErrorHandlingService } from './errorHandlingService';

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
  useBatch?: boolean; // Optional flag to force batch mode
}

class RaffleContractService {
  

  
  /**
   * Buy tickets for a raffle (standard method)
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
      
      // Pre-calculate total cost to avoid async in transaction args
      const totalCost = await apeTokenService.calculateTotalCost(params.ticketPrice, params.quantity);
      safeLog('💰 Total cost:', totalCost.toString(), 'wei');
      
      // Choose method based on quantity
      const functionName = params.quantity > 100 ? 'buyTicketsBatch' : 'buyTickets';
      
      const hash = await writeContract(config, {
        address: params.raffleContract as `0x${string}`,
        abi: RAFFLE_CONTRACT_ABI,
        functionName,
        args: [BigInt(params.quantity)],
        value: totalCost,
        // Gas will be estimated automatically
      });

      safeLog('✅ Ticket purchase transaction submitted:', hash);

      // Wait for confirmation with longer timeout for winner selection
      const receipt = await waitForTransactionReceipt(config, {
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
      throw new Error(ErrorHandlingService.parseContractError(error));
    }
  }

  /**
   * Buy tickets in batch (for large quantities)
   */
  async buyTicketsBatch(params: BuyTicketsParams): Promise<string> {
    safeLog('🔄 Buying tickets in batch with params:', params);

    try {
      // Validate batch size
      if (params.quantity > 500) {
        throw new Error('Maximum 500 tickets per batch purchase');
      }

      // Get current raffle info to validate
      const raffleInfo = await this.getRaffleInfo(params.raffleContract);
      const availableTickets = Number(raffleInfo.maxTickets - raffleInfo.ticketsSold);
      
      if (params.quantity > availableTickets) {
        throw new Error(`Only ${availableTickets} tickets available`);
      }
      
      if (raffleInfo.completed) {
        throw new Error('Raffle has already completed');
      }
      
      const now = Math.floor(Date.now() / 1000);
      if (now >= Number(raffleInfo.endTime)) {
        throw new Error('Raffle has expired');
      }
      
      const totalCost = await apeTokenService.calculateTotalCost(params.ticketPrice, params.quantity);
      safeLog('💰 Batch total cost:', totalCost.toString(), 'wei');
      
      const hash = await writeContract(config, {
        address: params.raffleContract as `0x${string}`,
        abi: RAFFLE_CONTRACT_ABI,
        functionName: 'buyTicketsBatch',
        args: [BigInt(params.quantity)],
        value: totalCost,
        gas: BigInt(8000000), // Higher gas limit for batch operations
      });

      safeLog('✅ Batch ticket purchase transaction submitted:', hash);

      const receipt = await waitForTransactionReceipt(config, {
        hash,
        confirmations: 1,
        timeout: 120000, // 2 minute timeout for batch operations
      });

      safeLog('✅ Batch ticket purchase confirmed:', receipt.status);
      
      if (receipt.status === 'reverted') {
        throw new Error('Batch transaction reverted - check your APE balance');
      }
      
      return hash;

    } catch (error: any) {
      safeError('❌ Batch ticket purchase failed:', error);
      throw new Error(ErrorHandlingService.parseContractError(error));
    }
  }

  /**
   * Get raffle information
   */
  async getRaffleInfo(raffleContract: string): Promise<RaffleInfo> {
    try {
      // First try the secure contract format (uses endBlock)
      try {
        const structInfo = await readContract(config, {
          address: raffleContract as `0x${string}`,
          abi: [{
            "inputs": [],
            "name": "getRaffleInfo",
            "outputs": [{
              "components": [
                {"internalType": "address", "name": "nftContract", "type": "address"},
                {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
                {"internalType": "address", "name": "creator", "type": "address"},
                {"internalType": "uint256", "name": "ticketPrice", "type": "uint256"},
                {"internalType": "uint256", "name": "maxTickets", "type": "uint256"},
                {"internalType": "uint256", "name": "ticketsSold", "type": "uint256"},
                {"internalType": "uint256", "name": "endBlock", "type": "uint256"},
                {"internalType": "address", "name": "winner", "type": "address"},
                {"internalType": "bool", "name": "completed", "type": "bool"},
                {"internalType": "uint256", "name": "platformFee", "type": "uint256"}
              ],
              "internalType": "struct RaffleContractSecure.RaffleInfo",
              "name": "",
              "type": "tuple"
            }],
            "stateMutability": "view",
            "type": "function"
          }],
          functionName: 'getRaffleInfo',
        });
        
        // Handle standard contract format (uses timestamps)
        
        return {
          nftContract: structInfo.nftContract,
          tokenId: structInfo.tokenId,
          creator: structInfo.creator,
          ticketPrice: structInfo.ticketPrice,
          maxTickets: structInfo.maxTickets,
          ticketsSold: structInfo.ticketsSold,
          endTime: (structInfo as any).endTime || (structInfo as any).endBlock, // Handle both endTime and endBlock
          winner: structInfo.winner,
          completed: structInfo.completed,
          platformFee: structInfo.platformFee
        };
      } catch (structError) {
        console.log('Secure contract format failed for contract:', raffleContract, 'trying legacy format. Error:', structError);
        // If struct format fails, try the old array format (older contracts)
        const arrayInfo = await readContract(config, {
          address: raffleContract as `0x${string}`,
          abi: [{
            "inputs": [],
            "name": "getRaffleInfo",
            "outputs": [
              {"internalType": "address", "name": "nftContract", "type": "address"},
              {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
              {"internalType": "address", "name": "creator", "type": "address"},
              {"internalType": "uint256", "name": "ticketPrice", "type": "uint256"},
              {"internalType": "uint256", "name": "maxTickets", "type": "uint256"},
              {"internalType": "uint256", "name": "ticketsSold", "type": "uint256"},
              {"internalType": "uint256", "name": "endTime", "type": "uint256"},
              {"internalType": "address", "name": "winner", "type": "address"},
              {"internalType": "bool", "name": "completed", "type": "bool"}
            ],
            "stateMutability": "view",
            "type": "function"
          }],
          functionName: 'getRaffleInfo',
        });
        
        // Handle array format (older contracts)
        if (Array.isArray(arrayInfo) && arrayInfo.length === 9) {
          const [
            nftContract,
            tokenId,
            creator,
            ticketPrice,
            maxTickets,
            ticketsSold,
            endTime,
            winner,
            completed
          ] = arrayInfo;

          return {
            nftContract: nftContract as string,
            tokenId: tokenId as bigint,
            creator: creator as string,
            ticketPrice: ticketPrice as bigint,
            maxTickets: maxTickets as bigint,
            ticketsSold: ticketsSold as bigint,
            endTime: endTime as bigint,
            winner: winner as string,
            completed: completed as boolean,
            platformFee: 0n // Default platform fee for older contracts
          };
        } else {
          console.error('Invalid array format for contract:', raffleContract, 'arrayInfo:', arrayInfo);
          // Return default values for invalid format
          return {
            nftContract: '',
            tokenId: 0n,
            creator: '',
            ticketPrice: 0n,
            maxTickets: 0n,
            ticketsSold: 0n,
            endTime: 0n,
            winner: '',
            completed: true,
            platformFee: 0n
          };
        }
      }
    } catch (error) {
      console.error('Failed to get raffle info for contract:', raffleContract, error);
      safeError('Failed to get raffle info:', error);
      // Return default raffle info to prevent crashes
      return {
        nftContract: '',
        tokenId: 0n,
        creator: '',
        ticketPrice: 0n,
        maxTickets: 0n,
        ticketsSold: 0n,
        endTime: 0n,
        winner: '',
        completed: true,
        platformFee: 0n
      };
    }
  }

  /**
   * Check if raffle is active
   */
  async isActive(raffleContract: string): Promise<boolean> {
    try {
      const active = await readContract(config, {
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
      const tickets = await readContract(config, {
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
   * Emergency select winner (for expired raffles)
   */
  async emergencySelectWinner(raffleContract: string): Promise<string> {
    try {
      safeLog('🔄 Emergency winner selection for raffle:', raffleContract);
      
      const hash = await writeContract(config, {
        address: raffleContract as `0x${string}`,
        abi: RAFFLE_CONTRACT_ABI,
        functionName: 'emergencySelectWinner',
      });

      safeLog('✅ Emergency winner selection transaction submitted:', hash);

      await waitForTransactionReceipt(config, {
        hash,
        confirmations: 1,
        timeout: 30000,
      });

      safeLog('✅ Emergency winner selection confirmed');
      return hash;

    } catch (error) {
      safeError('❌ Emergency winner selection failed:', error);
      throw new Error(ErrorHandlingService.parseContractError(error));
    }
  }

  /**
   * Commit randomness for winner selection (creator only)
   */
  async commitRandomness(raffleContract: string, commitHash: string): Promise<string> {
    try {
      safeLog('🔄 Committing randomness for raffle:', raffleContract);
      
      const hash = await writeContract(config, {
        address: raffleContract as `0x${string}`,
        abi: RAFFLE_CONTRACT_ABI,
        functionName: 'commitRandomness',
        args: [commitHash as `0x${string}`],
      });

      safeLog('✅ Commit randomness transaction submitted:', hash);

      await waitForTransactionReceipt(config, {
        hash,
        confirmations: 1,
        timeout: 30000,
      });

      safeLog('✅ Commit randomness confirmed');
      return hash;

    } catch (error) {
      safeError('❌ Commit randomness failed:', error);
      throw new Error(ErrorHandlingService.parseContractError(error));
    }
  }

  /**
   * Reveal randomness and select winner
   */
  async revealAndSelectWinner(raffleContract: string, nonce: bigint): Promise<string> {
    try {
      safeLog('🔄 Revealing randomness and selecting winner:', raffleContract);
      
      const hash = await writeContract(config, {
        address: raffleContract as `0x${string}`,
        abi: RAFFLE_CONTRACT_ABI,
        functionName: 'revealAndSelectWinner',
        args: [nonce],
      });

      safeLog('✅ Reveal and select winner transaction submitted:', hash);

      await waitForTransactionReceipt(config, {
        hash,
        confirmations: 1,
        timeout: 30000,
      });

      safeLog('✅ Reveal and select winner confirmed');
      return hash;

    } catch (error) {
      safeError('❌ Reveal and select winner failed:', error);
      throw new Error(ErrorHandlingService.parseContractError(error));
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
   * Cancel raffle (creator only, no tickets sold)
   */
  async cancelRaffle(raffleContract: string): Promise<string> {
    try {
      safeLog('🔄 Cancelling raffle:', raffleContract);
      
      const hash = await writeContract(config, {
        address: raffleContract as `0x${string}`,
        abi: RAFFLE_CONTRACT_ABI,
        functionName: 'cancelRaffle',
      });

      safeLog('✅ Cancel raffle transaction submitted:', hash);

      await waitForTransactionReceipt(config, {
        hash,
        confirmations: 1,
        timeout: 30000,
      });

      safeLog('✅ Raffle cancelled confirmed');
      return hash;

    } catch (error) {
      safeError('❌ Cancel raffle failed:', error);
      throw new Error(ErrorHandlingService.parseContractError(error));
    }
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