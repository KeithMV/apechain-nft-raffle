/**
 * Shared Raffle Types
 * Common interfaces used across the application
 */

export interface UserRafflePosition {
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
  version: 'v3' | 'v4';
}

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

export interface CacheKeyParams {
  type: 'raffles' | 'positions' | 'created';
  chainId?: number;
  userAddress?: string;
  limit?: number;
  offset?: number;
  page?: number;
}