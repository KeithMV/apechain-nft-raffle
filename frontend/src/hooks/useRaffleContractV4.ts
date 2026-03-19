/**
 * V4 Contract Hooks with Version Detection
 * Automatically detects and uses V4 when available
 */

import { useWriteContract, useReadContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { useContractVersionManager } from './useContractVersionManager';
import { useNFTApprovalTransaction, useRaffleCreationTransaction, useTicketPurchaseTransaction } from './useWeb3TransactionManager';
import { RAFFLE_FACTORY_ABI, RAFFLE_CONTRACT_ABI, ERC721_ABI } from '../config/contracts';
import { parseEther } from 'viem/utils';
import { useState } from 'react';
import { useCacheInvalidation } from './useCacheInvalidation';

export interface CreateRaffleParams {
  nftContract: string;
  tokenId: string;
  ticketPrice: string;
  maxTickets: number;
  duration: number;
}



/**
 * Hook for reading platform fee (V4 aware)
 */
export function usePlatformFeeV4() {
  const { factoryAddress } = useContractVersionManager();
  
  return useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: RAFFLE_FACTORY_ABI,
    functionName: 'platformFee',
  });
}

/**
 * Hook for reading raffle counter (V4 aware)
 */
export function useRaffleCounterV4() {
  const { factoryAddress } = useContractVersionManager();
  
  return useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: RAFFLE_FACTORY_ABI,
    functionName: 'raffleCounter',
  });
}

/**
 * Hook for checking NFT approval status (V4 aware)
 */
export function useNFTApprovalStatusV4(nftContract: string, userAddress: string) {
  const { factoryAddress } = useContractVersionManager();
  const isValidAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr);
  
  return useReadContract({
    address: nftContract as `0x${string}`,
    abi: ERC721_ABI,
    functionName: 'isApprovedForAll',
    args: [userAddress as `0x${string}`, factoryAddress as `0x${string}`],
    query: {
      enabled: !!(nftContract && userAddress && isValidAddress(nftContract) && isValidAddress(userAddress)),
    },
  });
}

/**
 * Hook for NFT approval transaction (V4 aware)
 */
export function useNFTApprovalV4() {
  const chainId = useChainId();
  const { factoryAddress, currentVersion } = useContractVersionManager();
  const { hash, error, isPending, isConfirming, isSuccess, executeTransaction } = useNFTApprovalTransaction();

  const approveNFT = async (nftContract: string) => {
    return await executeTransaction({
      address: nftContract as `0x${string}`,
      abi: ERC721_ABI,
      functionName: 'setApprovalForAll',
      args: [factoryAddress as `0x${string}`, true],
      chainId: chainId,
    });
  };

  return {
    approveNFT,
    hash,
    error,
    isPending,
    isConfirming,
    isSuccess,
    version: currentVersion,
  };
}

/**
 * Hook for creating raffle with V4 support and rate limit awareness
 */
export function useCreateRaffleV4() {
  const chainId = useChainId();
  const { factoryAddress, currentVersion, rateLimit, rateLimitText } = useContractVersionManager();
  const { invalidateAll } = useCacheInvalidation();
  
  const handleSuccess = () => {
    const cacheTimeoutId = setTimeout(() => {
      invalidateAll();
    }, 500);
    return () => clearTimeout(cacheTimeoutId);
  };
  
  const { hash, error, isPending, isConfirming, isSuccess, executeTransaction } = useRaffleCreationTransaction(handleSuccess);

  const createRaffle = async (params: CreateRaffleParams) => {
    // Validate inputs
    if (!params.ticketPrice || isNaN(parseFloat(params.ticketPrice))) {
      throw new Error('Invalid ticket price');
    }
    if (!params.tokenId || isNaN(parseInt(params.tokenId))) {
      throw new Error('Invalid token ID');
    }
    if (!params.maxTickets || params.maxTickets <= 0) {
      throw new Error('Invalid max tickets');
    }
    if (!params.duration || params.duration <= 0) {
      throw new Error('Invalid duration');
    }
    
    const ticketPriceWei = parseEther(params.ticketPrice);
    
    return await executeTransaction({
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
    hash,
    error,
    isPending,
    isConfirming,
    isSuccess,
    version: currentVersion,
    rateLimit,
    rateLimitText
  };
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
    },
  });
}

/**
 * Hook for checking if factory is paused (V4 aware)
 */
export function useFactoryPauseStatusV4() {
  const { factoryAddress } = useContractVersionManager();
  
  return useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: RAFFLE_FACTORY_ABI,
    functionName: 'paused',
  });
}

/**
 * Hook for buying raffle tickets (V4 aware)
 */
export function useBuyTickets() {
  const { invalidateAll } = useCacheInvalidation();
  
  const handleSuccess = () => {
    invalidateAll();
  };
  
  const { hash, error, isPending, isConfirming, isSuccess, executeTransaction } = useTicketPurchaseTransaction();

  const buyTickets = async (raffleContract: string, quantity: number, ticketPrice: string) => {
    if (!ticketPrice || isNaN(parseFloat(ticketPrice))) {
      throw new Error('Invalid ticket price');
    }
    if (!quantity || quantity <= 0) {
      throw new Error('Invalid quantity');
    }
    
    const ticketPriceWei = parseEther(ticketPrice);
    const totalCost = ticketPriceWei * BigInt(quantity);
    
    return await executeTransaction({
      address: raffleContract as `0x${string}`,
      abi: RAFFLE_CONTRACT_ABI,
      functionName: 'buyTickets',
      args: [BigInt(quantity)],
      value: totalCost,
    });
  };

  return {
    buyTickets,
    hash,
    error,
    isPending,
    isConfirming,
    isSuccess,
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
 * Rate limit checker hook
 */
export function useRateLimitChecker(userAddress?: string) {
  const { currentVersion, rateLimit, rateLimitText } = useContractVersionManager();
  const [canCreateRaffle, setCanCreateRaffle] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  return {
    canCreateRaffle,
    timeRemaining,
    rateLimit,
    rateLimitText,
    version: currentVersion
  };
}