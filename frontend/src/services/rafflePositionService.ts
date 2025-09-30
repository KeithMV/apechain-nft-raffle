import { readContract } from '@wagmi/core';
import { wagmiConfig } from '../config/wagmi';
import { parseAbiItem } from 'viem';
import { RAFFLE_FACTORY_ADDRESS } from '../config/contracts';
import { raffleContractService, RaffleInfo } from './raffleContractService';
import { safeLog, safeError } from '../utils/logSanitizer';

export interface UserRafflePosition {
  raffleId: number;
  raffleContract: string;
  nftContract: string;
  tokenId: string;
  creator: string;
  ticketPrice: string; // In APE
  maxTickets: number;
  ticketsSold: number;
  userTickets: number;
  winProbability: number; // Percentage
  endTime: number;
  isActive: boolean;
  isWinner: boolean;
  completed: boolean;
}

export interface CreatedRaffle {
  raffleId: number;
  raffleContract: string;
  nftContract: string;
  tokenId: string;
  ticketPrice: string;
  maxTickets: number;
  ticketsSold: number;
  endTime: number;
  isActive: boolean;
  completed: boolean;
  winner?: string;
}

const RAFFLE_FACTORY_CONTRACT = RAFFLE_FACTORY_ADDRESS as `0x${string}`;

class RafflePositionService {
  private cache = new Map<string, UserRafflePosition[]>();
  private createdCache = new Map<string, CreatedRaffle[]>();
  private lastUpdate = new Map<string, number>();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  /**
   * Get all raffles user has participated in (bought tickets)
   */
  async getUserRafflePositions(userAddress: string, publicClient: any): Promise<UserRafflePosition[]> {
    safeLog('🎫 Getting user raffle positions for:', userAddress);
    
    if (!publicClient) {
      console.log('❌ No publicClient provided');
      return [];
    }
    
    try {
      // Get all RaffleCreated events (last 50000 blocks)
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock > 50000n ? currentBlock - 50000n : 0n;
      
      const raffleEvents = await publicClient.getLogs({
        address: RAFFLE_FACTORY_CONTRACT,
        event: parseAbiItem('event RaffleCreated(uint256 indexed raffleId, address indexed creator, address indexed nftContract, uint256 tokenId, address raffleContract, uint256 ticketPrice, uint256 maxTickets)'),
        fromBlock,
        toBlock: 'latest'
      });

      if (raffleEvents.length === 0) {
        return [];
      }

      // Process each raffle to check user participation
      const positionPromises = raffleEvents.map(async (event: any) => {
        try {
          const { raffleId, raffleContract, nftContract, tokenId, creator, ticketPrice, maxTickets } = event.args;
          
          // Get raffle info and user tickets
          const [raffleInfo, userTickets] = await Promise.all([
            raffleContractService.getRaffleInfo(raffleContract as string),
            raffleContractService.getUserTickets(raffleContract as string, userAddress)
          ]);

          // Skip if user has no tickets
          if (userTickets === 0) {
            return null;
          }

          const winProbability = raffleContractService.calculateWinProbability(
            userTickets, 
            Number(raffleInfo.ticketsSold)
          );

          const isWinner = raffleInfo.completed && 
                          raffleInfo.winner.toLowerCase() === userAddress.toLowerCase();

          return {
            raffleId: Number(raffleId),
            raffleContract: raffleContract as string,
            nftContract: nftContract as string,
            tokenId: tokenId.toString(),
            creator: creator as string,
            ticketPrice: (Number(ticketPrice) / 1e18).toString(), // Convert from wei to APE
            maxTickets: Number(maxTickets),
            ticketsSold: Number(raffleInfo.ticketsSold),
            userTickets,
            winProbability,
            endTime: Number(raffleInfo.endTime),
            isActive: !raffleInfo.completed && Date.now() / 1000 < Number(raffleInfo.endTime),
            isWinner,
            completed: raffleInfo.completed
          };
        } catch (error) {
          console.log('Error processing raffle position:', error);
          return null;
        }
      });

      const results = await Promise.all(positionPromises);
      const positions = results.filter(position => position !== null) as UserRafflePosition[];
      
      console.log(`🎫 Found ${positions.length} raffle positions for user`);
      return positions;

    } catch (error) {
      safeError('Error fetching user raffle positions:', error);
      return [];
    }
  }

  /**
   * Get all raffles created by user
   */
  async getCreatedRaffles(userAddress: string, publicClient: any): Promise<CreatedRaffle[]> {
    safeLog('🎨 Getting created raffles for:', userAddress);
    
    if (!publicClient) {
      console.log('❌ No publicClient provided');
      return [];
    }
    
    try {
      // Get RaffleCreated events where user is the creator
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock > 50000n ? currentBlock - 50000n : 0n;
      
      const raffleEvents = await publicClient.getLogs({
        address: RAFFLE_FACTORY_CONTRACT,
        event: parseAbiItem('event RaffleCreated(uint256 indexed raffleId, address indexed creator, address indexed nftContract, uint256 tokenId, address raffleContract, uint256 ticketPrice, uint256 maxTickets)'),
        fromBlock,
        toBlock: 'latest',
        args: {
          creator: userAddress as `0x${string}` // Filter by creator
        }
      });

      if (raffleEvents.length === 0) {
        return [];
      }

      // Process each created raffle
      const rafflePromises = raffleEvents.map(async (event: any) => {
        try {
          const { raffleId, raffleContract, nftContract, tokenId, ticketPrice, maxTickets } = event.args;
          
          // Get current raffle info
          const raffleInfo = await raffleContractService.getRaffleInfo(raffleContract as string);

          return {
            raffleId: Number(raffleId),
            raffleContract: raffleContract as string,
            nftContract: nftContract as string,
            tokenId: tokenId.toString(),
            ticketPrice: (Number(ticketPrice) / 1e18).toString(), // Convert from wei to APE
            maxTickets: Number(maxTickets),
            ticketsSold: Number(raffleInfo.ticketsSold),
            endTime: Number(raffleInfo.endTime),
            isActive: !raffleInfo.completed && Date.now() / 1000 < Number(raffleInfo.endTime),
            completed: raffleInfo.completed,
            winner: raffleInfo.completed ? raffleInfo.winner : undefined
          };
        } catch (error) {
          console.log('Error processing created raffle:', error);
          return null;
        }
      });

      const results = await Promise.all(rafflePromises);
      const raffles = results.filter(raffle => raffle !== null) as CreatedRaffle[];
      
      console.log(`🎨 Found ${raffles.length} created raffles for user`);
      return raffles;

    } catch (error) {
      safeError('Error fetching created raffles:', error);
      return [];
    }
  }

  /**
   * Get all active raffles (for browsing)
   */
  async getActiveRaffles(publicClient: any, limit: number = 20): Promise<CreatedRaffle[]> {
    safeLog('🔍 Getting active raffles');
    
    if (!publicClient) {
      console.log('❌ No publicClient provided');
      return [];
    }
    
    try {
      // Get recent RaffleCreated events
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock > 10000n ? currentBlock - 10000n : 0n;
      
      const raffleEvents = await publicClient.getLogs({
        address: RAFFLE_FACTORY_CONTRACT,
        event: parseAbiItem('event RaffleCreated(uint256 indexed raffleId, address indexed creator, address indexed nftContract, uint256 tokenId, address raffleContract, uint256 ticketPrice, uint256 maxTickets)'),
        fromBlock,
        toBlock: 'latest'
      });

      if (raffleEvents.length === 0) {
        return [];
      }

      // Process and filter active raffles
      const rafflePromises = raffleEvents.slice(-limit).map(async (event: any) => {
        try {
          const { raffleId, raffleContract, nftContract, tokenId, creator, ticketPrice, maxTickets } = event.args;
          
          // Check if raffle is still active
          const isActive = await raffleContractService.isActive(raffleContract as string);
          
          if (!isActive) {
            return null; // Skip inactive raffles
          }

          const raffleInfo = await raffleContractService.getRaffleInfo(raffleContract as string);

          return {
            raffleId: Number(raffleId),
            raffleContract: raffleContract as string,
            nftContract: nftContract as string,
            tokenId: tokenId.toString(),
            ticketPrice: (Number(ticketPrice) / 1e18).toString(),
            maxTickets: Number(maxTickets),
            ticketsSold: Number(raffleInfo.ticketsSold),
            endTime: Number(raffleInfo.endTime),
            isActive: true,
            completed: false
          };
        } catch (error) {
          console.log('Error processing active raffle:', error);
          return null;
        }
      });

      const results = await Promise.all(rafflePromises);
      const activeRaffles = results.filter(raffle => raffle !== null) as CreatedRaffle[];
      
      console.log(`🔍 Found ${activeRaffles.length} active raffles`);
      return activeRaffles.reverse(); // Show newest first

    } catch (error) {
      safeError('Error fetching active raffles:', error);
      return [];
    }
  }

  /**
   * Clear cache for user
   */
  clearCache(userAddress?: string) {
    if (userAddress) {
      const cacheKey = userAddress.toLowerCase();
      this.cache.delete(cacheKey);
      this.createdCache.delete(cacheKey);
      this.lastUpdate.delete(cacheKey);
    } else {
      this.cache.clear();
      this.createdCache.clear();
      this.lastUpdate.clear();
    }
  }

  /**
   * Clear all data
   */
  clearAllData() {
    this.cache.clear();
    this.createdCache.clear();
    this.lastUpdate.clear();
  }
}

export const rafflePositionService = new RafflePositionService();