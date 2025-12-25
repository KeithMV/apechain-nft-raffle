/**
 * V4 Contract Hooks with Version Detection
 * Automatically detects and uses V4 when available
 */

import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { getRaffleFactoryAddress, isV4Available, getRateLimit } from '../config/addresses';
import { RAFFLE_FACTORY_ABI, RAFFLE_CONTRACT_ABI, ERC721_ABI } from '../config/contracts';
import { parseEther } from 'viem/utils';
import { useEffect, useRef, useState } from 'react';
import { useCacheInvalidation } from './useCacheInvalidation';
import toast from 'react-hot-toast';

export interface CreateRaffleParams {
  nftContract: string;
  tokenId: string;
  ticketPrice: string;
  maxTickets: number;
  duration: number;
}

/**
 * Hook to detect V4 availability and get current version info
 */
export function useVersionInfo() {
  const [v4Available, setV4Available] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<'v3' | 'v4'>('v3');
  
  useEffect(() => {
    const checkV4 = isV4Available();
    setV4Available(checkV4);
    setCurrentVersion(checkV4 ? 'v4' : 'v3');
  }, []);
  
  const rateLimit = getRateLimit(currentVersion === 'v4');
  
  return {
    v4Available,
    currentVersion,
    rateLimit,
    rateLimitText: currentVersion === 'v4' ? '10 seconds' : '5 minutes'
  };
}

/**
 * Hook for reading platform fee (V4 aware)
 */
export function usePlatformFeeV4() {
  const { currentVersion } = useVersionInfo();
  const factoryAddress = getRaffleFactoryAddress(undefined, currentVersion === 'v4');
  
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
  const { currentVersion } = useVersionInfo();
  const factoryAddress = getRaffleFactoryAddress(undefined, currentVersion === 'v4');
  
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
  const { currentVersion } = useVersionInfo();
  const factoryAddress = getRaffleFactoryAddress(undefined, currentVersion === 'v4');
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
  const { currentVersion } = useVersionInfo();
  const factoryAddress = getRaffleFactoryAddress(undefined, currentVersion === 'v4');
  const { writeContractAsync, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approveNFT = async (nftContract: string) => {
    return await writeContractAsync({
      address: nftContract as `0x${string}`,
      abi: ERC721_ABI,
      functionName: 'setApprovalForAll',
      args: [factoryAddress as `0x${string}`, true],
      chainId: 33139,
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
  const { currentVersion, rateLimit } = useVersionInfo();
  const factoryAddress = getRaffleFactoryAddress(undefined, currentVersion === 'v4');
  const { writeContractAsync, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const { invalidateAll } = useCacheInvalidation();
  const lastSuccessHash = useRef<string | null>(null);

  useEffect(() => {
    if (isSuccess && hash && hash !== lastSuccessHash.current) {
      lastSuccessHash.current = hash;
      
      // Immediate success notification
      toast.success('✅ Raffle created successfully!');
      
      // Invalidate cache after a short delay to ensure transaction is processed
      const cacheTimeoutId = setTimeout(() => {
        invalidateAll();
      }, 500);
      
      return () => clearTimeout(cacheTimeoutId);
    }
  }, [isSuccess, hash, invalidateAll]);

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
    
    return await writeContractAsync({
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
      chainId: 33139,
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
    rateLimitText: currentVersion === 'v4' ? '10 seconds' : '5 minutes'
  };
}

/**
 * Hook for reading raffle contract address by ID (V4 aware)
 */
export function useRaffleContractV4(raffleId: number) {
  const { currentVersion } = useVersionInfo();
  const factoryAddress = getRaffleFactoryAddress(undefined, currentVersion === 'v4');
  
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
  const { currentVersion } = useVersionInfo();
  const factoryAddress = getRaffleFactoryAddress(undefined, currentVersion === 'v4');
  
  return useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: RAFFLE_FACTORY_ABI,
    functionName: 'paused',
  });
}

/**
 * Rate limit checker hook
 */
export function useRateLimitChecker(userAddress?: string) {
  const { currentVersion, rateLimit } = useVersionInfo();
  const [canCreateRaffle, setCanCreateRaffle] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  // This would need to be implemented with actual last raffle time from contract
  // For now, just return the rate limit info
  
  return {
    canCreateRaffle,
    timeRemaining,
    rateLimit,
    rateLimitText: currentVersion === 'v4' ? '10 seconds' : '5 minutes',
    version: currentVersion
  };
}