import { parseAbiItem } from 'viem';
import { RAFFLE_FACTORY_ADDRESS } from '../config/contracts';
import { raffleContractService } from './raffleContractService';
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
  creator: string;
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
  private activeRafflesCache: CreatedRaffle[] | null = null;
  private lastUpdate = new Map<string, number>();
  private activeRafflesLastUpdate = 0;
  private readonly CACHE_DURATION = 45000; // 45 seconds (longer for better UX)
  private readonly ACTIVE_RAFFLES_CACHE_DURATION = 90000; // 1.5 minutes for active raffles

  /**
   * Get all raffles user has participated in (bought tickets)
   */
  async getUserRafflePositions(userAddress: string, publicClient: any): Promise<UserRafflePosition[]> {
    safeLog('🎫 Getting user raffle positions for:', userAddress);
    
    if (!publicClient) {
      console.log('❌ No publicClient provided');
      return [];
    }
    
    // Check cache first
    const cacheKey = userAddress.toLowerCase();
    const lastUpdate = this.lastUpdate.get(cacheKey) || 0;
    const now = Date.now();
    
    if (now - lastUpdate < this.CACHE_DURATION && this.cache.has(cacheKey)) {
      safeLog('🎫 Returning cached user raffle positions');
      return this.cache.get(cacheKey) || [];
    }
    
    try {
      // Get all RaffleCreated events (last 500000 blocks)
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock > 500000n ? currentBlock - 500000n : 0n;
      
      const raffleEvents = await publicClient.getLogs({
        address: RAFFLE_FACTORY_CONTRACT,
        event: parseAbiItem('event RaffleCreated(uint256 indexed raffleId, address indexed creator, address indexed nftContract, uint256 tokenId, address raffleContract, uint256 ticketPrice, uint256 maxTickets)'),
        fromBlock,
        toBlock: 'latest'
      });

      if (raffleEvents.length === 0) {
        return [];
      }

      // Limit processing to avoid performance issues while ensuring good coverage
      const eventsToProcess = raffleEvents.slice(-500); // Process last 500 events (good historical coverage)
      safeLog(`Processing ${eventsToProcess.length} of ${raffleEvents.length} raffle events`);
      
      // Process each raffle to check user participation
      const positionPromises = eventsToProcess.map(async (event: any) => {
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
          safeError('Error processing raffle position:', error);
          return null;
        }
      });

      const results = await Promise.all(positionPromises);
      const positions = results.filter(position => position !== null) as UserRafflePosition[];
      
      // Cache the results
      this.cache.set(cacheKey, positions);
      this.lastUpdate.set(cacheKey, now);
      
      safeLog(`🎫 Found ${positions.length} raffle positions for user`);
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
    
    // Check cache first
    const cacheKey = `created_${userAddress.toLowerCase()}`;
    const lastUpdate = this.lastUpdate.get(cacheKey) || 0;
    const now = Date.now();
    
    if (now - lastUpdate < this.CACHE_DURATION && this.createdCache.has(cacheKey)) {
      safeLog('🎨 Returning cached created raffles');
      return this.createdCache.get(cacheKey) || [];
    }
    
    try {
      // Get RaffleCreated events where user is the creator
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock > 500000n ? currentBlock - 500000n : 0n;
      
      const raffleEvents = await publicClient.getLogs({
        address: RAFFLE_FACTORY_CONTRACT,
        event: parseAbiItem('event RaffleCreated(uint256 indexed raffleId, address indexed creator, address indexed nftContract, uint256 tokenId, address raffleContract, uint256 ticketPrice, uint256 maxTickets)'),
        args: {
          creator: userAddress as `0x${string}`
        },
        fromBlock,
        toBlock: 'latest'
      });
      
      safeLog(`Found ${raffleEvents.length} events for creator`, userAddress);

      if (raffleEvents.length === 0) {
        return [];
      }

      // Process each created raffle (already filtered by creator)
      const rafflePromises = raffleEvents.map(async (event: any) => {
        try {
          const { raffleId, raffleContract, nftContract, tokenId, creator, ticketPrice, maxTickets } = event.args;
          
          // Get current raffle info
          const raffleInfo = await raffleContractService.getRaffleInfo(raffleContract as string);

          return {
            raffleId: Number(raffleId),
            raffleContract: raffleContract as string,
            nftContract: nftContract as string,
            tokenId: tokenId.toString(),
            creator: creator as string,
            ticketPrice: (Number(ticketPrice) / 1e18).toString(), // Convert from wei to APE
            maxTickets: Number(maxTickets),
            ticketsSold: Number(raffleInfo.ticketsSold),
            endTime: Number(raffleInfo.endTime),
            isActive: !raffleInfo.completed && Date.now() / 1000 < Number(raffleInfo.endTime),
            completed: raffleInfo.completed,
            winner: raffleInfo.completed ? raffleInfo.winner : undefined
          };
        } catch (error) {
          safeError('Error processing created raffle:', error);
          return null;
        }
      });

      const results = await Promise.all(rafflePromises);
      const raffles = results.filter(raffle => raffle !== null) as CreatedRaffle[];
      
      // Cache the results
      this.createdCache.set(cacheKey, raffles);
      this.lastUpdate.set(cacheKey, now);
      
      safeLog(`🎨 Found ${raffles.length} created raffles for user`);
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
    
    // Check cache first (longer cache for active raffles)
    const now = Date.now();
    if (now - this.activeRafflesLastUpdate < this.ACTIVE_RAFFLES_CACHE_DURATION && this.activeRafflesCache) {
      safeLog('🔍 Returning cached active raffles');
      return this.activeRafflesCache.slice(0, limit);
    }
    
    try {
      // Get RaffleCreated events from a wider range
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock > 500000n ? currentBlock - 500000n : 0n;
      
      // Scan in chunks to avoid RPC limits
      let raffleEvents: any[] = [];
      const chunkSize = 100000n;
      
      for (let start = fromBlock; start < currentBlock; start += chunkSize) {
        const end = start + chunkSize - 1n < currentBlock ? start + chunkSize - 1n : currentBlock;
        
        try {
          const chunkEvents = await publicClient.getLogs({
            address: RAFFLE_FACTORY_CONTRACT,
            event: parseAbiItem('event RaffleCreated(uint256 indexed raffleId, address indexed creator, address indexed nftContract, uint256 tokenId, address raffleContract, uint256 ticketPrice, uint256 maxTickets)'),
            fromBlock: start,
            toBlock: end
          });
          raffleEvents = raffleEvents.concat(chunkEvents);
          safeLog(`Scanned blocks ${start} to ${end}: found ${chunkEvents.length} events`);
        } catch (error) {
          safeError(`Error scanning blocks ${start} to ${end}:`, error);
        }
      }

      if (raffleEvents.length === 0) {
        return [];
      }

      safeLog(`Found ${raffleEvents.length} total raffle events`);
      safeLog('Raffle IDs found:', raffleEvents.map(e => e.args.raffleId.toString()).join(', '));
      
      // Process raffles to find active ones (generous limit for good coverage)
      const eventsToProcess = raffleEvents.slice(-Math.max(limit * 10, 200)); // Process 10x limit or minimum 200 events
      safeLog(`Processing ${eventsToProcess.length} of ${raffleEvents.length} events for active raffles`);
      
      const rafflePromises = eventsToProcess.map(async (event: any) => {
        try {
          const { raffleId, raffleContract, nftContract, tokenId, creator, ticketPrice, maxTickets } = event.args;
          safeLog(`Processing raffle`, raffleId, raffleContract);
          
          const raffleInfo = await raffleContractService.getRaffleInfo(raffleContract as string);
          safeLog(`Raffle ${raffleId} info:`, {
            completed: raffleInfo.completed,
            endTime: Number(raffleInfo.endTime),
            currentTime: Math.floor(Date.now() / 1000),
            ticketsSold: Number(raffleInfo.ticketsSold),
            maxTickets: Number(maxTickets)
          });
          
          // Check if raffle is still active
          const now = Math.floor(Date.now() / 1000);
          const isActive = !raffleInfo.completed && now < Number(raffleInfo.endTime) && Number(raffleInfo.ticketsSold) < Number(maxTickets);
          
          safeLog(`Raffle ${raffleId} active:`, isActive);
          
          if (!isActive) {
            return null;
          }

          return {
            raffleId: Number(raffleId),
            raffleContract: raffleContract as string,
            nftContract: nftContract as string,
            tokenId: tokenId.toString(),
            creator: creator as string,
            ticketPrice: (Number(ticketPrice) / 1e18).toString(),
            maxTickets: Number(maxTickets),
            ticketsSold: Number(raffleInfo.ticketsSold),
            endTime: Number(raffleInfo.endTime),
            isActive: true,
            completed: false
          };
        } catch (error) {
          safeError('Error processing raffle:', error);
          return null;
        }
      });

      const results = await Promise.all(rafflePromises);
      const activeRaffles = results.filter(raffle => raffle !== null) as CreatedRaffle[];
      
      // Apply limit and sort by newest first
      const limitedRaffles = activeRaffles
        .sort((a, b) => b.raffleId - a.raffleId)
        .slice(0, limit);
      
      // Cache the results
      this.activeRafflesCache = limitedRaffles;
      this.activeRafflesLastUpdate = now;
      
      safeLog(`🔍 Found ${limitedRaffles.length} active raffles (limited from ${activeRaffles.length})`);
      return limitedRaffles;

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
      const createdCacheKey = `created_${cacheKey}`;
      this.cache.delete(cacheKey);
      this.createdCache.delete(createdCacheKey);
      this.lastUpdate.delete(cacheKey);
      this.lastUpdate.delete(createdCacheKey);
    } else {
      this.cache.clear();
      this.createdCache.clear();
      this.lastUpdate.clear();
      this.activeRafflesCache = null;
      this.activeRafflesLastUpdate = 0;
    }
  }

  /**
   * Clear all data
   */
  clearAllData() {
    this.cache.clear();
    this.createdCache.clear();
    this.lastUpdate.clear();
    this.activeRafflesCache = null;
    this.activeRafflesLastUpdate = 0;
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats() {
    return {
      userPositionsCache: this.cache.size,
      createdRafflesCache: this.createdCache.size,
      activeRafflesCached: this.activeRafflesCache ? this.activeRafflesCache.length : 0,
      lastUpdates: this.lastUpdate.size
    };
  }
}

export const rafflePositionService = new RafflePositionService();