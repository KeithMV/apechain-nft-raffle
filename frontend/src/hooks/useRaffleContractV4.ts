/**
 * V4 Contract Hooks - Optimized for Performance
 * High-performance transaction hooks with adaptive configurations
 */

import React from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { useContractVersionManager } from './useContractVersionManager';
import { useOptimizedBuyTickets, useOptimizedSelectWinner, useOptimizedCreateRaffle } from './useOptimizedTransactionManager';
import { useContractValidator } from './useContractValidator';
import { RAFFLE_FACTORY_ABI, ERC721_ABI, RAFFLE_CONTRACT_ABI } from '../config/contracts';
import { parseEther } from 'viem/utils';
import { useUnifiedCacheInvalidation } from './useUnifiedCacheInvalidation';
import { MultiChainErrorHandler } from '../utils/multiChainErrorHandler';

// Re-export read hooks for backward compatibility
export { 
  usePlatformFeeV4, 
  useRaffleCounterV4, 
  useFactoryPauseStatusV4, 
  useRaffleContractV4, 
  useNFTApprovalStatusV4 
} from './useContractReads';

export interface CreateRaffleParams {
  nftContract: string;
  tokenId: string;
  ticketPrice: string;
  maxTickets: number;
  duration: number;
}

/**
 * Hook for NFT approval transaction (Optimized V4)
 */
export function useNFTApprovalV4() {
  const chainId = useChainId();
  const { factoryAddress, currentVersion } = useContractVersionManager();
  const { validateNFTApproval } = useContractValidator();
  const transactionManager = useOptimizedCreateRaffle(); // Use create raffle manager for approvals

  const approveNFT = async (nftContract: string) => {
    // Validate input
    const validation = validateNFTApproval(nftContract);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    return await transactionManager.executeTransaction({
      address: nftContract as `0x${string}`,
      abi: ERC721_ABI,
      functionName: 'setApprovalForAll',
      args: [factoryAddress as `0x${string}`, true],
      chainId: chainId,
    });
  };

  return {
    approveNFT,
    hash: transactionManager.hash,
    error: transactionManager.error,
    isPending: transactionManager.isPending,
    isConfirming: transactionManager.isConfirming,
    isSuccess: transactionManager.isSuccess,
    version: currentVersion,
  };
}

/**
 * Hook for creating raffle with V4 support and optimized performance
 */
export function useCreateRaffleV4() {
  const chainId = useChainId();
  const { factoryAddress, currentVersion, rateLimit, rateLimitText } = useContractVersionManager();
  const { validateRaffleCreation } = useContractValidator();
  const { invalidateAfterTransaction } = useUnifiedCacheInvalidation();
  
  const handleSuccess = () => {
    setTimeout(() => invalidateAfterTransaction({ transactionType: 'create-raffle' }), 500);
  };
  
  const transactionManager = useOptimizedCreateRaffle(handleSuccess);

  const createRaffle = async (params: CreateRaffleParams) => {
    // Validate all inputs
    const validation = validateRaffleCreation(params);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    const ticketPriceWei = parseEther(params.ticketPrice);
    
    return await transactionManager.executeTransaction({
      address: factoryAddress as `0x${string}`,
      abi: RAFFLE_FACTORY_ABI,
      functionName: 'createRaffle',
      args: [
        params.nftContract as `0x${string}`,
        BigInt(params.tokenId),
        ticketPriceWei,
        BigInt(params.maxTickets),
        BigInt(params.duration)
      ],
      chainId: chainId,
    });
  };

  return {
    createRaffle,
    hash: transactionManager.hash,
    error: transactionManager.error,
    isPending: transactionManager.isPending,
    isConfirming: transactionManager.isConfirming,
    isSuccess: transactionManager.isSuccess,
    version: currentVersion,
    rateLimit,
    rateLimitText
  };
}
/**
 * Hook for buying raffle tickets (Optimized V4)
 */
export function useBuyTickets() {
  const chainId = useChainId();
  const { validateTicketPurchase } = useContractValidator();
  const { invalidateAfterTransaction } = useUnifiedCacheInvalidation();
  
  const handleSuccess = () => invalidateAfterTransaction({ transactionType: 'buy-tickets' });
  
  const transactionManager = useOptimizedBuyTickets();

  const buyTickets = async (raffleContract: string, quantity: number, ticketPrice: string, userAddress?: string) => {
    // Validate all inputs
    const validation = validateTicketPurchase({ raffleContract, quantity, ticketPrice });
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    const ticketPriceWei = parseEther(ticketPrice);
    const totalCost = ticketPriceWei * BigInt(quantity);
    
    // Calculate optimistic data for better UX
    const optimisticData = {
      raffleId: raffleContract,
      userAddress,
      expectedTicketCount: quantity, // This would need to be current + quantity in real implementation
    };
    
    return await transactionManager.executeTransaction({
      address: raffleContract as `0x${string}`,
      abi: RAFFLE_CONTRACT_ABI,
      functionName: 'buyTickets',
      args: [BigInt(quantity)],
      value: totalCost,
    });
  };

  return {
    buyTickets,
    hash: transactionManager.hash,
    error: transactionManager.error,
    isPending: transactionManager.isPending,
    isConfirming: transactionManager.isConfirming,
    isSuccess: transactionManager.isSuccess,
    retryTransaction: transactionManager.retryTransaction,
  };
}

/**
 * Hook for cancelling raffle (Optimized V4)
 */
export function useCancelRaffleV4() {
  const chainId = useChainId();
  const { invalidateAfterTransaction } = useUnifiedCacheInvalidation();
  
  const handleSuccess = () => invalidateAfterTransaction({ transactionType: 'cancel-raffle' });
  
  const transactionManager = useOptimizedCancelRaffle();

  const cancelRaffle = async (raffleContract: string) => {
    // Simple validation
    if (!raffleContract || !/^0x[a-fA-F0-9]{40}$/.test(raffleContract)) {
      throw new Error('Invalid raffle contract address');
    }
    
    return await transactionManager.executeTransaction({
      address: raffleContract as `0x${string}`,
      abi: RAFFLE_CONTRACT_ABI,
      functionName: 'cancelRaffle',
      chainId: chainId,
    });
  };

  return {
    cancelRaffle,
    hash: transactionManager.hash,
    error: transactionManager.error,
    isPending: transactionManager.isPending,
    isConfirming: transactionManager.isConfirming,
    isSuccess: transactionManager.isSuccess,
    retryTransaction: transactionManager.retryTransaction,
  };
}

/**
 * Hook for emergency pause (owner only) - V4 aware
 */
export function useEmergencyPause() {
  const chainId = useChainId();
  const { factoryAddress } = useContractVersionManager();
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const pause = () => {
    writeContract({
      address: factoryAddress as `0x${string}`,
      abi: RAFFLE_FACTORY_ABI,
      functionName: 'emergencyPause',
      chainId: chainId,
    });
  };

  const unpause = () => {
    writeContract({
      address: factoryAddress as `0x${string}`,
      abi: RAFFLE_FACTORY_ABI,
      functionName: 'emergencyUnpause',
      chainId: chainId,
    });
  };

  return {
    pause,
    unpause,
    hash,
    error,
    isPending,
    isConfirming,
    isSuccess,
  };
}

/**
 * Rate limit checker hook (stub implementation)
 */
export function useRateLimitChecker(userAddress?: string) {
  const { currentVersion, rateLimit, rateLimitText } = useContractVersionManager();
  
  // TODO: Implement actual rate limiting logic
  return {
    canCreateRaffle: true,
    timeRemaining: 0,
    rateLimit,
    rateLimitText,
    version: currentVersion
  };
}