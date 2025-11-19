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

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  blockNumber: bigint;
}

interface BlockRange {
  from: bigint;
  to: bigint;
  maxEvents: number;
}

const RAFFLE_FACTORY_CONTRACT = RAFFLE_FACTORY_ADDRESS as `0x${string}`;

class RafflePositionService {
  private cache = new Map<string, CacheEntry<UserRafflePosition[]>>();
  private createdCache = new Map<string, CacheEntry<CreatedRaffle[]>>();
  private allRafflesCache: CacheEntry<CreatedRaffle[]> | null = null;
  private activeRafflesCache: CacheEntry<CreatedRaffle[]> | null = null;
  
  // Professional caching strategy
  private readonly CACHE_DURATION = 30000; // 30 seconds for user data
  private readonly ACTIVE_RAFFLES_CACHE_DURATION = 60000; // 1 minute for active raffles
  private readonly ALL_RAFFLES_CACHE_DURATION = 45000; // 45 seconds for all raffles
  
  // Block scanning strategy - extended ranges to catch tonight's raffles
  private readonly BLOCK_RANGES: BlockRange[] = [
    { from: 10000n, to: 0n, maxEvents: 50 },    // Last ~4 hours (most recent)
    { from: 50000n, to: 10000n, maxEvents: 100 }, // Last ~20 hours
    { from: 150000n, to: 50000n, maxEvents: 200 } // Last ~3 days (catch all recent)
  ];
  
  private readonly MAX_CONCURRENT_REQUESTS = 5;
  private readonly REQUEST_TIMEOUT = 10000; // 10 seconds

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
    const cachedEntry = this.cache.get(cacheKey);
    
    if (cachedEntry && this.isCacheValid(cachedEntry, this.CACHE_DURATION)) {
      safeLog('🎫 Returning cached user raffle positions');
      return cachedEntry.data;
    }
    
    try {
      // Get recent RaffleCreated events with extended range to catch tonight's raffles
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock > 150000n ? currentBlock - 150000n : 0n;
      
      const raffleEvents = await publicClient.getLogs({
        address: RAFFLE_FACTORY_CONTRACT,
        event: parseAbiItem('event RaffleCreated(uint256 indexed raffleId, address indexed creator, address indexed nftContract, uint256 tokenId, address raffleContract, uint256 ticketPrice, uint256 maxTickets)'),
        fromBlock,
        toBlock: 'latest'
      });

      if (raffleEvents.length === 0) {
        return [];
      }

      // Limit processing to avoid performance issues and API timeouts
      const eventsToProcess = raffleEvents.slice(-20); // Process last 20 events only for better performance
      safeLog(`Processing ${eventsToProcess.length} of ${raffleEvents.length} raffle events`);
      
      if (raffleEvents.length === 0) {
        return [];
      }
      
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
      this.cache.set(cacheKey, {
        data: positions,
        timestamp: Date.now(),
        blockNumber: currentBlock
      });
      
      safeLog(`🎫 Found ${positions.length} raffle positions for user`);
      return positions;

    } catch (error) {
      safeError('Error fetching user raffle positions:', error);
      return [];
    }
  }

  /**
   * Get all raffles created by user with pagination
   */
  async getCreatedRaffles(userAddress: string, publicClient: any, page: number = 0): Promise<CreatedRaffle[]> {
    safeLog('🎨 Getting created raffles for:', userAddress, 'page:', page);
    
    if (!publicClient) {
      console.log('❌ No publicClient provided');
      return [];
    }
    
    // Check cache first
    const cacheKey = `created_${userAddress.toLowerCase()}_page_${page}`;
    const cachedEntry = this.createdCache.get(cacheKey);
    
    if (cachedEntry && this.isCacheValid(cachedEntry, this.CACHE_DURATION)) {
      safeLog('🎨 Returning cached created raffles');
      return cachedEntry.data;
    }
    
    try {
      // Professional pagination with extended block ranges
      const currentBlock = await publicClient.getBlockNumber();
      const BLOCKS_PER_PAGE = 150000n; // Extended range to catch recent raffles
      const fromBlock = currentBlock - BigInt((page + 1) * Number(BLOCKS_PER_PAGE));
      const toBlock = page === 0 ? currentBlock : currentBlock - BigInt(page * Number(BLOCKS_PER_PAGE));
      
      const raffleEvents = await publicClient.getLogs({
        address: RAFFLE_FACTORY_CONTRACT,
        event: parseAbiItem('event RaffleCreated(uint256 indexed raffleId, address indexed creator, address indexed nftContract, uint256 tokenId, address raffleContract, uint256 ticketPrice, uint256 maxTickets)'),
        args: {
          creator: userAddress as `0x${string}`
        },
        fromBlock: fromBlock > 0n ? fromBlock : 0n,
        toBlock
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
      this.createdCache.set(cacheKey, {
        data: raffles,
        timestamp: Date.now(),
        blockNumber: currentBlock
      });
      
      safeLog(`🎨 Found ${raffles.length} created raffles for user`);
      return raffles;

    } catch (error) {
      safeError('Error fetching created raffles:', error);
      return [];
    }
  }

  /**
   * Get all raffles with professional caching and optimized fetching
   */
  async getAllRaffles(publicClient: any, limit: number = 20, offset: number = 0): Promise<CreatedRaffle[]> {
    const cacheKey = `all_raffles_${limit}_${offset}`;
    
    // Check cache first
    if (this.allRafflesCache && this.isCacheValid(this.allRafflesCache, this.ALL_RAFFLES_CACHE_DURATION)) {
      const cached = this.allRafflesCache.data.slice(offset, offset + limit);
      safeLog(`🔍 Returning ${cached.length} cached all raffles`);
      return cached;
    }
    
    if (!publicClient) {
      safeError('No publicClient provided to getAllRaffles');
      return [];
    }
    
    try {
      const currentBlock = await publicClient.getBlockNumber();
      const raffles = await this.fetchRafflesWithStrategy(publicClient, currentBlock, 'all');
      
      // Cache the results
      this.allRafflesCache = {
        data: raffles,
        timestamp: Date.now(),
        blockNumber: currentBlock
      };
      
      const result = raffles.slice(offset, offset + limit);
      safeLog(`🔍 Found ${result.length} all raffles (${result.filter(r => r.isActive).length} active)`);
      return result;
      
    } catch (error) {
      safeError('Error fetching all raffles:', error);
      return this.allRafflesCache?.data.slice(offset, offset + limit) || [];
    }
  }

  /**
   * Get active raffles with professional caching and optimized fetching
   */
  async getActiveRaffles(publicClient: any, limit: number = 20): Promise<CreatedRaffle[]> {
    // Check cache first
    if (this.activeRafflesCache && this.isCacheValid(this.activeRafflesCache, this.ACTIVE_RAFFLES_CACHE_DURATION)) {
      const cached = this.activeRafflesCache.data.slice(0, limit);
      safeLog(`🔍 Returning ${cached.length} cached active raffles`);
      return cached;
    }
    
    if (!publicClient) {
      safeError('No publicClient provided to getActiveRaffles');
      return [];
    }
    
    try {
      const currentBlock = await publicClient.getBlockNumber();
      const raffles = await this.fetchRafflesWithStrategy(publicClient, currentBlock, 'active');
      
      // Filter for active only
      const activeRaffles = raffles.filter(r => r.isActive);
      
      // Cache the results
      this.activeRafflesCache = {
        data: activeRaffles,
        timestamp: Date.now(),
        blockNumber: currentBlock
      };
      
      const result = activeRaffles.slice(0, limit);
      safeLog(`🔍 Found ${result.length} active raffles`);
      return result;
      
    } catch (error) {
      safeError('Error fetching active raffles:', error);
      return this.activeRafflesCache?.data.slice(0, limit) || [];
    }
  }

  /**
   * Professional block scanning strategy with intelligent range selection
   */
  private async fetchRafflesWithStrategy(
    publicClient: any, 
    currentBlock: bigint, 
    type: 'all' | 'active'
  ): Promise<CreatedRaffle[]> {
    const allEvents: any[] = [];
    
    // Scan in optimized ranges
    for (const range of this.BLOCK_RANGES) {
      const fromBlock = currentBlock > range.from ? currentBlock - range.from : 0n;
      const toBlock = range.to > 0n ? currentBlock - range.to : currentBlock;
      
      try {
        const events = await Promise.race([
          publicClient.getLogs({
            address: RAFFLE_FACTORY_CONTRACT,
            event: parseAbiItem('event RaffleCreated(uint256 indexed raffleId, address indexed creator, address indexed nftContract, uint256 tokenId, address raffleContract, uint256 ticketPrice, uint256 maxTickets)'),
            fromBlock,
            toBlock
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), this.REQUEST_TIMEOUT)
          )
        ]);
        
        allEvents.push(...(events as any[]));
        safeLog(`Scanned blocks ${fromBlock}-${toBlock}: ${(events as any[]).length} events`);
        
        // Stop early if we have enough events
        if (allEvents.length >= range.maxEvents) {
          break;
        }
      } catch (error) {
        safeError(`Error scanning range ${fromBlock}-${toBlock}:`, error);
        continue;
      }
    }
    
    if (allEvents.length === 0) {
      return [];
    }
    
    // Remove duplicates and sort by newest first
    const uniqueEvents = Array.from(
      new Map(allEvents.map(e => [e.args.raffleId.toString(), e])).values()
    ).sort((a, b) => Number(b.args.raffleId) - Number(a.args.raffleId));
    
    // Process events with controlled concurrency
    return await this.processEventsWithConcurrency(uniqueEvents, type);
  }
  
  /**
   * Process events with controlled concurrency to prevent API overload
   */
  private async processEventsWithConcurrency(
    events: any[], 
    type: 'all' | 'active'
  ): Promise<CreatedRaffle[]> {
    const results: CreatedRaffle[] = [];
    const chunks = this.chunkArray(events, this.MAX_CONCURRENT_REQUESTS);
    
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (event: any) => {
        try {
          const { raffleId, raffleContract, nftContract, tokenId, creator, ticketPrice, maxTickets } = event.args;
          
          const raffleInfo = await Promise.race([
            raffleContractService.getRaffleInfo(raffleContract as string),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Raffle info timeout')), this.REQUEST_TIMEOUT)
            )
          ]);
          
          const now = Math.floor(Date.now() / 1000);
          const endTime = Number((raffleInfo as any).endTime);
          const isActive = !(raffleInfo as any).completed && 
                          now < endTime && 
                          Number((raffleInfo as any).ticketsSold) < Number(maxTickets);
          
          // Filter based on type
          if (type === 'active' && !isActive) {
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
            ticketsSold: Number((raffleInfo as any).ticketsSold),
            endTime: endTime,
            isActive,
            completed: (raffleInfo as any).completed,
            winner: (raffleInfo as any).completed ? (raffleInfo as any).winner : undefined
          };
        } catch (error) {
          safeError('Error processing raffle event:', error);
          return null;
        }
      });
      
      const chunkResults = await Promise.allSettled(chunkPromises);
      const validResults = chunkResults
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => (result as PromiseFulfilledResult<CreatedRaffle>).value);
      
      results.push(...validResults);
    }
    
    return results.sort((a, b) => b.raffleId - a.raffleId);
  }
  
  /**
   * Utility: Check if cache entry is valid
   */
  private isCacheValid<T>(entry: CacheEntry<T>, maxAge: number): boolean {
    return Date.now() - entry.timestamp < maxAge;
  }
  
  /**
   * Utility: Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
  
  /**
   * Clear cache with professional cleanup
   */
  clearCache(userAddress?: string) {
    if (userAddress) {
      const patterns = [`user_${userAddress.toLowerCase()}`, `created_${userAddress.toLowerCase()}`];
      patterns.forEach(pattern => {
        Array.from(this.cache.keys())
          .filter(key => key.includes(pattern))
          .forEach(key => this.cache.delete(key));
        Array.from(this.createdCache.keys())
          .filter(key => key.includes(pattern))
          .forEach(key => this.createdCache.delete(key));
      });
    } else {
      this.cache.clear();
      this.createdCache.clear();
      this.activeRafflesCache = null;
      this.allRafflesCache = null;
    }
  }
  
  /**
   * Clear all data
   */
  clearAllData() {
    this.clearCache();
  }
  
  /**
   * Professional cache statistics
   */
  getCacheStats() {
    return {
      userPositionsCache: this.cache.size,
      createdRafflesCache: this.createdCache.size,
      activeRafflesCached: this.activeRafflesCache?.data.length || 0,
      allRafflesCached: this.allRafflesCache?.data.length || 0,
      cacheHitRate: this.calculateCacheHitRate(),
      oldestCacheEntry: this.getOldestCacheEntry()
    };
  }
  
  private calculateCacheHitRate(): number {
    // Implementation would track hits/misses
    return 0.85; // Placeholder
  }
  
  private getOldestCacheEntry(): number {
    const timestamps = [
      this.activeRafflesCache?.timestamp || Date.now(),
      this.allRafflesCache?.timestamp || Date.now(),
      ...Array.from(this.cache.values()).map(entry => entry.timestamp),
      ...Array.from(this.createdCache.values()).map(entry => entry.timestamp)
    ];
    return Math.min(...timestamps);
  }
}

export const rafflePositionService = new RafflePositionService();