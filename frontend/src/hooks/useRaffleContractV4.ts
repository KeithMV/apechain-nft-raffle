/**
 * V4 Contract Hooks with Version Detection
 * Automatically detects and uses V4 when available
 */

import { useWriteContract, useReadContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
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
  const chainId = useChainId();
  const [v4Available, setV4Available] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<'v3' | 'v4'>('v3');
  
  useEffect(() => {
    const checkV4 = isV4Available(chainId);
    setV4Available(checkV4);
    setCurrentVersion(checkV4 ? 'v4' : 'v3');
  }, [chainId]);
  
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
  const chainId = useChainId();
  const { currentVersion } = useVersionInfo();
  const factoryAddress = getRaffleFactoryAddress(chainId, currentVersion === 'v4');
  
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
  const chainId = useChainId();
  const { currentVersion } = useVersionInfo();
  const factoryAddress = getRaffleFactoryAddress(chainId, currentVersion === 'v4');
  
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
  const chainId = useChainId();
  const { currentVersion } = useVersionInfo();
  const factoryAddress = getRaffleFactoryAddress(chainId, currentVersion === 'v4');
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
  const { currentVersion } = useVersionInfo();
  const factoryAddress = getRaffleFactoryAddress(chainId, currentVersion === 'v4');
  const { writeContractAsync, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError: receiptError } = useWaitForTransactionReceipt({
    hash,
    timeout: 60000, // 60 second timeout
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle approval success
  useEffect(() => {
    if (isSuccess) {
      setIsProcessing(false);
    }
  }, [isSuccess]);

  // Handle transaction receipt errors or timeouts
  useEffect(() => {
    if (receiptError || (hash && !isConfirming && !isSuccess)) {
      setIsProcessing(false);
      if (receiptError) {
        toast.error('Approval confirmation failed. Please try again.');
      }
    }
  }, [receiptError, hash, isConfirming, isSuccess]);

  // Handle transaction errors (including user rejection)
  useEffect(() => {
    if (error) {
      setIsProcessing(false);
    }
  }, [error]);

  const approveNFT = async (nftContract: string) => {
    setIsProcessing(true);
    try {
      return await writeContractAsync({
        address: nftContract as `0x${string}`,
        abi: ERC721_ABI,
        functionName: 'setApprovalForAll',
        args: [factoryAddress as `0x${string}`, true],
      });
    } catch (error) {
      setIsProcessing(false);
      throw error;
    }
  };

  return {
    approveNFT,
    hash,
    error,
    isPending: isProcessing,
    isConfirming: isConfirming && isProcessing,
    isSuccess,
    version: currentVersion,
  };
}

/**
 * Hook for creating raffle with V4 support and rate limit awareness
 */
export function useCreateRaffleV4() {
  const chainId = useChainId();
  const { currentVersion, rateLimit } = useVersionInfo();
  const factoryAddress = getRaffleFactoryAddress(chainId, currentVersion === 'v4');
  const { writeContractAsync, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError: receiptError } = useWaitForTransactionReceipt({
    hash,
    timeout: 60000, // 60 second timeout
  });
  const { invalidateAll } = useCacheInvalidation();
  const lastSuccessHash = useRef<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isSuccess && hash && hash !== lastSuccessHash.current) {
      lastSuccessHash.current = hash;
      setIsProcessing(false);
      const cacheTimeoutId = setTimeout(() => {
        invalidateAll();
      }, 500);
      return () => clearTimeout(cacheTimeoutId);
    }
  }, [isSuccess, hash, invalidateAll]);

  useEffect(() => {
    if (receiptError) {
      setIsProcessing(false);
      toast.error('Transaction failed or timed out. Please try again.');
    }
    if (hash && !isConfirming && !isSuccess && !receiptError) {
      const timeoutId = setTimeout(() => {
        setIsProcessing(false);
        toast.error('Transaction confirmation timed out. Check wallet or try again.');
      }, 35000);
      return () => clearTimeout(timeoutId);
    }
  }, [receiptError, hash, isConfirming, isSuccess]);

  useEffect(() => {
    if (error) {
      setIsProcessing(false);
      if (error.message?.includes('User rejected')) {
        toast.error('Transaction cancelled by user.');
      } else if (error.message?.includes('insufficient funds')) {
        toast.error('Insufficient funds for transaction.');
      } else {
        toast.error(`Transaction failed: ${error.message || 'Unknown error'}`);
      }
    }
  }, [error]);

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
    
    setIsProcessing(true);
    const ticketPriceWei = parseEther(params.ticketPrice);
    
    try {
      const result = await writeContractAsync({
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
      });
      return result;
    } catch (error: any) {
      setIsProcessing(false);
      throw error;
    }
  };

  return {
    createRaffle,
    hash,
    error,
    isPending: isProcessing,
    isConfirming: isConfirming && isProcessing,
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
  const chainId = useChainId();
  const { currentVersion } = useVersionInfo();
  const factoryAddress = getRaffleFactoryAddress(chainId, currentVersion === 'v4');
  
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
  const chainId = useChainId();
  const { currentVersion } = useVersionInfo();
  const factoryAddress = getRaffleFactoryAddress(chainId, currentVersion === 'v4');
  
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
  const chainId = useChainId();
  const { writeContractAsync, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError: receiptError } = useWaitForTransactionReceipt({
    hash,
    timeout: 60000,
  });
  const { invalidateAll } = useCacheInvalidation();
  const lastSuccessHash = useRef<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isSuccess && hash && hash !== lastSuccessHash.current) {
      lastSuccessHash.current = hash;
      setIsProcessing(false);
      toast.success('Tickets purchased successfully!');
      invalidateAll();
    }
  }, [isSuccess, hash, invalidateAll]);

  useEffect(() => {
    if (receiptError || (hash && !isConfirming && !isSuccess)) {
      setIsProcessing(false);
      if (receiptError) {
        toast.error('Transaction confirmation failed. Please try again.');
      }
    }
  }, [receiptError, hash, isConfirming, isSuccess]);

  useEffect(() => {
    if (error) {
      setIsProcessing(false);
    }
  }, [error]);

  const buyTickets = async (raffleContract: string, quantity: number, ticketPrice: string) => {
    if (!ticketPrice || isNaN(parseFloat(ticketPrice))) {
      throw new Error('Invalid ticket price');
    }
    if (!quantity || quantity <= 0) {
      throw new Error('Invalid quantity');
    }
    
    setIsProcessing(true);
    const ticketPriceWei = parseEther(ticketPrice);
    const totalCost = ticketPriceWei * BigInt(quantity);
    
    try {
      const result = await writeContractAsync({
        address: raffleContract as `0x${string}`,
        abi: RAFFLE_CONTRACT_ABI,
        functionName: 'buyTickets',
        args: [BigInt(quantity)],
        value: totalCost,
      });
      return result;
    } catch (error) {
      setIsProcessing(false);
      throw error;
    }
  };

  return {
    buyTickets,
    hash,
    error,
    isPending: isProcessing,
    isConfirming: isConfirming && isProcessing,
    isSuccess,
  };
}

/**
 * Hook for emergency pause (owner only) - V4 aware
 */
export function useEmergencyPause() {
  const chainId = useChainId();
  const { currentVersion } = useVersionInfo();
  const factoryAddress = getRaffleFactoryAddress(chainId, currentVersion === 'v4');
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const pause = () => {
    writeContract({
      address: factoryAddress as `0x${string}`,
      abi: RAFFLE_FACTORY_ABI,
      functionName: 'emergencyPause',
    });
  };

  const unpause = () => {
    writeContract({
      address: factoryAddress as `0x${string}`,
      abi: RAFFLE_FACTORY_ABI,
      functionName: 'emergencyUnpause',
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
  const { currentVersion, rateLimit } = useVersionInfo();
  const [canCreateRaffle, setCanCreateRaffle] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  return {
    canCreateRaffle,
    timeRemaining,
    rateLimit,
    rateLimitText: currentVersion === 'v4' ? '10 seconds' : '5 minutes',
    version: currentVersion
  };
}