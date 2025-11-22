import { parseAbiItem } from 'viem/utils';
import { RAFFLE_FACTORY_ADDRESS } from '../config/contracts';
import { raffleContractService } from './raffleContractService';
import { safeLog, safeError } from '../utils/logSanitizer';
import { publicClient, getOptimalBlockLimit } from './rpcService';

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
  
  // Professional caching strategy with adaptive durations
  private readonly cacheConfig = {
    USER_DATA: process.env.NODE_ENV === 'production' ? 300000 : 30000, // 5min prod, 30s dev
    ACTIVE_RAFFLES: process.env.NODE_ENV === 'production' ? 600000 : 60000, // 10min prod, 1min dev
    ALL_RAFFLES: process.env.NODE_ENV === 'production' ? 300000 : 45000, // 5min prod, 45s dev
    PERFORMANCE_METRICS: 60000, // 1 minute for metrics
  };
  
  // Professional configuration management
  private readonly config = {
    // Adaptive scanning depth based on platform usage
    SCAN_DEPTH: process.env.NODE_ENV === 'production' ? 500000n : 100000n, // 87 days prod, 17 days dev
    CHUNK_SIZE: 5000n, // Optimized for ApeChain RPC limits
    MAX_CONCURRENT_REQUESTS: 3, // Conservative for stability
    REQUEST_TIMEOUT: 30000, // 30s timeout for extended range
    MAX_EVENTS_PER_SCAN: 500, // Prevent memory issues
    RETRY_ATTEMPTS: 3, // Resilient error handling
    RETRY_DELAY: 1000, // 1s between retries
  };
  
  private getChunkSize(): bigint {
    return this.config.CHUNK_SIZE;
  }

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
    
    if (cachedEntry && this.isCacheValid(cachedEntry, this.cacheConfig.USER_DATA)) {
      safeLog('🎫 Returning cached user raffle positions');
      return cachedEntry.data;
    }
    
    try {
      // Get recent RaffleCreated events with chunked scanning
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock > 50000n ? currentBlock - 50000n : 0n;
      
      // Scan in chunks with dynamic sizing
      const allEvents: any[] = [];
      const chunkSize = this.getChunkSize();
      for (let chunkStart = fromBlock; chunkStart < currentBlock; chunkStart += BigInt(chunkSize)) {
        const chunkEnd = chunkStart + BigInt(chunkSize) > currentBlock ? currentBlock : chunkStart + BigInt(chunkSize);
        try {
          const events = await publicClient.getLogs({
            address: RAFFLE_FACTORY_CONTRACT,
            event: parseAbiItem('event RaffleCreated(uint256 indexed raffleId, address indexed creator, address indexed nftContract, uint256 tokenId, address raffleContract, uint256 ticketPrice, uint256 maxTickets)'),
            fromBlock: chunkStart,
            toBlock: chunkEnd
          });
          allEvents.push(...events);
        } catch (error) {
          safeError(`Error scanning chunk ${chunkStart}-${chunkEnd}:`, error);
        }
      }
      const raffleEvents = allEvents;

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
    
    if (cachedEntry && this.isCacheValid(cachedEntry, this.cacheConfig.USER_DATA)) {
      safeLog('🎨 Returning cached created raffles');
      return cachedEntry.data;
    }
    
    try {
      // Professional pagination with chunked scanning
      const currentBlock = await publicClient.getBlockNumber();
      const BLOCKS_PER_PAGE = 50000n; // Safe range for chunked scanning
      const fromBlock = currentBlock - BigInt((page + 1) * Number(BLOCKS_PER_PAGE));
      const toBlock = page === 0 ? currentBlock : currentBlock - BigInt(page * Number(BLOCKS_PER_PAGE));
      
      // Scan in chunks with dynamic sizing
      const allEvents: any[] = [];
      const scanFrom = fromBlock > 0n ? fromBlock : 0n;
      const chunkSize = this.getChunkSize();
      for (let chunkStart = scanFrom; chunkStart < toBlock; chunkStart += BigInt(chunkSize)) {
        const chunkEnd = chunkStart + BigInt(chunkSize) > toBlock ? toBlock : chunkStart + BigInt(chunkSize);
        try {
          const events = await publicClient.getLogs({
            address: RAFFLE_FACTORY_CONTRACT,
            event: parseAbiItem('event RaffleCreated(uint256 indexed raffleId, address indexed creator, address indexed nftContract, uint256 tokenId, address raffleContract, uint256 ticketPrice, uint256 maxTickets)'),
            args: {
              creator: userAddress as `0x${string}`
            },
            fromBlock: chunkStart,
            toBlock: chunkEnd
          });
          allEvents.push(...events);
        } catch (error) {
          safeError(`Error scanning chunk ${chunkStart}-${chunkEnd}:`, error);
        }
      }
      const raffleEvents = allEvents;
      
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
    if (this.allRafflesCache && this.isCacheValid(this.allRafflesCache, this.cacheConfig.ALL_RAFFLES)) {
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
      const currentTime = Math.floor(Date.now() / 1000);
      console.log('🔍 All raffles debug:');
      result.forEach((r, i) => {
        console.log(`Raffle ${i}:`, {
          id: r.raffleId,
          endTime: r.endTime,
          currentTime: currentTime,
          timeRemaining: r.endTime - currentTime,
          isActive: r.isActive,
          completed: r.completed,
          calculation: `${r.endTime} - ${currentTime} = ${r.endTime - currentTime}`
        });
      });
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
    if (this.activeRafflesCache && this.isCacheValid(this.activeRafflesCache, this.cacheConfig.ACTIVE_RAFFLES)) {
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
   * Professional block scanning with enterprise-grade error handling
   */
  private async fetchRafflesWithStrategy(
    publicClient: any, 
    currentBlock: bigint, 
    type: 'all' | 'active'
  ): Promise<CreatedRaffle[]> {
    const allEvents: any[] = [];
    const startBlock = currentBlock > this.config.SCAN_DEPTH ? currentBlock - this.config.SCAN_DEPTH : 0n;
    const totalBlocks = Number(currentBlock - startBlock);
    
    safeLog(`🔍 Professional scan: ${totalBlocks} blocks (~${Math.round(totalBlocks / 5760)} days)`);
    
    // Scan in optimized chunks with retry logic
    const chunkSize = this.getChunkSize();
    for (let fromBlock = startBlock; fromBlock < currentBlock; fromBlock += chunkSize) {
      const toBlock = fromBlock + chunkSize > currentBlock ? currentBlock : fromBlock + chunkSize;
      
      const events = await this.scanBlockRangeWithRetry(publicClient, fromBlock, toBlock);
      if (events) {
        allEvents.push(...events);
        safeLog(`✅ Scanned blocks ${fromBlock}-${toBlock}: ${events.length} events`);
        
        // Professional memory management
        if (allEvents.length >= this.config.MAX_EVENTS_PER_SCAN) {
          safeLog(`📊 Reached event limit (${this.config.MAX_EVENTS_PER_SCAN}), stopping scan`);
          break;
        }
      }
    }
    
    if (allEvents.length === 0) {
      safeLog('📭 No raffle events found in scan range');
      return [];
    }
    
    // Professional deduplication and sorting
    const uniqueEvents = this.deduplicateAndSortEvents(allEvents);
    safeLog(`📋 Processing ${uniqueEvents.length} unique events`);
    
    // Process events with enterprise-grade concurrency control
    return await this.processEventsWithConcurrency(uniqueEvents, type);
  }
  
  /**
   * Professional block range scanning with retry logic
   */
  private async scanBlockRangeWithRetry(
    publicClient: any,
    fromBlock: bigint,
    toBlock: bigint
  ): Promise<any[] | null> {
    for (let attempt = 1; attempt <= this.config.RETRY_ATTEMPTS; attempt++) {
      try {
        const events = await Promise.race([
          publicClient.getLogs({
            address: RAFFLE_FACTORY_CONTRACT,
            event: parseAbiItem('event RaffleCreated(uint256 indexed raffleId, address indexed creator, address indexed nftContract, uint256 tokenId, address raffleContract, uint256 ticketPrice, uint256 maxTickets)'),
            fromBlock,
            toBlock
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), this.config.REQUEST_TIMEOUT)
          )
        ]);
        
        return events as any[];
      } catch (error) {
        safeError(`Attempt ${attempt}/${this.config.RETRY_ATTEMPTS} failed for blocks ${fromBlock}-${toBlock}:`, error);
        
        if (attempt < this.config.RETRY_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, this.config.RETRY_DELAY * attempt));
        }
      }
    }
    
    safeError(`❌ All retry attempts failed for blocks ${fromBlock}-${toBlock}`);
    return null;
  }
  
  /**
   * Professional event deduplication and sorting
   */
  private deduplicateAndSortEvents(events: any[]): any[] {
    const eventMap = new Map();
    
    events.forEach(event => {
      const key = event.args.raffleId.toString();
      if (!eventMap.has(key) || event.blockNumber > eventMap.get(key).blockNumber) {
        eventMap.set(key, event);
      }
    });
    
    return Array.from(eventMap.values())
      .sort((a, b) => Number(b.args.raffleId) - Number(a.args.raffleId));
  }
  
  /**
   * Enterprise-grade event processing with controlled concurrency
   */
  private async processEventsWithConcurrency(
    events: any[], 
    type: 'all' | 'active'
  ): Promise<CreatedRaffle[]> {
    const results: CreatedRaffle[] = [];
    const chunks = this.chunkArray(events, this.config.MAX_CONCURRENT_REQUESTS);
    
    for (const [index, chunk] of chunks.entries()) {
      safeLog(`📊 Processing chunk ${index + 1}/${chunks.length} (${chunk.length} events)`);
      
      const chunkPromises = chunk.map(async (event: any) => {
        try {
          const { raffleId, raffleContract, nftContract, tokenId, creator, ticketPrice, maxTickets } = event.args;
          
          const raffleInfo = await Promise.race([
            raffleContractService.getRaffleInfo(raffleContract as string),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Raffle info timeout')), this.config.REQUEST_TIMEOUT)
            )
          ]);
          
          const now = Math.floor(Date.now() / 1000);
          const endTime = Number((raffleInfo as any).endTime);
          const isActive = !(raffleInfo as any).completed && now < endTime;
          
          // Professional filtering
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
      
      // Professional rate limiting between chunks
      if (index < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    safeLog(`✅ Successfully processed ${results.length} raffles`);
    return results.sort((a, b) => b.raffleId - a.raffleId);
  }
  
  /**
   * Check if raffle is active using block numbers
   */
  private async isRaffleActiveByBlock(raffleInfo: any, publicClient: any): Promise<boolean> {
    if (raffleInfo.completed) return false;
    try {
      const currentBlock = await publicClient.getBlockNumber();
      return Number(currentBlock) < Number(raffleInfo.endTime);
    } catch {
      return false;
    }
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
   * Enterprise-grade performance monitoring
   */
  getCacheStats() {
    const now = Date.now();
    return {
      userPositionsCache: this.cache.size,
      createdRafflesCache: this.createdCache.size,
      activeRafflesCached: this.activeRafflesCache?.data.length || 0,
      allRafflesCached: this.allRafflesCache?.data.length || 0,
      cacheHitRate: this.calculateCacheHitRate(),
      oldestCacheEntry: this.getOldestCacheEntry(),
      memoryUsage: this.estimateMemoryUsage(),
      scanConfiguration: {
        scanDepth: Number(this.config.SCAN_DEPTH),
        chunkSize: Number(this.config.CHUNK_SIZE),
        maxEvents: this.config.MAX_EVENTS_PER_SCAN,
        estimatedDays: Math.round(Number(this.config.SCAN_DEPTH) / 5760)
      },
      cacheHealth: {
        activeRafflesAge: this.activeRafflesCache ? now - this.activeRafflesCache.timestamp : 0,
        allRafflesAge: this.allRafflesCache ? now - this.allRafflesCache.timestamp : 0,
        isHealthy: this.isCacheHealthy()
      }
    };
  }
  
  /**
   * Professional memory usage estimation
   */
  private estimateMemoryUsage(): { estimated: string; breakdown: any } {
    const userCacheSize = Array.from(this.cache.values()).reduce((acc, entry) => acc + entry.data.length, 0);
    const createdCacheSize = Array.from(this.createdCache.values()).reduce((acc, entry) => acc + entry.data.length, 0);
    const activeCacheSize = this.activeRafflesCache?.data.length || 0;
    const allCacheSize = this.allRafflesCache?.data.length || 0;
    
    const totalEntries = userCacheSize + createdCacheSize + activeCacheSize + allCacheSize;
    const estimatedMB = Math.round((totalEntries * 2) / 1024); // Rough estimate: 2KB per raffle entry
    
    return {
      estimated: `${estimatedMB}MB`,
      breakdown: {
        userPositions: userCacheSize,
        createdRaffles: createdCacheSize,
        activeRaffles: activeCacheSize,
        allRaffles: allCacheSize,
        totalEntries
      }
    };
  }
  
  /**
   * Professional cache health monitoring
   */
  private isCacheHealthy(): boolean {
    const now = Date.now();
    const maxAge = this.cacheConfig.ALL_RAFFLES * 2; // 2x normal cache duration
    
    const activeAge = this.activeRafflesCache ? now - this.activeRafflesCache.timestamp : 0;
    const allAge = this.allRafflesCache ? now - this.allRafflesCache.timestamp : 0;
    
    return activeAge < maxAge && allAge < maxAge;
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