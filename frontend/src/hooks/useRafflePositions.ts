/**
 * Raffle Position Hooks
 * Professional wagmi hooks for raffle position management
 */

import { usePublicClient, useReadContract } from 'wagmi';
import { useState, useEffect, useCallback } from 'react';
import { RAFFLE_FACTORY_ADDRESS, RAFFLE_FACTORY_ABI } from '../config/contracts';

interface CreatedRaffle {
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
}

interface UserRafflePosition {
  raffleId: number;
  raffleContract: string;
  nftContract: string;
  tokenId: string;
  userTickets: number;
  ticketsSold: number;
  maxTickets: number;
  endTime: number;
  completed: boolean;
  isActive: boolean;
  isWinner: boolean;
  winProbability: number;
}

// Get all raffles
export function useAllRaffles(limit: number = 30, offset: number = 0) {
  const publicClient = usePublicClient();
  const [raffles, setRaffles] = useState<CreatedRaffle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: raffleCount } = useReadContract({
    address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
    abi: RAFFLE_FACTORY_ABI,
    functionName: 'raffleCounter',
  });

  const loadRaffles = useCallback(async () => {
    if (!publicClient || !raffleCount) return;

    setLoading(true);
    setError(null);

    try {
      const totalRaffles = Number(raffleCount);
      const startIndex = Math.max(0, totalRaffles - offset - limit);
      const endIndex = Math.max(0, totalRaffles - offset);
      
      const rafflePromises = [];
      for (let i = startIndex; i < endIndex; i++) {
        rafflePromises.push(
          publicClient.readContract({
            address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
            abi: RAFFLE_FACTORY_ABI,
            functionName: 'getRaffleContract',
            args: [BigInt(i)],
          })
        );
      }

      const raffleContracts = await Promise.all(rafflePromises);
      
      // Get raffle info for each contract
      const raffleInfoPromises = raffleContracts.map((contract: any) =>
        publicClient.readContract({
          address: contract as `0x${string}`,
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
        })
      );

      const raffleInfos = await Promise.all(raffleInfoPromises);
      
      const processedRaffles: CreatedRaffle[] = raffleInfos.map((result: any, index) => {
        const now = Date.now() / 1000;
        const endTime = Number(result.endTime);
        const isActive = now < endTime;
        
        return {
          raffleId: startIndex + index,
          raffleContract: raffleContracts[index] as string,
          nftContract: result.nftContract,
          tokenId: result.tokenId.toString(),
          creator: result.creator,
          ticketPrice: (Number(result.ticketPrice) / 1e18).toString(),
          maxTickets: Number(result.maxTickets),
          ticketsSold: Number(result.ticketsSold),
          endTime,
          winner: result.winner,
          completed: result.completed,
          isActive,
        };
      }).reverse(); // Show newest first

      setRaffles(processedRaffles);
    } catch (err) {
      console.error('Failed to load raffles:', err);
      setError('Failed to load raffles');
    } finally {
      setLoading(false);
    }
  }, [publicClient, raffleCount, limit, offset]);

  useEffect(() => {
    loadRaffles();
  }, [loadRaffles]);

  return { raffles, loading, error, refetch: loadRaffles };
}

// Get user's raffle positions
export function useUserRafflePositions(userAddress?: string) {
  const publicClient = usePublicClient();
  const [positions, setPositions] = useState<UserRafflePosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: raffleCount } = useReadContract({
    address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
    abi: RAFFLE_FACTORY_ABI,
    functionName: 'raffleCounter',
  });

  const loadPositions = useCallback(async () => {
    if (!publicClient || !userAddress || !raffleCount) return;

    setLoading(true);
    setError(null);

    try {
      const totalRaffles = Number(raffleCount);
      const userPositions: UserRafflePosition[] = [];

      // Check last 50 raffles for user participation (reduced from 100)
      const startIndex = Math.max(0, totalRaffles - 50);
      
      // Batch process raffles in parallel (10 at a time)
      const batchSize = 10;
      for (let batchStart = startIndex; batchStart < totalRaffles; batchStart += batchSize) {
        const batchEnd = Math.min(batchStart + batchSize, totalRaffles);
        const batchPromises = [];
        
        for (let i = batchStart; i < batchEnd; i++) {
          batchPromises.push(
            (async () => {
              try {
                const raffleContract = await publicClient.readContract({
                  address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
                  abi: RAFFLE_FACTORY_ABI,
                  functionName: 'getRaffleContract',
                  args: [BigInt(i)],
                });
                
                // Parallel calls for raffle info and user tickets
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
                    abi: [
                      {
                        inputs: [{ name: 'user', type: 'address' }],
                        name: 'ticketsPurchased',
                        outputs: [{ name: '', type: 'uint256' }],
                        stateMutability: 'view',
                        type: 'function',
                      },
                    ],
                    functionName: 'ticketsPurchased',
                    args: [userAddress as `0x${string}`],
                  })
                ]);
                
                return { i, raffleContract, raffle, userTickets };
              } catch (err) {
                return null;
              }
            })()
          );
        }
        
        const batchResults = await Promise.all(batchPromises);
        
        for (const result of batchResults) {
          if (!result) continue;
          const { i, raffleContract, raffle, userTickets } = result;

          if (Number(userTickets) > 0) {
            const now = Date.now() / 1000;
            const endTime = Number(raffle.endTime);
            const isActive = now < endTime;
            const isWinner = raffle.winner?.toLowerCase() === userAddress.toLowerCase();
            const winProbability = (Number(userTickets) / Number(raffle.maxTickets)) * 100;

            userPositions.push({
              raffleId: i,
              raffleContract: raffleContract as string,
              nftContract: raffle.nftContract,
              tokenId: raffle.tokenId.toString(),
              userTickets: Number(userTickets),
              ticketsSold: Number(raffle.ticketsSold),
              maxTickets: Number(raffle.maxTickets),
              endTime,
              completed: raffle.completed,
              isActive,
              isWinner,
              winProbability,
            });
          }
        }
      }

      setPositions(userPositions.reverse()); // Show newest first
    } catch (err) {
      console.error('Failed to load user positions:', err);
      setError('Failed to load user positions');
    } finally {
      setLoading(false);
    }
  }, [publicClient, userAddress, raffleCount]);

  useEffect(() => {
    loadPositions();
  }, [loadPositions]);

  return { positions, loading, error, refetch: loadPositions };
}

// Get user's created raffles
export function useCreatedRaffles(userAddress?: string, page: number = 0) {
  const publicClient = usePublicClient();
  const [raffles, setRaffles] = useState<CreatedRaffle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: raffleCount } = useReadContract({
    address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
    abi: RAFFLE_FACTORY_ABI,
    functionName: 'raffleCounter',
  });

  const loadCreatedRaffles = useCallback(async () => {
    if (!publicClient || !userAddress || !raffleCount) return;

    setLoading(true);
    setError(null);

    try {
      const totalRaffles = Number(raffleCount);
      const createdRaffles: CreatedRaffle[] = [];
      
      // Check last 200 raffles for user creation (optimized from all raffles)
      const startIndex = Math.max(0, totalRaffles - 200);
      for (let i = startIndex; i < totalRaffles; i++) {
        try {
          const raffleContract = await publicClient.readContract({
            address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
            abi: RAFFLE_FACTORY_ABI,
            functionName: 'getRaffleContract',
            args: [BigInt(i)],
          });
          
          const raffle = await publicClient.readContract({
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
          });

          if (raffle.creator.toLowerCase() === userAddress.toLowerCase()) {
            const now = Date.now() / 1000;
            const endTime = Number(raffle.endTime);
            const isActive = now < endTime;

            createdRaffles.push({
              raffleId: i,
              raffleContract: raffleContract as string,
              nftContract: raffle.nftContract,
              tokenId: raffle.tokenId.toString(),
              creator: raffle.creator,
              ticketPrice: (Number(raffle.ticketPrice) / 1e18).toString(),
              maxTickets: Number(raffle.maxTickets),
              ticketsSold: Number(raffle.ticketsSold),
              endTime,
              winner: raffle.winner,
              completed: raffle.completed,
              isActive,
            });
          }
        } catch (err) {
          // Skip failed raffle reads
          continue;
        }
      }

      setRaffles(createdRaffles.reverse()); // Show newest first
    } catch (err) {
      console.error('Failed to load created raffles:', err);
      setError('Failed to load created raffles');
    } finally {
      setLoading(false);
    }
  }, [publicClient, userAddress, raffleCount, page]);

  useEffect(() => {
    loadCreatedRaffles();
  }, [loadCreatedRaffles]);

  return { raffles, loading, error, refetch: loadCreatedRaffles };
}

// Clear cache utility (no-op for hooks)
export function useClearRaffleCache() {
  return useCallback(() => {
    // Hooks don't need cache clearing - they auto-refresh
    console.log('Cache cleared (hooks auto-refresh)');
  }, []);
}