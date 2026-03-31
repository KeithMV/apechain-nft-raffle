/**
 * V4 Contract Hooks - Optimized for Performance
 * High-performance transaction hooks with adaptive configurations
 */

import { useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { useEffect } from 'react';
import { useContractVersionManager } from './useContractVersionManager';
import { useOptimizedBuyTickets, useOptimizedCreateRaffle, useOptimizedCancelRaffle } from './useOptimizedTransactionManager';
import { useContractValidator } from './useContractValidator';
import { RAFFLE_FACTORY_ABI, ERC721_ABI, RAFFLE_CONTRACT_ABI } from '../config/contracts';
import { parseEther } from 'viem/utils';
import { useUnifiedCacheInvalidation } from './useUnifiedCacheInvalidation';

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
  const { factoryAddress, currentVersion } = useContractVersionManager();
  const { validateNFTApproval } = useContractValidator();
  const transactionManager = useOptimizedCreateRaffle(); // Use create raffle manager for approvals

  const approveNFT = async (nftContract: string) => {
    // SECURITY: Validate and sanitize input
    if (!nftContract || typeof nftContract !== 'string') {
      throw new Error('Invalid NFT contract address');
    }
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(nftContract)) {
      throw new Error('Invalid Ethereum address format');
    }
    
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
  const { factoryAddress, currentVersion, rateLimit, rateLimitText } = useContractVersionManager();
  const { validateRaffleCreation } = useContractValidator();
  const { invalidateAfterTransaction } = useUnifiedCacheInvalidation();
  
  const handleSuccess = (hash: string) => {
    console.log('✅ [CREATE] Raffle created successfully, invalidating all caches including user NFTs');
    // Comprehensive cache invalidation after raffle creation
    setTimeout(() => {
      invalidateAfterTransaction({ 
        transactionType: 'create-raffle',
        immediate: true
      });
    }, 500);
  };
  
  const transactionManager = useOptimizedCreateRaffle(handleSuccess);

  const createRaffle = async (params: CreateRaffleParams) => {
    // SECURITY: Validate and sanitize all inputs
    if (!params || typeof params !== 'object') {
      throw new Error('Invalid raffle parameters');
    }
    
    if (!params.nftContract || !/^0x[a-fA-F0-9]{40}$/.test(params.nftContract)) {
      throw new Error('Invalid NFT contract address');
    }
    
    if (!params.tokenId || !/^\d+$/.test(params.tokenId.toString())) {
      throw new Error('Invalid token ID');
    }
    
    if (!params.ticketPrice || typeof params.ticketPrice !== 'string' || parseFloat(params.ticketPrice) <= 0) {
      throw new Error('Invalid ticket price');
    }
    
    if (!params.maxTickets || typeof params.maxTickets !== 'number' || params.maxTickets <= 0 || params.maxTickets > 10000) {
      throw new Error('Invalid max tickets (must be 1-10000)');
    }
    
    if (!params.duration || typeof params.duration !== 'number' || params.duration <= 0) {
      throw new Error('Invalid duration');
    }
    
    // Validate all inputs
    const validation = validateRaffleCreation(params);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    const ticketPriceWei = parseEther(params.ticketPrice);
    
    console.log('🎯 [CREATE] Creating raffle - NFT will be transferred from user wallet to raffle contract');
    console.log('📝 [CREATE] NFT:', params.nftContract, 'Token ID:', params.tokenId);
    
    // POLYGON FIX: Add explicit gas configuration for Polygon
    const contractCall = {
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
    };
    
    // Add Polygon-specific gas settings
    const chainId = typeof window !== 'undefined' && (window as any).ethereum 
      ? await (window as any).ethereum.request({ method: 'eth_chainId' })
      : null;
    
    if (chainId === '0x89' || chainId === 137) { // Polygon
      console.log('🔶 [POLYGON] Adding Polygon-specific gas settings');
      (contractCall as any).gas = BigInt(500000); // Higher gas limit for Polygon
      (contractCall as any).maxFeePerGas = BigInt('200000000000'); // 200 gwei
      (contractCall as any).maxPriorityFeePerGas = BigInt('50000000000'); // 50 gwei
    }
    
    return await transactionManager.executeTransaction(contractCall);
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
  const { validateTicketPurchase } = useContractValidator();
  const { invalidateAfterTransaction } = useUnifiedCacheInvalidation();
  
  const transactionManager = useOptimizedBuyTickets();
  
  // Handle success with cache invalidation
  useEffect(() => {
    if (transactionManager.isSuccess) {
      invalidateAfterTransaction({ transactionType: 'buy-tickets' });
    }
  }, [transactionManager.isSuccess, invalidateAfterTransaction]);

  const buyTickets = async (raffleContract: string, quantity: number, ticketPrice: string, userAddress?: string) => {
    // SECURITY: Validate and sanitize all inputs
    if (!raffleContract || typeof raffleContract !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(raffleContract)) {
      throw new Error('Invalid raffle contract address');
    }
    
    if (!quantity || typeof quantity !== 'number' || quantity < 1 || quantity > 25 || !Number.isInteger(quantity)) {
      throw new Error('Invalid ticket quantity (must be 1-25)');
    }
    
    if (!ticketPrice || typeof ticketPrice !== 'string' || parseFloat(ticketPrice) <= 0) {
      throw new Error('Invalid ticket price');
    }
    
    if (userAddress && !/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
      throw new Error('Invalid user address format');
    }
    
    // Validate all inputs
    const validation = validateTicketPurchase({ raffleContract, quantity, ticketPrice });
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    const ticketPriceWei = parseEther(ticketPrice);
    const totalCost = ticketPriceWei * BigInt(quantity);
    
    // Calculate optimistic data for better UX
    
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
  const { invalidateAfterTransaction } = useUnifiedCacheInvalidation();
  
  const transactionManager = useOptimizedCancelRaffle();
  
  // Handle success with cache invalidation
  useEffect(() => {
    if (transactionManager.isSuccess) {
      invalidateAfterTransaction({ transactionType: 'cancel-raffle' });
    }
  }, [transactionManager.isSuccess, invalidateAfterTransaction]);

  const cancelRaffle = async (raffleContract: string) => {
    // SECURITY: Comprehensive input validation and sanitization
    if (!raffleContract || typeof raffleContract !== 'string') {
      throw new Error('Invalid raffle contract address');
    }
    
    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(raffleContract)) {
      throw new Error('Invalid Ethereum address format');
    }
    
    // Additional security: ensure it's not a system address
    const systemAddresses = ['0x0000000000000000000000000000000000000000'];
    if (systemAddresses.includes(raffleContract.toLowerCase())) {
      throw new Error('Cannot cancel system contracts');
    }
    
    return await transactionManager.executeTransaction({
      address: raffleContract as `0x${string}`,
      abi: RAFFLE_CONTRACT_ABI,
      functionName: 'cancelRaffle',
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