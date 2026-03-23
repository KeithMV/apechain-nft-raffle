/**
 * Raffle Position Processor Hook
 * Handles complex position calculation, batch processing, and data transformation
 */

import { useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { UserRafflePosition } from '../types/raffle';
import { RAFFLE_FACTORY_ABI } from '../config/contracts';
import { processBatch } from '../utils/performance';

interface RaffleInfo {
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

interface PositionProcessorOptions {
  maxRafflesToCheck?: number;
  batchSize?: number;
  concurrency?: number;
}

export function useRafflePositionProcessor() {
  const publicClient = usePublicClient();

  // Calculate position metrics from raffle data
  const calculatePositionMetrics = useCallback((
    raffle: RaffleInfo,
    userTickets: number,
    userAddress: string
  ) => {
    const now = Date.now() / 1000;
    const endTime = Number(raffle.endTime);
    const ticketsSold = Number(raffle.ticketsSold);
    const maxTickets = Number(raffle.maxTickets);
    
    const isSoldOut = ticketsSold >= maxTickets;
    const isActive = now < endTime && !raffle.completed && !isSoldOut;
    const isWinner = raffle.winner?.toLowerCase() === userAddress.toLowerCase();
    const winProbability = maxTickets > 0 ? (userTickets / maxTickets) * 100 : 0;

    return {
      isActive,
      isWinner,
      winProbability,
      ticketsSold,
      maxTickets,
      endTime,
      completed: raffle.completed
    };
  }, []);

  // Process batch results into user positions
  const processBatchResults = useCallback((
    batchResults: any[],
    userAddress: string,
    version: 'v3' | 'v4'
  ): UserRafflePosition[] => {
    const userPositions: UserRafflePosition[] = [];

    for (const result of batchResults) {
      if (!result) continue;
      const { i, raffleContract, raffle, userTickets } = result;

      const ticketCount = Number(userTickets);
      if (ticketCount > 0) {
        const metrics = calculatePositionMetrics(raffle, ticketCount, userAddress);

        userPositions.push({
          raffleId: i,
          raffleContract: raffleContract as string,
          nftContract: raffle.nftContract,
          tokenId: raffle.tokenId.toString(),
          userTickets: ticketCount,
          ticketsSold: metrics.ticketsSold,
          maxTickets: metrics.maxTickets,
          endTime: metrics.endTime,
          completed: metrics.completed,
          isActive: metrics.isActive,
          isWinner: metrics.isWinner,
          winProbability: metrics.winProbability,
          version,
        });
      }
    }

    return userPositions;
  }, [calculatePositionMetrics]);

  // Remove duplicates and sort positions
  const processPositionList = useCallback((positions: UserRafflePosition[]): UserRafflePosition[] => {
    // Remove duplicates based on raffle contract address
    const uniquePositions = positions.filter((position, index, self) => 
      index === self.findIndex(p => p.raffleContract === position.raffleContract)
    );
    
    // Sort by end time (newest first)
    return uniquePositions.sort((a, b) => b.endTime - a.endTime);
  }, []);

  // Get user positions from a specific factory
  const getUserPositionsFromFactory = useCallback(async (
    factoryAddress: string,
    userAddress: string,
    version: 'v3' | 'v4',
    options: PositionProcessorOptions = {}
  ): Promise<UserRafflePosition[]> => {
    if (!publicClient) {
      throw new Error('Public client not available');
    }

    const {
      maxRafflesToCheck = 50,
      batchSize = 25,
      concurrency = 3
    } = options;

    try {
      // Get total raffle count
      const raffleCount = await publicClient.readContract({
        address: factoryAddress as `0x${string}`,
        abi: RAFFLE_FACTORY_ABI,
        functionName: 'raffleCounter',
      });

      const totalRaffles = Number(raffleCount);
      if (totalRaffles === 0) return [];

      // Generate indices for recent raffles
      const startIndex = Math.max(0, totalRaffles - maxRafflesToCheck);
      const indices = Array.from(
        { length: totalRaffles - startIndex }, 
        (_, i) => startIndex + i
      );
      
      // Process raffles in batches
      const batchResults = await processBatch(
        indices,
        async (i) => {
          try {
            // Get raffle contract address
            const raffleContract = await publicClient.readContract({
              address: factoryAddress as `0x${string}`,
              abi: RAFFLE_FACTORY_ABI,
              functionName: 'getRaffleContract',
              args: [BigInt(i)],
            });
            
            // Get raffle info and user tickets in parallel
            const [raffle, userTickets] = await Promise.all([
              publicClient.readContract({
                address: raffleContract as `0x${string}`,
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
              }),
              publicClient.readContract({
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
              })
            ]);
            
            return { i, raffleContract, raffle, userTickets };
          } catch (err) {
            console.warn(`Failed to process raffle ${i}:`, err);
            return null;
          }
        },
        { batchSize, maxConcurrent: concurrency }
      );
      
      // Process results into user positions
      return processBatchResults(batchResults, userAddress, version);
    } catch (error) {
      console.error(`Failed to get user positions from factory ${factoryAddress}:`, error);
      return [];
    }
  }, [publicClient, processBatchResults]);

  // Get positions from multiple factories and combine
  const getCombinedUserPositions = useCallback(async (
    factories: Array<{ address: string; version: 'v3' | 'v4' }>,
    userAddress: string,
    options?: PositionProcessorOptions
  ): Promise<UserRafflePosition[]> => {
    const allPositions: UserRafflePosition[] = [];
    
    // Fetch positions from all factories in parallel
    const factoryPromises = factories.map(factory =>
      getUserPositionsFromFactory(factory.address, userAddress, factory.version, options)
    );
    
    const factoryResults = await Promise.all(factoryPromises);
    
    // Combine all positions
    for (const positions of factoryResults) {
      allPositions.push(...positions);
    }
    
    // Process and return sorted unique positions
    return processPositionList(allPositions);
  }, [getUserPositionsFromFactory, processPositionList]);

  return {
    getUserPositionsFromFactory,
    getCombinedUserPositions,
    calculatePositionMetrics,
    processBatchResults,
    processPositionList
  };
}

export type { PositionProcessorOptions };