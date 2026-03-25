/**
 * Core Raffle Data Fetching Hook
 * Handles factory interactions and batch processing for both V3 and V4 contracts
 */

import { usePublicClient, useChainId } from 'wagmi';
import { useCallback } from 'react';
import { getRaffleFactoryAddress, isV4Available } from '../config/addresses';
import { RAFFLE_FACTORY_ABI } from '../config/contracts';
import { processBatch } from '../utils/performance';

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
      
      // Chain-specific batch optimization
      const isPolygon = chainId === 137;
      const batchSize = isPolygon ? 3 : 5; // Smaller batches for Polygon's higher congestion
      const delay = isPolygon ? 15 : 10; // Slightly longer delays for Polygon
      
      // Get raffle contracts with chain-optimized batching
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
        { batchSize, delay }
      );
      
      // Filter out failed contracts while maintaining index mapping
      const validContractResults = contractResults.filter(result => result.contract !== null);
      
      // Get raffle info with chain-optimized error handling
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
        { batchSize: isPolygon ? 2 : 3, delay: delay + 5 } // Even smaller batches for raffle info on Polygon
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
          // Silent fail for individual raffle processing
        }
      });
      
      return validRaffles;
    } catch (error) {
      console.error(`Failed to get raffles from factory ${factoryAddress}:`, error);
      throw new Error(`Failed to load ${version} raffles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [publicClient, chainId]);

  // Get all raffles from both V3 and V4 factories
  const fetchAllRaffles = useCallback(async (options: RaffleDataFetcherOptions = {}): Promise<RaffleInfo[]> => {
    if (!publicClient || !chainId) {
      throw new Error('Public client or chain ID not available');
    }

    const {
      limit = 20,
      offset = 0,
      includeV3 = true,
      includeV4 = true
    } = options;

    const allRaffles: RaffleInfo[] = [];
    
    // Get V4 raffles first (priority)
    if (includeV4 && isV4Available(chainId)) {
      const v4Address = getRaffleFactoryAddress(chainId, true);
      const v4Raffles = await getRafflesFromFactory(v4Address, 'v4', limit, offset);
      allRaffles.push(...v4Raffles);
    }
    
    // Only get V3 raffles if we don't have enough V4 raffles or if specifically requested
    if (includeV3 && (allRaffles.length < limit || !includeV4)) {
      const v3Address = getRaffleFactoryAddress(chainId, false);
      const remainingLimit = includeV4 ? limit - allRaffles.length : limit;
      const v3Raffles = await getRafflesFromFactory(v3Address, 'v3', remainingLimit, offset);
      allRaffles.push(...v3Raffles);
    }
    
    // Remove duplicates based on unique contract address + raffle ID combination
    const uniqueRaffles = allRaffles.filter((raffle, index, self) => 
      index === self.findIndex(r => 
        r.raffleContract === raffle.raffleContract && 
        r.raffleId === raffle.raffleId
      )
    );
    
    // Sort by creation time (newest first) and limit results
    return uniqueRaffles
      .sort((a, b) => b.endTime - a.endTime)
      .slice(0, limit);
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