/**
 * Core Raffle Data Fetching Hook
 * Handles factory interactions and batch processing for both V3 and V4 contracts
 */

import { usePublicClient, useChainId } from 'wagmi';
import { useCallback } from 'react';
import { getRaffleFactoryAddress, isV4Available } from '../config/addresses';
import { RAFFLE_FACTORY_ABI } from '../config/contracts';
import { processBatch } from '../utils/performance';
import { useChainConfig } from '../hooks/useChainConfig';

export interface RaffleInfo {
  raffleId: number;
  raffleContract: string;
  nftContract: string;
  tokenId: string;
  creator: string;
  ticketPrice: string;
  maxTickets: number;
  ticketsSold: number;
  endTime: number;
  winner?: string;
  completed: boolean;
  isActive: boolean;
  version: 'v3' | 'v4';
}

export interface RaffleDataFetcherOptions {
  limit?: number;
  offset?: number;
  includeV3?: boolean;
  includeV4?: boolean;
}

export function useRaffleDataFetcher() {
  const publicClient = usePublicClient();
  const chainId = useChainId();
  
  // Use centralized chain configuration
  const { config: chainConfig } = useChainConfig();
  const batchConfig = {
    contractBatchSize: chainConfig.batch.contractSize,
    contractDelay: chainConfig.batch.contractDelay,
    raffleBatchSize: chainConfig.batch.raffleSize,
    raffleDelay: chainConfig.batch.raffleDelay,
  };

  // Get raffles from a specific factory version with chain-specific optimizations
  const getRafflesFromFactory = useCallback(async (
    factoryAddress: string,
    version: 'v3' | 'v4',
    limit: number = 20,
    offset: number = 0
  ): Promise<RaffleInfo[]> => {
    if (!publicClient) throw new Error('Public client not available');

    try {
      const raffleCount = await publicClient.readContract({
        address: factoryAddress as `0x${string}`,
        abi: RAFFLE_FACTORY_ABI,
        functionName: 'raffleCounter',
      });

      const totalRaffles = Number(raffleCount);
      if (totalRaffles === 0) return [];

      const startIndex = Math.max(0, totalRaffles - offset - limit);
      const endIndex = Math.max(0, totalRaffles - offset);
      
      const indices = Array.from({ length: endIndex - startIndex }, (_, i) => startIndex + i);
      
      // Use current batch configuration values to avoid stale closures
      const currentBatchConfig = {
        contractBatchSize: batchConfig.contractBatchSize,
        contractDelay: batchConfig.contractDelay,
        raffleBatchSize: batchConfig.raffleBatchSize,
        raffleDelay: batchConfig.raffleDelay,
      };
      
      const contractResults = await processBatch(
        indices,
        async (i) => {
          try {
            const contract = await publicClient.readContract({
              address: factoryAddress as `0x${string}`,
              abi: RAFFLE_FACTORY_ABI,
              functionName: 'getRaffleContract',
              args: [BigInt(i)],
            });
            return { index: i, contract };
          } catch (error) {
            return { index: i, contract: null };
          }
        },
        { 
          batchSize: currentBatchConfig.contractBatchSize, 
          delay: currentBatchConfig.contractDelay 
        }
      );
      
      // Filter out failed contracts while maintaining index mapping
      const validContractResults = contractResults.filter(result => result.contract !== null);
      
      // Get raffle info with current batch configuration
      const raffleInfoResults = await processBatch(
        validContractResults,
        async (contractResult: any) => {
          try {
            const raffleInfo = await publicClient.readContract({
              address: contractResult.contract as `0x${string}`,
              abi: [{
                inputs: [],
                name: 'getRaffleInfo',
                outputs: [{
                  components: [
                    { name: 'nftContract', type: 'address' },
                    { name: 'tokenId', type: 'uint256' },
                    { name: 'creator', type: 'address' },
                    { name: 'ticketPrice', type: 'uint256' },
                    { name: 'maxTickets', type: 'uint256' },
                    { name: 'ticketsSold', type: 'uint256' },
                    { name: 'endTime', type: 'uint256' },
                    { name: 'winner', type: 'address' },
                    { name: 'completed', type: 'bool' },
                    { name: 'platformFee', type: 'uint256' }
                  ],
                  type: 'tuple'
                }],
                stateMutability: 'view',
                type: 'function'
              }],
              functionName: 'getRaffleInfo',
            });
            return { ...contractResult, raffleInfo };
          } catch (error) {
            return { ...contractResult, raffleInfo: null };
          }
        },
        { 
          batchSize: currentBatchConfig.raffleBatchSize, 
          delay: currentBatchConfig.raffleDelay 
        }
      );
      
      // Process valid results with correct index mapping
      const validRaffles: RaffleInfo[] = [];
      
      raffleInfoResults.forEach((result: any) => {
        if (!result.raffleInfo) return;
        
        try {
          const now = Date.now() / 1000;
          const endTime = Number(result.raffleInfo.endTime);
          const isSoldOut = Number(result.raffleInfo.ticketsSold) >= Number(result.raffleInfo.maxTickets);
          const isActive = now < endTime && !result.raffleInfo.completed && !isSoldOut;
          
          validRaffles.push({
            raffleId: result.index,
            raffleContract: result.contract as string,
            nftContract: result.raffleInfo.nftContract,
            tokenId: result.raffleInfo.tokenId.toString(),
            creator: result.raffleInfo.creator,
            ticketPrice: (Number(result.raffleInfo.ticketPrice) / 1e18).toString(),
            maxTickets: Number(result.raffleInfo.maxTickets),
            ticketsSold: Number(result.raffleInfo.ticketsSold),
            endTime,
            winner: result.raffleInfo.winner || undefined,
            completed: result.raffleInfo.completed,
            isActive,
            version,
          });
        } catch (error) {
          // Silent fail for individual raffle processing - reduce console noise
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Failed to process raffle ${result.index}:`, error);
          }
        }
      });
      
      return validRaffles;
    } catch (error) {
      console.error(`Failed to get raffles from factory ${factoryAddress}:`, error);
      throw new Error(`Failed to load ${version} raffles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [publicClient, batchConfig.contractBatchSize, batchConfig.contractDelay, batchConfig.raffleBatchSize, batchConfig.raffleDelay]);

  // Get all raffles from both V3 and V4 factories with DETERMINISTIC fetching
  const fetchAllRaffles = useCallback(async (options: RaffleDataFetcherOptions = {}): Promise<RaffleInfo[]> => {
    const currentChainId = chainId; // Capture chainId to avoid stale closure
    
    if (!publicClient || !currentChainId) {
      throw new Error('Public client or chain ID not available');
    }

    const {
      limit = 20,
      offset = 0,
      includeV3 = true,
      includeV4 = true
    } = options;

    // POLYGON OPTIMIZATION: Reduce limit for faster loading
    const optimizedLimit = currentChainId === 137 ? Math.min(limit, 10) : limit;
    
    const allRaffles: RaffleInfo[] = [];
    
    // DETERMINISTIC APPROACH: Always fetch the same amount from each factory
    // This prevents reload inconsistencies caused by variable V4 results
    
    const factoryPromises: Promise<RaffleInfo[]>[] = [];
    
    // Get V4 raffles (priority)
    if (includeV4 && isV4Available(currentChainId)) {
      const v4Address = getRaffleFactoryAddress(currentChainId, true);
      factoryPromises.push(
        getRafflesFromFactory(v4Address, 'v4', optimizedLimit, offset)
          .catch(error => {
            console.warn('V4 factory fetch failed:', error);
            return [];
          })
      );
    }
    
    // Get V3 raffles (always fetch same amount for consistency)
    if (includeV3) {
      const v3Address = getRaffleFactoryAddress(currentChainId, false);
      factoryPromises.push(
        getRafflesFromFactory(v3Address, 'v3', optimizedLimit, offset)
          .catch(error => {
            console.warn('V3 factory fetch failed:', error);
            return [];
          })
      );
    }
    
    // Fetch from all factories in parallel for consistent results
    const factoryResults = await Promise.all(factoryPromises);
    
    // Combine all results
    for (const raffles of factoryResults) {
      allRaffles.push(...raffles);
    }
    
    // Remove duplicates based on unique contract address + raffle ID combination
    const uniqueRaffles = allRaffles.filter((raffle, index, self) => 
      index === self.findIndex(r => 
        r.raffleContract === raffle.raffleContract && 
        r.raffleId === raffle.raffleId
      )
    );
    
    // Sort by creation time (newest first) and limit results DETERMINISTICALLY
    return uniqueRaffles
      .sort((a, b) => b.endTime - a.endTime)
      .slice(0, optimizedLimit);
  }, [publicClient, chainId, getRafflesFromFactory]);

  // Get user tickets for a specific raffle
  const getUserTickets = useCallback(async (raffleContract: string, userAddress: string): Promise<number> => {
    if (!publicClient) throw new Error('Public client not available');

    try {
      const userTickets = await publicClient.readContract({
        address: raffleContract as `0x${string}`,
        abi: [{
          inputs: [{ name: 'user', type: 'address' }],
          name: 'ticketsPurchased',
          outputs: [{ name: '', type: 'uint256' }],
          stateMutability: 'view',
          type: 'function',
        }],
        functionName: 'ticketsPurchased',
        args: [userAddress as `0x${string}`],
      });
      
      return Number(userTickets);
    } catch (error) {
      console.error(`Failed to get user tickets for ${raffleContract}:`, error);
      return 0;
    }
  }, [publicClient]);

  return {
    fetchAllRaffles,
    getRafflesFromFactory,
    getUserTickets,
    isReady: !!publicClient && !!chainId
  };
}