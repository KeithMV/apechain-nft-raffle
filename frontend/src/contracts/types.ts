/**
 * Contract Types and Interfaces
 * TypeScript definitions for all smart contract interactions
 */

// Raffle Factory Types
export interface RaffleFactoryConfig {
  MAX_DURATION: bigint;
  MAX_FEE: bigint;
  MAX_TICKETS: bigint;
  MIN_DURATION: bigint;
  RATE_LIMIT: bigint;
}

export interface CreateRaffleParams {
  nftContract: string;
  tokenId: bigint;
  ticketPrice: bigint;
  maxTickets: bigint;
  duration: bigint;
}

// Raffle Contract Types
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

export interface RaffleState {
  isActive: boolean;
  completed: boolean;
  winner?: string;
  totalTickets: bigint;
}

// Event Types
export interface RaffleCreatedEvent {
  raffleId: bigint;
  creator: string;
  nftContract: string;
  tokenId: bigint;
  raffleContract: string;
  ticketPrice: bigint;
  maxTickets: bigint;
}

export interface TicketsPurchasedEvent {
  buyer: string;
  quantity: bigint;
  totalSpent: bigint;
}

export interface RaffleCompletedEvent {
  winner: string;
  totalSales: bigint;
}

export interface CommitSubmittedEvent {
  commitHash: string;
}

// NFT Types
export interface NFTApproval {
  owner: string;
  operator: string;
  approved: boolean;
}

// Token Types
export interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
  balance?: bigint;
}

// Network Types
export interface NetworkConfig {
  chainId: number;
  rpcUrl: string;
  name: string;
  explorerUrl: string;
  nativeCurrency: string;
}

export interface ContractAddresses {
  RAFFLE_FACTORY: string;
  RAFFLE_FACTORY_V4: string;
  RAFFLE_TEMPLATE: string;
  RAFFLE_FACTORY_LEGACY?: string;
  RAFFLE_FACTORY_V1?: string;
  disabled?: boolean;
}

// Protocol Types
export interface ProtocolInfo {
  name: string;
  version: string;
  status: string;
  securityFixes: string[];
  v4Features: string[];
}

// Validation Types
export interface ChainValidation {
  isValid: boolean;
  errors: string[];
}

// Contract Version Types
export type ContractVersion = 'v3' | 'v4';

export interface VersionConfig {
  version: ContractVersion;
  rateLimit: number;
  features: string[];
  address: string;
}