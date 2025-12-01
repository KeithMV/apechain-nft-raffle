/**
 * Professional Raffle Contract Hooks
 * Uses wagmi React hooks for proper mobile Safari compatibility
 */

import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { RAFFLE_FACTORY_ADDRESS, RAFFLE_FACTORY_ABI, RAFFLE_CONTRACT_ABI, ERC721_ABI } from '../config/contracts';
import { parseEther } from 'viem/utils';

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
  return useReadContract({
    address: nftContract as `0x${string}`,
    abi: ERC721_ABI,
    functionName: 'isApprovedForAll',
    args: [userAddress as `0x${string}`, RAFFLE_FACTORY_ADDRESS as `0x${string}`],
    query: {
      enabled: !!(nftContract && userAddress),
    },
  });
}

/**
 * Hook for NFT approval transaction
 */
export function useNFTApproval() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approveNFT = (nftContract: string) => {
    writeContract({
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
 * Hook for creating raffle
 */
export function useCreateRaffle() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createRaffle = async (params: CreateRaffleParams) => {
    // Convert APE to wei (18 decimals)
    const ticketPriceWei = parseEther(params.ticketPrice);
    
    writeContract({
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
      chainId: 33139, // Force ApeChain
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
    });
  };

  const unpause = () => {
    writeContract({
      address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
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
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const buyTickets = (raffleContract: string, quantity: number, ticketPrice: string) => {
    try {
      // Validate inputs
      if (!raffleContract || quantity <= 0 || !ticketPrice) {
        throw new Error('Invalid parameters for buyTickets');
      }
      
      // Calculate total cost with precision handling
      const ticketPriceWei = parseEther(ticketPrice);
      const totalCost = ticketPriceWei * BigInt(quantity);
      
      console.log('💰 Buy tickets parameters:', {
        raffleContract,
        quantity,
        ticketPrice,
        ticketPriceWei: ticketPriceWei.toString(),
        totalCost: totalCost.toString(),
        quantityBigInt: BigInt(quantity).toString()
      });
      
      writeContract({
        address: raffleContract as `0x${string}`,
        abi: RAFFLE_CONTRACT_ABI,
        functionName: 'buyTickets',
        args: [BigInt(quantity)],
        value: totalCost,
        chainId: 33139,
      });
      
      console.log('✅ writeContract called successfully');
    } catch (error) {
      console.error('❌ Error in buyTickets function:', error);
      throw error;
    }
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