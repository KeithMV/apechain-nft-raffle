/**
 * Contract Reads Hook
 * Centralized read-only contract operations with optimized query management
 */

import { useReadContract } from 'wagmi';
import { useContractVersionManager } from './useContractVersionManager';
import { RAFFLE_FACTORY_ABI, ERC721_ABI } from '../config/contracts';

export interface ContractReadsConfig {
  enabled?: boolean;
  refetchInterval?: number;
}

export function useContractReads(config: ContractReadsConfig = {}) {
  const { factoryAddress } = useContractVersionManager();
  const { enabled = true, refetchInterval } = config;

  // Platform fee query
  const platformFeeQuery = useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: RAFFLE_FACTORY_ABI,
    functionName: 'platformFee',
    query: {
      enabled,
      refetchInterval,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Raffle counter query
  const raffleCounterQuery = useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: RAFFLE_FACTORY_ABI,
    functionName: 'raffleCounter',
    query: {
      enabled,
      refetchInterval,
      staleTime: 30 * 1000, // 30 seconds
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Factory pause status query
  const pauseStatusQuery = useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: RAFFLE_FACTORY_ABI,
    functionName: 'paused',
    query: {
      enabled,
      refetchInterval,
      staleTime: 10 * 1000, // 10 seconds
      retry: 3,
      retryDelay: 1000,
    },
  });

  return {
    // Platform fee
    platformFee: {
      data: platformFeeQuery.data,
      isLoading: platformFeeQuery.isLoading,
      error: platformFeeQuery.error,
      refetch: platformFeeQuery.refetch,
    },
    
    // Raffle counter
    raffleCounter: {
      data: raffleCounterQuery.data,
      isLoading: raffleCounterQuery.isLoading,
      error: raffleCounterQuery.error,
      refetch: raffleCounterQuery.refetch,
    },
    
    // Pause status
    pauseStatus: {
      data: pauseStatusQuery.data,
      isLoading: pauseStatusQuery.isLoading,
      error: pauseStatusQuery.error,
      refetch: pauseStatusQuery.refetch,
    },
    
    // Combined loading state
    isLoading: platformFeeQuery.isLoading || raffleCounterQuery.isLoading || pauseStatusQuery.isLoading,
    
    // Combined error state
    hasError: !!(platformFeeQuery.error || raffleCounterQuery.error || pauseStatusQuery.error),
    
    // Refetch all queries
    refetchAll: () => {
      platformFeeQuery.refetch();
      raffleCounterQuery.refetch();
      pauseStatusQuery.refetch();
    }
  };
}

/**
 * Hook for reading platform fee (V4 aware)
 */
export function usePlatformFeeV4() {
  const { platformFee } = useContractReads();
  return platformFee;
}

/**
 * Hook for reading raffle counter (V4 aware)
 */
export function useRaffleCounterV4() {
  const { raffleCounter } = useContractReads();
  return raffleCounter;
}

/**
 * Hook for checking if factory is paused (V4 aware)
 */
export function useFactoryPauseStatusV4() {
  const { pauseStatus } = useContractReads();
  return pauseStatus;
}

/**
 * Hook for reading raffle contract address by ID (V4 aware)
 */
export function useRaffleContractV4(raffleId: number) {
  const { factoryAddress } = useContractVersionManager();
  
  return useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: RAFFLE_FACTORY_ABI,
    functionName: 'getRaffleContract',
    args: [BigInt(raffleId)],
    query: {
      enabled: raffleId >= 0,
      staleTime: 60 * 1000, // 1 minute
      retry: 3,
      retryDelay: 1000,
    },
  });
}

/**
 * Hook for checking NFT approval status (V4 aware)
 * FIXED: Now checks both isApprovedForAll AND specific token approval
 */
export function useNFTApprovalStatusV4(nftContract: string, userAddress: string, tokenId?: string) {
  const { factoryAddress } = useContractVersionManager();
  const isValidAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr);
  
  // Check isApprovedForAll
  const approvedForAllQuery = useReadContract({
    address: nftContract as `0x${string}`,
    abi: ERC721_ABI,
    functionName: 'isApprovedForAll',
    args: [userAddress as `0x${string}`, factoryAddress as `0x${string}`],
    query: {
      enabled: !!(nftContract && userAddress && isValidAddress(nftContract) && isValidAddress(userAddress)),
      staleTime: 30 * 1000, // 30 seconds
      retry: 3,
      retryDelay: 1000,
    },
  });
  
  // Check specific token approval (if tokenId provided)
  const tokenApprovalQuery = useReadContract({
    address: nftContract as `0x${string}`,
    abi: ERC721_ABI,
    functionName: 'getApproved',
    args: [BigInt(tokenId || '0')],
    query: {
      enabled: !!(nftContract && tokenId && isValidAddress(nftContract)),
      staleTime: 30 * 1000, // 30 seconds
      retry: 3,
      retryDelay: 1000,
    },
  });
  
  // Combine both approval checks (matches contract logic)
  const isApprovedForAll = approvedForAllQuery.data as boolean;
  const approvedAddress = tokenApprovalQuery.data as string;
  const isTokenApproved = tokenId && approvedAddress?.toLowerCase() === factoryAddress.toLowerCase();
  
  // Return true if EITHER condition is met (matches contract requirement)
  const isApproved = isApprovedForAll || isTokenApproved;
  
  return {
    data: isApproved,
    isLoading: approvedForAllQuery.isLoading || (tokenId ? tokenApprovalQuery.isLoading : false),
    error: approvedForAllQuery.error || tokenApprovalQuery.error,
    refetch: () => {
      approvedForAllQuery.refetch();
      if (tokenId) tokenApprovalQuery.refetch();
    },
    // Debug info
    debug: {
      isApprovedForAll,
      isTokenApproved,
      approvedAddress,
      factoryAddress
    }
  };
}

