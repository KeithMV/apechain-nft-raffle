/**
 * Professional Raffle Contract Hooks
 * Uses wagmi React hooks for proper mobile Safari compatibility
 */

import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { RAFFLE_FACTORY_ADDRESS, RAFFLE_FACTORY_ABI, RAFFLE_CONTRACT_ABI, ERC721_ABI } from '../config/contracts';
import { parseEther } from 'viem/utils';
import { useEffect, useRef } from 'react';
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
 * Hook for reading platform fee
 */
export function usePlatformFee() {
  return useReadContract({
    address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
    abi: RAFFLE_FACTORY_ABI,
    functionName: 'platformFee',
  });
}

/**
 * Hook for reading raffle counter
 */
export function useRaffleCounter() {
  return useReadContract({
    address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
    abi: RAFFLE_FACTORY_ABI,
    functionName: 'raffleCounter',
  });
}

/**
 * Hook for checking NFT approval status
 */
export function useNFTApprovalStatus(nftContract: string, userAddress: string) {
  const isValidAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr);
  
  return useReadContract({
    address: nftContract as `0x${string}`,
    abi: ERC721_ABI,
    functionName: 'isApprovedForAll',
    args: [userAddress as `0x${string}`, RAFFLE_FACTORY_ADDRESS as `0x${string}`],
    query: {
      enabled: !!(nftContract && userAddress && isValidAddress(nftContract) && isValidAddress(userAddress)),
    },
  });
}

/**
 * Hook for NFT approval transaction
 */
export function useNFTApproval() {
  const { writeContractAsync, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approveNFT = async (nftContract: string) => {
    return await writeContractAsync({
      address: nftContract as `0x${string}`,
      abi: ERC721_ABI,
      functionName: 'setApprovalForAll',
      args: [RAFFLE_FACTORY_ADDRESS as `0x${string}`, true],
      chainId: 33139, // Force ApeChain
    });
  };

  return {
    approveNFT,
    hash,
    error,
    isPending,
    isConfirming,
    isSuccess,
  };
}

/**
 * Hook for creating raffle - simplified standard wagmi pattern
 */
export function useCreateRaffle() {
  const { writeContractAsync, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const { invalidateAll } = useCacheInvalidation();

  useEffect(() => {
    if (isSuccess) {
      invalidateAll();
    }
  }, [isSuccess, invalidateAll]);

  const createRaffle = async (params: CreateRaffleParams) => {
    const ticketPriceWei = parseEther(params.ticketPrice);
    
    return await writeContractAsync({
      address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
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
  };
}

/**
 * Hook for reading raffle contract address by ID
 */
export function useRaffleContract(raffleId: number) {
  return useReadContract({
    address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
    abi: RAFFLE_FACTORY_ABI,
    functionName: 'getRaffleContract',
    args: [BigInt(raffleId)],
    query: {
      enabled: raffleId >= 0,
    },
  });
}

/**
 * Hook for emergency pause (owner only)
 */
export function useEmergencyPause() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const pause = () => {
    writeContract({
      address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
      abi: RAFFLE_FACTORY_ABI,
      functionName: 'emergencyPause',
      chainId: 33139,
    });
  };

  const unpause = () => {
    writeContract({
      address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
      abi: RAFFLE_FACTORY_ABI,
      functionName: 'emergencyUnpause',
      chainId: 33139,
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
 * Hook for checking if factory is paused
 */
export function useFactoryPauseStatus() {
  return useReadContract({
    address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
    abi: RAFFLE_FACTORY_ABI,
    functionName: 'paused',
  });
}

/**
 * Hook for buying raffle tickets
 */
export function useBuyTickets() {
  const { writeContractAsync, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const { invalidateAll } = useCacheInvalidation();
  const lastSuccessHash = useRef<string | null>(null);

  useEffect(() => {
    if (isSuccess && hash && hash !== lastSuccessHash.current) {
      lastSuccessHash.current = hash;
      toast.success('Tickets purchased successfully!');
      invalidateAll();
    }
  }, [isSuccess, hash, invalidateAll]);

  const buyTickets = async (raffleContract: string, quantity: number, ticketPrice: string) => {
    const ticketPriceWei = parseEther(ticketPrice);
    const totalCost = ticketPriceWei * BigInt(quantity);
    
    return await writeContractAsync({
      address: raffleContract as `0x${string}`,
      abi: RAFFLE_CONTRACT_ABI,
      functionName: 'buyTickets',
      args: [BigInt(quantity)],
      value: totalCost,
      chainId: 33139,
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